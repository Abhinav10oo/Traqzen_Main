"""
Sensor data history — backed by SQLite.
"""
import json
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user

router = APIRouter(prefix="/sensor-data", tags=["Sensor Data"])


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["gps_valid"] = bool(d.get("gps_valid", 0))
    return d


@router.get("/{vehicle_id}/latest")
def get_latest(
    vehicle_id: str,
    current_user: dict = Depends(get_current_user),
):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT last_reading, status FROM vehicles WHERE id = ?", (vehicle_id,)
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    try:
        data = json.loads(row["last_reading"] or "{}")
    except Exception:
        data = {}
    if not data:
        raise HTTPException(status_code=404, detail="No sensor data yet")
    data["status"] = row["status"]
    return data


@router.get("/{vehicle_id}/history")
def get_history(
    vehicle_id: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    limit = min(limit, 500)
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT * FROM sensor_data
               WHERE vehicle_id = ?
               ORDER BY timestamp DESC
               LIMIT ?""",
            (vehicle_id, limit),
        ).fetchall()
    finally:
        conn.close()
    return [_row_to_dict(r) for r in rows]
