# main.py
from fastapi import FastAPI, Request, HTTPException, status  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.middleware.trustedhost import TrustedHostMiddleware  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
from fastapi.security import HTTPBearer  # type: ignore
from sqlalchemy import inspect, text # type: ignore
from fastapi.staticfiles import StaticFiles # type: ignore
from contextlib import asynccontextmanager
import logging
import logging.config
import time
import os
from datetime import datetime, timezone

from .core.config import settings
from .core.database import engine, Base, get_db, SessionLocal
from .api.v1 import (
    auth, users, revenue, expenses, dashboard,
    reports, approvals, notifications, admin,
    projects, departments, analytics, budgeting,
    inventory, sales, contact, ip_management, accounting, documents, banking, fixed_assets, ai, payroll, warehouses, account_mappings, feedback, comments, websocket
)

from .utils.audit import AuditLogger, AuditAction
from .core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# --- Critical imports for default admin creation ---
from .models.user import User, UserRole        # SQLAlchemy model + Enum
from .schemas.user import UserCreate           # Pydantic schema
from .schemas.responses import ErrorResponse    # Standardized response
from .core.security import get_password_hash   # Use core.security (bcrypt directly)
from .models.currency import Currency          # SQLAlchemy model

# --- Import all models to ensure they're registered with Base ---
# This ensures all tables are created when Base.metadata.create_all() is called
from .models import (  # noqa: F401
    User, UserRole, Role,
    RevenueEntry, ExpenseEntry,
    ApprovalWorkflow, ApprovalComment,
    Report, ReportSchedule,
    AuditLog, Notification,
    Project, LoginHistory,
    Budget, BudgetItem, BudgetScenario, Forecast, BudgetVariance,
    BudgetType, BudgetPeriod, BudgetStatus,
    InventoryItem, Warehouse, WarehouseItemStock, StockTransfer,
    Sale, SaleStatus, JournalEntry,
    Account, AccountingJournalEntry, JournalEntryLine, JournalEntryStatus,
    TaxType, TaxRate, TaxComponent,
    Currency, ExchangeRate,
    BankAccount, BankTransaction,
    FixedAsset, DepreciationLog,
    FraudFlag,
    EmployeeProfile, PayrollPeriod, Payslip,
    Feedback
)

# Create required directories early (prevents FileNotFoundError during config or mount)
for directory in ("uploads", "reports", "backups", "logs"):
    os.makedirs(directory, exist_ok=True)
    print(f"Directory ensured: {directory}")

# Now safe to configure logging
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        },
    },
    "handlers": {
        "console": {  # Always include console
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "DEBUG" if settings.DEBUG else "INFO",
        },
    },
    "root": {
        "level": settings.LOG_LEVEL,
        "handlers": ["console"],
    },
    "loggers": {
        "app": {
            "level": settings.LOG_LEVEL,
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

# Conditionally add file handler AFTER directory creation
if settings.LOG_FILE:
    LOGGING_CONFIG["handlers"]["file"] = {
        "class": "logging.FileHandler",
        "filename": settings.LOG_FILE,
        "formatter": "default",
        "level": "INFO",
    }
    LOGGING_CONFIG["root"]["handlers"].append("file")
    LOGGING_CONFIG["loggers"]["app"]["handlers"].append("file")

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Helper: create default admin (now runs inside lifespan)
def create_default_admin():
    """Create a default admin user if none exists."""
    db = SessionLocal()
    try:
        admin_email = "admin@expense.com"
        admin_username = "admin"
        admin_password = "admin1234"          # 8+ chars

        existing = (
            db.query(User)
            .filter((User.email == admin_email) | (User.username == admin_username))
            .first()
        )
        if existing:
            logger.info(f"Default admin already exists: {admin_email}")
            return

        user_in = UserCreate(
            email=admin_email,
            username=admin_username,
            password=admin_password,
            full_name="Default Administrator",
            role=UserRole.ADMIN,
        )
        hashed = get_password_hash(user_in.password)

        db_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=hashed,
            full_name=user_in.full_name,
            role=user_in.role,
            is_active=True,
            is_verified=True,
        )
        db.add(db_user)
        db.commit()
        logger.info(f"Default admin created: {admin_email} / {admin_password}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create default admin: {e}")
    finally:
        db.close()

def create_default_currencies():
    """Create default currencies if they don't exist."""
    db = SessionLocal()
    try:
        defaults = [
            {"code": "USD", "name": "US Dollar", "symbol": "$", "is_base_currency": True},
            {"code": "EUR", "name": "Euro", "symbol": "€", "is_base_currency": False},
            {"code": "ETB", "name": "Ethiopian Birr", "symbol": "Br", "is_base_currency": False},
        ]
        
        for curr_data in defaults:
            existing = db.query(Currency).filter(Currency.code == curr_data["code"]).first()
            if not existing:
                db_curr = Currency(**curr_data)
                db.add(db_curr)
                logger.info(f"Default currency created: {curr_data['code']}")
        
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create default currencies: {e}")
    finally:
        db.close()

def ensure_database_schema_sync(engine):
    """
    Ensure the database schema is in sync with the models.
    This is a self-healing mechanism for environments like Render where 
    migrations might not have been applied yet but code expects new columns.
    """
    inspector = inspect(engine)
    try:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'profile_image_url' not in columns:
            logger.info("Self-healing: Adding profile_image_url column to users table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_image_url VARCHAR"))
                conn.commit()
            logger.info("Self-healing: Successfully added profile_image_url column")
    except Exception as e:
        logger.error(f"Failed to perform self-healing migration: {e}")

# Lifespan (startup + shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # -------------------- STARTUP --------------------
    logger.info("Starting Finance Management System Backend")

    # 1. Create DB tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")

    # 2. Ensure required directories (handled at module level for mounts)
    pass

    # 3. **Self-healing migration**
    ensure_database_schema_sync(engine)

    # 4. **Create default admin and currencies** (replaces @app.on_event)
    create_default_currencies()
    create_default_admin()

    # 4. Start ML model training scheduler (optional)
    try:
        from .services.ml_scheduler import start_scheduler
        if start_scheduler():
            logger.info("ML model training scheduler started")
        else:
            logger.warning("ML model training scheduler not available (APScheduler not installed)")
    except Exception as e:
        logger.warning(f"Failed to start ML training scheduler: {e}")

    yield

    # -------------------- SHUTDOWN --------------------
    logger.info("Shutting down Finance Management System Backend")
    
    # Stop ML training scheduler
    try:
        from .services.ml_scheduler import stop_scheduler
        stop_scheduler()
    except Exception as e:
        logger.warning(f"Failed to stop ML training scheduler: {e}")


# ------------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description="A comprehensive finance management system with role-based access control",
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# --- Rate Limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS Configuration ---
# Standard FastAPI CORS handling. Added here to be the outermost middleware layer.
all_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8081",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8081",
    "https://project1frontend.onrender.com",
]

# Add extra origins from settings if provided
if settings.ALLOWED_ORIGINS:
    extra_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    for origin in extra_origins:
        if origin not in all_origins:
            all_origins.append(origin)

# Special handling for debug mode
# Note: we don't use "*" because allow_credentials=True requires specific origins
if settings.DEBUG:
    # Most common dev origins are already covered
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Requires-2FA", "Content-Disposition", "*"],
)


# Custom OpenAPI Schema with Bearer Token Authorization
def custom_openapi():
    """
    Custom OpenAPI schema generator that adds Bearer token authentication
    to Swagger UI for easy testing of protected endpoints.
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    from fastapi.openapi.utils import get_openapi  # type: ignore
    
    # Generate base OpenAPI schema
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="""
## Financial Management System API

A comprehensive REST API for managing financial data, budgets, forecasts, revenue, expenses, and reporting with role-based access control.

### 🔑 Authentication

Most endpoints require JWT Bearer token authentication.

**How to authenticate:**
1. Use the `/api/v1/auth/login` endpoint to get your access token
2. Click the 🔒 "Authorize" button at the top of this page
3. Enter **ONLY the token value** (without "Bearer" prefix)
4. Click "Authorize" and then "Close"

Now all protected endpoints will automatically include your token in requests.

**Example:** Just enter the token value:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```
(Swagger automatically adds "Bearer" prefix to the Authorization header)

### 📚 Documentation
- Interactive API testing available in Swagger UI
- Alternative documentation at `/redoc`
- OpenAPI specification at `/openapi.json`
        """,
        routes=app.routes,
        tags=[
            {"name": "Authentication", "description": "User authentication and authorization"},
            {"name": "users", "description": "User management endpoints"},
            {"name": "Revenue", "description": "Revenue entry management"},
            {"name": "Expenses", "description": "Expense entry management"},
            {"name": "Budgeting & Forecasting", "description": "FP&A features - budgets, scenarios, forecasts"},
            {"name": "Analytics", "description": "Advanced analytics and insights"},
            {"name": "Dashboard", "description": "Dashboard data and metrics"},
            {"name": "Approvals", "description": "Approval workflow management"},
            {"name": "Projects", "description": "Project management"},
            {"name": "Departments", "description": "Department management"},
            {"name": "Reports", "description": "Report generation and management"},
            {"name": "Notifications", "description": "Notification system"},
            {"name": "Admin", "description": "Administrative functions"},
        ],
    )
    
    # Ensure components section exists
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    
    # Add Bearer token security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": """
**JWT Bearer Token Authentication**

**Step-by-step authentication:**

1. **Login to get token:**
   - Use the `/api/v1/auth/login` endpoint below
   - Enter your username/email and password
   - Copy the `access_token` from the response

2. **Authorize in Swagger:**
   - Click the 🔒 **"Authorize"** button at the top right of this page
   - In the "Value" field, enter **ONLY the token** (without "Bearer" prefix)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
   - Click **"Authorize"** button
   - Click **"Close"**

3. **Test endpoints:**
   - Now all protected endpoints will automatically include your token
   - The Authorization header will be: `Authorization: Bearer <your_token>`

**Important Notes:**
- ✅ Enter **ONLY the token value** (Swagger automatically adds "Bearer" prefix)
- ❌ Do NOT include "Bearer" in the value field
- ⏱️ Token expires after 30 minutes (default)
- 🔄 Re-authorize if you get 401 Unauthorized errors

**Token Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```
            """.strip()
        }
    }
    
    # Add servers
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.example.com",
            "description": "Production server (update with your production URL)"
        }
    ]
    
    # Add contact information
    openapi_schema["info"]["contact"] = {
        "name": "Finance Management System Support",
        "email": "support@finance-system.com"
    }
    
    # Add license
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    # Cache the schema
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Override default OpenAPI schema with custom one
app.openapi = custom_openapi

# --- End CORS Configuration ---


# Add trusted host middleware for production (after CORS)
if not settings.DEBUG:
    allowed_hosts = [host.strip() for host in settings.ALLOWED_HOSTS.split(",")] if settings.ALLOWED_HOSTS else ["localhost", "127.0.0.1"]
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts
    )

# CORS headers middleware (backup - ensures CORS headers are always present)
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Ensure CORS headers are always present"""
    # Get origin from request
    origin = request.headers.get("Origin")
    
    # Default allowed origins
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8081",  # Expo web dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8081",  # Expo web dev server
    ]
    
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        response = JSONResponse(content={}, status_code=200)
        if origin and origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response.headers["Access-Control-Max-Age"] = "3600"
        return response
    
    # Process the actual request
    response = await call_next(request)
    
    # Add CORS headers to response
    if origin and origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Expose-Headers"] = "*"
    
    return response

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} in {process_time:.4f}s")
    
    return response

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            message=str(exc.detail),
            status_code=exc.status_code
        ).model_dump(),
        headers=getattr(exc, "headers", None)
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            message="Internal server error" if not settings.DEBUG else str(exc),
            status_code=500
        ).model_dump()
    )

# Serve static files (uploads)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve profile images at root /profile_images if needed (for backward compatibility)
profile_images_dir = os.path.join("uploads", "profile_images")
os.makedirs(profile_images_dir, exist_ok=True)
app.mount("/profile_images", StaticFiles(directory=profile_images_dir), name="profile_images")

# Include API routers
api_v1_prefix = "/api/v1"

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

# Keep other modules too:
api_prefix = "/api/v1"
app.include_router(revenue.router, prefix=f"{api_prefix}/revenue", tags=["Revenue"])
app.include_router(expenses.router, prefix=f"{api_prefix}/expenses", tags=["Expenses"])
app.include_router(approvals.router, prefix=f"{api_prefix}/approvals", tags=["Approvals"])
app.include_router(reports.router, prefix=f"{api_prefix}/reports", tags=["Reports"])
app.include_router(notifications.router, prefix=f"{api_prefix}/notifications", tags=["Notifications"])
app.include_router(dashboard.router, prefix=f"{api_prefix}/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix=f"{api_prefix}/admin", tags=["Admin"])
app.include_router(projects.router, prefix=f"{api_prefix}/projects", tags=["Projects"])
app.include_router(departments.router, prefix=f"{api_prefix}/departments", tags=["Departments"])
app.include_router(analytics.router, prefix=f"{api_prefix}/analytics", tags=["Analytics"])
app.include_router(budgeting.router, prefix=f"{api_prefix}/budgeting", tags=["Budgeting & Forecasting"])
app.include_router(inventory.router, prefix=f"{api_prefix}/inventory", tags=["Inventory"])
app.include_router(sales.router, prefix=f"{api_prefix}/sales", tags=["Sales"])
app.include_router(ip_management.router, prefix=f"{api_prefix}/ip-management", tags=["IP Management"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["Contact"])
app.include_router(accounting.router, prefix=f"{api_prefix}/accounting", tags=["Accounting"])
app.include_router(documents.router, prefix=f"{api_prefix}/documents", tags=["Document Intelligence"])
app.include_router(banking.router, prefix=f"{api_prefix}/banking", tags=["Banking"])
app.include_router(fixed_assets.router, prefix=f"{api_prefix}/fixed-assets", tags=["Fixed Assets"])
app.include_router(ai.router, prefix=f"{api_prefix}/ai", tags=["Applied AI"])
app.include_router(payroll.router, prefix=f"{api_prefix}/payroll", tags=["Payroll"])
app.include_router(warehouses.router, prefix=f"{api_prefix}/warehouses", tags=["Warehouses"])
app.include_router(account_mappings.router, prefix=f"{api_prefix}/account-mappings", tags=["Accounting Mapping"])
app.include_router(feedback.router, prefix=f"{api_prefix}/feedback", tags=["Feedback"])
app.include_router(comments.router, prefix=f"{api_prefix}/comments", tags=["Collaboration"])
app.include_router(websocket.router, prefix="/api/v1", tags=["WebSockets"])


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection (fixed session handling)
        db_gen = get_db()
        db = next(db_gen)
        try:
            from sqlalchemy import text  # type: ignore
            db.execute(text("SELECT 1"))
            db.commit()  # Explicit commit for test
            db_status = "healthy"
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "unhealthy"
    
    # Check Redis connection (if configured)
    redis_status = "not_configured"
    if settings.REDIS_URL:
        try:
            import redis  # type: ignore
            r = redis.from_url(settings.REDIS_URL)
            r.ping()
            redis_status = "healthy"
        except Exception as e:
            logger.error(f"Redis health check failed: {str(e)}")
            redis_status = "unhealthy"
    
    overall_status = "healthy" if db_status == "healthy" else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
        "services": {
            "database": db_status,
            "redis": redis_status
        },
        "environment": "development" if settings.DEBUG else "production"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production",
        "health": "/health"
    }

# API info endpoint
@app.get("/api/info")
async def api_info():
    """API information endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "description": "Finance Management System Backend API",
        "endpoints": {
            "auth": f"{api_v1_prefix}/auth",
            "users": f"{api_v1_prefix}/users",
            "revenue": f"{api_v1_prefix}/revenue",
            "expenses": f"{api_v1_prefix}/expenses",
            "approvals": f"{api_v1_prefix}/approvals",
            "reports": f"{api_v1_prefix}/reports",
            "notifications": f"{api_v1_prefix}/notifications",
            "dashboard": f"{api_v1_prefix}/dashboard",
            "admin": f"{api_v1_prefix}/admin"
        },
        "documentation": {
            "swagger": "/docs" if settings.DEBUG else None,
            "redoc": "/redoc" if settings.DEBUG else None,
            "openapi": "/openapi.json" if settings.DEBUG else None
        }
    }


# Celery configuration (for background tasks)
celery_app = None
try:
    from celery import Celery  # type: ignore
    
    celery_app = Celery(
        "app.main",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
        include=["app.tasks"]
    )
    
    # Celery configuration
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=30 * 60,  # 30 minutes
        task_soft_time_limit=25 * 60,  # 25 minutes
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1000,
    )
    
    logger.info("Celery configured successfully")
    
except ImportError:
    logger.warning("Celery not available - background tasks disabled")
    celery_app = None

# Background tasks
if celery_app:
    @celery_app.task
    def run_proactive_agent_scan():
        """Periodic task to scan for financial insights using AI"""
        import asyncio
        from .services.proactive_agent import proactive_agent_service
        try:
            # Since generating AI responses is async, we run it in the event loop
            asyncio.run(proactive_agent_service.run_daily_insight_scan())
            return True
        except Exception as e:
            logger.error(f"Proactive scan task failed: {str(e)}")
            return False

    @celery_app.task
    def send_email_task(to_email: str, subject: str, body: str):
        """Background task for sending emails"""
        try:
            from .services.email import EmailService
            EmailService.send_email(to_email, subject, body)
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    @celery_app.task
    def generate_report_task(report_id: int):
        """Background task for generating reports"""
        try:
            from .services.report import ReportService
            result = ReportService.generate_report(report_id)
            logger.info(f"Report {report_id} generated successfully")
            return result
        except Exception as e:
            logger.error(f"Failed to generate report {report_id}: {str(e)}")
            return False
    
    @celery_app.task
    def backup_task(include_files: bool = False):
        """Background task for system backup"""
        try:
            from .services.backup import BackupService
            result = BackupService.create_backup(include_files)
            logger.info(f"Backup {result} created successfully")
            return result
        except Exception as e:
            logger.error(f"Failed to create backup: {str(e)}")
            return False

    @celery_app.task
    def cleanup_logs_task():
        """Cleanup old logs task"""
        logger.info("Cleaning old logs")
        try:
            import os
            import glob
            from datetime import datetime, timedelta
            
            log_dir = os.path.dirname(settings.LOG_FILE) if settings.LOG_FILE else "logs"
            if not os.path.exists(log_dir):
                logger.warning(f"Log directory {log_dir} does not exist")
                return
            
            # Delete log files older than 30 days
            cutoff_date = datetime.now() - timedelta(days=30)
            log_files = glob.glob(os.path.join(log_dir, "*.log"))
            
            deleted_count = 0
            for log_file in log_files:
                try:
                    file_time = datetime.fromtimestamp(os.path.getmtime(log_file))
                    if file_time < cutoff_date:
                        os.remove(log_file)
                        deleted_count += 1
                except Exception as e:
                    logger.error(f"Error deleting log file {log_file}: {str(e)}")
            
            logger.info(f"Cleaned up {deleted_count} old log files")
        except Exception as e:
            logger.error(f"Error in cleanup_logs_task: {str(e)}")

    @celery_app.task
    def cleanup_notifications_task():
        """Cleanup expired notifications task"""
        logger.info("Cleaning expired notifications")
        try:
            from datetime import datetime, timedelta
            from .models.notification import Notification
            
            db = SessionLocal()
            try:
                # Delete notifications older than 90 days
                cutoff_date = datetime.utcnow() - timedelta(days=90)
                deleted_count = db.query(Notification).filter(
                    Notification.created_at < cutoff_date
                ).delete()
                db.commit()
                logger.info(f"Cleaned up {deleted_count} expired notifications")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error in cleanup_notifications_task: {str(e)}")

# Scheduled tasks (Celery Beat)
if celery_app:
    from celery.schedules import crontab  # type: ignore
    
    celery_app.conf.beat_schedule = {
        'daily-backup': {
            'task': 'app.main.backup_task',
            'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
            'args': (True,)  # Include files in backup
        },
        'cleanup-old-logs': {
            'task': 'app.main.cleanup_logs_task',
            'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Weekly on Sunday at 3 AM
        },
        'cleanup-expired-notifications': {
            'task': 'app.main.cleanup_notifications_task',
            'schedule': crontab(hour=4, minute=0),  # Daily at 4 AM
        },
        'proactive-ai-insight': {
            'task': 'app.main.run_proactive_agent_scan',
            'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
        }
    }

if __name__ == "__main__":
    import uvicorn  # type: ignore
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )