from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("/")
def list_actions(status: str = None, priority: str = None, category: str = None):
    with get_db() as conn:
        query = "SELECT * FROM action_items WHERE 1=1"
        params = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if priority:
            query += " AND priority = ?"
            params.append(priority)
        if category:
            query += " AND category = ?"
            params.append(category)
        query += " ORDER BY CASE priority WHEN 'HIGH' THEN 0 WHEN 'MED' THEN 1 WHEN 'LOW' THEN 2 ELSE 3 END, created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.get("/categories")
def list_categories():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT category FROM action_items ORDER BY category").fetchall()
        return [r["category"] for r in rows]


@router.post("/")
def create_action(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO action_items (priority, item, category, status, answer) VALUES (?,?,?,?,?)",
            (data.get("priority", "MED"), data.get("item"), data.get("category"),
             data.get("status", "open"), data.get("answer"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM action_items WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.put("/{action_id}")
def update_action(action_id: int, data: dict):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM action_items WHERE id = ?", (action_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Action item not found")

        fields = ["priority", "item", "category", "status", "answer"]
        updates = {k: data[k] for k in fields if k in data}
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(f"UPDATE action_items SET {set_clause}, updated_at = datetime('now') WHERE id = ?", (*updates.values(), action_id))
            conn.commit()
        row = conn.execute("SELECT * FROM action_items WHERE id = ?", (action_id,)).fetchone()
        return dict(row)


@router.delete("/{action_id}")
def delete_action(action_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM action_items WHERE id = ?", (action_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Action item not found")
        conn.execute("DELETE FROM action_items WHERE id = ?", (action_id,))
        conn.commit()
        return {"deleted": action_id}
