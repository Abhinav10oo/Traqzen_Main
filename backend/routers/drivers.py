"""
Driver management — reads from users table (role=driver) backed by SQLite.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/")
def list_drivers(current_user: dict = Depends(get_current_owner)):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM users WHERE role = 'driver'"
        ).fetchall()
    finally:
        conn.close()
    return [
        {
            "id":              r["id"],
            "name":            r["name"],
            "email":           r["email"],
            "phone":           r["phone"],
            "assignedVehicle": r["assigned_vehicle"],
        }
        for r in rows
    ]
