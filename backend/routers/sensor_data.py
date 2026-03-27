from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
from core.firebase_admin import db
from core.dependencies import get_current_user
from services.alert_service import check_and_create_alerts

router = APIRouter(prefix="/sensor-data", tags=["Sensor Data"])


@router.post("/{vehicle_id}", status_code=201)
def ingest_sensor_data(
    vehicle_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """IoT device pushes a telemetry snapshot via HTTP. Saves to Firestore."""
    ts = datetime.now(timezone.utc).isoformat()
    reading = {
        "vehicle_id": vehicle_id,
        "timestamp":  ts,
        "lat":        float(payload.get("lat", 0)),
        "lng":        float(payload.get("lng", 0)),
        "speed":      float(payload.get("speed", 0)),
        "fuel":       float(payload.get("fuel", 0)),
        "temp":       float(payload.get("temp", 0)),
        "rpm":        int(payload.get("rpm", 0)),
    }

    # Write reading to Firestore subcollection
    db.collection("sensor_data").document(vehicle_id).collection("readings").add(reading)

    # Update vehicle live status
    db.collection("vehicles").document(vehicle_id).set({
        "last_seen":    ts,
        "status":       "active" if reading["speed"] > 2 else "idle",
        "last_reading": reading,
    }, merge=True)

    # Run alert checks
    check_and_create_alerts(vehicle_id, reading)

    return {"status": "ok", "vehicle_id": vehicle_id, "timestamp": ts}


@router.get("/{vehicle_id}/latest")
def get_latest(
    vehicle_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get the most recent sensor reading for a vehicle from Firestore."""
    vehicle_doc = db.collection("vehicles").document(vehicle_id).get()
    if not vehicle_doc.exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    data = vehicle_doc.to_dict()
    last_reading = data.get("last_reading")
    if not last_reading:
        raise HTTPException(status_code=404, detail="No sensor data found")
    return last_reading


@router.get("/{vehicle_id}/history")
def get_history(
    vehicle_id: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    """Recent sensor readings for a vehicle (newest first)."""
    docs = (
        db.collection("sensor_data")
        .document(vehicle_id)
        .collection("readings")
        .order_by("timestamp", direction="DESCENDING")
        .limit(min(limit, 500))
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]
