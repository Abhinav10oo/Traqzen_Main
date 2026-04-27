"""
Analytics — fleet KPIs derived from SQLite sensor data.
"""
from fastapi import APIRouter, Depends
from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/fleet-summary")
def fleet_summary(current_user: dict = Depends(get_current_owner)):
    uid = current_user["uid"]
    conn = get_db()
    try:
        vehicles = conn.execute(
            "SELECT * FROM vehicles WHERE owner_uid = ?", (uid,)
        ).fetchall()

        total   = len(vehicles)
        active  = sum(1 for v in vehicles if v["status"] == "active")
        offline = sum(1 for v in vehicles if v["status"] == "offline")
        idle    = sum(1 for v in vehicles if v["status"] == "idle")

        alerts = conn.execute(
            "SELECT COUNT(*) as cnt FROM alerts WHERE resolved = 0"
        ).fetchone()["cnt"]

        return {
            "total_vehicles":    total,
            "active_vehicles":   active,
            "offline_vehicles":  offline,
            "idle_vehicles":     idle,
            "unresolved_alerts": alerts,
        }
    finally:
        conn.close()


@router.get("/vehicle/{vehicle_id}/stats")
def vehicle_stats(
    vehicle_id: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT avg(speed) as avg_speed, max(speed) as max_speed,
                      avg(fuel) as avg_fuel, min(fuel) as min_fuel,
                      avg(temp) as avg_temp, max(temp) as max_temp,
                      avg(rpm) as avg_rpm, count(*) as readings
               FROM sensor_data WHERE vehicle_id = ?
               ORDER BY timestamp DESC LIMIT ?""",
            (vehicle_id, limit),
        ).fetchone()
    finally:
        conn.close()

    return dict(rows) if rows else {}
