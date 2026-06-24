import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dbrwxutgbbreshlfdndl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicnd4dXRnYmJyZXNobGZkbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzQzNjAsImV4cCI6MjA5NzQ1MDM2MH0.zYa3xF4gxzwjA9o0wLHInsdK-Nv8aKi2kKWAP_ZJeSc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const BASE = '/api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Patient {
  id: string; age: number | null; sex: string | null;
  height_cm: number | null; weight_kg: number | null;
  mobility_note: string | null; updated_at: string;
}

export interface Condition {
  code: string; name: string; notes: string | null; active: number;
}

export interface Medication {
  id: number; drug: string; dose: string | null; route: string | null;
  schedule: string | null; purpose: string | null; description: string | null;
  active: number; start_date: string | null; stop_date: string | null;
}

export interface MedicationLog {
  id: number; med_id: number; scheduled_for: string;
  taken_at: string | null; status: 'taken' | 'missed' | 'skipped' | 'held'; notes: string | null;
}

export interface AdherenceRow {
  id: number; drug: string; schedule: string | null;
  total_logs: number; taken_count: number; missed_count: number;
}

export interface Vital {
  id: number; measured_at: string; bp_sys: number | null; bp_dia: number | null;
  hr: number | null; temp_c: number | null; spo2: number | null;
  weight_kg: number | null; notes: string | null;
}

export interface Glucose {
  id: number; measured_at: string; value_mgdl: number;
  context: 'fasting' | 'pre_meal' | 'post_meal' | 'random' | 'bedtime' | null;
  notes: string | null;
}

export interface Lab {
  id: number; measured_at: string; test: string; value: number | null;
  unit: string | null; ref_low: number | null; ref_high: number | null;
  flag: 'H' | 'L' | 'N' | null; notes: string | null;
}

export interface Wound {
  id: number; assessed_at: string; site: string; size_note: string | null;
  appearance: string | null; discharge: string | null; odor: number;
  color_change: number; photo_ref: string | null; notes: string | null;
}

export interface Symptom {
  id: number; noted_at: string; type: string | null;
  severity: number | null; notes: string | null;
}

export interface Appointment {
  id: number; scheduled_for: string; specialty: string | null;
  status: 'planned' | 'done' | 'cancelled'; outcome: string | null; notes: string | null;
}

export interface ActionItem {
  id: number; priority: 'HIGH' | 'MED' | 'LOW' | 'ONGOING';
  item: string; category: string | null;
  status: 'open' | 'answered' | 'done'; answer: string | null;
  created_at: string; updated_at: string | null;
}

export interface GoodTracking {
  id: number; note: string; created_at: string;
}

export interface Plan {
  id: number; title: string; content: string | null;
  color: string; created_at: string; updated_at: string | null;
}

export interface AlertResponse { alerts: string[]; count: number; }

export interface WeeklySummaryData {
  patient: Patient | null;
  vitals_range: { bp_sys_min: number | null; bp_sys_max: number | null; bp_dia_min: number | null; bp_dia_max: number | null; hr_min: number | null; hr_max: number | null; temp_min: number | null; temp_max: number | null; spo2_min: number | null; spo2_max: number | null; } | null;
  glucose_summary: { min_val: number | null; max_val: number | null; avg_val: number | null; reading_count: number; } | null;
  adherence: { taken: number; total: number };
  new_symptoms: Symptom[];
  wound_status: Wound[];
  lab_summary: Lab[];
  high_priority_actions: ActionItem[];
  open_actions: ActionItem[];
  upcoming_appointments: Appointment[];
}

// ── Auth helper (for Python backend endpoints) ─────────────────────────────────

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('care-tracker-auth')
    if (stored) { const { token } = JSON.parse(stored); return token || null }
  } catch {}
  return null
}

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { headers, ...options })
  if (!res.ok) {
    if (res.status === 401) { localStorage.removeItem('care-tracker-auth'); window.location.href = '/login'; throw new Error('Session expired') }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.error || `API error: ${res.status}`)
  }
  return res.json()
}

// ── Supabase helper ────────────────────────────────────────────────────────────

function handleError(err: any): never {
  const msg = err?.message || err?.details || 'Database error'
  throw new Error(msg)
}

// ── Patient ────────────────────────────────────────────────────────────────────

export async function fetchPatient(): Promise<Patient> {
  const { data, error } = await supabase.from('patient').select('*').eq('id', 'PT-ANON').single()
  if (error) handleError(error)
  return data as Patient
}

export async function fetchConditions(): Promise<Condition[]> {
  const { data, error } = await supabase.from('conditions').select('*').eq('active', 1)
  if (error) handleError(error)
  return data as Condition[]
}

export async function updatePatient(payload: Partial<Patient>): Promise<Patient> {
  const { data, error } = await supabase.from('patient').update(payload).eq('id', 'PT-ANON').select().single()
  if (error) handleError(error)
  return data as Patient
}

// ── Medications ────────────────────────────────────────────────────────────────

export async function fetchMedications(active?: number | boolean): Promise<Medication[]> {
  let query = supabase.from('medications').select('*').order('drug')
  if (active !== undefined) query = query.eq('active', active ? 1 : 0)
  const { data, error } = await query
  if (error) handleError(error)
  return data as Medication[]
}

export async function fetchMedicationLog(medId: number, days?: number): Promise<MedicationLog[]> {
  let query = supabase.from('medication_log').select('*').eq('med_id', medId).order('scheduled_for', { ascending: false })
  if (days) query = query.limit(days)
  const { data, error } = await query
  if (error) handleError(error)
  return data as MedicationLog[]
}

export async function fetchAdherence(days?: number): Promise<AdherenceRow[]> {
  const { data, error } = await supabase.rpc('get_adherence', days ? { p_days: days } : { p_days: 7 })
  if (error) {
    // fallback: compute in JS if RPC not available
    const { data: meds, error: merr } = await supabase.from('medications').select('id,drug,schedule').eq('active', 1)
    if (merr) handleError(merr)
    const d = days || 7
    const cutoff = new Date(Date.now() - d * 86400000).toISOString()
    const result: AdherenceRow[] = []
    for (const m of meds) {
      const { data: logs, error: lerr } = await supabase.from('medication_log').select('status').eq('med_id', m.id).gte('scheduled_for', cutoff)
      if (lerr) handleError(lerr)
      const total = logs?.length || 0
      const taken = logs?.filter(l => l.status === 'taken').length || 0
      const missed = logs?.filter(l => l.status === 'missed').length || 0
      result.push({ id: m.id, drug: m.drug, schedule: m.schedule, total_logs: total, taken_count: taken, missed_count: missed })
    }
    return result
  }
  return data as AdherenceRow[]
}

export async function createMedication(payload: Partial<Medication>): Promise<Medication> {
  const { data, error } = await supabase.from('medications').insert(payload).select().single()
  if (error) handleError(error)
  return data as Medication
}

export async function updateMedication(id: number, payload: Partial<Medication>): Promise<Medication> {
  const { data, error } = await supabase.from('medications').update(payload).eq('id', id).select().single()
  if (error) handleError(error)
  return data as Medication
}

export async function logMedication(payload: { med_id: number; scheduled_for?: string; taken_at?: string; status?: string; notes?: string }): Promise<MedicationLog> {
  const { data, error } = await supabase.from('medication_log').insert(payload).select().single()
  if (error) handleError(error)
  return data as MedicationLog
}

export async function undoMedicationLog(medId: number): Promise<{ deleted: number }> {
  const { data, error } = await supabase.from('medication_log').select('id').eq('med_id', medId).order('scheduled_for', { ascending: false }).limit(1).single()
  if (error) handleError(error)
  const { error: derr } = await supabase.from('medication_log').delete().eq('id', data.id)
  if (derr) handleError(derr)
  return { deleted: data.id }
}

// ── Vitals ─────────────────────────────────────────────────────────────────────

export async function fetchVitals(days?: number): Promise<Vital[]> {
  const d = days || 30
  const cutoff = new Date(Date.now() - d * 86400000).toISOString()
  const { data, error } = await supabase.from('vitals').select('*').gte('measured_at', cutoff).order('measured_at', { ascending: false })
  if (error) handleError(error)
  return data as Vital[]
}

export async function fetchLatestVitals(): Promise<Vital> {
  const { data, error } = await supabase.from('vitals').select('*').order('measured_at', { ascending: false }).limit(1).single()
  if (error) handleError(error)
  return data as Vital
}

export async function createVital(payload: Partial<Vital>): Promise<Vital> {
  const { data, error } = await supabase.from('vitals').insert(payload).select().single()
  if (error) handleError(error)
  return data as Vital
}

export async function deleteVital(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('vitals').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

export async function updateVital(id: number, payload: Partial<Vital>): Promise<Vital> {
  const { data, error } = await supabase.from('vitals').update(payload).eq('id', id).select().single()
  if (error) handleError(error)
  return data as Vital
}

// ── Glucose ────────────────────────────────────────────────────────────────────

export async function fetchGlucose(days?: number): Promise<Glucose[]> {
  const d = days || 30
  const cutoff = new Date(Date.now() - d * 86400000).toISOString()
  const { data, error } = await supabase.from('glucose_readings').select('*').gte('measured_at', cutoff).order('measured_at', { ascending: false })
  if (error) handleError(error)
  return data as Glucose[]
}

export async function fetchLatestGlucose(): Promise<Glucose> {
  const { data, error } = await supabase.from('glucose_readings').select('*').order('measured_at', { ascending: false }).limit(1).single()
  if (error) handleError(error)
  return data as Glucose
}

export async function createGlucose(payload: Partial<Glucose>): Promise<Glucose> {
  const { data, error } = await supabase.from('glucose_readings').insert(payload).select().single()
  if (error) handleError(error)
  return data as Glucose
}

export async function deleteGlucose(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('glucose_readings').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

export async function updateGlucose(id: number, payload: Partial<Glucose>): Promise<Glucose> {
  const { data, error } = await supabase.from('glucose_readings').update(payload).eq('id', id).select().single()
  if (error) handleError(error)
  return data as Glucose
}

// ── Labs ───────────────────────────────────────────────────────────────────────

export async function fetchLabs(test?: string): Promise<Lab[]> {
  let query = supabase.from('lab_results').select('*').order('measured_at', { ascending: false })
  if (test) query = query.eq('test', test)
  const { data, error } = await query
  if (error) handleError(error)
  return data as Lab[]
}

export async function fetchLabTests(): Promise<string[]> {
  const { data, error } = await supabase.from('lab_results').select('test')
  if (error) handleError(error)
  const tests = [...new Set(data.map((r: { test: string }) => r.test))]
  return tests
}

export async function fetchLabTrend(test: string): Promise<Lab[]> {
  const { data, error } = await supabase.from('lab_results').select('*').eq('test', test).order('measured_at', { ascending: false }).limit(20)
  if (error) handleError(error)
  return data as Lab[]
}

export async function createLab(payload: Partial<Lab>): Promise<Lab> {
  const { data, error } = await supabase.from('lab_results').insert(payload).select().single()
  if (error) handleError(error)
  return data as Lab
}

export async function deleteLab(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('lab_results').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

export async function updateLab(id: number, payload: Partial<Lab>): Promise<Lab> {
  const { data, error } = await supabase.from('lab_results').update(payload).eq('id', id).select().single()
  if (error) handleError(error)
  return data as Lab
}

// ── Wounds ─────────────────────────────────────────────────────────────────────

export async function fetchWounds(site?: string): Promise<Wound[]> {
  let query = supabase.from('wounds').select('*').order('assessed_at', { ascending: false })
  if (site) query = query.eq('site', site)
  const { data, error } = await query
  if (error) handleError(error)
  return data as Wound[]
}

export async function fetchWoundSites(): Promise<string[]> {
  const { data, error } = await supabase.from('wounds').select('site')
  if (error) handleError(error)
  return [...new Set(data.map((r: { site: string }) => r.site))]
}

export async function createWound(payload: Partial<Wound>): Promise<Wound> {
  const { data, error } = await supabase.from('wounds').insert(payload).select().single()
  if (error) handleError(error)
  return data as Wound
}

export async function deleteWound(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('wounds').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

// ── Symptoms ───────────────────────────────────────────────────────────────────

export async function fetchSymptoms(days?: number, type?: string): Promise<Symptom[]> {
  let query = supabase.from('symptoms').select('*').order('noted_at', { ascending: false })
  if (days) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    query = query.gte('noted_at', cutoff)
  }
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) handleError(error)
  return data as Symptom[]
}

export async function fetchSymptomTypes(): Promise<string[]> {
  const { data, error } = await supabase.from('symptoms').select('type')
  if (error) handleError(error)
  return [...new Set(data.map((r: { type: string }) => r.type))]
}

export async function createSymptom(payload: Partial<Symptom>): Promise<Symptom> {
  const { data, error } = await supabase.from('symptoms').insert(payload).select().single()
  if (error) handleError(error)
  return data as Symptom
}

export async function deleteSymptom(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('symptoms').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

// ── Appointments ───────────────────────────────────────────────────────────────

export async function fetchAppointments(status?: string): Promise<Appointment[]> {
  let query = supabase.from('appointments').select('*').order('scheduled_for', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) handleError(error)
  return data as Appointment[]
}

export async function fetchUpcomingAppointments(): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('appointments').select('*').gte('scheduled_for', today).eq('status', 'planned').order('scheduled_for')
  if (error) handleError(error)
  return data as Appointment[]
}

export async function createAppointment(payload: Partial<Appointment>): Promise<Appointment> {
  const { data, error } = await supabase.from('appointments').insert(payload).select().single()
  if (error) handleError(error)
  return data as Appointment
}

export async function updateAppointment(id: number, payload: Partial<Appointment>): Promise<Appointment> {
  const { data, error } = await supabase.from('appointments').update(payload).eq('id', id).select().single()
  if (error) handleError(error)
  return data as Appointment
}

// ── Action Items ───────────────────────────────────────────────────────────────

export async function fetchActionItems(status?: string, priority?: string, category?: string): Promise<ActionItem[]> {
  let query = supabase.from('action_items').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) handleError(error)
  return data as ActionItem[]
}

export async function createActionItem(payload: Partial<ActionItem>): Promise<ActionItem> {
  const { data, error } = await supabase.from('action_items').insert(payload).select().single()
  if (error) handleError(error)
  return data as ActionItem
}

export async function updateActionItem(id: number, payload: Partial<ActionItem>): Promise<ActionItem> {
  const { data, error } = await supabase.from('action_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) handleError(error)
  return data as ActionItem
}

export async function deleteActionItem(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('action_items').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

// ── Good Tracking (Notes) ──────────────────────────────────────────────────────

export async function fetchGoodTracking(days?: number): Promise<GoodTracking[]> {
  let query = supabase.from('good_tracking').select('*').order('created_at', { ascending: false })
  if (days) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    query = query.gte('created_at', cutoff)
  }
  const { data, error } = await query
  if (error) handleError(error)
  return data as GoodTracking[]
}

export async function createGoodTracking(payload: { note: string; created_at?: string }): Promise<GoodTracking> {
  const { data, error } = await supabase.from('good_tracking').insert(payload).select().single()
  if (error) handleError(error)
  return data as GoodTracking
}

export async function updateGoodTracking(id: number, payload: { note: string }): Promise<GoodTracking> {
  const { data, error } = await supabase.from('good_tracking').update(payload).eq('id', id).select().single()
  if (error) handleError(error)
  return data as GoodTracking
}

export async function deleteGoodTracking(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('good_tracking').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

// ── Plans ──────────────────────────────────────────────────────────────────────

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false })
  if (error) handleError(error)
  return data as Plan[]
}

export async function createPlan(payload: { title: string; content?: string; color?: string }): Promise<Plan> {
  const { data, error } = await supabase.from('plans').insert(payload).select().single()
  if (error) handleError(error)
  return data as Plan
}

export async function updatePlan(id: number, payload: Partial<Plan>): Promise<Plan> {
  const { data, error } = await supabase.from('plans').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) handleError(error)
  return data as Plan
}

export async function deletePlan(id: number): Promise<{ deleted: number }> {
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) handleError(error)
  return { deleted: id }
}

// ── Complex operations (Supabase) ───────────────────────────────────────────────

export async function fetchAlerts(): Promise<AlertResponse> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString()

  const [
    { data: glucoseData, error: glucoseErr },
    { data: vitalsData, error: vitalsErr },
    { data: woundsData, error: woundsErr },
    { data: symptomsData, error: symptomsErr },
    { data: missedMeds, error: medsErr },
    { data: labData, error: labErr },
  ] = await Promise.all([
    supabase.from('glucose_readings').select('*').gte('measured_at', sevenDaysAgo).order('measured_at', { ascending: false }),
    supabase.from('vitals').select('*').order('measured_at', { ascending: false }).limit(1),
    supabase.from('wounds').select('*').gte('assessed_at', fourteenDaysAgo).order('assessed_at', { ascending: false }),
    supabase.from('symptoms').select('*').gte('noted_at', sevenDaysAgo).gte('severity', 7).order('noted_at', { ascending: false }),
    supabase.from('medication_log').select('*, medications(drug)').eq('status', 'missed').gte('scheduled_for', sevenDaysAgo).order('scheduled_for', { ascending: false }),
    supabase.from('lab_results').select('*').in('flag', ['H', 'L']).order('measured_at', { ascending: false }).limit(20),
  ])

  if (glucoseErr || vitalsErr || woundsErr || symptomsErr || medsErr || labErr) {
    handleError(glucoseErr || vitalsErr || woundsErr || symptomsErr || medsErr || labErr)
  }

  const alerts: string[] = []

  for (const g of (glucoseData as Glucose[]) || []) {
    const date = new Date(g.measured_at).toLocaleDateString()
    if (g.value_mgdl > 180 && g.context !== 'post_meal') {
      alerts.push(`High glucose: ${g.value_mgdl} mg/dL on ${date}`)
    }
    if (g.value_mgdl < 70) {
      alerts.push(`Low glucose: ${g.value_mgdl} mg/dL on ${date}`)
    }
  }

  const latestVital = (vitalsData as Vital[])?.[0]
  if (latestVital) {
    const date = new Date(latestVital.measured_at).toLocaleDateString()
    if (latestVital.bp_sys !== null && (latestVital.bp_sys > 160 || latestVital.bp_sys < 90)) {
      alerts.push(`Blood pressure: ${latestVital.bp_sys}/${latestVital.bp_dia ?? '?'} mmHg on ${date}`)
    }
    if (latestVital.hr !== null && latestVital.hr > 100) {
      alerts.push(`High heart rate: ${latestVital.hr} bpm on ${date}`)
    }
    if (latestVital.spo2 !== null && latestVital.spo2 < 92) {
      alerts.push(`Low SpO2: ${latestVital.spo2}% on ${date}`)
    }
  }

  for (const w of (woundsData as Wound[]) || []) {
    if ((w.odor ?? 0) > 0 || (w.color_change ?? 0) > 0) {
      const date = new Date(w.assessed_at).toLocaleDateString()
      alerts.push(`Wound concern at ${w.site}: odor=${w.odor}, color_change=${w.color_change} on ${date}`)
    }
  }

  for (const s of (symptomsData as Symptom[]) || []) {
    const date = new Date(s.noted_at).toLocaleDateString()
    alerts.push(`Severe symptom: ${s.type || 'Unknown'} (severity ${s.severity}) on ${date}`)
  }

  for (const m of (missedMeds as any[]) || []) {
    const drug = m.medications?.drug || 'Unknown'
    const date = new Date(m.scheduled_for).toLocaleDateString()
    alerts.push(`Missed medication: ${drug} on ${date}`)
  }

  for (const l of (labData as Lab[]) || []) {
    const date = new Date(l.measured_at).toLocaleDateString()
    const direction = l.flag === 'H' ? 'High' : 'Low'
    alerts.push(`${direction} lab: ${l.test} = ${l.value} ${l.unit || ''} on ${date}`.trim())
  }

  return { alerts, count: alerts.length }
}

export async function fetchWeeklySummary(): Promise<WeeklySummaryData> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: patient, error: patientErr },
    { data: vitals, error: vitalsErr },
    { data: glucose, error: glucoseErr },
    { data: symptoms, error: symptomsErr },
    { data: wounds, error: woundsErr },
    { data: highPriority, error: highPriErr },
    { data: openActions, error: openErr },
    { data: appointments, error: apptErr },
    { data: activeMeds, error: medsErr },
    { data: allLogs, error: logsErr },
    { data: allLabs, error: labsErr },
  ] = await Promise.all([
    supabase.from('patient').select('*').eq('id', 'PT-ANON').single(),
    supabase.from('vitals').select('*').gte('measured_at', sevenDaysAgo).order('measured_at'),
    supabase.from('glucose_readings').select('*').gte('measured_at', sevenDaysAgo).order('measured_at'),
    supabase.from('symptoms').select('*').gte('noted_at', sevenDaysAgo).order('noted_at', { ascending: false }),
    supabase.from('wounds').select('*').order('assessed_at', { ascending: false }).limit(5),
    supabase.from('action_items').select('*').eq('priority', 'HIGH').neq('status', 'done').order('created_at', { ascending: false }),
    supabase.from('action_items').select('*').eq('status', 'open').order('created_at', { ascending: false }),
    supabase.from('appointments').select('*').gte('scheduled_for', today).eq('status', 'planned').order('scheduled_for').limit(5),
    supabase.from('medications').select('id').eq('active', 1),
    supabase.from('medication_log').select('med_id,status').gte('scheduled_for', sevenDaysAgo),
    supabase.from('lab_results').select('*').order('measured_at', { ascending: false }),
  ])

  if (patientErr || vitalsErr || glucoseErr || symptomsErr || woundsErr || highPriErr || openErr || apptErr || medsErr || logsErr || labsErr) {
    handleError(patientErr || vitalsErr || glucoseErr || symptomsErr || woundsErr || highPriErr || openErr || apptErr || medsErr || logsErr || labsErr)
  }

  const vArr = vitals as Vital[]
  let vitals_range: WeeklySummaryData['vitals_range'] = null
  if (vArr && vArr.length > 0) {
    const bp_sys_vals = vArr.map(v => v.bp_sys).filter((v): v is number => v !== null)
    const bp_dia_vals = vArr.map(v => v.bp_dia).filter((v): v is number => v !== null)
    const hr_vals = vArr.map(v => v.hr).filter((v): v is number => v !== null)
    const temp_vals = vArr.map(v => v.temp_c).filter((v): v is number => v !== null)
    const spo2_vals = vArr.map(v => v.spo2).filter((v): v is number => v !== null)
    vitals_range = {
      bp_sys_min: bp_sys_vals.length ? Math.min(...bp_sys_vals) : null,
      bp_sys_max: bp_sys_vals.length ? Math.max(...bp_sys_vals) : null,
      bp_dia_min: bp_dia_vals.length ? Math.min(...bp_dia_vals) : null,
      bp_dia_max: bp_dia_vals.length ? Math.max(...bp_dia_vals) : null,
      hr_min: hr_vals.length ? Math.min(...hr_vals) : null,
      hr_max: hr_vals.length ? Math.max(...hr_vals) : null,
      temp_min: temp_vals.length ? Math.min(...temp_vals) : null,
      temp_max: temp_vals.length ? Math.max(...temp_vals) : null,
      spo2_min: spo2_vals.length ? Math.min(...spo2_vals) : null,
      spo2_max: spo2_vals.length ? Math.max(...spo2_vals) : null,
    }
  }

  const gArr = glucose as Glucose[]
  let glucose_summary: WeeklySummaryData['glucose_summary'] = null
  if (gArr && gArr.length > 0) {
    const values = gArr.map(g => g.value_mgdl)
    glucose_summary = {
      min_val: Math.min(...values),
      max_val: Math.max(...values),
      avg_val: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      reading_count: values.length,
    }
  }

  const activeIds = new Set(((activeMeds as any[]) || []).map(m => m.id))
  const logs = (allLogs as any[]) || []
  const adherence = {
    taken: logs.filter(l => activeIds.has(l.med_id) && l.status === 'taken').length,
    total: logs.filter(l => activeIds.has(l.med_id)).length,
  }

  const labMap = new Map<string, Lab>()
  for (const l of (allLabs as Lab[]) || []) {
    if (!labMap.has(l.test)) labMap.set(l.test, l)
  }
  const lab_summary = Array.from(labMap.values())

  return {
    patient: patient as Patient | null,
    vitals_range,
    glucose_summary,
    adherence,
    new_symptoms: (symptoms as Symptom[]) || [],
    wound_status: (wounds as Wound[]) || [],
    lab_summary,
    high_priority_actions: (highPriority as ActionItem[]) || [],
    open_actions: (openActions as ActionItem[]) || [],
    upcoming_appointments: (appointments as Appointment[]) || [],
  }
}

export async function fetchExport(): Promise<Response> {
  const tables = [
    'patient',
    'conditions',
    'medications',
    'medication_log',
    'glucose_readings',
    'vitals',
    'lab_results',
    'symptoms',
    'wounds',
    'appointments',
    'action_items',
    'food_log',
    'good_tracking',
    'plans',
  ]

  const results = await Promise.all(
    tables.map(table => supabase.from(table).select('*'))
  )

  const errors = results.filter(r => r.error)
  if (errors.length > 0) handleError(errors[0].error)

  const data: Record<string, any[]> = {}
  tables.forEach((table, i) => {
    data[table] = results[i].data || []
  })

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  return new Response(blob, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="patient-export.json"',
    },
  })
}
