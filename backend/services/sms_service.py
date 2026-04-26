"""
SMS Service — Twilio Integration
=================================
Sends SMS alerts to vehicle owners via Twilio API.

Usage:
  send_alcohol_alert_sms(vehicle_id, alcohol_level, owner_phone)

Twilio docs:    https://www.twilio.com/docs/sms
Get credentials: https://console.twilio.com (Account SID + Auth Token + From number)
"""
import logging
from core.config import settings

logger = logging.getLogger(__name__)


def _normalize_phone(phone: str) -> str:
    """Ensure phone is in E.164 format (e.g. +919876543210 or +12025551234)."""
    number = phone.strip().replace(" ", "").replace("-", "")
    if not number.startswith("+"):
        # Assume Indian number if 10 digits, otherwise warn
        if len(number) == 10 and number.isdigit():
            number = "+91" + number
        elif len(number) == 12 and number.startswith("91"):
            number = "+" + number
        else:
            logger.warning("[SMS] Cannot normalize phone to E.164: '%s'", phone)
    return number


def send_sms(phone: str, message: str) -> bool:
    """
    Send a plain-text SMS via Twilio.
    Returns True on success, False on failure (never raises).
    """
    if not settings.SMS_ENABLED:
        logger.info("[SMS] SMS_ENABLED=False — skipping alert to %s", phone)
        return False

    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_FROM_NUMBER]):
        logger.warning("[SMS] Twilio credentials not fully set — cannot send SMS")
        return False

    try:
        from twilio.rest import Client  # lazy import so missing package doesn't break startup
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        to_number = _normalize_phone(phone)
        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM_NUMBER,
            to=to_number,
        )
        logger.info("[SMS] Sent to %s | SID: %s", phone, msg.sid)
        return True

    except ImportError:
        logger.error("[SMS] twilio package not installed — run: pip install twilio")
        return False
    except Exception as exc:
        logger.error("[SMS] Failed to send to %s: %s", phone, exc)
        return False


# ── Alert-specific helpers ────────────────────────────────────────────────────

def send_alcohol_alert_sms(vehicle_id: str, alcohol_level: int, owner_phone: str):
    level_label = "HIGH" if alcohol_level == 3 else "Moderate"
    message = (
        f"TelematicsHub ALERT: {level_label} alcohol detected in vehicle {vehicle_id} "
        f"(MQ-3 Level {alcohol_level}/3). Please take immediate action!"
    )
    send_sms(owner_phone, message)
