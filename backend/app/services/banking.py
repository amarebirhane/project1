from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta
import csv
import io
from typing import List

from ..models.banking import BankAccount, BankTransaction, TransactionStatus
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine, JournalEntryStatus
from ..models.account import Account
from ..schemas import banking as banking_schema


class BankingService:

    @staticmethod
    def _get_account_balance(db: Session, account_id: int) -> float:
        """Compute the current balance of a bank account by summing its transactions."""
        result = db.query(func.coalesce(func.sum(BankTransaction.amount), 0.0)).filter(
            BankTransaction.bank_account_id == account_id
        ).scalar()
        return float(result)

    @staticmethod
    def match_transaction(db: Session, transaction_id: int) -> bool:
        """
        Attempt to auto-match a bank transaction to an existing journal entry.
        """
        transaction = db.query(BankTransaction).filter(BankTransaction.id == transaction_id).first()
        if not transaction or transaction.journal_entry_id:
            return False

        target_amount = abs(transaction.amount)
        is_deposit = transaction.amount > 0

        from ..models.account import AccountType

        start_date = transaction.date - timedelta(days=3)
        end_date = transaction.date + timedelta(days=3)

        match = (
            db.query(AccountingJournalEntry)
            .join(JournalEntryLine)
            .join(Account)
            .filter(
                Account.account_type == AccountType.ASSET,
                AccountingJournalEntry.entry_date.between(start_date, end_date),
                AccountingJournalEntry.status == JournalEntryStatus.POSTED
            )
            .filter(
                or_(
                    and_(is_deposit, JournalEntryLine.debit_amount >= target_amount - 0.01, JournalEntryLine.debit_amount <= target_amount + 0.01),
                    and_(not is_deposit, JournalEntryLine.credit_amount >= target_amount - 0.01, JournalEntryLine.credit_amount <= target_amount + 0.01)
                )
            )
            .first()
        )

        if match:
            transaction.journal_entry_id = match.id
            transaction.status = TransactionStatus.COMPLETED
            db.commit()
            return True

        return False

    @staticmethod
    def process_csv_upload(db: Session, bank_account_id: int, file_content: bytes, user_id: int):
        """
        Parse CSV and create BankTransaction records.
        Expected Format: Date, Description, Amount
        """
        decoded = file_content.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(decoded))

        transactions = []
        for row in csv_reader:
            date_str = row.get("Date") or row.get("date")
            desc = row.get("Description") or row.get("description") or row.get("Memo")
            amount_str = row.get("Amount") or row.get("amount")

            if date_str and amount_str:
                try:
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                    amount = float(amount_str)

                    tx = BankTransaction(
                        bank_account_id=bank_account_id,
                        date=dt,
                        description=desc or "Imported Transaction",
                        amount=amount,
                        status=TransactionStatus.PENDING,
                        created_by_id=user_id
                    )
                    db.add(tx)
                    transactions.append(tx)
                except Exception as e:
                    print(f"Skipping row {row}: {e}")
                    continue

        db.commit()
        return transactions

    @staticmethod
    def initiate_transfer(
        db: Session,
        transfer_in: banking_schema.MoneyTransferCreate,
        user_id: int
    ) -> banking_schema.MoneyTransferResponse:
        """
        Process a money transfer:
        - Validates the sender has sufficient balance
        - Creates a debit (outflow) transaction on the sender's account
        - For internal transfers: finds the recipient's bank account and creates a credit (inflow)
        - For external bank transfers: calls Chapa API
        All DB changes are atomic — rolled back on any failure.
        """
        from .chapa_service import chapa_service

        # 1. Validate source account
        source_account = db.query(BankAccount).filter(BankAccount.id == transfer_in.source_account_id).first()
        if not source_account:
            return banking_schema.MoneyTransferResponse(status="error", message="Source account not found")

        amount = abs(transfer_in.amount)
        if amount <= 0:
            return banking_schema.MoneyTransferResponse(status="error", message="Transfer amount must be greater than zero")

        # 2. Check sender has sufficient balance
        current_balance = BankingService._get_account_balance(db, source_account.id)
        if current_balance < amount:
            return banking_schema.MoneyTransferResponse(
                status="error",
                message=f"Insufficient balance. Available: {current_balance:.2f}, Requested: {amount:.2f}"
            )

        now = datetime.now()
        reference = transfer_in.reference or f"TX-{int(now.timestamp())}"

        try:
            if transfer_in.transfer_type == "accountant":
                # --- Internal Transfer ---
                external_id = f"INT-{int(now.timestamp())}"

                # Find the recipient's first active bank account
                recipient_account = None
                if transfer_in.recipient_user_id:
                    recipient_account = db.query(BankAccount).filter(
                        BankAccount.created_by_id == transfer_in.recipient_user_id,
                        BankAccount.is_active == True
                    ).first()

                # Debit the sender
                debit_tx = BankTransaction(
                    bank_account_id=source_account.id,
                    date=now,
                    description=f"Internal transfer to {transfer_in.beneficiary_name} – {reference}",
                    amount=-amount,
                    status=TransactionStatus.MATCHED,
                    external_id=external_id,
                    created_by_id=user_id
                )
                db.add(debit_tx)

                # Credit the recipient (if they have a bank account in the system)
                if recipient_account:
                    credit_tx = BankTransaction(
                        bank_account_id=recipient_account.id,
                        date=now,
                        description=f"Internal transfer from {source_account.account_name} – {reference}",
                        amount=amount,
                        status=TransactionStatus.MATCHED,
                        external_id=f"{external_id}-IN",
                        created_by_id=user_id
                    )
                    db.add(credit_tx)

                db.commit()
                db.refresh(debit_tx)

                suffix = "" if recipient_account else " (recipient has no linked bank account — only your account was debited)"
                return banking_schema.MoneyTransferResponse(
                    status="success",
                    message=f"Transfer of {amount:.2f} to {transfer_in.beneficiary_name} completed{suffix}",
                    transaction_id=debit_tx.id,
                    external_reference=external_id
                )

            else:
                # --- External Bank Transfer via Chapa ---
                chapa_data = {
                    "account_number": transfer_in.account_number,
                    "bank_code": transfer_in.bank_code,
                    "beneficiary_name": transfer_in.beneficiary_name,
                    "amount": amount,
                    "currency": source_account.currency_code,
                    "reference": reference
                }
                try:
                    response = chapa_service.create_transfer(chapa_data)
                except Exception as e:
                    return banking_schema.MoneyTransferResponse(
                        status="error",
                        message=f"Chapa transfer failed: {str(e)}"
                    )

                # Debit sender
                debit_tx = BankTransaction(
                    bank_account_id=source_account.id,
                    date=now,
                    description=f"Transfer to {transfer_in.beneficiary_name} – {reference}",
                    amount=-amount,
                    status=TransactionStatus.PENDING,
                    external_id=response.get("reference") or reference,
                    created_by_id=user_id
                )
                db.add(debit_tx)
                db.commit()
                db.refresh(debit_tx)

                return banking_schema.MoneyTransferResponse(
                    status="success",
                    message=f"Transfer of {amount:.2f} to {transfer_in.beneficiary_name} initiated via Chapa",
                    transaction_id=debit_tx.id,
                    external_reference=debit_tx.external_id
                )

        except Exception as e:
            db.rollback()
            return banking_schema.MoneyTransferResponse(status="error", message=f"Transfer failed: {str(e)}")


banking_service = BankingService()
