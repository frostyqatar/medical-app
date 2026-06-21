from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/vitals", tags=["vitals"])


@router.get("/")
def list_vitals(days: int = 30):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM vitals WHERE measured_at >= date('now', ?) ORDER BY measured_at DESC",
            (f"-{days} days",)
        ).fetchall()
        return [dict(r) for r in rows]


@router.get("/latest")
def latest_vitals():
    with get_db() as conn:
        row = conn.execute("SELECT * FROM vitals ORDER BY measured_at DESC LIMIT 1").fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No vitals recorded")
        return dict(row)


@router.post("/")
def create_vitals(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO vitals (measured_at, bp_sys, bp_dia, hr, temp_c, spo2, weight_kg, notes) VALUES (?,?,?,?,?,?,?,?)",
            (data.get("measured_at"), data.get("bp_sys"), data.get("bp_dia"), data.get("hr"),
             data.get("temp_c"), data.get("spo2"), data.get("weight_kg"), data.get("notes"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM vitals WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.delete("/{vital_id}")
def delete_vital(vital_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM vitals WHERE id = ?", (vital_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM vitals WHERE id = ?", (vital_id,))
        conn.commit()
        return {"deleted": vital_id}
