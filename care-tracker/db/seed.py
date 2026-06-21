"""Seed the SQLite database with anonymized clinical baseline data."""
import sqlite3
import os
from datetime import datetime, timedelta, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "care.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")

def seed():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    with open(SCHEMA_PATH) as f:
        cur.executescript(f.read())

    now = datetime.now(timezone.utc).isoformat()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    # 3.1 Patient profile
    cur.execute(
        "INSERT INTO patient (id, age, sex, height_cm, weight_kg, mobility_note, updated_at) VALUES (?,?,?,?,?,?,?)",
        ("PT-ANON", 65, "F", 158, 83,
         "Frail; cannot currently stand unaided on remaining leg (fall risk). Post right below-knee amputation, recovering.",
         now)
    )

    # 3.2 Conditions
    conditions = [
        ("C01", "Type 2 diabetes", "HbA1c 11.4%% -> 8.2%%", 1),
        ("C02", "Bilateral peripheral arterial disease", "Right worse; left foot flow compromised", 1),
        ("C03", "Right below-knee amputation", "Wet gangrene; stump healing", 1),
        ("C04", "Left foot — dry ulcer, 2nd toe", "Bone resorption; threatened toe", 1),
        ("C05", "Hypertension", "3 agents", 1),
        ("C06", "Hyperlipidemia", "LDL 177, TG 291, HDL 30 — statin upgraded", 1),
        ("C07", "Rheumatic heart disease", "Cardiomegaly", 1),
        ("C08", "Rheumatoid arthritis", "", 1),
        ("C09", "Severe osteoarthritis, both knees", "Right bone-on-bone", 1),
        ("C10", "Cervical + lumbar spine degeneration", "C4–C7 severe; dextroscoliosis", 1),
        ("C11", "Low bone density", "Approaching osteoporosis", 1),
        ("C12", "Vitamin D deficiency", "Correcting", 1),
        ("C13", "GERD", "On PPI", 1),
        ("C14", "Fatty liver", "Incidental", 1),
        ("C15", "Cerebral aneurysm, 2mm, left MCA", "Incidental — needs neuro follow-up", 1),
        ("C16", "Thickened endometrium, 2.1cm", "Incidental — needs gyn follow-up", 1),
        ("C17", "UTI", "Treating — confirm cleared", 1),
        ("C18", "Diabetic polyneuropathy", "Symmetrical distal sensory-motor; managed with pregabalin, nortriptyline, ALA, B12", 1),
        ("C19", "Diabetic retinopathy + cataracts", "Confirmed on ophthalmology exam — cataracts noted bilaterally; retinopathy graded, plan TBD", 1),
        ("C20", "Dental disease", "Caries/periodontal — needs dental assessment given RHD", 1),
        ("C21", "Facial palsy (peripheral)", "Left-sided; onset documented — monitor for recovery", 1),
    ]
    cur.executemany("INSERT INTO conditions (code, name, notes, active) VALUES (?,?,?,?)", conditions)

    # 3.3 Medications
    medications = [
        ("Amlodipine", "10mg", "oral", "daily, after dinner", "BP", 1, None, None,
         "Calcium channel blocker that relaxes blood vessels to lower blood pressure."),
        ("Bisoprolol", "2.5mg", "oral", "daily, after breakfast", "heart/BP", 1, None, None,
         "Beta-blocker that slows heart rate and reduces cardiac workload."),
        ("Valsartan", "160mg", "oral", "daily, after dinner", "BP", 1, None, None,
         "ARB (angiotensin receptor blocker) that prevents blood vessels from tightening."),
        ("Aspirin", "100mg", "oral", "daily, after dinner", "antiplatelet", 1, None, None,
         "Antiplatelet (blood thinner) that reduces risk of clots, heart attack, and stroke."),
        ("Ezetimibe+Atorvastatin", "10+20mg", "oral", "daily, after dinner", "cholesterol", 1, None, None,
         "Combo: Atorvastatin (statin) reduces cholesterol production in the liver; Ezetimibe blocks cholesterol absorption in the gut. Dual-action lipid control."),
        ("Tirzepatide (Mounjaro)", "2.5mg", "SC", "weekly, Thu noon", "diabetes/weight", 1, None, None,
         "GIP/GLP-1 dual receptor agonist for type 2 diabetes and weight loss. Stimulates insulin, slows gastric emptying, and suppresses appetite."),
        ("Metformin XR", "1000mg x2", "oral", "daily, after dinner", "diabetes", 1, None, None,
         "Biguanide (extended release) — first-line diabetes treatment. Reduces liver glucose production and improves insulin sensitivity."),
        ("Pregabalin", "50mg", "oral", "daily, after dinner", "nerve/phantom pain", 1, None, None,
         "Gabapentinoid that calms overactive nerve signals. Used for neuropathic and phantom limb pain."),
        ("Nortriptyline", "10mg", "oral", "daily, bedtime", "nerve pain", 1, None, None,
         "Tricyclic antidepressant used at low dose for neuropathic pain. Modulates pain pathways in the CNS."),
        ("Alpha-lipoic acid", "600mg", "oral", "daily, before breakfast", "neuropathy", 1, None, None,
         "Antioxidant supplement that may reduce nerve pain in diabetic neuropathy. Supports cellular metabolism."),
        ("Vitamin B12", "1000mcg", "IV", "weekly", "neuropathy", 1, None, None,
         "Essential vitamin for nerve function and red blood cell formation. IV form for deficiency correction and nerve repair."),
        ("Paracetamol", "500mg x2", "oral", "q6h PRN", "pain/fever", 1, None, None,
         "Analgesic and antipyretic for mild-to-moderate pain and fever. Acts centrally to reduce pain perception."),
        ("Tramadol+Paracetamol", "37.5+325mg", "oral", "q8h PRN", "pain", 1, None, None,
         "Combo: Tramadol (opioid analgesic) + Paracetamol (non-opioid). Dual-mechanism pain relief stronger than either alone — for moderate to severe pain."),
        ("Rabeprazole", "20mg", "oral", "2x/day", "stomach", 1, None, None,
         "Proton pump inhibitor (PPI) that reduces stomach acid. Used for GERD, ulcers, and gastric protection during polypharmacy."),
        ("Senna / Mg hydroxide / fiber / elobixibat", "-", "oral", "per protocol", "constipation", 1, None, None,
         "Bowel protocol combo: Senna (stimulant laxative), Mg hydroxide (osmotic laxative), Fiber (bulking agent), Elobixibat (IBAT inhibitor promoting bile flow). Multi-agent approach for chronic constipation."),
        ("Ketoconazole shampoo+cream", "2%", "topical", "per protocol", "fungal skin", 1, None, None,
         "Combo: Shampoo treats scalp/body fungal infections; cream targets localized areas. Both disrupt fungal cell membranes."),
        ("Mometasone / urea+triamcinolone", "-", "topical", "2x/day", "itch/rash", 1, None, None,
         "Topical steroid combo: Mometasone and Triamcinolone (corticosteroids) reduce inflammation and itching. Urea (moisturizer/keratolytic) enhances steroid penetration into skin."),
        ("Bilastine", "20mg", "oral", "bedtime", "antihistamine", 1, None, None,
         "Second-generation non-drowsy antihistamine. Blocks H1 receptors to relieve allergy and urticaria symptoms."),
        ("Vitamin D2", "20000U", "oral", "weekly", "deficiency", 1, None, None,
         "Ergocalciferol supplement to correct vitamin D deficiency. Essential for calcium absorption, bone health, and immune function."),
        ("Glucosamine", "1500mg", "oral", "daily, before breakfast", "joint", 1, None, None,
         "Supplement that may help maintain joint cartilage and reduce osteoarthritis symptoms."),
        ("Wound topicals (DuoDerm/fusidic acid/amikacin gel)", "-", "topical", "PRN, left foot", "wound", 1, None, None,
         "Wound care combo: DuoDerm (hydrocolloid dressing for moisture balance), Fusidic acid (topical antibiotic), Amikacin gel (aminoglycoside antibiotic). Multi-agent protocol for chronic/infected foot wound."),
    ]
    cur.executemany(
        "INSERT INTO medications (drug, dose, route, schedule, purpose, active, start_date, stop_date, description) VALUES (?,?,?,?,?,?,?,?,?)",
        medications
    )

    # medication_log — intentionally empty; only real entries from now on

    # 3.4 Labs — historical trend data + latest reading
    # Each test gets 6 readings spaced ~15 days apart over ~90 days
    def lab_dates(days_ago):
        return (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")

    def flag_val(val, lo, hi):
        if lo is not None and val < lo:
            return "L"
        if hi is not None and val > hi:
            return "H"
        return "N"

    lab_history = [
        # HbA1c — improving from 11.4% → 8.2%
        {"test": "HbA1c", "unit": "%", "ref_low": None, "ref_high": 5.7,
         "values": [
             (90, 11.4, "H"), (75, 10.8, "H"), (60, 10.1, "H"),
             (45, 9.3, "H"), (30, 8.7, "H"), (3, 8.2, "H"),
         ]},
        # Glucose (fasting) — slowly improving
        {"test": "Glucose (fasting)", "unit": "mg/dL", "ref_low": 70, "ref_high": 99,
         "values": [
             (90, 180, "H"), (75, 172, "H"), (60, 165, "H"),
             (45, 158, "H"), (30, 155, "H"), (3, 152, "H"),
         ]},
        # Albumin — stable
        {"test": "Albumin", "unit": "g/dL", "ref_low": 3.2, "ref_high": 4.6,
         "values": [
             (90, 3.4, "N"), (75, 3.5, "N"), (60, 3.4, "N"),
             (45, 3.5, "N"), (30, 3.7, "N"), (3, 3.6, "N"),
         ]},
        # CRP (hs) — trending down (inflammation improving)
        {"test": "CRP (hs)", "unit": "mg/L", "ref_low": None, "ref_high": 5,
         "values": [
             (90, 15.0, "H"), (75, 12.5, "H"), (60, 10.2, "H"),
             (45, 9.0, "H"), (30, 8.5, "H"), (3, 8.38, "H"),
         ]},
        # WBC — stable
        {"test": "WBC", "unit": "x10^3/uL", "ref_low": 4.5, "ref_high": 10.5,
         "values": [
             (90, 9.2, "N"), (75, 8.8, "N"), (60, 7.9, "N"),
             (45, 8.3, "N"), (30, 8.6, "N"), (3, 8.51, "N"),
         ]},
        # Creatinine — stable
        {"test": "Creatinine", "unit": "mg/dL", "ref_low": 0.55, "ref_high": 1.02,
         "values": [
             (90, 0.82, "N"), (75, 0.79, "N"), (60, 0.75, "N"),
             (45, 0.80, "N"), (30, 0.81, "N"), (3, 0.77, "N"),
         ]},
        # eGFR — stable
        {"test": "eGFR", "unit": "mL/min", "ref_low": 60, "ref_high": None,
         "values": [
             (90, 76, "N"), (75, 78, "N"), (60, 80, "N"),
             (45, 79, "N"), (30, 82, "N"), (3, 81, "N"),
         ]},
        # Hemoglobin — trending slightly down
        {"test": "Hemoglobin", "unit": "g/dL", "ref_low": 12.5, "ref_high": 14.9,
         "values": [
             (90, 13.1, "N"), (75, 12.9, "N"), (60, 12.7, "N"),
             (45, 12.5, "N"), (30, 12.3, "L"), (3, 12.1, "L"),
         ]},
        # Total cholesterol — coming down with statin
        {"test": "Total cholesterol", "unit": "mg/dL", "ref_low": None, "ref_high": 200,
         "values": [
             (90, 270, "H"), (75, 258, "H"), (60, 250, "H"),
             (45, 245, "H"), (30, 244, "H"), (3, 242, "H"),
         ]},
        # LDL — coming down with statin
        {"test": "LDL", "unit": "mg/dL", "ref_low": None, "ref_high": 130,
         "values": [
             (90, 210, "H"), (75, 195, "H"), (60, 188, "H"),
             (45, 182, "H"), (30, 178, "H"), (3, 177, "H"),
         ]},
        # Triglycerides — slowly improving
        {"test": "Triglycerides", "unit": "mg/dL", "ref_low": None, "ref_high": 150,
         "values": [
             (90, 350, "H"), (75, 330, "H"), (60, 310, "H"),
             (45, 300, "H"), (30, 295, "H"), (3, 291, "H"),
         ]},
        # HDL — slowly improving with treatment
        {"test": "HDL", "unit": "mg/dL", "ref_low": 50, "ref_high": None,
         "values": [
             (90, 26, "L"), (75, 28, "L"), (60, 29, "L"),
             (45, 29, "L"), (30, 30, "L"), (3, 30, "L"),
         ]},
        # Vitamin D — improving with supplementation
        {"test": "Vitamin D", "unit": "ng/mL", "ref_low": 30, "ref_high": None,
         "values": [
             (90, 18, "L"), (75, 22, "L"), (60, 28, "L"),
             (45, 32, "N"), (30, 36, "N"), (3, 40, "N"),
         ]},
    ]

    for test_def in lab_history:
        for days_ago, val, flag in test_def["values"]:
            cur.execute(
                "INSERT INTO lab_results (measured_at, test, value, unit, ref_low, ref_high, flag, notes) VALUES (?,?,?,?,?,?,?,?)",
                (lab_dates(days_ago), test_def["test"], val, test_def["unit"],
                 test_def["ref_low"], test_def["ref_high"], flag, "")
            )

    # 3.6 Action items (de-duplicated; standing questions merged into originals)
    action_items = [
        ("HIGH", "Angiogram + toe pressure/TcPO2 on left foot → save vs revascularize 2nd toe", "vascular", "open", None),
        ("HIGH", "Brain aneurysm (2mm): who reviews it, what is the follow-up, does it affect aspirin?", "neuro", "open", None),
        ("HIGH", "Physiotherapy: assess remaining-leg weakness + fall prevention; prosthetic candidacy?", "rehab", "open", None),
        ("HIGH", "Dental assessment + endocarditis prophylaxis (given RHD history)", "dental", "open", None),
        ("MED", "Obtain ophthalmology report", "eyes", "answered", "Report received — retinopathy confirmed, cataracts noted bilaterally. Clinical decisions pending."),
        ("MED", "Eyes: retinopathy treatment plan? Macular edema? Cataract surgery timing?", "eyes", "open", None),
        ("MED", "Confirm UTI fully treated", "infection", "open", None),
        ("MED", "Comfort: constipation controlled? Skin/fungal improving?", "comfort", "open", None),
        ("MED", "Lipids: responding to new statin?", "cardiometabolic", "open", None),
        ("MED", "Discharge plan + home red-flags", "planning", "open", None),
        ("LOW", "Gynecology follow-up, thickened endometrium", "gyn", "open", None),
        ("ONGOING", "Mounjaro: protecting nutrition + leg muscle while losing weight", "diabetes", "open", None),
    ]
    cur.executemany(
        "INSERT INTO action_items (priority, item, category, status, answer) VALUES (?,?,?,?,?)",
        action_items
    )

    # vitals — intentionally empty; only real entries from now on

    # glucose_readings — intentionally empty; only real entries from now on

    # Wound entries
    wound_dates = [(datetime.now(timezone.utc) - timedelta(days=d)).strftime("%Y-%m-%d") for d in [1, 4, 7, 10]]
    for d in wound_dates:
        cur.execute(
            "INSERT INTO wounds (assessed_at, site, size_note, appearance, discharge, odor, color_change, photo_ref, notes) VALUES (?,?,?,?,?,?,?,?,?)",
            (d, "stump", "stable", "healing, pink", "none", 0, 0, "", "Stump healing well.")
        )
        cur.execute(
            "INSERT INTO wounds (assessed_at, site, size_note, appearance, discharge, odor, color_change, photo_ref, notes) VALUES (?,?,?,?,?,?,?,?,?)",
            (d, "left_foot_2nd_toe", "0.5cm dry", "dry ulcer, dark edge", "none", 0, 1, "", "Threatened toe — monitor closely. → discuss with treating physician.")
        )

    # Appointments
    appointments = [
        ((datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d"), "vascular", "done", "Doppler done — awaiting angiogram schedule.", ""),
        ((datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%d"), "endocrinology", "done", "Mounjaro started; HbA1c improving.", ""),
        ((datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"), "neurology", "planned", None, "Aneurysm review."),
        ((datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"), "vascular", "planned", None, "Angiogram + toe pressure."),
        ((datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d"), "ophthalmology", "planned", None, "Eye exam."),
    ]
    cur.executemany(
        "INSERT INTO appointments (scheduled_for, specialty, status, outcome, notes) VALUES (?,?,?,?,?)",
        appointments
    )

    # Symptoms
    symptom_entries = [
        (today + "T09:00:00Z", "phantom limb pain", 4, "Managed with pregabalin."),
        (yesterday + "T14:00:00Z", "left foot numbness", 3, "Intermittent; worse when lying down."),
        (yesterday + "T20:00:00Z", "GERD/heartburn", 2, "After dinner; controlled with rabeprazole."),
        ((datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d") + "T08:00:00Z", "dizziness", 2, "On standing; orthostatic? → discuss with treating physician."),
    ]
    cur.executemany(
        "INSERT INTO symptoms (noted_at, type, severity, notes) VALUES (?,?,?,?)",
        symptom_entries
    )

    conn.commit()
    conn.close()
    print(f"Database seeded successfully at {DB_PATH}")

if __name__ == "__main__":
    seed()
