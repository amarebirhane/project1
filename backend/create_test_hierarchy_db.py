# create_test_hierarchy_db.py

import sqlite3
import os

DB_NAME = "test_hierarchy.db"

# Remove old DB if exists
if os.path.exists(DB_NAME):
    try:
        os.remove(DB_NAME)
    except PermissionError:
        print("⚠ Cannot delete existing DB (file in use). Close applications and try again.")
        raise

# Create new SQLite DB
conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()

cursor.executescript("""
PRAGMA foreign_keys = ON;


CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'EMPLOYEE',
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    otp_secret TEXT,
    manager_id INTEGER,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    last_login DATETIME,
    FOREIGN KEY(manager_id) REFERENCES users(id)
);

CREATE TABLE revenue_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    amount FLOAT NOT NULL,
    category TEXT,
    source TEXT,
    date DATETIME NOT NULL,
    is_recurring BOOLEAN,
    recurring_frequency TEXT,
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    is_approved BOOLEAN,
    approved_by_id INTEGER,
    approved_at DATETIME,
    attachment_url TEXT,
    FOREIGN KEY(created_by_id) REFERENCES users(id),
    FOREIGN KEY(approved_by_id) REFERENCES users(id)
);

CREATE TABLE expense_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    amount FLOAT NOT NULL,
    category TEXT,
    vendor TEXT,
    date DATETIME NOT NULL,
    is_recurring BOOLEAN,
    recurring_frequency TEXT,
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    is_approved BOOLEAN,
    approved_by_id INTEGER,
    approved_at DATETIME,
    attachment_url TEXT,
    receipt_url TEXT,
    FOREIGN KEY(created_by_id) REFERENCES users(id),
    FOREIGN KEY(approved_by_id) REFERENCES users(id)
);


CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE approval_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requester_id INTEGER NOT NULL,
    approver_id INTEGER,
    revenue_entry_id INTEGER,
    expense_entry_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    approved_at DATETIME,
    rejection_reason TEXT,
    priority TEXT DEFAULT 'medium',
    FOREIGN KEY(requester_id) REFERENCES users(id),
    FOREIGN KEY(approver_id) REFERENCES users(id),
    FOREIGN KEY(revenue_entry_id) REFERENCES revenue_entries(id),
    FOREIGN KEY(expense_entry_id) REFERENCES expense_entries(id)
);

CREATE TABLE approval_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generating',
    parameters TEXT,
    file_url TEXT,
    file_size INTEGER,
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    generated_at DATETIME,
    expires_at DATETIME,
    is_public BOOLEAN DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    FOREIGN KEY(created_by_id) REFERENCES users(id)
);

CREATE TABLE report_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    day_of_week INTEGER,
    day_of_month INTEGER,
    month INTEGER,
    next_run DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE
);
""")

conn.commit()
conn.close()

print("✅ Created new test_hierarchy.db successfully.")
