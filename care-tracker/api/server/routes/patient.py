from fastapi import APIRouter, Depends, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/patient", tags=["patient"])


@router.get("/")
def get_patient():
    with get_db() as conn:
        row = conn.execute("SELECT * FROM patient WHERE id = 'PT-ANON'").fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Patient not found")
        return dict(row)


@router.get("/conditions")
def get_conditions():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM conditions WHERE active = 1").fetchall()
        return [dict(r) for r in rows]


@router.put("/")
def update_patient(payload: dict):
    allowed = {"age", "sex", "height_cm", "weight_kg", "mobility_note"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values())
    values.append("PT-ANON")

    with get_db() as conn:
        conn.execute(
            f"UPDATE patient SET {set_clause}, updated_at = datetime('now') WHERE id = ?",
            values,
        )
        conn.commit()

        row = conn.execute("SELECT * FROM patient WHERE id = 'PT-ANON'").fetchone()
        return dict(row)
