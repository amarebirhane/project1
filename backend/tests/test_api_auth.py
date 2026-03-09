import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
from sqlalchemy.pool import StaticPool # Ensure StaticPool is available or imported correctly
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_rate_limiting_login(client):
    """Test that login is rate limited after 5 attempts per minute"""
    # We use a non-existent user to avoid side effects, 
    # but the rate limiter triggers before the auth logic fully completes or on failure.
    
    # Send 5 requests
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "nonexistent", "password": "wrongpassword"}
        )
        # Should be 401 because user doesn't exist
        assert response.status_code == 401
    
    # 6th request should be rate limited (429)
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent", "password": "wrongpassword"}
    )
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["error"]

def test_rate_limiting_register(client):
    """Test that registration is rate limited after 3 attempts per minute"""
    payload = {
        "email": "newuser@test.com",
        "username": "newuser",
        "password": "password123",
        "full_name": "New User"
    }
    
    # 1st attempt might succeed (if email is unique) or fail with 400
    # 2nd, 3rd attempts
    for i in range(3):
        client.post("/api/v1/auth/register", json=payload)
    
    # 4th attempt should be rate limited (429)
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 429
