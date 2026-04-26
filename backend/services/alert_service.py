"""
Alert Engine
============
Called after every sensor reading is saved.
Checks thresholds and creates Alert records in Firestore automatically.
Deduplicates: will not create a duplicate unresolved alert of the same type.
"""
from datetime import datetime, timezone, date
from core.firebase_admin import db
from core.config import settings
from services.sms_service import send_alcohol_alert_sms


def _has_open_alert(vehicle_id: str, alert_type: str) -> bool:
    """Return True if an unresolved alert of this type already exists for this vehicle."""
    docs = (
        db.collection("alerts")
        .where("vehicle_id", "==", vehicle_id)
        .where("alert_type", "==", alert_type)
        .where("resolved", "==", False)
        .limit(1)
        .stream()
    )
    return any(True for _ in docs)


def _create_alert(vehicle_id: str, alert_type: str, severity: str, message: str) -> bool:
    """Create an alert if no open one of this type exists. Returns True if a new alert was written."""
    if _has_open_alert(vehicle_id, alert_type):
        return False
    db.collection("alerts").add({
        "vehicle_id":  vehicle_id,
        "alert_type":  alert_type,
        "severity":    severity,
        "message":     message,
        "resolved":    False,
        "created_at":  datetime.now(timezone.utc).isoformat(),
    })
    return True


def _get_owner_phones() -> list[str]:
    """Return phone numbers of all users with role='owner' from the users collection."""
    try:
        docs = db.collection("users").where("role", "==", "owner").stream()
        return [d.to_dict().get("phone") for d in docs if d.to_dict().get("phone")]
    except Exception:
        return []


def check_and_create_alerts(vehicle_id: str, reading: dict):
    """Run all threshold checks on one sensor reading and create alerts as needed."""

    # ── Fuel Low ──────────────────────────────────────────────────────────────
    fuel = reading.get("fuel")
    if fuel is not None:
        if fuel < settings.FUEL_ALERT_THRESHOLD:
            sev = "danger" if fuel < 10 else "warning"
            msg = (
                f"Fuel level critically low at {fuel:.1f}%"
                if sev == "danger"
                else f"Fuel level low at {fuel:.1f}% (threshold: {settings.FUEL_ALERT_THRESHOLD}%)"
            )
            _create_alert(vehicle_id, "fuel_low", sev, msg)

    # ── Engine Overheating ────────────────────────────────────────────────────
    temp = reading.get("temp")
    if temp is not None and temp > settings.ENGINE_TEMP_MAX:
        _create_alert(
            vehicle_id, "engine_temp", "danger",
            f"Engine temperature at {temp:.0f}°C — exceeds safe limit of {settings.ENGINE_TEMP_MAX}°C"
        )

    # ── Speed Exceeded ────────────────────────────────────────────────────────
    speed = reading.get("speed")
    if speed is not None and speed > settings.SPEED_LIMIT:
        _create_alert(
            vehicle_id, "speed_exceeded", "warning",
            f"Speed limit exceeded: {speed:.0f} km/h (limit: {settings.SPEED_LIMIT} km/h)"
        )

    # ── Alcohol Detected ──────────────────────────────────────────────────────
    alcohol = reading.get("alcohol_level")
    if alcohol is not None:
        if alcohol == 3:
            created = _create_alert(
                vehicle_id, "alcohol_high", "danger",
                f"HIGH alcohol detected (level {alcohol}/3) — driver may be impaired!"
            )
        elif alcohol == 2:
            created = _create_alert(
                vehicle_id, "alcohol_moderate", "warning",
                f"Moderate alcohol detected (level {alcohol}/3) — please verify driver condition"
            )
        else:
            created = False

        # Send SMS only when a fresh alert is created (deduplication is already handled above)
        if created and alcohol >= 2:
            for phone in _get_owner_phones():
                send_alcohol_alert_sms(vehicle_id, alcohol, phone)


def check_document_expiry_alerts():
    """
    Scheduled task — check all documents and fire alerts for expiring/expired ones.
    Called by APScheduler daily.
    """
    today = date.today()
    reminder_thresholds = settings.reminder_days_list  # e.g. [30, 7, 1]

    doc_type_to_alert = {
        "Insurance":                   "insurance_expiry",
        "Pollution Certificate (PUC)": "pollution_expiry",
        "Fitness Certificate":         "fitness_expiry",
    }

    docs = db.collection("documents").stream()
    for doc in docs:
        data = doc.to_dict()
        expiry_str = data.get("expiry_date")
        doc_type   = data.get("document_type")
        vehicle_id = data.get("vehicle_id")

        if not expiry_str or not doc_type or not vehicle_id:
            continue

        alert_type = doc_type_to_alert.get(doc_type)
        if not alert_type:
            continue

        try:
            expiry = date.fromisoformat(expiry_str)
        except ValueError:
            continue

        days_left = (expiry - today).days

        if days_left < 0:
            _create_alert(
                vehicle_id, alert_type, "danger",
                f"{doc_type} expired on {expiry} for vehicle {vehicle_id}"
            )
        elif days_left in reminder_thresholds:
            sev = "danger" if days_left <= 7 else "warning"
            _create_alert(
                vehicle_id, alert_type, sev,
                f"{doc_type} expires in {days_left} day(s) on {expiry}"
            )
