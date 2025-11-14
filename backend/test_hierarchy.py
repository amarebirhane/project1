# test_hierarchy.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole

# Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hierarchy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_test_data():
    db = TestingSessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        db.query(User).delete()
        db.commit()

        # Create users in order
        users = [
            ("superadmin@test.com", "superadmin", "test123", "Super Admin", UserRole.SUPER_ADMIN, None),
            ("admin@test.com", "admin", "test123", "Admin User", UserRole.ADMIN, None),
        ]

        created = {}
        for email, username, pwd, name, role, manager in users:
            user = User(
                email=email,
                username=username,
                hashed_password=get_password_hash(pwd),
                full_name=name,
                role=role,
                is_active=True,
                is_verified=True,
                manager_id=created.get(manager).id if manager else None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            created[username] = user

        # Manager under Admin
        manager = User(
            email="manager@test.com",
            username="manager",
            hashed_password=get_password_hash("test123"),
            full_name="Finance Manager",
            role=UserRole.MANAGER,
            is_active=True,
            is_verified=True,
            manager_id=created["admin"].id
        )
        db.add(manager)
        db.commit()
        db.refresh(manager)
        created["manager"] = manager

        # Accountant & Employee under Manager
        for email, username, name, role in [
            ("accountant@test.com", "accountant", "Accountant User", UserRole.ACCOUNTANT),
            ("employee@test.com", "employee", "Employee User", UserRole.EMPLOYEE),
        ]:
            user = User(
                email=email,
                username=username,
                hashed_password=get_password_hash("test123"),
                full_name=name,
                role=role,
                is_active=True,
                is_verified=True,
                manager_id=manager.id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            created[username] = user

        print("Test data setup complete")
        return {k: v.id for k, v in created.items()}

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_auth_token(username: str, password: str = "test123") -> str:
    response = client.post("/api/v1/auth/login", data={"username": username, "password": password})
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


def test_admin_creates_manager():
    print("\nTesting: Admin creates manager")
    token = get_auth_token("admin")
    headers = {"Authorization": f"Bearer {token}"}

    data = {
        "email": "newmgr@test.com",
        "username": "newmgr",
        "password": "test123",
        "full_name": "New Manager",
        "role": "MANAGER"  # ← UPPERCASE
    }
    r = client.post("/api/v1/users/", json=data, headers=headers)
    assert r.status_code == 200, f"Create failed: {r.json()}"
    print("Admin created manager")


def test_manager_creates_subordinates():
    print("\nTesting: Manager creates subordinates")
    token = get_auth_token("manager")
    headers = {"Authorization": f"Bearer {token}"}

    for role in ["ACCOUNTANT", "EMPLOYEE"]:  # ← UPPERCASE
        data = {
            "email": f"new{role.lower()}@test.com",
            "username": f"new{role.lower()}",
            "password": "test123",
            "full_name": f"New {role.title()}",
            "role": role  # ← "ACCOUNTANT", "EMPLOYEE"
        }
        r = client.post("/api/v1/users/subordinates", json=data, headers=headers)
        assert r.status_code == 200, f"Create {role} failed: {r.json()}"
        print(f"Manager created {role.lower()}")


def test_hierarchy_restrictions():
    print("\nTesting: Restrictions")
    token = get_auth_token("employee")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/v1/users/", json={"email": "x@x.com", "username": "x", "password": "x", "role": "employee"}, headers=headers)
    assert r.status_code == 403
    print("Employee blocked from creating users")


def main():
    print("Starting Finance Management System Hierarchy Tests")
    print("=" * 60)
    try:
        setup_test_data()
        test_admin_creates_manager()
        test_manager_creates_subordinates()
        test_hierarchy_restrictions()
        print("\n" + "=" * 60)
        print("ALL HIERARCHY TESTS PASSED!")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()
        db_path = "test_hierarchy.db"
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
                print("Test database cleaned up")
            except:
                pass
    return True


if __name__ == "__main__":
    sys.exit(0 if main() else 1)