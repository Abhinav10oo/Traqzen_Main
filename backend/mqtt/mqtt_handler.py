"""
MQTT Handler
============
Subscribes to the MQTT broker and bridges incoming IoT payloads into Firestore.

Topic convention:
  telematicshub/vehicles/{vehicle_id}/data   → sensor reading (JSON)

ESP32 publishes JSON like:
{
  "lat": 19.076,
  "lng": 72.877,
  "speed": 48.5,
  "fuel": 72,
  "temp": 88,
  "rpm": 2400
}
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False

from core.config import settings
from core.firebase_admin import db
from services.alert_service import check_and_create_alerts

logger = logging.getLogger("mqtt_handler")


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        topic = f"{settings.MQTT_TOPIC_PREFIX}/+/data"
        client.subscribe(topic, qos=1)
        logger.info(f"MQTT connected. Subscribed to: {topic}")
    else:
        logger.error(f"MQTT connection failed with code {rc}")


def on_message(client, userdata, msg):
    """Handle every incoming MQTT message and save to Firestore."""
    try:
        parts = msg.topic.split("/")
        if len(parts) < 4:
            return

        vehicle_id = parts[-2]   # telematicshub/vehicles/{vehicle_id}/data
        msg_type   = parts[-1]   # "data"

        if msg_type != "data":
            return

        raw = json.loads(msg.payload.decode("utf-8"))
        now = datetime.now(timezone.utc).isoformat()

        reading = {
            "vehicle_id": vehicle_id,
            "timestamp":  now,
            "lat":   float(raw.get("lat",   0)),
            "lng":   float(raw.get("lng",   0)),
            "speed": float(raw.get("speed", 0)),
            "fuel":  float(raw.get("fuel",  0)),
            "temp":  float(raw.get("temp",  0)),
            "rpm":   int(raw.get("rpm",     0)),
        }

        # Save reading to Firestore subcollection
        db.collection("sensor_data").document(vehicle_id).collection("readings").add(reading)

        # Update vehicle document with latest status
        speed = reading["speed"]
        db.collection("vehicles").document(vehicle_id).set({
            "last_seen":    now,
            "status":       "active" if speed > 2 else "idle",
            "last_reading": reading,
        }, merge=True)

        check_and_create_alerts(vehicle_id, reading)

        logger.debug(f"Saved MQTT reading for vehicle {vehicle_id}: speed={speed}, fuel={reading['fuel']}")

    except Exception as e:
        logger.error(f"MQTT on_message error: {e}")


def start_mqtt_client() -> Optional[object]:
    """
    Initialise and start the MQTT client loop in a background thread.
    Returns the client instance, or None if MQTT is unavailable / disabled.
    """
    if not MQTT_AVAILABLE:
        logger.warning("paho-mqtt not installed. MQTT disabled.")
        return None

    if not settings.MQTT_BROKER_HOST:
        logger.info("MQTT broker host not configured. MQTT disabled.")
        return None

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="telematicshub-backend")

    if settings.MQTT_USERNAME:
        client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)

    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
        client.loop_start()
        logger.info(f"MQTT client started → {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
        return client
    except Exception as e:
        logger.warning(f"Could not connect to MQTT broker: {e}. Running without MQTT.")
        return None
