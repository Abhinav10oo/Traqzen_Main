"""
IoT Device Ingestion — ESP32 authenticates with a static API key.

POST /api/iot/data/{vehicle_id}?key=OBD2_ESP32_KEY
GET  /api/iot/stream/{vehicle_id}          — Server-Sent Events for live dashboard
"""
import json
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from core.database import get_db
from services.alert_service import check_and_create_alerts

router = APIRouter(prefix="/iot", tags=["IoT"])

IOT_API_KEY = "OBD2_ESP32_KEY"

# In-memory queue of latest readings per vehicle_id (for SSE)
_latest: dict[str, dict] = {}


@router.post("/data/{vehicle_id}", status_code=201)
def ingest_iot_data(
    vehicle_id: str,
    payload: dict,
    key: str = Query(..., description="API key for IoT devices"),
):
    if key != IOT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid IoT API key")

    conn = get_db()
    try:
        vehicle = conn.execute(
            "SELECT id FROM vehicles WHERE id = ?", (vehicle_id,)
        ).fetchone()
        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail=f"Vehicle '{vehicle_id}' not registered. Add it from the dashboard first."
            )

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
            "alcohol_level": int(payload.get("alcohol_level", 0)),
            "mq3_voltage":   float(payload.get("mq3_voltage", 0.0)),
            "gps_valid":     1 if payload.get("gps_valid") else 0,
            "altitude":      float(payload.get("altitude", 0.0)),
            "gps_speed":     float(payload.get("gps_speed", 0.0)),
            "satellites":    int(payload.get("satellites", 0)),
        }

        conn.execute(
            """INSERT INTO sensor_data
               (vehicle_id, timestamp, lat, lng, speed, fuel, temp, rpm,
                engine_load, throttle, intake_air, battery, alcohol_level,
                mq3_voltage, gps_valid, altitude, gps_speed, satellites)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (vehicle_id, ts,
             reading["lat"], reading["lng"], reading["speed"], reading["fuel"],
             reading["temp"], reading["rpm"], reading["engine_load"],
             reading["throttle"], reading["intake_air"], reading["battery"],
             reading["alcohol_level"], reading["mq3_voltage"], reading["gps_valid"],
             reading["altitude"], reading["gps_speed"], reading["satellites"]),
        )

        status = "active" if reading["speed"] > 2 else "idle"
        conn.execute(
            "UPDATE vehicles SET status = ?, last_seen = ?, last_reading = ? WHERE id = ?",
            (status, ts, json.dumps(reading), vehicle_id),
        )
        conn.commit()

        # Cache for SSE streaming
        _latest[vehicle_id] = reading

        # Run alert checks
        check_and_create_alerts(vehicle_id, reading)

        return {"status": "ok", "vehicle_id": vehicle_id, "timestamp": ts}
    finally:
        conn.close()


@router.get("/stream/{vehicle_id}")
async def stream_vehicle(vehicle_id: str):
    """Server-Sent Events — dashboard subscribes here for live OBD data."""

    async def event_generator():
        last_ts = None
        while True:
            reading = _latest.get(vehicle_id)
            if reading and reading.get("timestamp") != last_ts:
                last_ts = reading["timestamp"]
                yield f"data: {json.dumps(reading)}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/latest/{vehicle_id}")
def get_latest_iot(vehicle_id: str):
    """Simple poll endpoint — returns the most recent reading (no auth needed for local use)."""
    reading = _latest.get(vehicle_id)
    if reading:
        return reading
    # Fall back to database
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT last_reading FROM vehicles WHERE id = ?", (vehicle_id,)
        ).fetchone()
        if row and row["last_reading"]:
            data = json.loads(row["last_reading"])
            if data:
                return data
    finally:
        conn.close()
    raise HTTPException(status_code=404, detail="No data yet for this vehicle")
