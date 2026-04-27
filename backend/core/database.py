"""
Local SQLite database — replaces Firebase/Firestore for offline operation.
All tables are created on first run; the DB file lives at backend/telematicshub.db.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "telematicshub.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'owner',
            first_name TEXT DEFAULT '',
            last_name TEXT DEFAULT '',
            name TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            assigned_vehicle TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vehicles (
            id TEXT PRIMARY KEY,
            registration_number TEXT,
            owner_uid TEXT NOT NULL,
            driver_uid TEXT DEFAULT '',
            status TEXT DEFAULT 'offline',
            last_seen TEXT DEFAULT '',
            last_reading TEXT DEFAULT '{}',
            model TEXT DEFAULT '',
            year TEXT DEFAULT '',
            driver TEXT DEFAULT '',
            insurance TEXT DEFAULT '',
            pollution TEXT DEFAULT '',
            odometer REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            extra TEXT DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            lat REAL DEFAULT 0,
            lng REAL DEFAULT 0,
            speed REAL DEFAULT 0,
            fuel REAL DEFAULT 0,
            temp REAL DEFAULT 0,
            rpm INTEGER DEFAULT 0,
            engine_load INTEGER DEFAULT 0,
            throttle INTEGER DEFAULT 0,
            intake_air INTEGER DEFAULT 0,
            battery REAL DEFAULT 0,
            alcohol_level INTEGER DEFAULT 0,
            mq3_voltage REAL DEFAULT 0,
            gps_valid INTEGER DEFAULT 0,
            altitude REAL DEFAULT 0,
            gps_speed REAL DEFAULT 0,
            satellites INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            resolved INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            resolved_at TEXT DEFAULT '',
            resolved_by TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS maintenance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            service_type TEXT DEFAULT '',
            description TEXT DEFAULT '',
            date TEXT DEFAULT '',
            cost REAL DEFAULT 0,
            odometer REAL DEFAULT 0,
            next_service_date TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            document_type TEXT DEFAULT '',
            document_number TEXT DEFAULT '',
            expiry_date TEXT DEFAULT '',
            file_url TEXT DEFAULT '',
            status TEXT DEFAULT 'valid',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            driver TEXT DEFAULT '',
            origin TEXT DEFAULT '',
            destination TEXT DEFAULT '',
            distance REAL DEFAULT 0,
            duration TEXT DEFAULT '',
            fuel_used REAL DEFAULT 0,
            start_time TEXT DEFAULT '',
            end_time TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sensor_vehicle_ts
            ON sensor_data(vehicle_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_alerts_vehicle
            ON alerts(vehicle_id, created_at DESC);
    """)
    conn.commit()
    conn.close()
