# Migration Guide: SQLite to PostgreSQL

This guide provides step-by-step instructions for migrating the Finance Management System database from SQLite to a production-ready PostgreSQL environment.

## Prerequisites
- A running PostgreSQL instance.
- `pgloader` installed on your system (recommended for automated migration).
- Alternatively, search for "SQLAlchemy database migration tools".

## Step 1: Update Configuration
1. Open your `.env` file or set the environment variable:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```
2. Verify connectivity by running the backend:
   ```bash
   uvicorn app.main:app --reload
   ```
   *Note: On first run, it will automatically create the tables if they don't exist.*

## Step 2: Data Migration Options

### Option A: Using `pgloader` (Recommended)
`pgloader` is a powerful tool that can migrate data directly from SQLite to PostgreSQL.
1. Create a command file `migrate.load`:
   ```lisp
   load database
        from sqlite:///path/to/app/app.db
        into postgresql://user:password@localhost/dbname

    with include drop, create tables, create indexes, reset sequences

    set work_mem to '16MB', maintenance_work_mem to '512MB'
   ```
2. Run pgloader:
   ```bash
   pgloader migrate.load
   ```

### Option B: Manual SQL Export/Import
1. Export SQLite data to SQL:
   ```bash
   sqlite3 app.db .dump > dump.sql
   ```
2. Adjust the `dump.sql` file (PostgreSQL has slightly different syntax for some types and constraints).
3. Import into PostgreSQL:
   ```bash
   psql -U user -d dbname -f dump.sql
   ```

## Step 3: Verify Migration
1. Log in with your existing admin credentials.
2. Verify that all financial records, budget data, and user permissions are intact.
3. Check the `AuditLogs` to ensure recent activities were migrated successfully.

## Post-Migration
- Ensure automatic backups are configured for your PostgreSQL instance.
- Update `AUTO_BACKUP_ENABLED` in your environment settings if using the built-in S3 backup feature.
