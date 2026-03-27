from fastapi import APIRouter, Depends
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/fleet-summary")
def fleet_summary(
    current_user: dict = Depends(get_current_owner),
):
    """High-level fleet KPIs for the owner dashboard."""
    uid = current_user.get("uid")
    vehicles = list(db.collection("vehicles").where("owner_uid", "==", uid).stream())
    vehicle_ids = [v.id for v in vehicles]
    vehicle_data = [v.to_dict() for v in vehicles]

    total   = len(vehicle_ids)
    active  = sum(1 for v in vehicle_data if v.get("status") == "active")
    offline = sum(1 for v in vehicle_data if v.get("status") == "offline")

    alerts_docs = db.collection("alerts").where("resolved", "==", False).stream()
    active_alerts = sum(1 for a in alerts_docs if a.to_dict().get("vehicle_id") in vehicle_ids)

    return {
        "total_vehicles": total,
        "active_vehicles": active,
        "offline_vehicles": offline,
        "active_alerts": active_alerts,
    }


@router.get("/fuel-trend")
def fuel_trend(
    vehicle_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """Recent fuel readings for a vehicle from Firestore subcollection."""
    docs = (
        db.collection("sensor_data")
        .document(vehicle_id)
        .collection("readings")
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [{"timestamp": d.to_dict().get("timestamp"), "fuel_pct": d.to_dict().get("fuel")} for d in docs]


@router.get("/speed-profile")
def speed_profile(
    vehicle_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """Recent speed readings for a vehicle from Firestore subcollection."""
    docs = (
        db.collection("sensor_data")
        .document(vehicle_id)
        .collection("readings")
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [{"timestamp": d.to_dict().get("timestamp"), "speed": d.to_dict().get("speed")} for d in docs]
