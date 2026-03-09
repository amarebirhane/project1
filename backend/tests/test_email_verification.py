# tests/test_email_verification.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.core.security import create_access_token
from datetime import timedelta

# Test database setup (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_verify_email_success(client, db):
    # 1. Create a user manually (not verified)
    user = User(
        email="verify@test.com",
        username="verifyuser",
        hashed_password="hashed",
        is_verified=False
    )
    db.add(user)
    db.commit()
    
    # 2. Generate token
    token = create_access_token(
        data={"sub": str(user.id), "type": "verification"},
        expires_delta=timedelta(hours=1)
    )
    
    # 3. Call verification endpoint
    response = client.get(f"/api/v1/auth/verify-email?token={token}")
    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully"
    
    # 4. Check DB
    db.refresh(user)
    assert user.is_verified is True

def test_verify_email_invalid_token(client):
    response = client.get("/api/v1/auth/verify-email?token=invalid")
    assert response.status_code == 400
