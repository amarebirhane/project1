# tests/test_payment_mocking.py
import pytest
from unittest.mock import MagicMock, patch
from app.services.chapa_service import ChapaService

@pytest.fixture
def mock_chapa_client():
    with patch('app.services.chapa_service.Chapa') as mock_chapa:
        yield mock_chapa.return_value

def test_chapa_banks_success():
    service = ChapaService()
    # Mocking httpx.Client().get
    with patch('httpx.Client.get') as mock_get:
        mock_get.return_value.json.return_value = {
            "status": "success",
            "data": [{"name": "CBE", "code": "001"}]
        }
        banks = service.get_banks()
        assert len(banks) == 1
        assert banks[0]["name"] == "CBE"

def test_chapa_banks_failure():
    service = ChapaService()
    with patch('httpx.Client.get') as mock_get:
        mock_get.return_value.json.return_value = {
            "status": "error",
            "message": "API Key Invalid"
        }
        banks = service.get_banks()
        assert banks == []

def test_chapa_initialize_transaction_error(mock_chapa_client):
    service = ChapaService()
    service.client = mock_chapa_client
    mock_chapa_client.initialize.side_effect = Exception("Network Error")
    
    result = service.initialize_transaction({"amount": 100})
    assert result["status"] == "error"
    assert "Network Error" in result["message"]

def test_chapa_verify_webhook_valid():
    service = ChapaService()
    service.webhook_hash = "secret"
    
    import hmac
    import hashlib
    payload = '{"test": "data"}'
    signature = hmac.new(
        b"secret",
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    assert service.verify_webhook(payload, signature) is True

def test_chapa_verify_webhook_invalid():
    service = ChapaService()
    service.webhook_hash = "secret"
    assert service.verify_webhook('{"test": "data"}', "wrong_signature") is False
