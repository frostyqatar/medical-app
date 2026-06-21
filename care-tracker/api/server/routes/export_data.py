import json
from fastapi import APIRouter
from fastapi.responses import Response
from ..db import get_db

router = APIRouter(prefix="/api/export", tags=["export"])

TABLES = [
    "patient", "conditions", "medications", "medication_log",
    "glucose_readings", "vitals", "lab_results", "symptoms",
    "wounds", "appointments", "action_items", "food_log",
    "good_tracking", "plans",
]


def _serialize_value(v):
    """Normalize values for JSON serialization."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return v
    return str(v)


@router.get("/")
def export_all():
    with get_db() as conn:
        export: dict[str, list[dict]] = {}

        for table in TABLES:
            rows = conn.execute(f"SELECT * FROM {table}").fetchall()
            if not rows:
                export[table] = []
                continue
            cols = list(rows[0].keys())
            export[table] = [
                {c: _serialize_value(row[c]) for c in cols}
                for row in rows
            ]

        body = json.dumps(export, ensure_ascii=False, default=str)
        return Response(
            content=body,
            media_type="application/json; charset=utf-8",
            headers={
                "Content-Disposition": 'attachment; filename="care-tracker-export.json"'
            },
        )
