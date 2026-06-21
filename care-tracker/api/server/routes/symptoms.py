from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.get("/")
def list_symptoms(days: int = 30, type: str = None):
    with get_db() as conn:
        query = "SELECT * FROM symptoms WHERE noted_at >= date('now', ?) "
        params = [f"-{days} days"]
        if type:
            query += "AND type = ? "
            params.append(type)
        query += "ORDER BY noted_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.get("/types")
def list_types():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT type FROM symptoms ORDER BY type").fetchall()
        return [r["type"] for r in rows]


@router.post("/")
def create_symptom(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO symptoms (noted_at, type, severity, notes) VALUES (?,?,?,?)",
            (data.get("noted_at"), data.get("type"), data.get("severity"), data.get("notes"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM symptoms WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.delete("/{symptom_id}")
def delete_symptom(symptom_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM symptoms WHERE id = ?", (symptom_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM symptoms WHERE id = ?", (symptom_id,))
        conn.commit()
        return {"deleted": symptom_id}
