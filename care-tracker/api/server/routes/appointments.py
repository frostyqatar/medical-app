from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.get("/")
def list_appointments(status: str = None):
    with get_db() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM appointments WHERE status = ? ORDER BY scheduled_for DESC",
                (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM appointments ORDER BY scheduled_for DESC").fetchall()
        return [dict(r) for r in rows]


@router.get("/upcoming")
def upcoming_appointments():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM appointments WHERE scheduled_for >= date('now') AND status = 'planned' ORDER BY scheduled_for"
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def create_appointment(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO appointments (scheduled_for, specialty, status, outcome, notes) VALUES (?,?,?,?,?)",
            (data.get("scheduled_for"), data.get("specialty"), data.get("status", "planned"),
             data.get("outcome"), data.get("notes"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM appointments WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.put("/{apt_id}")
def update_appointment(apt_id: int, data: dict):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM appointments WHERE id = ?", (apt_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Appointment not found")

        fields = ["scheduled_for", "specialty", "status", "outcome", "notes"]
        updates = {k: data[k] for k in fields if k in data}
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(f"UPDATE appointments SET {set_clause} WHERE id = ?", (*updates.values(), apt_id))
            conn.commit()
        row = conn.execute("SELECT * FROM appointments WHERE id = ?", (apt_id,)).fetchone()
        return dict(row)
