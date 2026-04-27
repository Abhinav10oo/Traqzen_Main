"""
Maintenance records — backed by SQLite.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("/")
def list_maintenance(
    vehicle_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    sql    = "SELECT * FROM maintenance WHERE 1=1"
    params: list = []
    if vehicle_id:
        sql += " AND vehicle_id = ?"
        params.append(vehicle_id)
    sql += " ORDER BY date DESC"

    conn = get_db()
    try:
        rows = conn.execute(sql, params).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.post("/", status_code=201)
def create_maintenance(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT INTO maintenance
               (vehicle_id, service_type, description, date, cost, odometer, next_service_date, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.get("vehicle_id", ""),
             payload.get("service_type", ""),
             payload.get("description", ""),
             payload.get("date", ""),
             float(payload.get("cost", 0)),
             float(payload.get("odometer", 0)),
             payload.get("next_service_date", ""),
             now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM maintenance WHERE id = ?", (cur.lastrowid,)).fetchone()
    finally:
        conn.close()
    return dict(row)


@router.put("/{record_id}")
def update_maintenance(
    record_id: int,
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    allowed = {"service_type", "description", "date", "cost", "odometer", "next_service_date"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields")

    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM maintenance WHERE id = ?", (record_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(
            f"UPDATE maintenance SET {set_clause} WHERE id = ?",
            [*updates.values(), record_id],
        )
        conn.commit()
        row = conn.execute("SELECT * FROM maintenance WHERE id = ?", (record_id,)).fetchone()
    finally:
        conn.close()
    return dict(row)


@router.delete("/{record_id}", status_code=204)
def delete_maintenance(
    record_id: int,
    current_user: dict = Depends(get_current_owner),
):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM maintenance WHERE id = ?", (record_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        conn.execute("DELETE FROM maintenance WHERE id = ?", (record_id,))
        conn.commit()
    finally:
        conn.close()
