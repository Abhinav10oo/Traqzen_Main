"""
Document metadata — backed by SQLite.
File uploads go directly to Cloudinary from the frontend; this router stores metadata only.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from core.dependencies import get_current_user, get_current_owner

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/")
def list_documents(
    vehicle_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    sql    = "SELECT * FROM documents WHERE 1=1"
    params: list = []
    if vehicle_id:
        sql += " AND vehicle_id = ?"
        params.append(vehicle_id)
    sql += " ORDER BY created_at DESC"

    conn = get_db()
    try:
        rows = conn.execute(sql, params).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.post("/", status_code=201)
def create_document(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT INTO documents
               (vehicle_id, document_type, document_number, expiry_date, file_url, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (payload.get("vehicle_id", ""),
             payload.get("document_type", ""),
             payload.get("document_number", ""),
             payload.get("expiry_date", ""),
             payload.get("file_url", ""),
             payload.get("status", "valid"),
             now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (cur.lastrowid,)).fetchone()
    finally:
        conn.close()
    return dict(row)


@router.put("/{doc_id}")
def update_document(
    doc_id: int,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    allowed = {"document_type", "document_number", "expiry_date", "file_url", "status"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields")

    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(
            f"UPDATE documents SET {set_clause} WHERE id = ?",
            [*updates.values(), doc_id],
        )
        conn.commit()
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    finally:
        conn.close()
    return dict(row)


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    current_user: dict = Depends(get_current_owner),
):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()
