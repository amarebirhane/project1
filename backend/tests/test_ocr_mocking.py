# tests/test_ocr_mocking.py
import pytest
from unittest.mock import MagicMock, patch
from fastapi import UploadFile
import io
from app.services.ocr import OCRService

@pytest.fixture
def mock_genai():
    with patch('app.services.ocr.genai.GenerativeModel') as mock_model, \
         patch('app.services.ocr.Image.open') as mock_image_open:
        yield mock_model.return_value

@pytest.mark.asyncio
async def test_ocr_analyze_image_success(mock_genai):
    service = OCRService()
    service.model = mock_genai
    
    # Mocking the response from Gemini
    mock_response = MagicMock()
    mock_response.text = '{"merchant_name": "Test Store", "date": "2023-01-01", "total_amount": 10.5, "tax_amount": 1.5, "currency": "USD", "category": "Meals", "items": [], "is_receipt": true, "confidence_score": 0.95}'
    mock_genai.generate_content.return_value = mock_response
    
    # Create a mock file
    file_content = b"fake image content"
    file = UploadFile(filename="test.jpg", file=io.BytesIO(file_content))
    
    result = await service.analyze_image(file)
    
    assert result.document_type == "receipt"
    assert result.extracted_data.merchant_name == "Test Store"
    assert result.extracted_data.total_amount == 10.5

@pytest.mark.asyncio
async def test_ocr_analyze_image_invalid_json(mock_genai):
    service = OCRService()
    service.model = mock_genai
    
    mock_response = MagicMock()
    mock_response.text = "This is not JSON at all"
    mock_genai.generate_content.return_value = mock_response
    
    file = UploadFile(filename="test.jpg", file=io.BytesIO(b"fake content"))
    
    result = await service.analyze_image(file)
    
    assert result.document_type == "error", f"Expected error due to invalid JSON, got {result.document_type}. Error: {result.raw_text}"
    assert "Expecting value" in result.raw_text
