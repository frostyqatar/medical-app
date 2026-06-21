from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/labs", tags=["labs"])

GLUCOSE_UNION = """
    SELECT
        -g.id AS id,
        g.measured_at,
        'Glucose (' || IFNULL(g.context, 'unknown') || ')' AS test,
        g.value_mgdl AS value,
        'mg/dL' AS unit,
        CASE g.context
            WHEN 'fasting' THEN 70
            WHEN 'pre_meal' THEN 70
            ELSE NULL
        END AS ref_low,
        CASE g.context
            WHEN 'fasting' THEN 99
            WHEN 'pre_meal' THEN 130
            WHEN 'post_meal' THEN 180
            WHEN 'bedtime' THEN 180
            WHEN 'random' THEN 200
            ELSE 180
        END AS ref_high,
        CASE
            WHEN g.context = 'fasting' AND g.value_mgdl > 99 THEN 'H'
            WHEN g.context = 'fasting' AND g.value_mgdl < 70 THEN 'L'
            WHEN g.context = 'pre_meal' AND g.value_mgdl > 130 THEN 'H'
            WHEN g.context IN ('post_meal', 'random', 'bedtime') AND g.value_mgdl > 180 THEN 'H'
            WHEN g.value_mgdl < 70 THEN 'L'
            ELSE 'N'
        END AS flag,
        g.notes
    FROM glucose_readings g
"""


@router.get("/")
def list_labs(test: str = None):
    with get_db() as conn:
        base = "SELECT id, measured_at, test, value, unit, ref_low, ref_high, flag, notes FROM lab_results"
        glucose = GLUCOSE_UNION

        if test:
            rows = conn.execute(
                f"{base} WHERE test = ?1 UNION ALL {glucose} WHERE test = ?1 ORDER BY measured_at DESC",
                (test,)
            ).fetchall()
        else:
            rows = conn.execute(
                f"{base} UNION ALL {glucose} ORDER BY measured_at DESC, test"
            ).fetchall()
        return [dict(r) for r in rows]


@router.get("/tests")
def list_tests():
    with get_db() as conn:
        lab_tests = conn.execute("SELECT DISTINCT test FROM lab_results").fetchall()
        glucose_contexts = conn.execute(
            "SELECT DISTINCT 'Glucose (' || IFNULL(context, 'unknown') || ')' AS test FROM glucose_readings"
        ).fetchall()
        tests = sorted(set(r["test"] for r in lab_tests) | set(r["test"] for r in glucose_contexts))
        return tests


@router.get("/trends/{test}")
def lab_trend(test: str):
    with get_db() as conn:
        if test.startswith("Glucose ("):
            ctx = test[len("Glucose ("):-1]
            rows = conn.execute(
                """SELECT
                    id, measured_at,
                    'Glucose (' || IFNULL(context,'unknown') || ')' AS test,
                    value_mgdl AS value, 'mg/dL' AS unit,
                    CASE context
                        WHEN 'fasting' THEN 70
                        WHEN 'pre_meal' THEN 70
                        ELSE NULL
                    END AS ref_low,
                    CASE context
                        WHEN 'fasting' THEN 99
                        WHEN 'pre_meal' THEN 130
                        WHEN 'post_meal' THEN 180
                        WHEN 'bedtime' THEN 180
                        WHEN 'random' THEN 200
                        ELSE 180
                    END AS ref_high,
                    CASE
                        WHEN context='fasting' AND value_mgdl>99 THEN 'H'
                        WHEN context='fasting' AND value_mgdl<70 THEN 'L'
                        WHEN context='pre_meal' AND value_mgdl>130 THEN 'H'
                        WHEN context IN ('post_meal','random','bedtime') AND value_mgdl>180 THEN 'H'
                        WHEN value_mgdl<70 THEN 'L'
                        ELSE 'N'
                    END AS flag,
                    notes
                FROM glucose_readings WHERE context = ? ORDER BY measured_at DESC LIMIT 20""",
                (ctx,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM lab_results WHERE test = ? ORDER BY measured_at DESC LIMIT 20",
                (test,)
            ).fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def create_lab(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO lab_results (measured_at, test, value, unit, ref_low, ref_high, flag, notes) VALUES (?,?,?,?,?,?,?,?)",
            (
                data.get("measured_at"),
                data.get("test"),
                data.get("value"),
                data.get("unit"),
                data.get("ref_low"),
                data.get("ref_high"),
                data.get("flag"),
                data.get("notes", ""),
            )
        )
        conn.commit()
        row = conn.execute("SELECT * FROM lab_results WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.delete("/{lab_id}")
def delete_lab(lab_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM lab_results WHERE id = ?", (lab_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Lab result not found")
        conn.execute("DELETE FROM lab_results WHERE id = ?", (lab_id,))
        conn.commit()
        return {"deleted": lab_id}
