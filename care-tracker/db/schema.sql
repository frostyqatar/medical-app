PRAGMA foreign_keys = ON;

CREATE TABLE patient (
  id TEXT PRIMARY KEY DEFAULT 'PT-ANON',
  age INTEGER, sex TEXT, height_cm REAL, weight_kg REAL,
  mobility_note TEXT, updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE conditions (
  code TEXT PRIMARY KEY, name TEXT NOT NULL, notes TEXT, active INTEGER DEFAULT 1
);

CREATE TABLE medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drug TEXT NOT NULL, dose TEXT, route TEXT,
  schedule TEXT, purpose TEXT, description TEXT, active INTEGER DEFAULT 1,
  start_date TEXT, stop_date TEXT
);

CREATE TABLE medication_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  med_id INTEGER REFERENCES medications(id),
  scheduled_for TEXT, taken_at TEXT,
  status TEXT CHECK(status IN ('taken','missed','skipped','held')) DEFAULT 'taken',
  notes TEXT
);

CREATE TABLE glucose_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at TEXT NOT NULL, value_mgdl REAL NOT NULL,
  context TEXT CHECK(context IN ('fasting','pre_meal','post_meal','random','bedtime')),
  notes TEXT
);

CREATE TABLE vitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at TEXT NOT NULL,
  bp_sys INTEGER, bp_dia INTEGER, hr INTEGER,
  temp_c REAL, spo2 INTEGER, weight_kg REAL, notes TEXT
);

CREATE TABLE lab_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at TEXT NOT NULL, test TEXT NOT NULL, value REAL, unit TEXT,
  ref_low REAL, ref_high REAL, flag TEXT CHECK(flag IN ('H','L','N')), notes TEXT
);

CREATE TABLE symptoms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  noted_at TEXT NOT NULL, type TEXT,
  severity INTEGER CHECK(severity BETWEEN 0 AND 10), notes TEXT
);

CREATE TABLE wounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessed_at TEXT NOT NULL, site TEXT,
  size_note TEXT, appearance TEXT, discharge TEXT, odor INTEGER,
  color_change INTEGER, photo_ref TEXT, notes TEXT
);

CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduled_for TEXT, specialty TEXT,
  status TEXT CHECK(status IN ('planned','done','cancelled')) DEFAULT 'planned',
  outcome TEXT, notes TEXT
);

CREATE TABLE action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priority TEXT CHECK(priority IN ('HIGH','MED','LOW','ONGOING')) DEFAULT 'MED',
  item TEXT NOT NULL, category TEXT,
  status TEXT CHECK(status IN ('open','answered','done')) DEFAULT 'open',
  answer TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT
);

CREATE TABLE food_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eaten_at TEXT, meal TEXT, items TEXT,
  flagged INTEGER DEFAULT 0, notes TEXT
);

CREATE TABLE good_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT 'default',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);
