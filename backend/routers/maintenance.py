from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("/")
def list_maintenance(
    vehicle_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List maintenance records from Firestore."""
    query = db.collection("maintenance")
    if vehicle_id:
        query = query.where("vehicle_id", "==", vehicle_id)
    if status:
        query = query.where("status", "==", status)

    result = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.post("/", status_code=201)
def create_maintenance(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    """Create a maintenance record in Firestore."""
    task_data = {
        **payload,
        "created_by": current_user.get("uid"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": payload.get("status", "upcoming"),
    }
    doc_ref = db.collection("maintenance").add(task_data)
    return {"id": doc_ref[1].id, **task_data}


@router.get("/{task_id}")
def get_maintenance(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = db.collection("maintenance").document(task_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Maintenance task not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


@router.put("/{task_id}")
def update_maintenance(
    task_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("maintenance").document(task_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Maintenance task not found")
    doc_ref.update(payload)
    updated = doc_ref.get().to_dict()
    updated["id"] = task_id
    return updated


@router.patch("/{task_id}/complete")
def complete_maintenance(
    task_id: str,
    payload: dict = {},
    current_user: dict = Depends(get_current_owner),
):
    """Mark a maintenance task as completed."""
    doc_ref = db.collection("maintenance").document(task_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Maintenance task not found")
    doc_ref.update({
        **payload,
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "completed_by": current_user.get("uid"),
    })
    updated = doc_ref.get().to_dict()
    updated["id"] = task_id
    return updated


@router.delete("/{task_id}", status_code=204)
def delete_maintenance(
    task_id: str,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("maintenance").document(task_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Maintenance task not found")
    doc_ref.delete()
