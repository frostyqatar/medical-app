"""Alert rule engine — informational only. Every alert appends '→ discuss with treating physician.'"""
from datetime import datetime, timedelta, timezone
from typing import Optional


DISCLAIMER = " — discuss with treating physician."


def check_glucose(readings: list) -> list[str]:
    alerts = []
    for r in readings:
        val = r["value_mgdl"]
        if val > 250:
            alerts.append(f"Glucose {val} mg/dL — HIGH. → discuss with treating physician.")
        elif val < 70:
            alerts.append(f"Glucose {val} mg/dL — LOW (urgent). → discuss with treating physician.")

    # ≥3 fasting readings >180 in 7 days
    fasting_high = [r for r in readings if r["context"] == "fasting" and r["value_mgdl"] > 180]
    if len(fasting_high) >= 3:
        alerts.append("Persistent high fasting glucose (≥3 readings >180 in 7 days) — review. → discuss with treating physician.")
    return alerts


def check_vitals(vitals_record: dict) -> list[str]:
    alerts = []
    temp = vitals_record.get("temp_c")
    bp_sys = vitals_record.get("bp_sys")
    bp_dia = vitals_record.get("bp_dia")
    hr = vitals_record.get("hr")
    spo2 = vitals_record.get("spo2")

    if temp is not None and temp >= 38.0:
        alerts.append(f"Temperature {temp}°C — fever flag (infection risk given amputation/diabetes). → discuss with treating physician.")

    if bp_sys is not None and bp_sys >= 180:
        alerts.append(f"BP {bp_sys}/{bp_dia} — systolic high. → discuss with treating physician.")
    if bp_dia is not None and bp_dia >= 110:
        alerts.append(f"BP {bp_sys}/{bp_dia} — diastolic high. → discuss with treating physician.")
    if bp_sys is not None and bp_sys < 90:
        alerts.append(f"BP {bp_sys}/{bp_dia} — low BP. → discuss with treating physician.")

    if hr is not None and (hr < 50 or hr > 110):
        alerts.append(f"Heart rate {hr} bpm — flag (on bisoprolol). → discuss with treating physician.")

    if spo2 is not None and spo2 < 92:
        alerts.append(f"SpO2 {spo2}% — oxygenation flag. → discuss with treating physician.")
    return alerts


def check_wounds(wound_records: list) -> list[str]:
    alerts = []
    for w in wound_records:
        site = w.get("site", "")
        has_odor = w.get("odor", 0)
        has_color_change = w.get("color_change", 0)
        has_discharge = w.get("discharge", "")
        size_note = w.get("size_note", "")

        flags = []
        if has_odor:
            flags.append("odor")
        if has_color_change:
            flags.append("color change")
        if has_discharge and has_discharge.lower() not in ("none", ""):
            flags.append("discharge")
        if "increase" in size_note.lower() or "larger" in size_note.lower():
            flags.append("increasing size")

        if flags:
            if "left_foot" in site:
                alerts.append(f"URGENT — Left foot wound ({site}): {', '.join(flags)}. Contact team today. → discuss with treating physician.")
            elif "stump" in site:
                alerts.append(f"Stump wound: {', '.join(flags)}. Monitor closely. → discuss with treating physician.")
    return alerts


def check_symptoms(symptom_records: list) -> list[str]:
    alerts = []
    for s in symptom_records:
        stype = (s.get("type") or "").lower()
        severity = s.get("severity")
        notes = (s.get("notes") or "").lower()

        # Left-leg numbness or foot cold/pale/dark
        if any(kw in stype + notes for kw in ["numb", "cold", "pale", "dark", "blue", "discolor"]):
            if "left" in stype + notes or "foot" in stype + notes or "leg" in stype + notes:
                alerts.append("URGENT vascular flag — left-leg/foot numbness, cold, pale, or dark. → discuss with treating physician.")

        # Fever + drowsiness/confusion + feeling cold + rapid breathing → possible sepsis
        fever_keywords = ["fever", "febrile"]
        sepsis_keywords = ["drowsy", "confus", "cold", "chill", "rapid breath", "short of breath"]
        combined = stype + notes
        has_fever_indicator = any(kw in combined for kw in fever_keywords)
        sepsis_count = sum(1 for kw in sepsis_keywords if kw in combined)
        if has_fever_indicator and sepsis_count >= 2:
            alerts.append("EMERGENCY pattern (possible sepsis) — seek urgent care now. → discuss with treating physician.")

        # Pain severity ≥7 sustained
        if severity is not None and severity >= 7 and "pain" in stype:
            alerts.append(f"Uncontrolled pain (severity {severity}) — review analgesia. → discuss with treating physician.")
    return alerts


def check_medication_adherence(med_logs: list) -> list[str]:
    alerts = []
    now = datetime.now(timezone.utc)
    # Check for weekly meds not logged in window
    weekly_meds = {"Tirzepatide (Mounjaro)", "Vitamin B12", "Vitamin D2"}
    logged_meds = set()
    for log in med_logs:
        logged_meds.add(log.get("drug", ""))

    for med_name in weekly_meds:
        found = any(med_name.lower() in lm.lower() for lm in logged_meds)
        if not found:
            alerts.append(f"Weekly dose due/missed: {med_name}. → discuss with treating physician.")

    # Check daily high-importance meds missed ≥2 days
    missed_counts = {}
    for log in med_logs:
        if log.get("status") == "missed":
            drug = log.get("drug", "")
            missed_counts[drug] = missed_counts.get(drug, 0) + 1

    for drug, count in missed_counts.items():
        if count >= 2:
            alerts.append(f"Adherence flag: {drug} missed {count} days. → discuss with treating physician.")
    return alerts


def check_labs(lab_records: list) -> list[str]:
    alerts = []
    for lab in lab_records:
        test = lab.get("test", "")
        value = lab.get("value")
        flag = lab.get("flag", "")

        if "albumin" in test.lower() and value is not None and value < 3.2:
            alerts.append(f"Albumin {value} g/dL — nutrition slipping. → discuss with treating physician.")
        if "hemoglobin" in test.lower() and flag == "L":
            alerts.append(f"Hemoglobin {value} g/dL — anemia, review. → discuss with treating physician.")
        if "egfr" in test.lower() and value is not None and value < 60:
            alerts.append(f"eGFR {value} mL/min — kidney function change, review (affects meds/contrast). → discuss with treating physician.")
    return alerts


def run_all(
    glucose_readings: list,
    latest_vitals: dict,
    recent_wounds: list,
    recent_symptoms: list,
    med_logs: list,
    recent_labs: list,
) -> list[str]:
    all_alerts = []
    all_alerts.extend(check_glucose(glucose_readings))
    if latest_vitals:
        all_alerts.extend(check_vitals(latest_vitals))
    all_alerts.extend(check_wounds(recent_wounds))
    all_alerts.extend(check_symptoms(recent_symptoms))
    all_alerts.extend(check_medication_adherence(med_logs))
    all_alerts.extend(check_labs(recent_labs))
    return all_alerts
