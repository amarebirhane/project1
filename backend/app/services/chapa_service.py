import logging
import httpx
from typing import Optional, List, Dict, Any
from chapa import Chapa
from ..core.config import settings

logger = logging.getLogger(__name__)

class ChapaService:
    def __init__(self):
        self.secret_key = settings.CHAPA_SECRET_KEY
        self.webhook_hash = settings.CHAPA_WEBHOOK_HASH
        
        if not self.secret_key:
            logger.warning("CHAPA_SECRET_KEY is not set. Chapa integration will be limited.")
            self.client = None
        else:
            self.client = Chapa(self.secret_key)

    def get_banks(self) -> List[Dict[str, Any]]:
        """Fetch list of supported banks from Chapa using httpx directly."""
        if not self.secret_key:
            return []
        
        try:
            # Bypass the library method which has httpx incompatibility issues
            # direct call to Chapa's banks endpoint
            headers = {
                "Authorization": f"Bearer {self.secret_key}"
            }
            with httpx.Client() as client:
                response = client.get("https://api.chapa.co/v1/banks", headers=headers)
                data = response.json()
                
            if data.get("status") == "success":
                return data.get("data", [])
            
            logger.error(f"Failed to fetch banks from Chapa: {data.get('message')}")
            return []
        except Exception as e:
            logger.error(f"Error fetching banks from Chapa: {str(e)}")
            return []

    def verify_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """Verify the status of a transaction."""
        if not self.client:
            return {"status": "error", "message": "Chapa client not initialized"}
        
        try:
            return self.client.verify(transaction_id)
        except Exception as e:
            logger.error(f"Error verifying transaction {transaction_id}: {str(e)}")
            return {"status": "error", "message": str(e)}

    def initialize_transaction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize a transaction (e.g., for linking or paying)."""
        if not self.client:
            return {"status": "error", "message": "Chapa client not initialized"}
        
        try:
            return self.client.initialize(**data)
        except Exception as e:
            logger.error(f"Error initializing transaction: {str(e)}")
            return {"status": "error", "message": str(e)}

    def create_transfer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initiate a money transfer (disbursement).
        Expected data keys: account_number, account_name, bank_code, amount, currency, reference
        """
        if not self.client:
            return {"status": "error", "message": "Chapa client not initialized"}
        
        try:
            # Note: The chapa-python SDK version might vary, but 'transfer' 
            # is the standard method for disbursements in most Chapa wrappers.
            return self.client.transfer(**data)
        except Exception as e:
            logger.error(f"Error creating transfer: {str(e)}")
            return {"status": "error", "message": str(e)}

    def verify_webhook(self, payload: str, signature: str) -> bool:
        """Verify that the webhook request is authentic."""
        if not self.webhook_hash:
            logger.warning("CHAPA_WEBHOOK_HASH not set. Skipping webhook verification (INSECURE).")
            return True
            
        import hmac
        import hashlib
        
        hash_value = hmac.new(
            self.webhook_hash.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(hash_value, signature)

# Global instances
chapa_service = ChapaService()
