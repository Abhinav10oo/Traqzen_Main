from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("/")
def list_trips(
    vehicle_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """List trips from Firestore."""
    query = db.collection("trips")
    if vehicle_id:
        query = query.where("vehicle_id", "==", vehicle_id)

    result = []
    for doc in query.limit(limit).stream():
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.post("/", status_code=201)
def create_trip(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Create a new trip record in Firestore."""
    trip_data = {
        **payload,
        "driver_uid": current_user.get("uid"),
        "start_time": datetime.now(timezone.utc).isoformat(),
    }
    doc_ref = db.collection("trips").add(trip_data)
    return {"id": doc_ref[1].id, **trip_data}


@router.get("/{trip_id}")
def get_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = db.collection("trips").document(trip_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Trip not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


@router.patch("/{trip_id}/end")
def end_trip(
    trip_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Mark a trip as ended."""
    doc_ref = db.collection("trips").document(trip_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Trip not found")
    doc_ref.update({
        **payload,
        "end_time": datetime.now(timezone.utc).isoformat(),
    })
    updated = doc_ref.get().to_dict()
    updated["id"] = trip_id
    return updated


@router.delete("/{trip_id}", status_code=204)
def delete_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("trips").document(trip_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Trip not found")
    doc_ref.delete()
