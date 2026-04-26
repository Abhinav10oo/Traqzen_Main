"""
IoT Device Ingestion — No Firebase auth required.
ESP32 authenticates with a static API key instead.

Endpoint:
  POST /api/iot/data/{vehicle_id}?key=OBD2_ESP32_KEY

Payload (JSON):
  { rpm, speed, fuel, temp, engine_load, throttle, intake_air, battery, lat, lng }
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from core.firebase_admin import db
from services.alert_service import check_and_create_alerts

router = APIRouter(prefix="/iot", tags=["IoT"])

# Simple static key — ESP32 sends this as ?key=OBD2_ESP32_KEY
IOT_API_KEY = "OBD2_ESP32_KEY"


@router.post("/data/{vehicle_id}", status_code=201)
def ingest_iot_data(
    vehicle_id: str,
    payload: dict,
    key: str = Query(..., description="API key for IoT devices"),
):
    if key != IOT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid IoT API key")

    ts = datetime.now(timezone.utc).isoformat()

    reading = {
        "vehicle_id":    vehicle_id,
        "timestamp":     ts,
        "lat":           float(payload.get("lat", 0)),
        "lng":           float(payload.get("lng", 0)),
        "speed":         float(payload.get("speed", 0)),
        "fuel":          float(payload.get("fuel", 0)),
        "temp":          float(payload.get("temp", 0)),
        "rpm":           int(payload.get("rpm", 0)),
        "engine_load":   int(payload.get("engine_load", 0)),
        "throttle":      int(payload.get("throttle", 0)),
        "intake_air":    int(payload.get("intake_air", 0)),
        "battery":       float(payload.get("battery", 0.0)),
        # Alcohol sensor (MQ-3)
        "alcohol_level": int(payload.get("alcohol_level", 0)),
        "mq3_voltage":   float(payload.get("mq3_voltage", 0.0)),
        # GPS extended
        "gps_valid":     bool(payload.get("gps_valid", False)),
        "altitude":      float(payload.get("altitude", 0.0)),
        "gps_speed":     float(payload.get("gps_speed", 0.0)),
        "satellites":    int(payload.get("satellites", 0)),
    }

    # Only update vehicles that have been registered by an owner
    vehicle_ref = db.collection("vehicles").document(vehicle_id)
    if not vehicle_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' is not registered. Add it from the dashboard first.")

    # Save reading to sensor_data subcollection
    db.collection("sensor_data").document(vehicle_id).collection("readings").add(reading)

    # Update live status on the existing vehicle document
    vehicle_ref.update({
        "status":       "active" if reading["speed"] > 2 else "idle",
        "last_seen":    ts,
        "last_reading": reading,
    })

    # Run alert threshold checks
    check_and_create_alerts(vehicle_id, reading)

    return {"status": "ok", "vehicle_id": vehicle_id, "timestamp": ts}
