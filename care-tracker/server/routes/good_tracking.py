from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/good-tracking", tags=["good-tracking"])


@router.get("/")
def list_good_tracking(days: int = None):
    with get_db() as conn:
        if days:
            rows = conn.execute(
                "SELECT * FROM good_tracking WHERE created_at >= date('now', ?) ORDER BY created_at DESC",
                (f"-{days} days",)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM good_tracking ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def create_good_tracking(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO good_tracking (note, created_at) VALUES (?, COALESCE(?, datetime('now')))",
            (data.get("note"), data.get("created_at"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM good_tracking WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.put("/{item_id}")
def update_good_tracking(item_id: int, data: dict):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM good_tracking WHERE id = ?", (item_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute(
            "UPDATE good_tracking SET note = ? WHERE id = ?",
            (data.get("note"), item_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM good_tracking WHERE id = ?", (item_id,)).fetchone()
        return dict(row)


@router.delete("/{item_id}")
def delete_good_tracking(item_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM good_tracking WHERE id = ?", (item_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM good_tracking WHERE id = ?", (item_id,))
        conn.commit()
        return {"deleted": item_id}
