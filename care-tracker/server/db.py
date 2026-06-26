"""Database connection helper — Supabase Postgres."""
import os
import re
import psycopg2
import psycopg2.extras
from contextlib import contextmanager

DATABASE_URL = os.environ["DATABASE_URL"]


def _pg_sql(sql):
    sql = re.sub(r"date\('now',\s*\?\)", r"(CURRENT_DATE + ?::INTERVAL)", sql)
    sql = re.sub(r"date\('now'(?:,'localtime')?\)", "CURRENT_DATE", sql)
    sql = re.sub(r"datetime\('now'(?:,'localtime')?\)", "NOW()::TEXT", sql)
    sql = sql.replace("IFNULL(", "COALESCE(")
    sql = sql.replace("?", "%s")
    return sql


def _is_insert(sql):
    return sql.strip().upper().startswith("INSERT")


def _pack_params(params):
    if params is None:
        return None
    if isinstance(params, dict):
        return params
    if isinstance(params, (list, tuple)):
        return tuple(params)
    return (params,)


class DBCursor:
    def __init__(self, cur):
        self._cur = cur
        self.lastrowid = None
        self.rowcount = 0

    def execute(self, sql, params=None):
        sql = _pg_sql(sql)
        if _is_insert(sql) and "RETURNING" not in sql.upper():
            sql = sql.rstrip(";") + " RETURNING id"
        self._cur.execute(sql, _pack_params(params))
        self.rowcount = self._cur.rowcount
        if _is_insert(sql):
            row = self._cur.fetchone()
            if row:
                self.lastrowid = row["id"]
        return self

    def fetchall(self):
        return [dict(r) for r in self._cur.fetchall()]

    def fetchone(self):
        row = self._cur.fetchone()
        return dict(row) if row else None

    def close(self):
        self._cur.close()


class DBConnection:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return DBCursor(self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))

    def execute(self, sql, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


@contextmanager
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    wrapper = DBConnection(conn)
    try:
        yield wrapper
    finally:
        wrapper.close()
