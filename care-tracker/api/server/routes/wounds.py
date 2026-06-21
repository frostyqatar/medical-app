from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/api/wounds", tags=["wounds"])


@router.get("/")
def list_wounds(site: str = None):
    with get_db() as conn:
        if site:
            rows = conn.execute(
                "SELECT * FROM wounds WHERE site = ? ORDER BY assessed_at DESC",
                (site,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM wounds ORDER BY assessed_at DESC").fetchall()
        return [dict(r) for r in rows]


@router.get("/sites")
def list_sites():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT site FROM wounds ORDER BY site").fetchall()
        return [r["site"] for r in rows]


@router.post("/")
def create_wound(data: dict):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO wounds (assessed_at, site, size_note, appearance, discharge, odor, color_change, photo_ref, notes) VALUES (?,?,?,?,?,?,?,?,?)",
            (data.get("assessed_at"), data.get("site"), data.get("size_note"), data.get("appearance"),
             data.get("discharge"), data.get("odor", 0), data.get("color_change", 0),
             data.get("photo_ref"), data.get("notes"))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM wounds WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


@router.delete("/{wound_id}")
def delete_wound(wound_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM wounds WHERE id = ?", (wound_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM wounds WHERE id = ?", (wound_id,))
        conn.commit()
        return {"deleted": wound_id}
