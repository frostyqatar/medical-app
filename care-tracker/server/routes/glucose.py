from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/glucose", tags=["glucose"])


@router.get("/")
def list_glucose(days: int = 30):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM glucose_readings WHERE measured_at >= date('now', ?) ORDER BY measured_at DESC",
            (f"-{days} days",)
        ).fetchall()
        return [dict(r) for r in rows]


@router.get("/latest")
def latest_glucose():
    with get_db() as conn:
        row = conn.execute("SELECT * FROM glucose_readings ORDER BY measured_at DESC LIMIT 1").fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No glucose readings")
        return dict(row)


@router.post("/")
def create_glucose(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO glucose_readings (measured_at, value_mgdl, context, notes) VALUES (?,?,?,?)",
            (data.get("measured_at"), data.get("value_mgdl"), data.get("context"), data.get("notes"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM glucose_readings WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.delete("/{reading_id}")
def delete_glucose(reading_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM glucose_readings WHERE id = ?", (reading_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM glucose_readings WHERE id = ?", (reading_id,))
        conn.commit()
        return {"deleted": reading_id}
