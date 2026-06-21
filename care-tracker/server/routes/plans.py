from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("/")
def list_plans():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM plans ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def create_plan(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO plans (title, content, color, created_at) VALUES (?, ?, ?, COALESCE(?, datetime('now')))",
            (data.get("title"), data.get("content", ""), data.get("color", "default"), data.get("created_at"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.put("/{plan_id}")
def update_plan(plan_id: int, data: dict):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute(
            "UPDATE plans SET title = ?, content = ?, color = ?, updated_at = datetime('now') WHERE id = ?",
            (data.get("title"), data.get("content"), data.get("color"), plan_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
        return dict(row)


@router.delete("/{plan_id}")
def delete_plan(plan_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM plans WHERE id = ?", (plan_id,))
        conn.commit()
        return {"deleted": plan_id}
