import logging
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
        """Fetch list of supported banks from Chapa."""
        if not self.client:
            return []
        
        try:
            # The chapa-python SDK might have a method for this, 
            # otherwise it might be a direct API call.
            # Based on the documentation, there is an endpoint for this.
            response = self.client.get_banks()
            if response.get("status") == "success":
                return response.get("data", [])
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
