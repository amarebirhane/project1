from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import uuid
from typing import List, Optional

from ..models.banking import BankAccount, BankTransaction, TransactionStatus
from ..schemas.banking import BankTransactionCreate

class BankFeedSimulationService:
    MERCHANTS = [
        {"name": "Amazon Web Services", "amount_range": (-500, -50), "description": "Cloud hosting services"},
        {"name": "Starbucks Coffee", "amount_range": (-15, -5), "description": "Office refreshments"},
        {"name": "Office Depot", "amount_range": (-200, -20), "description": "Stationary and supplies"},
        {"name": "Stripe Transfer", "amount_range": (1000, 5000), "description": "Customer payment settlement"},
        {"name": "Wegmans Market", "amount_range": (-100, -30), "description": "Office pantry"},
        {"name": "Apple Services", "amount_range": (-10, -1), "description": "iCloud storage subscription"},
        {"name": "Zoom Video Communications", "amount_range": (-15, -15), "description": "Monthly subscription"},
        {"name": "Uber Technologies", "amount_range": (-40, -10), "description": "Business travel"},
        {"name": "Chevron Gas", "amount_range": (-60, -30), "description": "Fuel expense"},
        {"name": "Internal Transfer", "amount_range": (5000, 10000), "description": "Transfer from savings"}
    ]

    @staticmethod
    def generate_mock_transaction_data(bank_account_id: int) -> BankTransactionCreate:
        merchant = random.choice(BankFeedSimulationService.MERCHANTS)
        amount = round(random.uniform(merchant["amount_range"][0], merchant["amount_range"][1]), 2)
        
        return BankTransactionCreate(
            bank_account_id=bank_account_id,
            date=datetime.now(),
            description=f"{merchant['name']} - {merchant['description']}",
            amount=amount,
            external_id=f"sim_{uuid.uuid4().hex[:12]}"
        )

    @classmethod
    def simulate_polling_sync(cls, db: Session, bank_account_id: int, count: int = 5, user_id: int = None) -> List[BankTransaction]:
        """
        Simulates fetching a batch of transactions from a bank API
        """
        bank_account = db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
        if not bank_account:
            return []

        transactions = []
        for _ in range(count):
            tx_data = cls.generate_mock_transaction_data(bank_account_id)
            
            # Check if external_id already exists to prevent duplicates (though unlikely with UUID)
            existing = db.query(BankTransaction).filter(BankTransaction.external_id == tx_data.external_id).first()
            if existing:
                continue

            tx = BankTransaction(
                bank_account_id=tx_data.bank_account_id,
                date=tx_data.date,
                description=tx_data.description,
                amount=tx_data.amount,
                external_id=tx_data.external_id,
                status=TransactionStatus.PENDING,
                created_by_id=user_id
            )
            db.add(tx)
            transactions.append(tx)

        bank_account.last_synced_at = datetime.now()
        db.commit()
        return transactions

    @classmethod
    def process_mock_webhook(cls, db: Session, bank_account_id: int, payload: dict, user_id: int = None) -> Optional[BankTransaction]:
        """
        Simulates processing a webhook notification for a single transaction
        """
        # In a real scenario, the payload would come from Plaid/Stripe
        # Here we just map some hypothetical fields
        external_id = payload.get("id") or f"wh_{uuid.uuid4().hex[:12]}"
        amount = float(payload.get("amount", 0))
        description = payload.get("description", "Webhook Transaction")
        date_str = payload.get("date")
        
        try:
            date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        except ValueError:
            date = datetime.now()

        # Check for duplicates
        existing = db.query(BankTransaction).filter(BankTransaction.external_id == external_id).first()
        if existing:
            return existing

        tx = BankTransaction(
            bank_account_id=bank_account_id,
            date=date,
            description=description,
            amount=amount,
            external_id=external_id,
            status=TransactionStatus.PENDING,
            created_by_id=user_id
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @classmethod
    def process_chapa_webhook(cls, db: Session, payload: dict) -> Optional[BankTransaction]:
        """
        Process a real webhook from Chapa.
        Maps Chapa fields to BankTransaction model.
        """
        # Chapa common fields
        external_id = payload.get("reference") or payload.get("tx_ref")
        amount = float(payload.get("amount", 0))
        # Determine if it's credit or debit based on type if available
        # Defaulting to credit for now as most webhooks are for inward payments
        
        description = payload.get("description") or f"Chapa Payment: {payload.get('first_name', '')} {payload.get('last_name', '')}"
        
        # We need to find the correct BankAccount. 
        # Usually, this is stores in custom metadata during initialization.
        metadata = payload.get("meta") or {}
        if isinstance(metadata, str):
            import json
            try:
                metadata = json.loads(metadata)
            except:
                metadata = {}
        
        bank_account_id = metadata.get("bank_account_id")
        
        if not bank_account_id:
            logger.error("Chapa webhook missing bank_account_id in metadata")
            return None

        # Check for duplicates
        existing = db.query(BankTransaction).filter(BankTransaction.external_id == external_id).first()
        if existing:
            return existing

        tx = BankTransaction(
            bank_account_id=bank_account_id,
            date=datetime.now(),
            description=description,
            amount=amount,
            external_id=external_id,
            status=TransactionStatus.COMPLETED # Real hits are usually completed
        )
        db.add(tx)
        
        # Notify via WebSocket if possible
        try:
            from .notification_service import notification_service
            # This is a bit of a shortcut, ideally we have a dedicated service for this
            # but let's use the notification service to alert the user
            notification_service.create_notification(
                db=db,
                user_id=tx.bank_account.created_by_id, # Alert the owner
                title="Real-Time Bank Update",
                message=f"New transaction of {amount} Br from Chapa: {description}",
                type="transaction",
                priority="medium"
            )
        except Exception as e:
            logger.error(f"Failed to send notification for bank update: {str(e)}")

        db.commit()
        db.refresh(tx)
        return tx

bank_feed_service = BankFeedSimulationService()
