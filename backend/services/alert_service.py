"""
Alert Engine — uses SQLite instead of Firestore.
Called after every sensor reading. Checks thresholds and deduplicates alerts.
"""
from datetime import datetime, timezone, date
from core.database import get_db
from core.config import settings


def _has_open_alert(vehicle_id: str, alert_type: str) -> bool:
    conn = get_db()
    try:
        row = conn.execute(
            """SELECT id FROM alerts
               WHERE vehicle_id = ? AND alert_type = ? AND resolved = 0
               LIMIT 1""",
            (vehicle_id, alert_type),
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def _create_alert(vehicle_id: str, alert_type: str, severity: str, message: str) -> bool:
    if _has_open_alert(vehicle_id, alert_type):
        return False
    now  = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO alerts (vehicle_id, alert_type, severity, message, resolved, created_at)
               VALUES (?, ?, ?, ?, 0, ?)""",
            (vehicle_id, alert_type, severity, message, now),
        )
        conn.commit()
    finally:
        conn.close()
    return True


def check_and_create_alerts(vehicle_id: str, reading: dict):
    fuel = reading.get("fuel")
    if fuel is not None and fuel < settings.FUEL_ALERT_THRESHOLD:
        sev = "danger" if fuel < 10 else "warning"
        msg = (
            f"Fuel critically low at {fuel:.1f}%"
            if sev == "danger"
            else f"Fuel low at {fuel:.1f}% (threshold: {settings.FUEL_ALERT_THRESHOLD}%)"
        )
        _create_alert(vehicle_id, "fuel_low", sev, msg)

    temp = reading.get("temp")
    if temp is not None and temp > settings.ENGINE_TEMP_MAX:
        _create_alert(
            vehicle_id, "engine_temp", "danger",
            f"Engine temp {temp:.0f}°C — exceeds safe limit of {settings.ENGINE_TEMP_MAX}°C",
        )

    speed = reading.get("speed")
    if speed is not None and speed > settings.SPEED_LIMIT:
        _create_alert(
            vehicle_id, "speed_exceeded", "warning",
            f"Speed limit exceeded: {speed:.0f} km/h (limit: {settings.SPEED_LIMIT} km/h)",
        )

    alcohol = reading.get("alcohol_level")
    if alcohol == 3:
        _create_alert(vehicle_id, "alcohol_high", "danger",
                      f"HIGH alcohol detected (level {alcohol}/3) — driver may be impaired!")
    elif alcohol == 2:
        _create_alert(vehicle_id, "alcohol_moderate", "warning",
                      f"Moderate alcohol detected (level {alcohol}/3) — verify driver condition")


def check_document_expiry_alerts():
    today = date.today()
    thresholds = settings.reminder_days_list

    type_to_alert = {
        "Insurance":                   "insurance_expiry",
        "Pollution Certificate (PUC)": "pollution_expiry",
        "Fitness Certificate":         "fitness_expiry",
    }

    conn = get_db()
    try:
        rows = conn.execute("SELECT * FROM documents").fetchall()
    finally:
        conn.close()

    for row in rows:
        expiry_str = row["expiry_date"]
        doc_type   = row["document_type"]
        vehicle_id = row["vehicle_id"]

        if not expiry_str or not doc_type or not vehicle_id:
            continue
        alert_type = type_to_alert.get(doc_type)
        if not alert_type:
            continue
        try:
            expiry = date.fromisoformat(expiry_str)
        except ValueError:
            continue

        days_left = (expiry - today).days
        if days_left < 0:
            _create_alert(vehicle_id, alert_type, "danger",
                          f"{doc_type} expired on {expiry}")
        elif days_left in thresholds:
            sev = "danger" if days_left <= 7 else "warning"
            _create_alert(vehicle_id, alert_type, sev,
                          f"{doc_type} expires in {days_left} day(s) on {expiry}")
