from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/medications", tags=["medications"])


@router.get("/")
def list_medications(active: bool = None):
    with get_db() as conn:
        if active is None:
            rows = conn.execute("SELECT * FROM medications ORDER BY drug").fetchall()
        else:
            rows = conn.execute("SELECT * FROM medications WHERE active = ? ORDER BY drug", (int(active),)).fetchall()
        return [dict(r) for r in rows]


@router.get("/{med_id}")
def get_medication(med_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM medications WHERE id = ?", (med_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Medication not found")
        return dict(row)


@router.post("/")
def create_medication(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO medications (drug, dose, route, schedule, purpose, active, start_date, stop_date, description) VALUES (?,?,?,?,?,?,?,?,?)",
            (data.get("drug"), data.get("dose"), data.get("route"), data.get("schedule"),
             data.get("purpose"), data.get("active", 1), data.get("start_date"), data.get("stop_date"),
             data.get("description"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM medications WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.put("/{med_id}")
def update_medication(med_id: int, data: dict):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM medications WHERE id = ?", (med_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Medication not found")

        fields = ["drug", "dose", "route", "schedule", "purpose", "active", "start_date", "stop_date", "description"]
        updates = {k: data[k] for k in fields if k in data}
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(f"UPDATE medications SET {set_clause} WHERE id = ?", (*updates.values(), med_id))
            conn.commit()
        row = conn.execute("SELECT * FROM medications WHERE id = ?", (med_id,)).fetchone()
        return dict(row)


@router.get("/{med_id}/log")
def get_medication_log(med_id: int, days: int = 30):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM medication_log WHERE med_id = ? ORDER BY scheduled_for DESC LIMIT ?",
            (med_id, days)
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/log")
def log_medication(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO medication_log (med_id, scheduled_for, taken_at, status, notes) VALUES (?,?,?,?,?)",
            (data.get("med_id"), data.get("scheduled_for"), data.get("taken_at"),
             data.get("status", "taken"), data.get("notes"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM medication_log WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.get("/adherence/summary")
def adherence_summary(days: int = 7):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT m.id, m.drug, m.schedule,
                   COUNT(ml.id) as total_logs,
                   SUM(CASE WHEN ml.status = 'taken' THEN 1 ELSE 0 END) as taken_count,
                   SUM(CASE WHEN ml.status = 'missed' THEN 1 ELSE 0 END) as missed_count
            FROM medications m
            LEFT JOIN medication_log ml ON m.id = ml.med_id
                AND ml.scheduled_for >= date('now', ?)
            WHERE m.active = 1
            GROUP BY m.id
            ORDER BY m.drug
        """, (f"-{days} days",)).fetchall()
        return [dict(r) for r in rows]


@router.delete("/log/{log_id}")
def delete_medication_log(log_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM medication_log WHERE id = ?", (log_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Log entry not found")
        conn.execute("DELETE FROM medication_log WHERE id = ?", (log_id,))
        conn.commit()
        return {"deleted": log_id}


@router.delete("/log/by-med/{med_id}")
def delete_latest_log_for_med(med_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM medication_log WHERE med_id = ? ORDER BY scheduled_for DESC LIMIT 1",
            (med_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No log found for this medication")
        conn.execute("DELETE FROM medication_log WHERE id = ?", (row["id"],))
        conn.commit()
        return {"deleted": row["id"]}
