# Finance Management System Backend

A comprehensive FastAPI-based backend for managing financial data, revenue, expenses, approvals, and reporting with role-based access control and hierarchical permissions.

## Features

- **User Management**: Role-based access control with hierarchical permissions
- **Revenue & Expense Tracking**: Full CRUD operations with approval workflows
- **Approval System**: Multi-level approval workflows with notifications
- **Reporting**: Automated report generation with multiple formats
- **Audit Logging**: Comprehensive audit trail for all actions
- **Notifications**: In-app and email notifications
- **Backup System**: Automated backups with S3 integration
- **Dashboard**: KPI metrics and analytics
- **Security**: JWT authentication, OTP support, password hashing

## Architecture

```
backend/
├── app/
│   ├── core/           # Configuration, security, database
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic models
│   ├── crud/           # Database operations
│   ├── api/v1/         # API endpoints
│   ├── services/       # Business logic
│   └── utils/          # Helper utilities
├── alembic/            # Database migrations
├── tests/              # Test suite
└── docs/               # Documentation
```
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # App entrypoint
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Env vars (e.g., DB_URL, JWT_SECRET)
│   │   ├── security.py          # JWT, bcrypt, OTP gen
│   │   └── database.py          # SQLAlchemy engine/session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User, Role models
│   │   ├── revenue.py           # RevenueEntry
│   │   ├── expense.py           # ExpenseEntry
│   │   ├── approval.py          # ApprovalWorkflow
│   │   ├── report.py            # Report
│   │   ├── audit.py             # AuditLog
│   │   └── notification.py      # Notification
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py              # Pydantic UserCreate, UserOut
│   │   ├── revenue.py           # RevenueCreate, RevenueOut
│   │   ├── expense.py           # Similar
│   │   └── ...                  # For all entities
│   ├── crud/
│   │   ├── __init__.py
│   │   ├── user.py              # CRUD for users/hierarchy
│   │   ├── revenue.py           # CRUD with permission checks
│   │   └── ...                  # For all
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py              # Auth deps (current_user, permissions)
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # /auth/login, /auth/register
│   │   │   ├── users.py         # /users/ (hierarchy mgmt)
│   │   │   ├── revenue.py       # /revenue/
│   │   │   ├── expenses.py      # /expenses/
│   │   │   ├── dashboard.py     # /dashboard/ (KPIs)
│   │   │   ├── reports.py       # /reports/ (generate/export)
│   │   │   ├── approvals.py     # /approvals/
│   │   │   ├── notifications.py # /notifications/
│   │   │   └── admin.py         # /admin/ (backups, policies)
│   │   └── endpoints/           # Router mounts
│   ├── services/
│   │   ├── __init__.py
│   │   ├── email.py             # OTP, alerts
│   │   ├── backup.py            # S3 backups
│   │   ├── approval.py          # Workflow logic
│   │   └── hierarchy.py         # Permission tree checks
│   └── utils/
│       ├── __init__.py
│       ├── permissions.py       # RBAC decorator
│       └── audit.py             # Log actions
├── alembic/
│   └── ...                      # Migrations
├── requirements.txt
├── Dockerfile
└── docker-compose.yml           # Postgres, Redis, Celery
```
## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create database
   createdb finance_db
   
   # Run migrations
   alembic upgrade head
   ```

6. **Start the application**
   ```bash
   uvicorn app.main:app --reload
   ```

### Docker Setup

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

3. **Access the application**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Flower (Celery monitor): http://localhost:5555

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/generate-otp` - Generate OTP

### Users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/` - List users (admin only)
- `POST /api/v1/users/` - Create user (admin only)

### Revenue
- `GET /api/v1/revenue/` - List revenue entries
- `POST /api/v1/revenue/` - Create revenue entry
- `POST /api/v1/revenue/{id}/approve` - Approve revenue entry

### Expenses
- `GET /api/v1/expenses/` - List expense entries
- `POST /api/v1/expenses/` - Create expense entry
- `POST /api/v1/expenses/{id}/approve` - Approve expense entry

### Approvals
- `GET /api/v1/approvals/` - List approval workflows
- `POST /api/v1/approvals/` - Create approval request
- `POST /api/v1/approvals/{id}/approve` - Approve request

### Reports
- `GET /api/v1/reports/` - List reports
- `POST /api/v1/reports/` - Generate report
- `POST /api/v1/reports/{id}/download` - Download report

### Dashboard
- `GET /api/v1/dashboard/overview` - Get dashboard overview
- `GET /api/v1/dashboard/kpi` - Get KPI metrics

## User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access
2. **Admin** - User management, all data access
3. **Manager** - Team management, approvals
4. **Accountant** - Financial data entry
5. **Employee** - Basic data entry

### Permissions by Role
- **Employee**: Create/view/edit own entries
- **Accountant**: Financial data management
- **Manager**: Team oversight, approvals
- **Admin**: User management, system administration
- **Super Admin**: Full system control

## Configuration

### Environment Variables

Key environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AWS (for backups)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket
```

### Database Setup

1. **Create database**
   ```sql
   CREATE DATABASE finance_db;
   CREATE USER finance_user WITH PASSWORD 'finance_password';
   GRANT ALL PRIVILEGES ON DATABASE finance_db TO finance_user;
   ```

2. **Run migrations**
   ```bash
   alembic upgrade head
   ```

## Development

### Running Tests
```bash
pytest
pytest --cov=app  # With coverage
```

### Code Formatting
```bash
black app/
isort app/
```

### Linting
```bash
flake8 app/
mypy app/
```

### Database Migrations

1. **Create new migration**
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   ```

2. **Apply migrations**
   ```bash
   alembic upgrade head
   ```

3. **Rollback migration**
   ```bash
   alembic downgrade -1
   ```

## Deployment

### Production Deployment

1. **Environment setup**
   - Set production environment variables
   - Configure secure SECRET_KEY
   - Set up production database
   - Configure email service
   - Set up AWS S3 for backups

2. **Security considerations**
   - Use HTTPS
   - Set up firewall rules
   - Enable database SSL
   - Regular security updates
   - Monitor access logs

3. **Performance optimization**
   - Use connection pooling
   - Enable Redis caching
   - Optimize database queries
   - Monitor resource usage

### Monitoring

- **Application logs**: `/logs/app.log`
- **Celery monitoring**: Flower UI on port 5555
- **Health checks**: `/health` endpoint
- **Database monitoring**: PostgreSQL logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API docs at `/docs`

## Roadmap

- [ ] Multi-currency support
- [ ] Advanced reporting templates
- [ ] Mobile API optimization
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Integration with accounting software
- [ ] Budget planning features
- [ ] Invoice management

<!-- 
# Create tables
Base.metadata.create_all(bind=engine)

# Create default admin on startup
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@expense.com"
        admin_pass = "admin123"  # Change in prod
        admin = get_user_by_email(db, admin_email)
        if not admin:
            user_create = UserCreate(email=admin_email, password=admin_pass, role=Role.ADMIN)
            create_user(db, user_create)
            print(f"Default admin created: {admin_email}/{admin_pass}")
    finally:
        db.close()
 -->

 <!-- 
Hierarchy
 superadmin
    └── admin
            └── manager
                    ├── accountant
                    └── employee

  -->

  <!-- 
  
  how to create admin as default 

  # app/main.py
from fastapi import FastAPI
from .api.v1 import auth, users
from .core.database import SessionLocal
from .crud.user import user as user_crud
from .schemas.user import UserCreate
from .models.user import UserRole
from .core.security import get_password_hash

app = FastAPI()

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])


@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@expense.com"
        admin_username = "admin"
        admin_password = "admin1234"  # 8+ chars

        # Check by email OR username
        existing = (
            db.query(User)
            .filter(
                (User.email == admin_email) | (User.username == admin_username)
            )
            .first()
        )
        if existing:
            print(f"Default admin already exists: {admin_email}")
            return

        # Create admin
        user_in = UserCreate(
            email=admin_email,
            username=admin_username,
            password=admin_password,
            full_name="Default Administrator",
            role=UserRole.ADMIN
        )
        hashed = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=hashed,
            full_name=user_in.full_name,
            role=user_in.role,
            is_active=True,
            is_verified=True
        )
        db.add(db_user)
        db.commit()
        print(f"Default admin created: {admin_email} / {admin_password}")
    except Exception as e:
        db.rollback()
        print(f"Failed to create default admin: {e}")
    finally:
        db.close()
   -->