from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
def list_alerts(
    vehicle_id: Optional[str] = None,
    resolved: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """List alerts from Firestore."""
    query = db.collection("alerts")

    if vehicle_id:
        query = query.where("vehicle_id", "==", vehicle_id)
    if resolved is not None:
        query = query.where("resolved", "==", resolved)
    if severity:
        query = query.where("severity", "==", severity)

    result = []
    for doc in query.limit(limit).stream():
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.post("/", status_code=201)
def create_alert(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    """Manually create an alert."""
    alert_data = {
        **payload,
        "resolved": False,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    doc_ref = db.collection("alerts").add(alert_data)
    return {"id": doc_ref[1].id, **alert_data}


@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark an alert as resolved."""
    doc_ref = db.collection("alerts").document(alert_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Alert not found")

    doc_ref.update({
        "resolved": True,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "resolved_by": current_user.get("uid"),
    })
    updated = doc_ref.get().to_dict()
    updated["id"] = alert_id
    return updated


@router.delete("/{alert_id}", status_code=204)
def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_owner),
):
    """Delete an alert."""
    doc_ref = db.collection("alerts").document(alert_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Alert not found")
    doc_ref.delete()
