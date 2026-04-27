"""
Trip history — backed by SQLite.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("/")
def list_trips(
    vehicle_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    sql    = "SELECT * FROM trips WHERE 1=1"
    params: list = []
    if vehicle_id:
        sql += " AND vehicle_id = ?"
        params.append(vehicle_id)
    sql += f" ORDER BY start_time DESC LIMIT {min(limit, 200)}"

    conn = get_db()
    try:
        rows = conn.execute(sql, params).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.post("/", status_code=201)
def create_trip(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT INTO trips
               (vehicle_id, driver, origin, destination, distance, duration,
                fuel_used, start_time, end_time, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.get("vehicle_id", ""),
             payload.get("driver", ""),
             payload.get("origin", payload.get("from", "")),
             payload.get("destination", payload.get("to", "")),
             float(payload.get("distance", 0)),
             payload.get("duration", ""),
             float(payload.get("fuel_used", payload.get("fuelUsed", 0))),
             payload.get("start_time", ""),
             payload.get("end_time", ""),
             now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM trips WHERE id = ?", (cur.lastrowid,)).fetchone()
    finally:
        conn.close()
    return dict(row)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(
    trip_id: int,
    current_user: dict = Depends(get_current_owner),
):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM trips WHERE id = ?", (trip_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Trip not found")
        conn.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
        conn.commit()
    finally:
        conn.close()
