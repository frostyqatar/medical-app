from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2, psycopg2.extras, re, os
from contextlib import contextmanager

DATABASE_URL = os.environ.get("DATABASE_URL",
    "postgresql://app_user:cAr3Tr@ck3r!2026@db.dbrwxutgbbreshlfdndl.supabase.co:5432/postgres")

def _pg_sql(sql):
    sql = re.sub(r"datetime\('now'(?:,'localtime')?\)", "NOW()::TEXT", sql)
    sql = re.sub(r"date\('now',\s*\?\)", r"(CURRENT_DATE + %s::INTERVAL)", sql)
    sql = re.sub(r"date\('now'(?:,'localtime')?\)", "CURRENT_DATE", sql)
    sql = sql.replace("IFNULL(", "COALESCE(")
    sql = sql.replace("?", "%s")
    return sql

def _is_insert(sql): return sql.strip().upper().startswith("INSERT")

class DBCursor:
    def __init__(self, cur): self._cur = cur; self.lastrowid = None; self.rowcount = 0
    def execute(self, sql, params=None):
        sql = _pg_sql(sql)
        if _is_insert(sql) and "RETURNING" not in sql.upper(): sql = sql.rstrip(";") + " RETURNING id"
        p = None if params is None else (tuple(params) if isinstance(params, (list, tuple)) else params)
        self._cur.execute(sql, p) if p is None else self._cur.execute(sql, p)
        self.rowcount = self._cur.rowcount
        if _is_insert(sql):
            row = self._cur.fetchone()
            if row: self.lastrowid = row.get("id")
        return self
    def fetchall(self): return [dict(r) for r in self._cur.fetchall()]
    def fetchone(self):
        row = self._cur.fetchone()
        return dict(row) if row else None
    def close(self): self._cur.close()

class DBConnection:
    def __init__(self, conn): self._conn = conn
    def cursor(self): return DBCursor(self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))
    def execute(self, sql, params=None):
        cur = self.cursor(); cur.execute(sql, params); return cur
    def commit(self): self._conn.commit()
    def rollback(self): self._conn.rollback()
    def close(self): self._conn.close()

@contextmanager
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    try: yield DBConnection(conn)
    finally: conn.close()

app = FastAPI(title="Care Tracker", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health(): return {"status": "ok"}
