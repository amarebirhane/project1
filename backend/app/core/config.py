from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore
from typing import Optional
from pathlib import Path

# Get the backend directory (parent of app/)
BASE_DIR = Path(__file__).parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_ignore_empty=True,
        env_nested_delimiter="__"
    )
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:amare@localhost/projectai"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email Configuration
    # Note: Port 465 uses SSL automatically, port 587 uses STARTTLS
    # The email service auto-detects based on port number
    # SECURITY: All SMTP credentials must be set via environment variables
    SMTP_HOST: str = ""  # Set via SMTP_HOST environment variable 
    SMTP_PORT: int = 587  # Changed to 465 (SSL) to avoid firewall blocking on port 587
    SMTP_USER: str = ""  # Set via SMTP_USER environment variable
    SMTP_PASSWORD: str = ""  # Set via SMTP_PASSWORD environment variable
    SMTP_FROM_EMAIL: str = ""  # Set via SMTP_FROM_EMAIL environment variable
    
    # Additional SMTP settings for feedback notifications
    SMTP_SERVER: str = "smtp.gmail.com"  # Default SMTP server
    SMTP_USERNAME: Optional[str] = None  # Set via SMTP_USERNAME environment variable
    FROM_EMAIL: Optional[str] = None  # Set via FROM_EMAIL environment variable
    ADMIN_EMAILS: str = ""  # Comma-separated list of admin emails for notifications
    FRONTEND_URL: str = "http://localhost:3000"  # Frontend URL for email links
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # S3 (for backups)
    # SECURITY: All AWS credentials must be set via environment variables
    AWS_ACCESS_KEY_ID: str = ""  # Set via AWS_ACCESS_KEY_ID environment variable
    AWS_SECRET_ACCESS_KEY: str = ""  # Set via AWS_SECRET_ACCESS_KEY environment variable
    AWS_BUCKET_NAME: str = ""  # Set via AWS_BUCKET_NAME environment variable
    AWS_REGION: str = "us-east-1"  # Set via AWS_REGION environment variable (default: us-east-1)
    
    # Application
    APP_NAME: str = "Finance Management System"
    DEBUG: bool = True  # Set to False in production
    VERSION: str = "1.0.0"
    
    # CORS and Hosts
    ALLOWED_ORIGINS: Optional[str] = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
    ALLOWED_HOSTS: Optional[str] = "localhost,127.0.0.1"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = "logs/app.log"
    
    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # Add these for .env extras (prevents validation errors)
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_FILE_SIZE: int = 10485760
    REPORT_RETENTION_DAYS: int = 30
    BACKUP_RETENTION_DAYS: int = 90
    AUTO_BACKUP_ENABLED: bool = True
    AUTO_BACKUP_SCHEDULE: str = "0 2 * * *"
    HEALTH_CHECK_ENABLED: bool = True
    METRICS_ENABLED: bool = False
    UPLOAD_DIR: str = "uploads"
    REPORTS_DIR: str = "reports"
    BACKUP_DIR: str = "backups"

    # AI Configuration
    GEMINI_API_KEY: Optional[str] = None  # Set via GEMINI_API_KEY environment variable

    # Chapa Configuration
    CHAPA_SECRET_KEY: Optional[str] = None
    CHAPA_WEBHOOK_HASH: Optional[str] = None

settings = Settings()