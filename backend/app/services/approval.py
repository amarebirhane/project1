from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session # type: ignore[import-untyped]

from ..crud.approval import approval as approval_crud
from ..crud.user import user as user_crud
from ..crud.notification import notification as notification_crud
from ..models.approval import ApprovalWorkflow, ApprovalStatus, ApprovalType
from ..models.user import User, UserRole
from ..models.notification import NotificationType, NotificationPriority
from ..core.database import get_db


class ApprovalService:
    """Service for managing approval workflows and business logic"""
    
    @staticmethod
    def create_approval_workflow(
        db: Session,
        entry_type: str,
        entry_id: int,
        title: str,
        description: str,
        requester_id: int
    ) -> ApprovalWorkflow:
        """Create approval workflow for revenue/expense entries"""
        from ..schemas.approval import ApprovalCreate
        
        # Determine approval type
        if entry_type == "revenue":
            approval_type = ApprovalType.REVENUE
            approval_data = ApprovalCreate(
                title=title,
                description=description,
                type=approval_type,
                revenue_entry_id=entry_id
            )
        elif entry_type == "expense":
            approval_type = ApprovalType.EXPENSE
            approval_data = ApprovalCreate(
                title=title,
                description=description,
                type=approval_type,
                expense_entry_id=entry_id
            )
        else:
            raise ValueError(f"Unsupported entry type: {entry_type}")
        
        # Create approval workflow
        approval = approval_crud.create(db, obj_in=approval_data, requester_id=requester_id)
        
        # Determine approver based on hierarchy
        approver = ApprovalService._get_approver(db, requester_id)
        if approver:
            approval.approver_id = approver.id
            db.commit()
            db.refresh(approval)
            
            # Send notification to approver
            ApprovalService._send_approval_notification(db, approval, approver)
        
        return approval
    
    @staticmethod
    def _get_approver(db: Session, requester_id: int) -> User:
        """Get the appropriate approver based on hierarchy"""
        requester = user_crud.get(db, requester_id)
        if not requester:
            return None
        
        # If user has a manager, assign to manager
        if requester.manager_id:
            manager = user_crud.get(db, requester.manager_id)
            if manager and manager.is_active and manager.role in [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
                return manager
        
        # If no manager, find first admin
        admin = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
            User.is_active == True
        ).first()
        
        return admin
    
    @staticmethod
    def _send_approval_notification(db: Session, approval: ApprovalWorkflow, approver: User):
        """Send notification to approver"""
        try:
            from ..services.email import EmailService
            
            notification_data = {
                "user_id": approver.id,
                "title": f"Approval Required: {approval.title}",
                "message": f"You have a new {approval.type.value} approval request from {approval.requester.username if approval.requester else 'Unknown'}",
                "type": NotificationType.APPROVAL_REQUEST,
                "priority": NotificationPriority.HIGH,
                "action_url": f"/approvals/{approval.id}"
            }
            
            notification = notification_crud.create(db, obj_in=notification_data)
            
            # Send email if configured
            if approver.email:
                EmailService.send_approval_notification(
                    approver.email,
                    approver.full_name or approver.username,
                    approval.title,
                    approval.type.value,
                    f"/approvals/{approval.id}"
                )
                
        except Exception as e:
            # Log error but don't fail the approval creation
            print(f"Failed to send approval notification: {str(e)}")
    
    @staticmethod
    def process_approval(
        db: Session,
        approval_id: int,
        approver_id: int,
        decision: str,
        reason: str = None
    ) -> ApprovalWorkflow:
        """Process approval decision"""
        approval = approval_crud.get(db, approval_id)
        if not approval:
            raise ValueError("Approval not found")
        
        if approval.status != ApprovalStatus.PENDING:
            raise ValueError("Approval is not pending")
        
        if decision == "approve":
            approval = approval_crud.approve(db, approval_id, approver_id)
            
            # Send approval notification to requester
            ApprovalService._send_decision_notification(db, approval, "approved")
            
        elif decision == "reject":
            approval = approval_crud.reject(db, approval_id, approver_id, reason)
            
            # Send rejection notification to requester
            ApprovalService._send_decision_notification(db, approval, "rejected", reason)
            
        else:
            raise ValueError("Invalid decision")
        
        return approval
    
    @staticmethod
    def _send_decision_notification(
        db: Session,
        approval: ApprovalWorkflow,
        decision: str,
        reason: str = None
    ):
        """Send decision notification to requester"""
        try:
            from ..services.email import EmailService
            
            if approval.requester and approval.requester.email:
                EmailService.send_approval_decision(
                    approval.requester.email,
                    approval.title,
                    decision,
                    reason
                )
            
            # Create in-app notification
            message = f"Your approval request '{approval.title}' has been {decision}"
            if reason:
                message += f". Reason: {reason}"
            
            notification_data = {
                "user_id": approval.requester_id,
                "title": f"Approval {decision.title()}: {approval.title}",
                "message": message,
                "type": NotificationType.APPROVAL_DECISION,
                "priority": NotificationPriority.MEDIUM,
                "action_url": f"/approvals/{approval.id}"
            }
            
            notification_crud.create(db, obj_in=notification_data)
            
        except Exception as e:
            print(f"Failed to send decision notification: {str(e)}")
    
    @staticmethod
    def get_approval_statistics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get approval statistics for the specified period"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get all approvals in the period
        all_approvals = approval_crud.get_multi(db, skip=0, limit=10000)
        period_approvals = [a for a in all_approvals if a.created_at >= start_date]
        
        # Calculate statistics
        total = len(period_approvals)
        approved = len([a for a in period_approvals if a.status == ApprovalStatus.APPROVED])
        rejected = len([a for a in period_approvals if a.status == ApprovalStatus.REJECTED])
        pending = len([a for a in period_approvals if a.status == ApprovalStatus.PENDING])
        
        # Calculate average approval time
        approved_approvals = [a for a in period_approvals if a.status == ApprovalStatus.APPROVED and a.approved_at]
        if approved_approvals:
            avg_approval_time = sum(
                (a.approved_at - a.created_at).total_seconds() 
                for a in approved_approvals
            ) / len(approved_approvals)
            avg_approval_hours = avg_approval_time / 3600
        else:
            avg_approval_hours = 0
        
        # By type
        revenue_approvals = [a for a in period_approvals if a.type == ApprovalType.REVENUE]
        expense_approvals = [a for a in period_approvals if a.type == ApprovalType.EXPENSE]
        
        return {
            "period_days": days,
            "total_approvals": total,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "approval_rate": (approved / total * 100) if total > 0 else 0,
            "rejection_rate": (rejected / total * 100) if total > 0 else 0,
            "average_approval_hours": round(avg_approval_hours, 2),
            "by_type": {
                "revenue": {
                    "total": len(revenue_approvals),
                    "approved": len([a for a in revenue_approvals if a.status == ApprovalStatus.APPROVED]),
                    "rejected": len([a for a in revenue_approvals if a.status == ApprovalStatus.REJECTED]),
                    "pending": len([a for a in revenue_approvals if a.status == ApprovalStatus.PENDING])
                },
                "expense": {
                    "total": len(expense_approvals),
                    "approved": len([a for a in expense_approvals if a.status == ApprovalStatus.APPROVED]),
                    "rejected": len([a for a in expense_approvals if a.status == ApprovalStatus.REJECTED]),
                    "pending": len([a for a in expense_approvals if a.status == ApprovalStatus.PENDING])
                }
            }
        }
    
    @staticmethod
    def get_pending_approvals_for_user(db: Session, user_id: int) -> List[ApprovalWorkflow]:
        """Get pending approvals that a user needs to approve"""
        user = user_crud.get(db, user_id)
        if not user:
            return []
        
        # Admins and super admins see all pending approvals
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return approval_crud.get_pending(db, user_id)
        
        # Managers see pending approvals from their subordinates
        if user.role == UserRole.MANAGER:
            all_pending = approval_crud.get_pending(db)
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)]
            return [a for a in all_pending if a.requester_id in subordinate_ids]
        
        # Other roles don't have approval permissions
        return []
    
    @staticmethod
    def auto_approve_small_amounts(
        db: Session,
        entry_type: str,
        amount: float,
        threshold: float = 1000.0
    ) -> bool:
        """Auto-approve entries below threshold amount"""
        if amount <= threshold:
            return True
        return False
    
    @staticmethod
    def get_approval_workload(db: Session, approver_id: int, days: int = 30) -> Dict[str, Any]:
        """Get workload statistics for an approver"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get approvals assigned to this user
        user_approvals = approval_crud.get_by_approver(db, approver_id, 0, 10000)
        period_approvals = [a for a in user_approvals if a.created_at >= start_date]
        
        # Calculate workload
        total_assigned = len(period_approvals)
        approved = len([a for a in period_approvals if a.status == ApprovalStatus.APPROVED])
        rejected = len([a for a in period_approvals if a.status == ApprovalStatus.REJECTED])
        still_pending = len([a for a in period_approvals if a.status == ApprovalStatus.PENDING])
        
        # Calculate average response time
        processed_approvals = [a for a in period_approvals if a.status in [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] and a.approved_at]
        if processed_approvals:
            avg_response_time = sum(
                (a.approved_at - a.created_at).total_seconds() 
                for a in processed_approvals
            ) / len(processed_approvals)
            avg_response_hours = avg_response_time / 3600
        else:
            avg_response_hours = 0
        
        return {
            "approver_id": approver_id,
            "period_days": days,
            "total_assigned": total_assigned,
            "approved": approved,
            "rejected": rejected,
            "still_pending": still_pending,
            "completion_rate": ((approved + rejected) / total_assigned * 100) if total_assigned > 0 else 0,
            "average_response_hours": round(avg_response_hours, 2)
        }
