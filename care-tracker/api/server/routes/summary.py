from fastapi import APIRouter
from typing import Optional
from ..db import get_db

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("/weekly")
def weekly_summary():
    with get_db() as conn:

        # Patient profile
        patient = conn.execute("SELECT * FROM patient LIMIT 1").fetchone()

        # Vitals range for past 7 days
        vitals = conn.execute("""
            SELECT MIN(bp_sys) as bp_sys_min, MAX(bp_sys) as bp_sys_max,
                   MIN(bp_dia) as bp_dia_min, MAX(bp_dia) as bp_dia_max,
                   MIN(hr) as hr_min, MAX(hr) as hr_max,
                   MIN(temp_c) as temp_min, MAX(temp_c) as temp_max,
                   MIN(spo2) as spo2_min, MAX(spo2) as spo2_max
            FROM vitals WHERE measured_at >= date('now', '-7 days')
        """).fetchone()

        # Glucose range for past 7 days
        glucose = conn.execute("""
            SELECT MIN(value_mgdl) as min_val, MAX(value_mgdl) as max_val,
                   AVG(value_mgdl) as avg_val, COUNT(*) as reading_count
            FROM glucose_readings WHERE measured_at >= date('now', '-7 days')
        """).fetchone()

        # Medication adherence
        adherence = conn.execute("""
            SELECT SUM(CASE WHEN ml.status = 'taken' THEN 1 ELSE 0 END) as taken,
                   COUNT(*) as total
            FROM medication_log ml
            WHERE ml.scheduled_for >= date('now', '-7 days')
        """).fetchone()

        # New symptoms this week
        symptoms = conn.execute("""
            SELECT * FROM symptoms WHERE noted_at >= date('now', '-7 days') ORDER BY noted_at DESC
        """).fetchall()

        # Wound status
        wounds = conn.execute("""
            SELECT * FROM wounds WHERE assessed_at >= date('now', '-7 days') ORDER BY assessed_at DESC
        """).fetchall()

        # Lab changes (latest)
        latest_labs = conn.execute("""
            SELECT DISTINCT test FROM lab_results ORDER BY test
        """).fetchall()
        lab_summary = []
        for (test_name,) in latest_labs:
            row = conn.execute(
                "SELECT * FROM lab_results WHERE test = ? ORDER BY measured_at DESC LIMIT 1",
                (test_name,)
            ).fetchone()
            if row:
                lab_summary.append(dict(row))

        # Open HIGH action items
        high_actions = conn.execute(
            "SELECT * FROM action_items WHERE status = 'open' AND priority = 'HIGH' ORDER BY created_at DESC"
        ).fetchall()

        # Open action items (all)
        open_actions = conn.execute(
            "SELECT * FROM action_items WHERE status = 'open' ORDER BY CASE priority WHEN 'HIGH' THEN 0 WHEN 'MED' THEN 1 WHEN 'LOW' THEN 2 ELSE 3 END, created_at DESC"
        ).fetchall()

        # Upcoming appointments
        upcoming = conn.execute(
            "SELECT * FROM appointments WHERE scheduled_for >= date('now') AND status = 'planned' ORDER BY scheduled_for"
        ).fetchall()

        return {
            "patient": dict(patient) if patient else None,
            "vitals_range": dict(vitals) if vitals else None,
            "glucose_summary": dict(glucose) if glucose else None,
            "adherence": dict(adherence) if adherence else {"taken": 0, "total": 0},
            "new_symptoms": [dict(s) for s in symptoms],
            "wound_status": [dict(w) for w in wounds],
            "lab_summary": lab_summary,
            "high_priority_actions": [dict(a) for a in high_actions],
            "open_actions": [dict(a) for a in open_actions],
            "upcoming_appointments": [dict(a) for a in upcoming],
        }
