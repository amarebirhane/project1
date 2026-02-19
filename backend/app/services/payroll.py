from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.payroll import EmployeeProfile, PayrollPeriod, Payslip, PayrollStatus
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine, JournalEntryStatus, ReferenceType

class PayrollService:
    @staticmethod
    def calculate_payslip(
        employee: EmployeeProfile,
        allowances: Dict[str, float],
        overtime_amount: float,
        deductions: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Calculate gross and net pay for an employee.
        """
        total_allowances = sum(allowances.values())
        total_deductions = sum(deductions.values())
        
        gross_pay = employee.base_salary + total_allowances + overtime_amount
        net_pay = gross_pay - total_deductions
        
        return {
            "base_salary": employee.base_salary,
            "gross_pay": gross_pay,
            "net_pay": net_pay,
            "total_deductions": total_deductions
        }

    @staticmethod
    def generate_period_payslips(db: Session, period_id: int):
        """
        Generates payslips for all active employees for a given period.
        """
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period or period.status != PayrollStatus.DRAFT:
            return None
        
        active_employees = db.query(EmployeeProfile).filter(EmployeeProfile.status == "active").all()
        
        total_gross = 0.0
        total_deductions = 0.0
        total_net = 0.0
        
        for emp in active_employees:
            # Basic calculation for MVP (Real system would have complex tax logic)
            # Default tax deduction of 15%
            tax = emp.base_salary * 0.15
            calc = PayrollService.calculate_payslip(
                employee=emp,
                allowances={},
                overtime_amount=0.0,
                deductions={"Income Tax": tax}
            )
            
            payslip = Payslip(
                employee_id=emp.id,
                period_id=period.id,
                base_salary=emp.base_salary,
                gross_pay=calc["gross_pay"],
                net_pay=calc["net_pay"],
                deductions={"Income Tax": tax},
                status=PayrollStatus.DRAFT
            )
            db.add(payslip)
            
            total_gross += calc["gross_pay"]
            total_deductions += calc["total_deductions"]
            total_net += calc["net_pay"]
            
        period.total_gross = total_gross
        period.total_deductions = total_deductions
        period.total_net = total_net
        
        db.commit()
        return period

    @staticmethod
    def approve_payroll(db: Session, period_id: int, user_id: int):
        """
        Approves the payroll period and creates a journal entry in accounting.
        """
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period or period.status != PayrollStatus.DRAFT:
            return None
        
        period.status = PayrollStatus.APPROVED
        
        # --- Cohesive Accounting Integration ("Gluer" Logic) ---
        from .accounting_service import accounting_service
        from ..models.account import AccountType
        from ..models.journal_entry import ReferenceType

        # 1. Get/Create necessary accounts (Dynamically)
        salaries_exp = accounting_service.get_account_for_category(
            db, "payroll", "salaries", "6100", "Salaries & Wages Expense", AccountType.EXPENSE
        )
        cash_bank = accounting_service.get_account_for_category(
            db, "banking", "default", "1010", "Cash at Bank", AccountType.ASSET
        )
        taxes_pay = accounting_service.get_account_for_category(
            db, "payroll", "taxes", "2100", "Payroll Taxes Payable", AccountType.LIABILITY
        )

        # 2. Create balanced Journal Entry
        # Dr Salaries Expense (Total Gross)
        # Cr Cash/Bank (Total Net)
        # Cr Taxes Payable (Total Deductions)
        
        lines = [
            {"account_id": salaries_exp.id, "debit": period.total_gross, "credit": 0.0, "description": "Gross Salaries Expense"},
            {"account_id": cash_bank.id, "debit": 0.0, "credit": period.total_net, "description": "Net Salary Payment"},
            {"account_id": taxes_pay.id, "debit": 0.0, "credit": period.total_deductions, "description": "Payroll Tax Liability"}
        ]

        accounting_service.create_journal_entry(
            db=db,
            description=f"Payroll Approval - {period.name}",
            reference_type=ReferenceType.EXPENSE,
            reference_id=period.id,
            lines=lines,
            created_by_id=user_id
        )
        # -----------------------------------------------------
        
        db.commit()
        return period

    @staticmethod
    def disburse_payroll(db: Session, period_id: int):
        """
        Initiates Chapa transfers for all approved payslips in a period.
        """
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period or period.status != PayrollStatus.APPROVED:
            return None
        
        from .chapa_service import chapa_service
        
        payslips = db.query(Payslip).filter(
            Payslip.period_id == period_id,
        ).all()
        
        if not payslips:
            return None
            
        success_count = 0
        total_payslips = len(payslips)
        
        for payslip in payslips:
            # Only disburse if in approved status (not already paid)
            if payslip.status != PayrollStatus.APPROVED:
                if payslip.status == PayrollStatus.PAID:
                    success_count += 1
                continue
                
            emp = payslip.employee
            if not emp.bank_account_number or not emp.bank_name:
                continue
                
            transfer_data = {
                "account_number": emp.bank_account_number,
                "account_name": emp.user.full_name,
                "bank_code": emp.bank_name, # Expected to be the bank code from Chapa
                "amount": payslip.net_pay,
                "currency": "ETB", 
                "reference": f"PAY-{period.id}-{payslip.id}"
            }
            
            response = chapa_service.create_transfer(transfer_data)
            if response.get("status") == "success":
                payslip.status = PayrollStatus.PAID
                success_count += 1
            else:
                # Log error or handle failure
                logger.error(f"Failed to disburse payslip {payslip.id}: {response.get('message')}")
                
        if success_count == total_payslips:
            period.status = PayrollStatus.PAID
            period.payment_date = date.today()
            
        db.commit()
        return period

payroll_service = PayrollService()
