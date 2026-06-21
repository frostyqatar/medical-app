# AGENT.md — Patient Care Tracking System (Build Spec + Clinical Baseline)

> **Hand this whole file to the coding agent.** It contains the architecture, the MCP-driven UI plan, the SQLite schema, the alert logic, and anonymized seed data.

---

## 0. PRIVACY & SAFETY — READ FIRST

**Anonymization.** This data is anonymized. There is **NO name, ID/passport, address, hospital identity, doctor name, or family/personal narrative** anywhere in this file. The patient is referred to only as **`PT-ANON`**. If the agent (or any model it calls, including China-routed ones) is ever given a real name, ID, photo, or location, it must **not store it** — reject or redact to `PT-ANON`.

**Medical safety.** This is a **tracker, not an advisor.** It records data, surfaces trends, and flags items for a human to raise with doctors. It must never output a diagnosis or a treatment change. Every rule-based alert ends with **"→ discuss with treating physician."**

---

## 1. ARCHITECTURE

**Goal:** a clean, modern, genuinely pleasant local app — not a developer-ugly CRUD screen. One patient, fully offline, no cloud, no telemetry.

```
care-tracker/
├── AGENT.md                 ← this file
├── server/                  ← Python (FastAPI) — thin API over SQLite
│   ├── main.py
│   ├── db.py                ← sqlite3, schema in /db/schema.sql
│   ├── alerts.py             ← rule engine (Section 5)
│   └── routes/                ← meds, vitals, glucose, labs, wounds, symptoms, appointments, actions
├── db/
│   ├── schema.sql           ← Section 4 DDL
│   └── seed.py               ← loads Section 3 anonymized baseline
├── web/                      ← React + Vite + TypeScript + Tailwind
│   ├── components.json       ← shadcn registry config (points the MCP server here)
│   └── src/
│       ├── pages/
│       │   ├── Today.tsx          ← due meds, last vitals/glucose, active alerts
│       │   ├── Medications.tsx    ← schedule + adherence
│       │   ├── Vitals.tsx         ← BP/HR/temp/SpO2 entry + trend charts
│       │   ├── Glucose.tsx        ← readings + trend chart
│       │   ├── Labs.tsx           ← lab history per test, direction arrows
│       │   ├── Wounds.tsx         ← stump + left-foot timeline (local photo refs only)
│       │   ├── Symptoms.tsx       ← log + severity
│       │   ├── Appointments.tsx
│       │   ├── ActionItems.tsx    ← Kanban-style board (open/answered/done)
│       │   └── WeeklySummary.tsx  ← printable/exportable one-pager
│       └── components/ui/    ← populated by shadcn MCP, NOT hand-written
└── data/
    └── care.db               ← local SQLite file
```

**Why this stack:**
- **FastAPI + SQLite** — small, local, zero infra, easy for an agent to scaffold correctly.
- **React + Vite + Tailwind + shadcn/ui** — modern, accessible, good-looking by default; avoids the "ugly internal tool" look without needing a designer.
- **Charts:** Recharts (pairs cleanly with shadcn's chart components) for glucose/vitals/lab trends.
- **Icons:** Lucide (shadcn's default icon set — consistent, has its own MCP server, large medical/health-relevant icon coverage: `Pill`, `Activity`, `Heart`, `Eye`, `Footprints`, `Stethoscope`, `AlertTriangle`, `Syringe`, `Droplet`, `Thermometer`, `Bandage`-style wound icons via `BandAid`/`Plus` compositions).

---

## 2. UI COMPONENT SOURCING — USE THE MCP SERVER, DON'T HAND-WRITE COMPONENTS

**Instruction to the agent:** Before writing any UI component, query the **shadcn/ui MCP server** for the right component rather than guessing or hand-rolling HTML/CSS. This keeps the result current, accessible, and visually consistent.

**Setup (one-time):**
```json
// mcp config (e.g. .cursor/mcp.json or equivalent client config)
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```
This is the **official shadcn MCP server** — it connects to the shadcn/ui registry (and any configured third-party/private registries) and lets the agent browse, search, and install real components via natural language instead of inventing markup. Configure registries in `web/components.json`.

**Component → page mapping (ask the MCP server for these by name):**

| Page / feature | Ask MCP for | Notes |
|---|---|---|
| Today dashboard | `card`, `badge`, `checkbox`, `alert`, `separator` | due meds as checklist items inside cards |
| Medications | `table`, `data-table` block, `dialog` (add/edit), `select`, `switch` (active/inactive) | adherence % as `progress` |
| Vitals / Glucose | `chart` (area/line), `input`, `form`, `tabs` (7d/30d/90d) | use Recharts via shadcn chart wrapper |
| Labs | `table`, `tooltip` (reference ranges on hover), `badge` (H/L/N flag color-coded) | |
| Wounds | `card` grid, `tabs` (by site: stump / left foot), `textarea`, `badge` (urgent flag styling) | photo = local file path only, never uploaded |
| Symptoms | `slider` (severity 0–10), `select` (type), `calendar` (date picker) | |
| Appointments | `calendar`, `card`, `badge` (status) | |
| Action Items | `kanban`-style via `card` columns, `badge` (priority HIGH/MED/LOW color), `dialog` | HIGH priority = destructive/red badge variant |
| Weekly Summary | `card`, `separator`, print-friendly layout, `button` (export) | |
| Global | `sidebar` block, `navigation-menu`, `toast` (save confirmations), `skeleton` (loading) | use a shadcn dashboard **block** (e.g. `dashboard-01`) as the base shell rather than building the shell from scratch |

**Icons (Lucide, via shadcn's default icon integration):**
`Pill` (meds), `Activity` (vitals), `Droplet` (glucose), `FlaskConical` (labs), `Footprints`/`Bandage` (wounds — left foot gets a distinct icon color, e.g. amber/red, to visually flag it as the priority limb), `HeartPulse` (cardiac), `Eye` (vision/ophthalmology), `Brain` (the aneurysm follow-up), `CalendarClock` (appointments), `ListTodo` (action items), `AlertTriangle` (active alerts — red), `CheckCircle2` (resolved items).

**Design tokens to apply (so it doesn't look like a default scaffold):**
- Pick one shadcn theme (e.g. `slate` or `zinc` base) and one accent color reserved *only* for urgent/left-foot/alert items — don't reuse that accent anywhere else, so it stays meaningful.
- Use the shadcn dashboard block's sidebar + header shell as the app frame; don't build navigation from scratch.
- Keep typography to shadcn defaults (Inter) — don't introduce a second font.
- Empty states (e.g. "no symptoms logged today") should use a shadcn `empty-state`/illustration pattern, not a blank table.

---

## 3. ANONYMIZED CLINICAL BASELINE (seed data)

### 3.1 Patient profile (`PT-ANON`)
- Age 65, Sex F, BMI ~34, Weight ~83 kg, Height ~157–160 cm
- Mobility: frail; **cannot currently stand unaided on remaining leg (fall risk)**
- Status: post right below-knee amputation (BKA), recovering; under inpatient care abroad

### 3.2 Conditions
| Code | Condition | Notes |
|---|---|---|
| C01 | Type 2 diabetes | HbA1c 11.4% → 8.2% |
| C02 | Bilateral peripheral arterial disease | Right worse; left foot flow compromised |
| C03 | Right below-knee amputation | Wet gangrene; stump healing |
| C04 | Left foot — dry ulcer, 2nd toe | Bone resorption; **threatened toe** |
| C05 | Hypertension | 3 agents |
| C06 | Hyperlipidemia | LDL 177, TG 291, HDL 30 — statin upgraded |
| C07 | Rheumatic heart disease | Cardiomegaly |
| C08 | Rheumatoid arthritis | — |
| C09 | Severe osteoarthritis, both knees | Right bone-on-bone |
| C10 | Cervical + lumbar spine degeneration | C4–C7 severe; dextroscoliosis |
| C11 | Low bone density | Approaching osteoporosis |
| C12 | Vitamin D deficiency | Correcting |
| C13 | GERD | On PPI |
| C14 | Fatty liver | Incidental |
| C15 | Cerebral aneurysm, 2mm, left MCA | **Incidental — needs neuro follow-up** |
| C16 | Thickened endometrium, 2.1cm | **Incidental — needs gyn follow-up** |
| C17 | UTI | Treating — confirm cleared |

### 3.3 Medications
| Drug | Dose | Route | Schedule | Purpose |
|---|---|---|---|---|
| Amlodipine | 10mg | oral | daily, after dinner | BP |
| Bisoprolol | 2.5mg | oral | daily, after breakfast | heart/BP |
| Valsartan | 160mg | oral | daily, after dinner | BP |
| Aspirin | 100mg | oral | daily, after dinner | antiplatelet |
| Ezetimibe+Atorvastatin | 10+20mg | oral | daily, after dinner | cholesterol |
| Tirzepatide (Mounjaro) | 2.5mg | SC | weekly, Thu noon | diabetes/weight |
| Metformin XR | 1000mg ×2 | oral | daily, after dinner | diabetes |
| Pregabalin | 50mg | oral | daily, after dinner | nerve/phantom pain |
| Nortriptyline | 10mg | oral | daily, bedtime | nerve pain |
| Alpha-lipoic acid | 600mg | oral | daily, before breakfast | neuropathy |
| Vitamin B12 | 1000mcg | IV | weekly | neuropathy |
| Paracetamol | 500mg ×2 | oral | q6h PRN | pain/fever |
| Tramadol+Paracetamol | 37.5+325mg | oral | q8h PRN | pain |
| Rabeprazole | 20mg | oral | 2×/day | stomach |
| Senna / Mg hydroxide / fiber / elobixibat | — | oral | per protocol | constipation |
| Ketoconazole shampoo+cream | 2% | topical | per protocol | fungal skin |
| Mometasone / urea+triamcinolone | — | topical | 2×/day | itch/rash |
| Bilastine | 20mg | oral | bedtime | antihistamine |
| Vitamin D2 | 20000U | oral | weekly | deficiency |
| Glucosamine | 1500mg | oral | daily, before breakfast | joint |
| Wound topicals (DuoDerm/fusidic acid/amikacin gel) | — | topical | PRN, left foot | wound |

### 3.4 Latest key labs
| Test | Value | Unit | Ref | Flag |
|---|---|---|---|---|
| HbA1c | 8.2 | % | <5.7 | H |
| Glucose (fasting) | 140–165 | mg/dL | 70–99 | H |
| Albumin | 3.6 | g/dL | 3.2–4.6 | N |
| CRP (hs) | 8.38 | mg/L | <5 | H |
| WBC | 8.51 | ×10³/µL | 4.5–10.5 | N |
| Creatinine | 0.77 | mg/dL | 0.55–1.02 | N |
| eGFR | 81 | mL/min | ≥60 | N |
| Hemoglobin | 12.1 | g/dL | 12.5–14.9 | L |
| Total cholesterol | 242 | mg/dL | <200 | H |
| LDL | 177 | mg/dL | <130 | H |
| Triglycerides | 291 | mg/dL | <150 | H |
| HDL | 30 | mg/dL | >50 | L |
| Vitamin D | 40 | ng/mL | >30 | N |

### 3.5 Imaging summary
- Left foot X-ray: 2nd distal phalanx resorption, soft-tissue swelling.
- Doppler left leg: good inflow (triphasic femoral/popliteal); **absent flow in anterior tibial + dorsalis pedis** → angiogram/CTA recommended.
- Brain MRI/MRA: no stroke; small-vessel disease; **2mm left-MCA aneurysm**.
- Abdomen US: fatty liver; endometrium 2.1cm.
- Chest: cardiomegaly, lungs clear.

### 3.6 Open action items (seed)
| Priority | Item | Category |
|---|---|---|
| HIGH | Angiogram + toe pressure/TcPO2 on left foot → save vs revascularize 2nd toe | vascular |
| HIGH | Neuro review + follow-up plan for 2mm aneurysm | neuro |
| HIGH | Physiotherapy: assess remaining-leg weakness + fall prevention | rehab |
| MED | Obtain ophthalmology report | eyes |
| MED | Confirm UTI fully treated | infection |
| MED | Confirm constipation controlled | comfort |
| MED | Confirm itchy skin/fungal improving | comfort |
| MED | Recheck lipid response on new statin | cardiometabolic |
| LOW | Gynecology follow-up, thickened endometrium | gyn |
| ONGOING | Mounjaro: protect nutrition + leg muscle (pair w/ physio) | diabetes |

---

## 4. SQLITE SCHEMA (DDL)

```sql
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
  schedule TEXT, purpose TEXT, active INTEGER DEFAULT 1,
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
```

---

## 5. ALERT RULES (informational only — every output appends "→ discuss with treating physician")

**Glucose:** `>250` HIGH · `<70` LOW (more urgent) · ≥3 fasting readings `>180` in 7 days → "persistent high — review."

**Vitals:** `temp_c ≥ 38.0` → **fever flag** (infection risk given amputation/diabetes) · `bp_sys ≥180 or bp_dia ≥110` → high BP · `bp_sys <90` → low BP · `hr <50 or >110` → HR flag (on bisoprolol) · `spo2 <92` → oxygenation flag.

**Wounds (left foot = highest sensitivity):** new `odor`, `color_change`, increasing size, or new discharge on any `left_foot_*` entry → **URGENT — contact team today.** Same logic, lower urgency, for the stump.

**Symptoms:** new/worsening left-leg numbness, or foot cold/pale/dark → **URGENT vascular flag** · fever + drowsiness/confusion + feeling cold + rapid breathing together → **EMERGENCY pattern (possible sepsis) — seek urgent care now** · pain severity ≥7 sustained → "uncontrolled pain — review analgesia."

**Medications:** weekly Mounjaro/B12 not logged in its window → "weekly dose due/missed" · any HIGH-importance daily med missed ≥2 days → adherence flag.

**Labs (trend):** albumin falling `<3.2` → "nutrition slipping" · hemoglobin falling → "anemia — review" · eGFR `<60` → "kidney function change — review (affects meds/contrast)."

---

## 6. PAGES & FEATURES (recap, maps to Section 2 table)

1. **Today** — due meds checklist, last glucose/vitals, active alerts, open HIGH items.
2. **Medications** — schedule + adherence % (highlight missed criticals).
3. **Vitals & Glucose** — entry forms + trend charts (7/30/90-day tabs).
4. **Labs** — per-test history with H/L/N badges and direction arrows.
5. **Wounds** — timeline per site (stump vs. left foot, visually distinguished); local photo filenames only, never uploaded.
6. **Symptoms** — log + severity slider.
7. **Appointments** — calendar + outcomes.
8. **Action Items** — board by priority/category/status.
9. **Weekly Summary** — exportable one-pager: vitals/glucose range, adherence %, new symptoms, wound status, lab changes, open HIGH items, standing questions (Section 7).
10. **Emergency card** — static screen: red-flag symptoms (fever, foot color/temperature change, drowsiness+cold = possible sepsis) → "seek urgent care."

---

## 7. STANDING QUESTIONS FOR THE CARE TEAM (seed into `action_items`, surface in Weekly Summary)
1. Left foot: angiogram + toe-pressure/TcPO2 — can the 2nd toe be saved or does it need revascularization? When?
2. Brain aneurysm (2mm): who reviews it, what's the follow-up, does it affect aspirin?
3. Eyes: retinopathy / macular edema / reversible sugar-related blur? Treat now or follow up?
4. Remaining leg: deconditioning vs reduced blood flow? Plan to stand/transfer safely? Prosthetic candidacy?
5. Mounjaro: protecting nutrition + leg muscle while losing weight?
6. Comfort: constipation controlled? Skin/fungal improving? UTI cleared?
7. Lipids: responding to new statin?
8. Discharge plan + home red-flags.

---

## 8. ANONYMIZATION CHECKLIST (enforce continuously)
- [ ] No real name anywhere — only `PT-ANON`.
- [ ] No ID/passport, address, phone, email.
- [ ] No specific hospital/doctor/city/country tied to identity.
- [ ] No personal narrative/backstory/family details.
- [ ] Photos = local filename reference only; never send image bytes to any external model.
- [ ] Strip/redact any identifying text before it reaches an external LLM.
- [ ] Tracker only — never advisor. Every alert ends "→ discuss with treating physician."

---

## 9. BUILD ORDER (suggested)
1. `db/schema.sql` + `db/seed.py` → verify `data/care.db` loads Section 3 data correctly.
2. `server/` FastAPI CRUD routes per table + `alerts.py`.
3. `web/` — init Vite + Tailwind + shadcn (`npx shadcn init`), configure MCP, pull in the `dashboard-01` block as the shell.
4. Build **Today** and **Weekly Summary** first (highest value, simplest data needs).
5. Then Medications, Vitals/Glucose (with charts), Labs.
6. Then Wounds, Symptoms, Appointments, Action Items.
7. Polish: empty states, toasts, loading skeletons, the reserved urgent-accent color, emergency card.

*End of AGENT.md — anonymized build spec. Not medical advice.*
