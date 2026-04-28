"""
Vehicle CRUD — backed by SQLite instead of Firestore.
"""
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


def _row_to_dict(row) -> dict:
    d = dict(row)
    try:
        extra = json.loads(d.pop("extra", "{}") or "{}")
    except Exception:
        extra = {}
    lr = d.pop("last_reading", "{}")
    try:
        last_reading = json.loads(lr or "{}")
    except Exception:
        last_reading = {}
    return {
        "id":          d["id"],
        "vehicle_id":  d["id"],           # frontend checks this to decide live vs static panel
        "reg":         d.get("registration_number", ""),  # frontend uses v.reg everywhere
        **d,
        **extra,
        **last_reading,                   # flatten latest OBD readings into top-level fields
        "last_reading": last_reading,
    }


@router.get("/")
def list_vehicles(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    uid  = current_user["uid"]
    role = current_user.get("role", "driver")

    conn = get_db()
    try:
        if role == "owner":
            sql = "SELECT * FROM vehicles WHERE owner_uid = ?"
            params: list = [uid]
            if status:
                sql += " AND status = ?"
                params.append(status)
            rows = conn.execute(sql, params).fetchall()
        else:
            # Driver sees only their assigned vehicle
            conn2 = get_db()
            user_row = conn2.execute(
                "SELECT assigned_vehicle FROM users WHERE id = ?", (uid,)
            ).fetchone()
            conn2.close()
            assigned = user_row["assigned_vehicle"] if user_row else ""
            if not assigned:
                return []
            rows = conn.execute(
                "SELECT * FROM vehicles WHERE id = ? OR driver_uid = ?",
                (assigned, uid),
            ).fetchall()
    finally:
        conn.close()

    return [_row_to_dict(r) for r in rows]


@router.post("/", status_code=201)
def create_vehicle(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    uid = current_user["uid"]
    vehicle_id = payload.get("vehicle_id", "").strip()
    reg        = payload.get("registration_number", "").strip()

    if not vehicle_id:
        raise HTTPException(status_code=400, detail="vehicle_id (Device ID) is required")
    if not reg:
        raise HTTPException(status_code=400, detail="registration_number is required")

    now = datetime.now(timezone.utc).isoformat()

    # Store known scalar fields; everything else goes into extra JSON
    known = {"vehicle_id", "registration_number", "model", "year", "driver",
             "insurance", "pollution", "odometer", "driver_uid"}
    extra = {k: v for k, v in payload.items() if k not in known}

    conn = get_db()
    try:
        existing = conn.execute(
            "SELECT id FROM vehicles WHERE id = ? OR registration_number = ?",
            (vehicle_id, reg),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Vehicle ID or registration number already exists")

        conn.execute(
            """INSERT INTO vehicles
               (id, registration_number, owner_uid, driver_uid, status,
                model, year, driver, insurance, pollution, odometer, created_at, extra)
               VALUES (?, ?, ?, ?, 'offline', ?, ?, ?, ?, ?, ?, ?, ?)""",
            (vehicle_id, reg, uid,
             payload.get("driver_uid", ""),
             payload.get("model", ""),
             str(payload.get("year", "")),
             payload.get("driver", ""),
             payload.get("insurance", ""),
             payload.get("pollution", ""),
             float(payload.get("odometer", 0)),
             now,
             json.dumps(extra)),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,)).fetchone()
    finally:
        conn.close()

    return _row_to_dict(row)


@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(get_current_user),
):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return _row_to_dict(row)


@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    scalar_fields = {"registration_number", "model", "year", "driver", "driver_uid",
                     "insurance", "pollution", "odometer", "status"}
    updates   = {k: v for k, v in payload.items() if k in scalar_fields}
    extra_upd = {k: v for k, v in payload.items() if k not in scalar_fields and k != "vehicle_id"}

    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(
                f"UPDATE vehicles SET {set_clause} WHERE id = ?",
                [*updates.values(), vehicle_id],
            )

        if extra_upd:
            existing_extra = json.loads(row["extra"] or "{}")
            existing_extra.update(extra_upd)
            conn.execute(
                "UPDATE vehicles SET extra = ? WHERE id = ?",
                (json.dumps(existing_extra), vehicle_id),
            )

        conn.commit()
        row = conn.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,)).fetchone()
    finally:
        conn.close()

    return _row_to_dict(row)


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(get_current_owner),
):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM vehicles WHERE id = ?", (vehicle_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        conn.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
        conn.commit()
    finally:
        conn.close()
