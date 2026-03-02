import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_accounting.db"
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
def setup_db():
    Base.metadata.create_all(bind=engine)
    # Create an accountant user for testing
    db = TestingSessionLocal()
    accountant = User(
        id=10,
        email="accountant@test.com",
        username="testaccountant",
        hashed_password=get_password_hash("password123"),
        role=UserRole.ACCOUNTANT,
        is_active=True
    )
    db.add(accountant)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_header():
    token = create_access_token(data={"sub": "10"})
    return {"Authorization": f"Bearer {token}"}

def test_create_account(client, auth_header):
    payload = {
        "code": "1001",
        "name": "Cash at Hand",
        "type": "asset",
        "description": "Physical cash in office",
        "is_active": True
    }
    response = client.post("/api/v1/accounting/accounts", json=payload, headers=auth_header)
    assert response.status_code == 200
    assert response.json()["code"] == "1001"

def test_create_duplicate_account(client, auth_header):
    payload = {
        "code": "1001",
        "name": "Cash again",
        "type": "asset"
    }
    response = client.post("/api/v1/accounting/accounts", json=payload, headers=auth_header)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_create_journal_entry(client, auth_header):
    # Need two accounts for a journal entry
    client.post("/api/v1/accounting/accounts", json={"code": "2001", "name": "Expense Account", "type": "expense"}, headers=auth_header)
    
    # Get IDs (in a real test we'd query DB or use returned IDs)
    # For SQLite starting fresh, Cash is ID 1, Expense is ID 2
    
    payload = {
        "entry_date": "2024-01-24T00:00:00",
        "description": "Office supplies",
        "lines": [
            {"account_id": 2, "debit_amount": 50.0, "credit_amount": 0.0, "description": "Stationery"},
            {"account_id": 1, "debit_amount": 0.0, "credit_amount": 50.0, "description": "Paid by cash"}
        ]
    }
    response = client.post("/api/v1/accounting/journal-entries", json=payload, headers=auth_header)
    assert response.status_code == 200
    assert response.json()["status"] == "draft"
    assert len(response.json()["lines"]) == 2
