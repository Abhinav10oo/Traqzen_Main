"""
Request dependencies — JWT-based auth replacing Firebase Auth.
"""
from fastapi import HTTPException, Header, Depends
from jose import JWTError
from core.auth import decode_token


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Verify JWT sent from frontend. Returns the decoded token dict (uid, email, role)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header format")
    token = authorization.split("Bearer ")[1]
    try:
        payload = decode_token(token)
        if not payload.get("uid"):
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_owner(current_user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to have the 'owner' role."""
    if current_user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return current_user
