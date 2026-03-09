import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.core.i18n import _

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
    yield
    Base.metadata.drop_all(bind=engine)

def test_translation_utility():
    # Test English
    assert _("LOGIN_SUCCESS", locale="en") == "Login successful"
    # Test Spanish
    assert _("LOGIN_SUCCESS", locale="es") == "Inicio de sesión exitoso"
    # Test fallback
    assert _("LOGIN_SUCCESS", locale="fr") == "Login successful"
    # Test formatting
    assert _("ACCOUNT_LOCKED", locale="en", minutes=15) == "Account is locked. Please try again in 15 minutes."

def test_locale_middleware():
    # Default (en)
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent", "password": "wrong"}
    )
    assert response.status_code == 401
    assert "Incorrect username" in response.json()["message"] # GenericResponse message

    # Spanish via header
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent", "password": "wrong"},
        headers={"Accept-Language": "es"}
    )
    assert response.status_code == 401
    assert "Nombre de usuario o contraseña incorrectos" in response.json()["message"]
