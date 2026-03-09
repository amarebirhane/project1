# app/core/email.py
"""
Email Service for sending notifications
Supports SMTP for sending emails
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging
from .config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service using SMTP"""
    
    def __init__(self):
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', None)
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
        self.from_email = getattr(settings, 'FROM_EMAIL', self.smtp_username)
        self.admin_emails = getattr(settings, 'ADMIN_EMAILS', [])
        
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """
        Send an email via SMTP
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured. Email not sent.")
            logger.info(f"Would have sent email to {to_emails}: {subject}")
            return False
            
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = ', '.join(to_emails)
            
            # Add plain text body
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML body if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Connect to SMTP server and send
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
                
            logger.info(f"Email sent successfully to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    def send_feedback_notification(
        self,
        feedback_id: int,
        rating: int,
        message: str,
        category: str = "general",
        user_email: Optional[str] = None
    ) -> bool:
        """
        Send notification to admins about new feedback
        
        Args:
            feedback_id: ID of the feedback
            rating: Rating (1-5 stars)
            message: Feedback message
            category: Feedback category
            user_email: Email of user who submitted (if authenticated)
            
        Returns:
            bool: True if email sent successfully
        """
        if not self.admin_emails:
            logger.warning("No admin emails configured. Feedback notification not sent.")
            logger.info(f"New feedback #{feedback_id} with {rating} stars")
            return False
        
        # Create email subject
        stars = "⭐" * rating
        subject = f"New Feedback Received: {stars} ({rating}/5)"
        
        # Create plain text body
        body = f"""
New feedback has been submitted to the system.

Feedback ID: #{feedback_id}
Rating: {rating}/5 stars
Category: {category.replace('_', ' ').title()}
Submitted by: {user_email if user_email else 'Anonymous User'}

Message:
{message}

---
View and manage this feedback in the admin panel:
{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/admin/feedback
"""
        
        # Create HTML body
        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">New Feedback Received</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 10px 0;"><strong>Feedback ID:</strong> #{feedback_id}</p>
            <p style="margin: 10px 0;"><strong>Rating:</strong> {stars} ({rating}/5)</p>
            <p style="margin: 10px 0;"><strong>Category:</strong> {category.replace('_', ' ').title()}</p>
            <p style="margin: 10px 0;"><strong>Submitted by:</strong> {user_email if user_email else 'Anonymous User'}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4b5563;">Message:</h3>
            <p style="white-space: pre-wrap;">{message}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/admin/feedback" 
               style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View in Admin Panel
            </a>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(
            to_emails=self.admin_emails,
            subject=subject,
            body=body,
            html_body=html_body
        )


    def send_verification_email(self, email: str, token: str) -> bool:
        """Send email verification link to new user"""
        verification_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={token}"
        subject = "Verify Your Email - Finance System"
        
        body = f"Please verify your email by clicking the link: {verification_link}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to Finance Management System!</h2>
                <p>Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
                <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
                    <a href="{verification_link}" 
                       style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{verification_link}</p>
                <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 0.8em; color: #666;">This link will expire in {getattr(settings, 'EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS', 24)} hours.</p>
            </div>
        </body>
        </html>
        """
        return self.send_email([email], subject, body, html_body)

# Create singleton instance
email_service = EmailService()
