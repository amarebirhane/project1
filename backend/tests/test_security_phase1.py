# tests/test_security_phase1.py
import pytest
import time
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models.refresh_token import RefreshToken

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Create a test user
    hashed_password = get_password_hash("testpass123")
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=hashed_password,
        full_name="Test User",
        role=UserRole.EMPLOYEE,
        is_active=True,
    )
    db.add(user)
    db.commit()
    yield
    Base.metadata.drop_all(bind=engine)

def test_account_lockout():
    # 1. First 2 failed attempts
    for i in range(2):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Failed at attempt {i+1}: {response.text}"
        
    # 2. Third failed attempt should trigger lockout
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401, f"Failed at 3rd attempt: {response.text}"
    
    # 4. Fourth attempt (even with right password) should be locked
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    print(f"DEBUG lockout response: {response.status_code} - {response.text}")
    assert response.status_code == 403
    error_msg = response.json().get("detail", response.json().get("message", ""))
    assert "locked" in error_msg.lower()

def test_refresh_token_issuance_and_rotation():
    # 1. Login to get tokens
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    print(f"DEBUG login response: {response.status_code} - {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    old_refresh_token = data["refresh_token"]
    
    # 2. Use refresh token to get new ones
    response = client.post(
        "/api/v1/auth/refresh",
        json={"token": old_refresh_token}
    )
    print(f"DEBUG refresh response: {response.status_code} - {response.text}")
    assert response.status_code == 200
    new_data = response.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["refresh_token"] != old_refresh_token
    
    # 3. Try to use OLD refresh token again (should fail - revoked)
    response = client.post(
        "/api/v1/auth/refresh",
        json={"token": old_refresh_token}
    )
    print(f"DEBUG revoked refresh response: {response.status_code} - {response.text}")
    assert response.status_code == 401
    error_msg = response.json().get("detail", response.json().get("message", ""))
    assert "revoked" in error_msg.lower()


