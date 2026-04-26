from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/")
def list_vehicles(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List vehicles from Firestore. Owners see all, drivers see their assigned vehicle."""
    uid = current_user.get("uid")
    profile_doc = db.collection("users").document(uid).get()
    role = profile_doc.to_dict().get("role", "driver") if profile_doc.exists else "driver"

    vehicles_ref = db.collection("vehicles")

    if role == "owner":
        query = vehicles_ref.where("owner_uid", "==", uid)
        if status:
            query = query.where("status", "==", status)
    else:
        query = vehicles_ref.where("driver_uid", "==", uid)

    result = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.post("/", status_code=201)
def create_vehicle(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    """Owner creates a new vehicle."""
    uid = current_user.get("uid")
    reg = payload.get("registration_number")
    if not reg:
        raise HTTPException(status_code=400, detail="registration_number required")

    existing = db.collection("vehicles").where("registration_number", "==", reg).get()
    if existing:
        raise HTTPException(status_code=409, detail="Registration number already exists")

    vehicle_id = payload.get("vehicle_id", "").strip()
    if not vehicle_id:
        raise HTTPException(status_code=400, detail="vehicle_id (Device ID) is required")

    doc_ref = db.collection("vehicles").document(vehicle_id)
    if doc_ref.get().exists:
        raise HTTPException(status_code=409, detail="A vehicle with this Device ID already exists")

    vehicle_data = {**payload, "vehicle_id": vehicle_id, "owner_uid": uid,
                    "status": "offline", "created_at": datetime.now(timezone.utc).isoformat()}
    doc_ref.set(vehicle_data)
    return {"id": vehicle_id, **vehicle_data}


@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = db.collection("vehicles").document(vehicle_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("vehicles").document(vehicle_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    doc_ref.update(payload)
    updated = doc_ref.get().to_dict()
    updated["id"] = vehicle_id
    return updated


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("vehicles").document(vehicle_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    doc_ref.delete()
