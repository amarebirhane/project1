import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token
from unittest.mock import patch, MagicMock

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_token():
    # Helper to generate a token for an admin user (id=1)
    return create_access_token(data={"sub": "1", "role": "admin"})

@pytest.fixture(autouse=True)
def create_test_users(setup_database):
    db = TestingSessionLocal()
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    # 1. Admin User
    admin = db.query(User).filter(User.username == "testadmin").first()
    if not admin:
        admin = User(
            id=1,
            email="admin@test.com",
            username="testadmin",
            hashed_password=get_password_hash("password123"),
            full_name="Test Admin",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
    
    # 2. Regular Accountant
    accountant = db.query(User).filter(User.username == "testacc").first()
    if not accountant:
        accountant = User(
            id=2,
            email="acc@test.com",
            username="testacc",
            hashed_password=get_password_hash("password123"),
            full_name="Test Accountant",
            role=UserRole.ACCOUNTANT,
            is_active=True,
            is_verified=True
        )
        db.add(accountant)
        
    db.commit()
    db.close()

# --- Authentication Tests ---

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login", 
        data={"username": "testadmin", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_unauthorized(client):
    response = client.post("/api/v1/auth/login", data={"username": "wrong", "password": "wrong"})
    assert response.status_code == 401

# --- AI Chat Tests (Functional) ---

@patch("app.services.ai_chat.AIChatService.generate_response")
def test_ai_chat_endpoint(mock_ai, client, test_token):
    mock_ai.return_value = "This is a mocked AI response."
    
    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "message": "Hello AI",
        "history": [],
        "current_page": "/dashboard"
    }
    
    response = client.post("/api/v1/ai/chat", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["response"] == "This is a mocked AI response."

# --- Revenue/CRUD Tests ---

def test_create_revenue_entry(client, test_token):
    headers = {"Authorization": f"Bearer {test_token}"}
    payload = {
        "title": "Functional Test Sale",
        "amount": 1500.50,
        "description": "Functional Test Sale Description",
        "category": "services",
        "date": "2024-01-24T12:00:00"
    }
    # Trying to create a revenue entry
    response = client.post("/api/v1/revenue/", json=payload, headers=headers)
    # The endpoint might return 201 or 200 depending on implementation
    assert response.status_code in [200, 201]
    assert float(response.json()["amount"]) == 1500.50

# --- Security/RBAC Tests ---

def test_admin_only_route_blocked_for_normal_user(client):
    # Fake a user token with 'employee' role (but the ID exists in DB as accountant now)
    # Actually create a real token for user 2 (Accountant)
    employee_token = create_access_token(data={"sub": "2", "role": "accountant"})
    headers = {"Authorization": f"Bearer {employee_token}"}
    
    # /api/v1/admin/roles requires ADMIN role
    response = client.get("/api/v1/admin/roles", headers=headers)
    # Roles like accountant might have different permissions, but admin/roles is usually high priv
    assert response.status_code in [403, 401]
