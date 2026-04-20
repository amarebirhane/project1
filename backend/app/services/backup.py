import os
import json
import zipfile
import shutil
import subprocess
import platform
import boto3 # type: ignore[import-untyped]
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import logging
from sqlalchemy import create_engine, text # type: ignore[import-untyped]

from ..core.config import settings
from ..core.database import get_db

logger = logging.getLogger(__name__)


def _find_pg_tool(tool_name: str) -> str:
    """
    Find PostgreSQL tool (pg_dump, psql) on the system.
    Checks common installation paths on Windows if not found in PATH.
    """
    # First, try the tool directly (in case it's in PATH)
    try:
        result = subprocess.run(
            [tool_name, '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return tool_name
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # On Windows, check common PostgreSQL installation paths
    if platform.system() == 'Windows':
        # Check common PostgreSQL versions (16 down to 12)
        for version in range(16, 11, -1):
            paths = [
                rf'C:\Program Files\PostgreSQL\{version}\bin\{tool_name}.exe',
                rf'C:\Program Files (x86)\PostgreSQL\{version}\bin\{tool_name}.exe',
            ]
            for path in paths:
                if os.path.exists(path):
                    logger.info(f"Found {tool_name} at: {path}")
                    return path
    
    # On Linux/Mac, the tool should be in PATH if PostgreSQL is installed
    raise FileNotFoundError(
        f"{tool_name} not found. Please ensure PostgreSQL client tools are installed "
        f"and accessible. On Windows, install PostgreSQL or add the bin directory to PATH."
    )


class BackupService:
    """Service for creating and managing system backups"""
    
    @staticmethod
    def create_backup(include_files: bool = False) -> str:
        """Create a complete system backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{timestamp}"
        backup_dir = f"backups/{backup_name}"
        
        try:
            # Create backup directory
            os.makedirs(backup_dir, exist_ok=True)
            
            # Backup database
            db_backup_file = BackupService._backup_database(backup_dir, backup_name)
            
            # Backup files if requested
            if include_files:
                BackupService._backup_files(backup_dir)
            
            # Create backup metadata
            metadata = {
                "backup_name": backup_name,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "include_files": include_files,
                "database_backup": db_backup_file,
                "version": settings.VERSION
            }
            
            with open(f"{backup_dir}/metadata.json", "w") as f:
                json.dump(metadata, f, indent=2)
            
            # Create zip file
            zip_file = f"backups/{backup_name}.zip"
            BackupService._create_zip(backup_dir, zip_file)
            
            # Upload to S3 if configured
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME:
                BackupService._upload_to_s3(zip_file, backup_name)
            
            # Clean up temporary directory
            BackupService._cleanup_directory(backup_dir)
            
            logger.info(f"Backup created successfully: {backup_name}")
            return backup_name
            
        except Exception as e:
            logger.error(f"Failed to create backup: {str(e)}")
            # Clean up on failure
            if os.path.exists(backup_dir):
                BackupService._cleanup_directory(backup_dir)
            raise
    
    @staticmethod
    def _backup_database(backup_dir: str, backup_name: str) -> str:
        """Backup database to SQL file"""
        db_url = settings.DATABASE_URL
        
        if "postgresql" in db_url:
            # PostgreSQL backup - find pg_dump tool
            pg_dump_path = _find_pg_tool("pg_dump")
            
            # Parse connection details
            import urllib.parse
            parsed = urllib.parse.urlparse(db_url)
            
            host = parsed.hostname
            port = parsed.port or 5432
            database = parsed.path[1:]  # Remove leading slash
            username = parsed.username
            password = parsed.password
            
            # Create pg_dump command
            backup_file = f"{backup_dir}/database_{backup_name}.sql"
            
            env = os.environ.copy()
            env["PGPASSWORD"] = password
            
            cmd = [
                pg_dump_path,
                f"-h{host}",
                f"-p{port}",
                f"-U{username}",
                f"-d{database}",
                "--no-password",
                "--clean",
                "--no-acl",
                "--no-owner",
                "-f", backup_file
            ]
            
            logger.info(f"Running pg_dump: {' '.join(cmd[:5])}...")
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"Database backup failed: {result.stderr}")
            
            logger.info(f"Database backup created: {backup_file}")
            return backup_file
            
        elif "sqlite" in db_url:
            # SQLite backup - just copy the file
            import shutil
            
            db_file = db_url.replace("sqlite:///", "")
            backup_file = f"{backup_dir}/database_{backup_name}.db"
            shutil.copy2(db_file, backup_file)
            
            return backup_file
            
        else:
            # Generic backup using SQLAlchemy
            backup_file = f"{backup_dir}/database_{backup_name}.sql"
            
            engine = create_engine(db_url)
            
            with engine.connect() as conn:
                result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
                tables = [row[0] for row in result]
                
                with open(backup_file, "w") as f:
                    for table in tables:
                        f.write(f"-- Table: {table}\n")
                        result = conn.execute(text(f"SELECT * FROM {table}"))
                        # Write INSERT statements (simplified)
                        f.write(f"-- {result.rowcount} rows\n\n")
            
            return backup_file
    
    @staticmethod
    def _backup_files(backup_dir: str):
        """Backup uploaded files and attachments"""
        files_dir = "uploads"
        if os.path.exists(files_dir):
            import shutil
            shutil.copytree(files_dir, f"{backup_dir}/uploads")
    
    @staticmethod
    def _create_zip(source_dir: str, zip_file: str):
        """Create zip file from directory"""
        with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)
    
    @staticmethod
    def _upload_to_s3(zip_file: str, backup_name: str):
        """Upload backup to S3"""
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            
            s3_key = f"backups/{backup_name}.zip"
            s3_client.upload_file(zip_file, settings.AWS_BUCKET_NAME, s3_key)
            
            logger.info(f"Backup uploaded to S3: {s3_key}")
            
        except Exception as e:
            logger.error(f"Failed to upload backup to S3: {str(e)}")
            # Don't raise - backup is still created locally
    
    @staticmethod
    def _cleanup_directory(directory: str):
        """Remove directory and all its contents"""
        import shutil
        if os.path.exists(directory):
            shutil.rmtree(directory)
    
    @staticmethod
    def list_backups() -> List[Dict[str, Any]]:
        """List available backups"""
        backups = []
        backups_dir = "backups"
        
        if not os.path.exists(backups_dir):
            return backups
        
        for file in os.listdir(backups_dir):
            if file.endswith(".zip"):
                file_path = os.path.join(backups_dir, file)
                stat = os.stat(file_path)
                
                # Try to read metadata
                metadata = {}
                try:
                    # Extract metadata.json from zip
                    with zipfile.ZipFile(file_path, 'r') as zipf:
                        if 'metadata.json' in zipf.namelist():
                            with zipf.open('metadata.json') as f:
                                metadata = json.load(f)
                except:
                    pass
                
                backups.append({
                    "name": file.replace(".zip", ""),
                    "file": file,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "metadata": metadata
                })
        
        # Sort by creation date (newest first)
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        return backups
    
    @staticmethod
    def restore_backup(backup_name: str) -> bool:
        """Restore from backup"""
        backup_file = f"backups/{backup_name}.zip"
        
        if not os.path.exists(backup_file):
            raise FileNotFoundError(f"Backup file not found: {backup_file}")
        
        try:
            # Extract backup
            temp_dir = f"temp_restore_{backup_name}"
            os.makedirs(temp_dir, exist_ok=True)
            
            with zipfile.ZipFile(backup_file, 'r') as zipf:
                zipf.extractall(temp_dir)
            
            # Read metadata
            metadata_file = f"{temp_dir}/metadata.json"
            if os.path.exists(metadata_file):
                with open(metadata_file) as f:
                    metadata = json.load(f)
            else:
                metadata = {}
            
            # Restore database
            db_backup_file = metadata.get("database_backup")
            if db_backup_file and os.path.exists(f"{temp_dir}/{db_backup_file}"):
                BackupService._restore_database(f"{temp_dir}/{db_backup_file}")
            
            # Restore files if included
            if metadata.get("include_files") and os.path.exists(f"{temp_dir}/uploads"):
                BackupService._restore_files(f"{temp_dir}/uploads")
            
            # Clean up
            BackupService._cleanup_directory(temp_dir)
            
            logger.info(f"Backup restored successfully: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to restore backup: {str(e)}")
            # Clean up on failure
            if os.path.exists(temp_dir):
                BackupService._cleanup_directory(temp_dir)
            raise
    
    @staticmethod
    def _restore_database(backup_file: str):
        """Restore database from backup file"""
        db_url = settings.DATABASE_URL
        
        if "postgresql" in db_url and backup_file.endswith(".sql"):
            # PostgreSQL restore - find psql tool
            psql_path = _find_pg_tool("psql")
            
            # Parse connection details
            import urllib.parse
            parsed = urllib.parse.urlparse(db_url)
            
            host = parsed.hostname
            port = parsed.port or 5432
            database = parsed.path[1:]
            username = parsed.username
            password = parsed.password
            
            env = os.environ.copy()
            env["PGPASSWORD"] = password
            
            cmd = [
                psql_path,
                f"-h{host}",
                f"-p{port}",
                f"-U{username}",
                f"-d{database}",
                "--no-password",
                "-f", backup_file
            ]
            
            logger.info(f"Running psql restore: {' '.join(cmd[:5])}...")
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"Database restore failed: {result.stderr}")
            
            logger.info(f"Database restored from: {backup_file}")
        
        elif "sqlite" in db_url and backup_file.endswith(".db"):
            # SQLite restore
            db_file = db_url.replace("sqlite:///", "")
            shutil.copy2(backup_file, db_file)
            logger.info(f"SQLite database restored from: {backup_file}")
        
        else:
            raise Exception("Unsupported database backup format")
    
    @staticmethod
    def _restore_files(uploads_backup_dir: str):
        """Restore uploaded files"""
        uploads_dir = "uploads"
        
        # Remove existing uploads directory
        if os.path.exists(uploads_dir):
            import shutil
            shutil.rmtree(uploads_dir)
        
        # Copy backup
        import shutil
        shutil.copytree(uploads_backup_dir, uploads_dir)
    
    @staticmethod
    def delete_backup(backup_name: str) -> bool:
        """Delete a backup"""
        backup_file = f"backups/{backup_name}.zip"
        
        try:
            if os.path.exists(backup_file):
                os.remove(backup_file)
            
            # Also delete from S3 if configured
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME:
                try:
                    s3_client = boto3.client(
                        's3',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION
                    )
                    
                    s3_key = f"backups/{backup_name}.zip"
                    s3_client.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=s3_key)
                    
                except Exception as e:
                    logger.warning(f"Failed to delete backup from S3: {str(e)}")
            
            logger.info(f"Backup deleted successfully: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete backup: {str(e)}")
            return False
    
    @staticmethod
    def cleanup_old_backups(days_to_keep: int = 30) -> int:
        """Delete backups older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        deleted_count = 0
        
        backups = BackupService.list_backups()
        for backup in backups:
            created_at = datetime.fromisoformat(backup["created_at"])
            if created_at < cutoff_date:
                if BackupService.delete_backup(backup["name"]):
                    deleted_count += 1
        
        logger.info(f"Cleaned up {deleted_count} old backups")
        return deleted_count
