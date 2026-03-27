from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
from core.firebase_admin import db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/documents", tags=["Documents"])
# NOTE: File uploads now go directly to Firebase Storage from the frontend.
# This router only handles document metadata stored in Firestore.


@router.get("/")
def list_documents(
    vehicle_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List document metadata from Firestore."""
    query = db.collection("documents")
    if vehicle_id:
        query = query.where("vehicle_id", "==", vehicle_id)

    result = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.post("/", status_code=201)
def save_document_metadata(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    """Save document metadata to Firestore after frontend uploads file to Firebase Storage."""
    doc_data = {
        **payload,
        "uploaded_by": current_user.get("uid"),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    doc_ref = db.collection("documents").add(doc_data)
    return {"id": doc_ref[1].id, **doc_data}


@router.get("/{doc_id}")
def get_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = db.collection("documents").document(doc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Document not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


@router.put("/{doc_id}")
def update_document(
    doc_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("documents").document(doc_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Document not found")
    doc_ref.update(payload)
    updated = doc_ref.get().to_dict()
    updated["id"] = doc_id
    return updated


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_owner),
):
    doc_ref = db.collection("documents").document(doc_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Document not found")
    doc_ref.delete()
