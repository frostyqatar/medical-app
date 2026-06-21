from fastapi import APIRouter
from ..db import get_db
from ..alerts import run_all

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/")
def get_alerts():
    with get_db() as conn:
        glucose = conn.execute(
            "SELECT * FROM glucose_readings WHERE measured_at >= date('now', '-7 days') ORDER BY measured_at DESC"
        ).fetchall()
        glucose_list = [dict(r) for r in glucose]

        vitals_row = conn.execute("SELECT * FROM vitals ORDER BY measured_at DESC LIMIT 1").fetchone()
        latest_vitals = dict(vitals_row) if vitals_row else {}

        wounds = conn.execute(
            "SELECT * FROM wounds WHERE assessed_at >= date('now', '-14 days') ORDER BY assessed_at DESC"
        ).fetchall()
        wounds_list = [dict(r) for r in wounds]

        symptoms = conn.execute(
            "SELECT * FROM symptoms WHERE noted_at >= date('now', '-7 days') ORDER BY noted_at DESC"
        ).fetchall()
        symptoms_list = [dict(r) for r in symptoms]

        med_logs = conn.execute(
            "SELECT ml.*, m.drug FROM medication_log ml JOIN medications m ON ml.med_id = m.id WHERE ml.scheduled_for >= date('now', '-7 days')"
        ).fetchall()
        med_logs_list = [dict(r) for r in med_logs]

        labs = conn.execute(
            "SELECT * FROM lab_results ORDER BY measured_at DESC LIMIT 20"
        ).fetchall()
        labs_list = [dict(r) for r in labs]

        alerts = run_all(glucose_list, latest_vitals, wounds_list, symptoms_list, med_logs_list, labs_list)
        return {"alerts": alerts, "count": len(alerts)}
