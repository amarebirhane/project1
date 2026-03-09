# tests/test_i18n.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.i18n import _

client = TestClient(app)

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
