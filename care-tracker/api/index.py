import os, re, hashlib, hmac, time, jwt
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

from contextlib import contextmanager
import psycopg2, psycopg2.extras
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DATABASE_URL = os.environ["DATABASE_URL"]
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
JWT_SECRET = os.environ.get("JWT_SECRET", hashlib.sha256(os.urandom(64)).hexdigest()[:64])

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

def verify_password(password): return hmac.compare_digest(password, ADMIN_PASSWORD)
def create_token(username):
    return jwt.encode({"sub": username, "iat": int(time.time()), "exp": int(time.time()) + 86400}, JWT_SECRET, algorithm="HS256")
def verify_token(token):
    try: return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except: return None

app = FastAPI(title="Care Tracker", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health(): return {"status": "ok"}

class LoginReq(BaseModel): username: str; password: str

@app.post("/api/auth/login")
def login(body: LoginReq):
    if body.username != ADMIN_USERNAME: raise HTTPException(401, "Invalid credentials")
    if not verify_password(body.password): raise HTTPException(401, "Invalid credentials")
    return {"token": create_token(body.username), "username": body.username, "expires_in": 86400}

# Serve React SPA from web/dist
import os as _os
_DIST = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "web", "dist")
_STATIC = _os.path.join(_DIST, "assets") if _os.path.isdir(_DIST) else None
if _STATIC and _os.path.isdir(_STATIC):
    app.mount("/assets", StaticFiles(directory=_STATIC), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(404, "Not Found")
    p = _os.path.join(_DIST, full_path) if _STATIC else None
    if _STATIC and full_path and _os.path.isfile(p):
        return FileResponse(p)
    if _STATIC:
        return FileResponse(_os.path.join(_DIST, "index.html"))
    raise HTTPException(404, "Not Found")
