import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.banking import BankAccount, BankTransaction
from app.core.security import get_password_hash

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_banking.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
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
def db():
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

def test_banking_cross_tenant_isolation(client: TestClient, db: Session):
    """
    Test that users cannot access bank accounts created by peers 
    (not in their subordinate tree).
    """
    # 1. Create User A (Finance Admin)
    user_a = User(
        email="user_a_finance@example.com",
        username="user_a",
        hashed_password=get_password_hash("password"),
        role=UserRole.FINANCE_ADMIN,
        is_active=True,
    )
    db.add(user_a)
    
    # 2. Create User B (Finance Admin, Peer to A)
    user_b = User(
        email="user_b_finance@example.com",
        username="user_b",
        hashed_password=get_password_hash("password"),
        role=UserRole.FINANCE_ADMIN,
        is_active=True,
    )
    db.add(user_b)
    db.commit()

    # 3. Create Bank Account for User A
    acc_a = BankAccount(
        bank_name="Awash Bank",
        account_name="User A Corp",
        account_number_last4="1234",
        created_by_id=user_a.id,
        is_active=True
    )
    db.add(acc_a)
    db.commit()

    # 4. User B attempts to access User A's bank account
    # Authenticate as User B
    response = client.post("/api/v1/auth/login", data={"username": "user_b_finance@example.com", "password": "password"})
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # Verify B cannot see A's accounts in the list
    list_resp = client.get("/api/v1/banking/accounts", headers=headers)
    assert list_resp.status_code == 200
    accounts = list_resp.json()
    assert len(accounts) == 0

    # Verify B cannot update A's account
    put_resp = client.put(f"/api/v1/banking/accounts/{acc_a.id}", json={"account_name": "Stolen Account"}, headers=headers)
    assert put_resp.status_code == 403

    # Verify B cannot delete A's account
    del_resp = client.delete(f"/api/v1/banking/accounts/{acc_a.id}", headers=headers)
    assert del_resp.status_code == 403

def test_banking_subordinate_access(client: TestClient, db: Session):
    """
    Test that managers CAN access bank accounts created by their subordinates.
    """
    # 1. Create User M (Manager)
    user_m = User(
        email="user_m_manager@example.com",
        username="user_m",
        hashed_password=get_password_hash("password"),
        role=UserRole.MANAGER,
        is_active=True,
    )
    db.add(user_m)
    db.commit()

    # 2. Create User S (Subordinate Employee)
    user_s = User(
        email="user_s_employee@example.com",
        username="user_s",
        hashed_password=get_password_hash("password"),
        role=UserRole.EMPLOYEE,
        manager_id=user_m.id,
        is_active=True,
    )
    db.add(user_s)
    db.commit()

    # 3. Create Bank Account for User S
    acc_s = BankAccount(
        bank_name="CBE",
        account_name="User S Ops",
        account_number_last4="4321",
        created_by_id=user_s.id,
        is_active=True
    )
    db.add(acc_s)
    db.commit()

    # 4. Authenticate as Manager
    response = client.post("/api/v1/auth/login", data={"username": "user_m_manager@example.com", "password": "password"})
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # Verify Manager CAN see Subordinate's account
    list_resp = client.get("/api/v1/banking/accounts", headers=headers)
    assert list_resp.status_code == 200
    accounts = list_resp.json()
    assert any(a["id"] == acc_s.id for a in accounts)

    # Verify Manager CAN rename Subordinate's account
    put_resp = client.put(f"/api/v1/banking/accounts/{acc_s.id}", json={"account_name": "Updated by Manager"}, headers=headers)
    assert put_resp.status_code == 200
    assert put_resp.json()["account_name"] == "Updated by Manager"

def test_banking_admin_override(client: TestClient, db: Session):
    """
    Test that Admins bypass isolation checks entirely.
    """
    # 1. Create Base User
    base_user = User(
        email="base_user@example.com",
        username="base_user",
        hashed_password=get_password_hash("password"),
        role=UserRole.EMPLOYEE,
        is_active=True,
    )
    db.add(base_user)
    db.commit()

    # 2. Create Bank Account for Base User
    acc_base = BankAccount(
        bank_name="Dashen",
        account_name="Base Testing",
        account_number_last4="9999",
        created_by_id=base_user.id,
        is_active=True
    )
    db.add(acc_base)
    db.commit()

    # 3. Authenticate as Super Admin (assuming the `test_admin@example.com` seeded user from test_functional logic)
    # Re-using test_admin from typical test database seeding, but we define one just in case
    admin_user = User(
        email="super_admin_test@example.com",
        username="sudo",
        hashed_password=get_password_hash("password"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db.add(admin_user)
    db.commit()

    response = client.post("/api/v1/auth/login", data={"username": "super_admin_test@example.com", "password": "password"})
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # Admin lists everything
    list_resp = client.get("/api/v1/banking/accounts", headers=headers)
    assert list_resp.status_code == 200
    accounts = list_resp.json()
    assert any(a["id"] == acc_base.id for a in accounts)

    # Admin deletes the account
    del_resp = client.delete(f"/api/v1/banking/accounts/{acc_base.id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Bank account successfully disconnected"

    # Verify it is deactivated
    db.refresh(acc_base)
    assert not acc_base.is_active
