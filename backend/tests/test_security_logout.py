# tests/test_security_logout.py
import pytest
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
        username="logoutuser",
        hashed_password=hashed_password,
        full_name="Logout User",
        role=UserRole.EMPLOYEE,
        is_active=True,
    )
    db.add(user)
    db.commit()
    yield
    Base.metadata.drop_all(bind=engine)

def test_logout_revokes_token():
    # 1. Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "logoutuser", "password": "testpass123"}
    )
    assert response.status_code == 200
    res_json = response.json()
    token = res_json["data"]["refresh_token"]
    
    # 2. Logout with token
    response = client.post(
        "/api/v1/auth/logout",
        json={"token": token}
    )
    assert response.status_code == 200
    assert "logged out" in response.json()["message"].lower()
    
    # 3. Try to refresh (should fail)
    response = client.post(
        "/api/v1/auth/refresh",
        json={"token": token}
    )
    assert response.status_code == 401
    assert "revoked" in response.json()["message"].lower()

def test_logout_all_revokes_all_tokens():
    # 1. Login twice to get two active tokens
    r1 = client.post("/api/v1/auth/login", data={"username": "logoutuser", "password": "testpass123"})
    t1 = r1.json()["data"]["refresh_token"]
    
    r2 = client.post("/api/v1/auth/login", data={"username": "logoutuser", "password": "testpass123"})
    t2 = r2.json()["data"]["refresh_token"]
    
    # 2. Logout all sessions
    # Need access token for logout-all (it uses current_user dependency)
    access_token = r2.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = client.post("/api/v1/auth/logout-all", headers=headers)
    assert response.status_code == 200
    
    # 3. Both tokens should be revoked
    for t in [t1, t2]:
        resp = client.post("/api/v1/auth/refresh", json={"token": t})
        assert resp.status_code == 401
