"""
Alert management — backed by SQLite.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["resolved"] = bool(d.get("resolved", 0))
    return d


@router.get("/")
def list_alerts(
    vehicle_id: Optional[str] = None,
    resolved:   Optional[bool] = None,
    severity:   Optional[str] = None,
    limit:      int = 50,
    current_user: dict = Depends(get_current_user),
):
    sql    = "SELECT * FROM alerts WHERE 1=1"
    params: list = []

    if vehicle_id:
        sql += " AND vehicle_id = ?"
        params.append(vehicle_id)
    if resolved is not None:
        sql += " AND resolved = ?"
        params.append(1 if resolved else 0)
    if severity:
        sql += " AND severity = ?"
        params.append(severity)

    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    conn = get_db()
    try:
        rows = conn.execute(sql, params).fetchall()
    finally:
        conn.close()
    return [_row_to_dict(r) for r in rows]


@router.post("/", status_code=201)
def create_alert(
    payload: dict,
    current_user: dict = Depends(get_current_owner),
):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT INTO alerts (vehicle_id, alert_type, severity, message, resolved, created_at)
               VALUES (?, ?, ?, ?, 0, ?)""",
            (payload.get("vehicle_id", ""),
             payload.get("alert_type", ""),
             payload.get("severity", "info"),
             payload.get("message", ""),
             now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM alerts WHERE id = ?", (cur.lastrowid,)).fetchone()
    finally:
        conn.close()
    return _row_to_dict(row)


@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        conn.execute(
            "UPDATE alerts SET resolved = 1, resolved_at = ?, resolved_by = ? WHERE id = ?",
            (now, current_user["uid"], alert_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    finally:
        conn.close()
    return _row_to_dict(row)


@router.delete("/{alert_id}", status_code=204)
def delete_alert(
    alert_id: int,
    current_user: dict = Depends(get_current_owner),
):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        conn.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
        conn.commit()
    finally:
        conn.close()
