from fastapi import HTTPException, Header, Depends
from firebase_admin import auth as fa
from core.firebase_admin import db as firestore_db


async def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Verify Firebase ID Token sent from frontend.
    Frontend must send: Authorization: Bearer <Firebase ID Token>
    Returns the decoded token dict which contains uid, email, etc.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header format")

    token = authorization.split("Bearer ")[1]

    try:
        decoded = fa.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")


async def get_current_owner(current_user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to have the 'owner' role in Firestore."""
    uid = current_user.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    doc = firestore_db.collection("users").document(uid).get()
    if not doc.exists or doc.to_dict().get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return current_user
