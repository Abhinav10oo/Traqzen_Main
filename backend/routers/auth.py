"""
Local auth endpoints — replaces Firebase Auth for offline operation.

POST /api/auth/signup   — create account
POST /api/auth/login    — get JWT token
GET  /api/auth/me       — fetch own profile (requires Bearer token)
PUT  /api/auth/me       — update own profile
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header
from jose import JWTError

from core.database import get_db
from core.auth import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])


def _row_to_profile(row) -> dict:
    return {
        "uid":             row["id"],
        "email":           row["email"],
        "role":            row["role"],
        "name":            row["name"],
        "firstName":       row["first_name"],
        "lastName":        row["last_name"],
        "phone":           row["phone"],
        "assignedVehicle": row["assigned_vehicle"],
    }


@router.post("/signup", status_code=201)
def signup(payload: dict):
    email    = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    role     = payload.get("role", "owner")
    first    = payload.get("firstName", "")
    last     = payload.get("lastName", "")
    phone    = payload.get("phone", "")
    assigned = payload.get("assignedVehicle", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    uid  = str(uuid.uuid4())
    name = f"{first} {last}".strip()
    now  = datetime.now(timezone.utc).isoformat()

    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO users
               (id, email, password_hash, role, first_name, last_name, name, phone, assigned_vehicle, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (uid, email, hash_password(password), role, first, last, name, phone, assigned, now),
        )
        conn.commit()
    except Exception as exc:
        if "UNIQUE" in str(exc):
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        conn.close()

    token = create_access_token({"uid": uid, "email": email, "role": role})
    return {"token": token, "uid": uid, "email": email, "role": role, "name": name}


@router.post("/login")
def login(payload: dict):
    email    = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    finally:
        conn.close()

    if not row or not verify_password(password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"uid": row["id"], "email": row["email"], "role": row["role"]})
    return {"token": token, **_row_to_profile(row)}


@router.get("/me")
def get_me(authorization: str = Header(...)):
    uid = _uid_from_header(authorization)
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return _row_to_profile(row)


@router.put("/me")
def update_me(payload: dict, authorization: str = Header(...)):
    uid = _uid_from_header(authorization)
    allowed = {"first_name", "last_name", "name", "phone", "assigned_vehicle"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values     = list(updates.values()) + [uid]
    conn = get_db()
    try:
        conn.execute(f"UPDATE users SET {set_clause} WHERE id = ?", values)
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    finally:
        conn.close()
    return _row_to_profile(row)


def _uid_from_header(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    try:
        payload = decode_token(authorization.split("Bearer ")[1])
        uid = payload.get("uid")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")
        return uid
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
