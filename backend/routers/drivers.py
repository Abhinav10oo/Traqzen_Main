from fastapi import APIRouter, Depends, HTTPException
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/")
def list_drivers(
    current_user: dict = Depends(get_current_owner),
):
    """Owner lists all drivers — reads from users collection with role=driver."""
    uid = current_user.get("uid")
    # List drivers stored in the drivers collection or users with role=driver
    docs = db.collection("drivers").stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
):
    """Get current user's profile from Firestore."""
    uid = current_user.get("uid")
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


@router.put("/me")
def update_my_profile(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update current user's profile in Firestore."""
    uid = current_user.get("uid")
    doc_ref = db.collection("users").document(uid)
    doc_ref.update(payload)
    updated = doc_ref.get().to_dict()
    updated["id"] = uid
    return updated


@router.get("/{driver_id}")
def get_driver_profile(
    driver_id: str,
    current_user: dict = Depends(get_current_owner),
):
    """Owner views any driver's profile by Firestore document ID."""
    doc = db.collection("users").document(driver_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data
