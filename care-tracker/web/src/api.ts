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

export interface VitalsRange {
  bp_sys_min: number | null; bp_sys_max: number | null;
  bp_dia_min: number | null; bp_dia_max: number | null;
  hr_min: number | null; hr_max: number | null;
  temp_min: number | null; temp_max: number | null;
  spo2_min: number | null; spo2_max: number | null;
}

export interface TrendArrow {
  direction: 'up' | 'down' | 'stable';
  change: number;
  change_pct: number;
  is_concern: boolean;
}

export interface VitalsSummary {
  latest: Vital | null;
  range_7d: VitalsRange;
  trend_bp_sys: TrendArrow | null;
  trend_bp_dia: TrendArrow | null;
  trend_hr: TrendArrow | null;
  trend_temp: TrendArrow | null;
  trend_spo2: TrendArrow | null;
}

export interface GlucoseContextBreakdown {
  context: string;
  count: number;
  avg: number;
  min: number;
  max: number;
}

export interface GlucoseSummaryExtended {
  latest: Glucose | null;
  range_7d: { min_val: number | null; max_val: number | null; avg_val: number | null; reading_count: number };
  by_context: GlucoseContextBreakdown[];
  trend: TrendArrow | null;
}

export interface MedAdherence {
  med_id: number;
  drug: string;
  taken: number;
  total: number;
  pct: number;
}

export interface MedicationSummaryExtended {
  active: Medication[];
  recently_stopped: Medication[];
  recently_added: Medication[];
  adherence_overall: { taken: number; total: number; pct: number };
  adherence_by_med: MedAdherence[];
}

export interface LabWithDelta {
  test: string;
  latest: Lab;
  previous: Lab | null;
  delta_value: number | null;
  delta_pct: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
}

export interface WoundSiteStatus {
  site: string;
  latest: Wound;
  previous: Wound | null;
  status: 'improving' | 'stable' | 'worsening' | 'new';
  days_since: number;
}

export interface ConditionGroup {
  category: string;
  items: Condition[];
}

export interface LiveSummaryData {
  patient: Patient | null;
  conditions: ConditionGroup[];
  alerts: string[];
  alert_count: number;
  vitals: VitalsSummary;
  glucose: GlucoseSummaryExtended;
  medications: MedicationSummaryExtended;
  labs: LabWithDelta[];
  wound_sites: WoundSiteStatus[];
  symptoms: Symptom[];
  appointments_upcoming: Appointment[];
  appointments_recent: Appointment[];
  actions_open: ActionItem[];
  actions_recent_done: ActionItem[];
  notes: GoodTracking[];
  last_updated: string;
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
    if (latestVital.bp_sys !== null && (latestVital.bp_sys >= 140 || latestVital.bp_sys < 90)) {
      alerts.push(`Blood pressure: ${latestVital.bp_sys}/${latestVital.bp_dia ?? '?'} mmHg on ${date}`)
    }
    if (latestVital.bp_dia !== null && latestVital.bp_dia >= 110) {
      alerts.push(`High diastolic BP: ${latestVital.bp_dia} mmHg on ${date}`)
    }
    if (latestVital.hr !== null && (latestVital.hr > 100 || latestVital.hr < 50)) {
      alerts.push(`${latestVital.hr > 100 ? 'High' : 'Low'} heart rate: ${latestVital.hr} bpm on ${date}`)
    }
    if (latestVital.spo2 !== null && latestVital.spo2 < 92) {
      alerts.push(`Low SpO2: ${latestVital.spo2}% on ${date}`)
    }
    if (latestVital.temp_c !== null && latestVital.temp_c >= 38) {
      alerts.push(`Fever: ${latestVital.temp_c}°C on ${date}`)
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

function computeRange(vals: number[]): { min: number | null; max: number | null; avg: number | null } {
  if (!vals.length) return { min: null, max: null, avg: null }
  return { min: Math.min(...vals), max: Math.max(...vals), avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }
}

function computeTrend(currentAvg: number | null, previousAvg: number | null, higherIsConcern: boolean): TrendArrow | null {
  if (currentAvg == null || previousAvg == null) return null
  const change = currentAvg - previousAvg
  const changePct = previousAvg !== 0 ? Math.round((change / previousAvg) * 100) : 0
  const direction = Math.abs(change) < 1 ? 'stable' : change > 0 ? 'up' : 'down'
  let isConcern = false
  if (higherIsConcern) isConcern = change > 5
  else isConcern = change < -5 || (change > 10 && direction === 'up')
  return { direction, change, change_pct: changePct, is_concern: isConcern }
}

function categorizeCondition(condition: Condition): string {
  const text = (condition.name + ' ' + (condition.notes || '')).toLowerCase()
  if (/heart|cardio|vascular|aneurysm|arterial|venous|bp\b|hypertension|blood pressure|anticoag|doppler|angiogram|angioplasty/i.test(text)) return 'Cardiovascular'
  if (/diabetes|glucose|hba1c|insulin|metabolic|endocrine|thyroid|cholesterol|lipid\b|ldl\b|hdl\b|triglyceride|vitamin d\b|deficiency/i.test(text)) return 'Endocrine / Metabolic'
  if (/neuro|nerve|brain|aneurysm|palsy|seizure|stroke|tia|carpal|tunnel|sciatica|facial/i.test(text)) return 'Neurological'
  if (/arthrit|joint|bone|osteo|spine|cervical|lumbar|vertebr|muscle|musculo|skeletal|fracture|scoliosis|knee|bone density/i.test(text)) return 'Musculoskeletal'
  if (/skin|rash|dermat|fungal|wound|ulcer|eczema|psoriasis|cellulitis|abscess|itch/i.test(text)) return 'Dermatological / Wound'
  if (/gerd|reflux|stomach|gastric|peptic|ulcer|constipation|bowel|colon|ibs\b|gi\b|liver|hepatic|fatty|pancreas|gall|intestinal|gut/i.test(text)) return 'Gastrointestinal'
  if (/uti\b|urinary|kidney|renal|bladder|prostate|gyne|endomet|ovar|uter|cervix|vaginal|thickened/i.test(text)) return 'Genitourinary'
  if (/eye|ophthal|retin|cataract|vision|glaucoma/i.test(text)) return 'Ophthalmology'
  if (/dental|tooth|teeth|gum|oral|caries|periodont/i.test(text)) return 'Dental / Oral'
  if (/amputation/i.test(text)) return 'Surgical / Procedure'
  return 'Other'
}

export async function fetchLiveSummary(): Promise<LiveSummaryData> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString()
  const today = now.toISOString().split('T')[0]

  const [
    { data: patient, error: patientErr },
    { data: conditions, error: condErr },
    { data: vitals, error: vitalsErr },
    { data: glucose, error: glucoseErr },
    { data: labs, error: labsErr },
    { data: wounds, error: woundsErr },
    { data: symptoms, error: symptomsErr },
    { data: appointments, error: apptErr },
    { data: actions, error: actionsErr },
    { data: medications, error: medsErr },
    { data: medLogs, error: logsErr },
    { data: notes, error: notesErr },
  ] = await Promise.all([
    supabase.from('patient').select('*').eq('id', 'PT-ANON').single(),
    supabase.from('conditions').select('*').eq('active', 1).order('code'),
    supabase.from('vitals').select('*').gte('measured_at', fourteenDaysAgo).order('measured_at', { ascending: false }),
    supabase.from('glucose_readings').select('*').gte('measured_at', fourteenDaysAgo).order('measured_at', { ascending: false }),
    supabase.from('lab_results').select('*').order('measured_at', { ascending: false }),
    supabase.from('wounds').select('*').order('assessed_at', { ascending: false }),
    supabase.from('symptoms').select('*').gte('noted_at', sevenDaysAgo).order('noted_at', { ascending: false }),
    supabase.from('appointments').select('*').order('scheduled_for', { ascending: false }),
    supabase.from('action_items').select('*').order('created_at', { ascending: false }),
    supabase.from('medications').select('*').order('drug'),
    supabase.from('medication_log').select('*').gte('scheduled_for', sevenDaysAgo),
    supabase.from('good_tracking').select('*').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }),
  ])

  if (patientErr || condErr || vitalsErr || glucoseErr || labsErr || woundsErr || symptomsErr || apptErr || actionsErr || medsErr || logsErr || notesErr) {
    handleError(patientErr || condErr || vitalsErr || glucoseErr || labsErr || woundsErr || symptomsErr || apptErr || actionsErr || medsErr || logsErr || notesErr)
  }

  const allVitals = (vitals as Vital[]) || []
  const weekVitals = allVitals.filter(v => v.measured_at >= sevenDaysAgo)
  const prevVitals = allVitals.filter(v => v.measured_at < sevenDaysAgo)
  const latestVital = weekVitals.length > 0 ? weekVitals[0] : (allVitals.length > 0 ? allVitals[0] : null)

  function vitalsRange(arr: Vital[]): VitalsRange {
    const s = (v: number | null): v is number => v !== null
    const sys = arr.map(v => v.bp_sys).filter(s); const dia = arr.map(v => v.bp_dia).filter(s)
    const hr = arr.map(v => v.hr).filter(s); const temp = arr.map(v => v.temp_c).filter(s)
    const spo2 = arr.map(v => v.spo2).filter(s)
    return {
      bp_sys_min: sys.length ? Math.min(...sys) : null, bp_sys_max: sys.length ? Math.max(...sys) : null,
      bp_dia_min: dia.length ? Math.min(...dia) : null, bp_dia_max: dia.length ? Math.max(...dia) : null,
      hr_min: hr.length ? Math.min(...hr) : null, hr_max: hr.length ? Math.max(...hr) : null,
      temp_min: temp.length ? Math.min(...temp) : null, temp_max: temp.length ? Math.max(...temp) : null,
      spo2_min: spo2.length ? Math.min(...spo2) : null, spo2_max: spo2.length ? Math.max(...spo2) : null,
    }
  }

  const vr = vitalsRange(weekVitals)
  const prv = vitalsRange(prevVitals)
  const cwS = weekVitals.map(v => v.bp_sys).filter((v): v is number => v !== null)
  const cwD = weekVitals.map(v => v.bp_dia).filter((v): v is number => v !== null)
  const cwH = weekVitals.map(v => v.hr).filter((v): v is number => v !== null)
  const cwT = weekVitals.map(v => v.temp_c).filter((v): v is number => v !== null)
  const cwO = weekVitals.map(v => v.spo2).filter((v): v is number => v !== null)
  const pwS = prevVitals.map(v => v.bp_sys).filter((v): v is number => v !== null)
  const pwD = prevVitals.map(v => v.bp_dia).filter((v): v is number => v !== null)
  const pwH = prevVitals.map(v => v.hr).filter((v): v is number => v !== null)
  const pwT = prevVitals.map(v => v.temp_c).filter((v): v is number => v !== null)
  const pwO = prevVitals.map(v => v.spo2).filter((v): v is number => v !== null)

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const vitals_summary: VitalsSummary = {
    latest: latestVital,
    range_7d: vr,
    trend_bp_sys: computeTrend(avg(cwS), avg(pwS), true),
    trend_bp_dia: computeTrend(avg(cwD), avg(pwD), true),
    trend_hr: computeTrend(avg(cwH), avg(pwH), true),
    trend_temp: computeTrend(avg(cwT), avg(pwT), true),
    trend_spo2: computeTrend(avg(cwO), avg(pwO), false),
  }

  const allGlucose = (glucose as Glucose[]) || []
  const weekGlucose = allGlucose.filter(g => g.measured_at >= sevenDaysAgo)
  const prevGlucose = allGlucose.filter(g => g.measured_at < sevenDaysAgo)
  const latestGlucose = weekGlucose.length > 0 ? weekGlucose[0] : (allGlucose.length > 0 ? allGlucose[0] : null)

  let glucoseRange = { min_val: null as number | null, max_val: null as number | null, avg_val: null as number | null, reading_count: 0 }
  const ctxMap = new Map<string, number[]>()
  if (weekGlucose.length > 0) {
    const vals = weekGlucose.map(g => g.value_mgdl)
    glucoseRange = { min_val: Math.min(...vals), max_val: Math.max(...vals), avg_val: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), reading_count: vals.length }
    for (const g of weekGlucose) {
      const c = g.context || 'unknown'
      if (!ctxMap.has(c)) ctxMap.set(c, [])
      ctxMap.get(c)!.push(g.value_mgdl)
    }
  }
  const byContext: GlucoseContextBreakdown[] = Array.from(ctxMap.entries()).map(([context, vals]) => {
    const r = computeRange(vals)
    return { context, count: vals.length, avg: r.avg ?? 0, min: r.min ?? 0, max: r.max ?? 0 }
  })

  const prevGlucoseVals = prevGlucose.map(g => g.value_mgdl)
  const glucose_summary: GlucoseSummaryExtended = {
    latest: latestGlucose,
    range_7d: glucoseRange,
    by_context: byContext.sort((a, b) => b.count - a.count),
    trend: computeTrend(glucoseRange.avg_val, avg(prevGlucoseVals), true),
  }

  const allMeds = (medications as Medication[]) || []
  const activeMeds = allMeds.filter(m => m.active === 1)
  const stoppedMeds = allMeds.filter(m => m.active === 0)
  const recentlyAdded = activeMeds.filter(m => m.start_date && m.start_date >= fourteenDaysAgo)
  const recentlyStopped = stoppedMeds.filter(m => m.stop_date && m.stop_date >= fourteenDaysAgo)

  const logs = (medLogs as MedicationLog[]) || []
  const activeMedIds = new Set(activeMeds.map(m => m.id))
  const activeLogs = logs.filter(l => activeMedIds.has(l.med_id))
  const takenCount = activeLogs.filter(l => l.status === 'taken').length
  const totalCount = activeLogs.length

  const byMed = new Map<number, { taken: number; total: number }>()
  for (const l of activeLogs) {
    if (!byMed.has(l.med_id)) byMed.set(l.med_id, { taken: 0, total: 0 })
    const entry = byMed.get(l.med_id)!
    entry.total++
    if (l.status === 'taken') entry.taken++
  }
  const adherenceByMed: MedAdherence[] = activeMeds.map(m => {
    const stats = byMed.get(m.id) || { taken: 0, total: 0 }
    return { med_id: m.id, drug: m.drug, taken: stats.taken, total: stats.total, pct: stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0 }
  })

  const medications_summary: MedicationSummaryExtended = {
    active: activeMeds,
    recently_stopped: recentlyStopped,
    recently_added: recentlyAdded,
    adherence_overall: { taken: takenCount, total: totalCount, pct: totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0 },
    adherence_by_med: adherenceByMed.sort((a, b) => a.pct - b.pct),
  }

  const allLabs = (labs as Lab[]) || []
  const labByTest = new Map<string, Lab[]>()
  for (const l of allLabs) {
    if (!labByTest.has(l.test)) labByTest.set(l.test, [])
    labByTest.get(l.test)!.push(l)
  }
  const labItems: LabWithDelta[] = []
  for (const [test, entries] of labByTest) {
    const latest = entries[0]
    const previous = entries.length > 1 ? entries[1] : null
    let deltaValue: number | null = null
    let deltaPct: number | null = null
    let trend: LabWithDelta['trend'] = 'new'
    if (previous && latest.value != null && previous.value != null) {
      deltaValue = latest.value - previous.value
      deltaPct = previous.value !== 0 ? Math.round((deltaValue / Math.abs(previous.value)) * 100) : null
      trend = Math.abs(deltaValue) < 0.01 ? 'stable' : deltaValue > 0 ? 'up' : 'down'
    }
    labItems.push({ test, latest, previous, delta_value: deltaValue, delta_pct: deltaPct, trend })
  }

  const allWounds = (wounds as Wound[]) || []
  const woundBySite = new Map<string, Wound[]>()
  for (const w of allWounds) {
    if (!woundBySite.has(w.site)) woundBySite.set(w.site, [])
    woundBySite.get(w.site)!.push(w)
  }
  const woundSites: WoundSiteStatus[] = Array.from(woundBySite.entries()).map(([site, entries]) => {
    const latest = entries[0]
    const previous = entries.length > 1 ? entries[1] : null
    let status: WoundSiteStatus['status'] = 'new'
    if (previous) {
      const odorImproved = (latest.odor ?? 0) < (previous.odor ?? 0)
      const colorImproved = (latest.color_change ?? 0) < (previous.color_change ?? 0)
      const odorWorse = (latest.odor ?? 0) > (previous.odor ?? 0)
      const colorWorse = (latest.color_change ?? 0) > (previous.color_change ?? 0)
      if (odorImproved || colorImproved) status = 'improving'
      else if (odorWorse || colorWorse) status = 'worsening'
      else status = 'stable'
    }
    const daysSince = Math.round((now.getTime() - new Date(latest.assessed_at).getTime()) / 86400000)
    return { site, latest, previous, status, days_since: daysSince }
  })

  const allAppointments = (appointments as Appointment[]) || []
  const apptsUpcoming = allAppointments.filter(a => a.status === 'planned' && a.scheduled_for >= today).slice(0, 8)
  const apptsRecent = allAppointments.filter(a => a.status === 'done').slice(0, 8)

  const allActions = (actions as ActionItem[]) || []
  const actionsOpen = allActions.filter(a => a.status === 'open')
  const actionsDone = allActions.filter(a => a.status === 'done').slice(0, 8)

  const conds = (conditions as Condition[]) || []
  const groupMap = new Map<string, Condition[]>()
  for (const c of conds) {
    const cat = categorizeCondition(c)
    if (!groupMap.has(cat)) groupMap.set(cat, [])
    groupMap.get(cat)!.push(c)
  }
  const conditionGroups: ConditionGroup[] = Array.from(groupMap.entries()).map(([category, items]) => ({ category, items }))

  const alerts: string[] = []
  const fmt = (d: string) => new Date(d).toLocaleDateString()
  for (const g of weekGlucose) {
    const date = fmt(g.measured_at)
    if (g.value_mgdl > 180 && g.context !== 'post_meal') alerts.push(`High glucose: ${g.value_mgdl} mg/dL on ${date}`)
    if (g.value_mgdl < 70) alerts.push(`Low glucose: ${g.value_mgdl} mg/dL on ${date}`)
  }
  if (latestVital) {
    const date = fmt(latestVital.measured_at)
    if (latestVital.bp_sys !== null && (latestVital.bp_sys >= 140 || latestVital.bp_sys < 90)) alerts.push(`Blood pressure: ${latestVital.bp_sys}/${latestVital.bp_dia ?? '?'} mmHg on ${date}`)
    if (latestVital.bp_dia !== null && latestVital.bp_dia >= 110) alerts.push(`High diastolic BP: ${latestVital.bp_dia} mmHg on ${date}`)
    if (latestVital.hr !== null && (latestVital.hr > 100 || latestVital.hr < 50)) alerts.push(`${latestVital.hr > 100 ? 'High' : 'Low'} heart rate: ${latestVital.hr} bpm on ${date}`)
    if (latestVital.spo2 !== null && latestVital.spo2 < 92) alerts.push(`Low SpO2: ${latestVital.spo2}% on ${date}`)
    if (latestVital.temp_c !== null && latestVital.temp_c >= 38) alerts.push(`Fever: ${latestVital.temp_c}°C on ${date}`)
  }
  for (const w of woundSites) {
    if ((w.latest.odor ?? 0) > 0 || (w.latest.color_change ?? 0) > 0) {
      alerts.push(`Wound concern at ${w.site}: signs of infection on ${fmt(w.latest.assessed_at)}`)
    }
  }
  for (const s of (symptoms as Symptom[]) || []) {
    if ((s.severity ?? 0) >= 7) alerts.push(`Severe symptom: ${s.type || 'Unknown'} (severity ${s.severity}) on ${fmt(s.noted_at)}`)
  }
  for (const l of activeLogs) {
    if (l.status === 'missed') {
      const drug = activeMeds.find(m => m.id === l.med_id)?.drug || 'Unknown'
      alerts.push(`Missed medication: ${drug} on ${fmt(l.scheduled_for)}`)
    }
  }
  for (const l of allLabs.slice(0, 30)) {
    const f = l.flag
    if (f === 'H' || f === 'L') {
      const sevenDaysMs = 7 * 86400000
      if (now.getTime() - new Date(l.measured_at).getTime() < sevenDaysMs) {
        alerts.push(`${f === 'H' ? 'High' : 'Low'} lab: ${l.test} = ${l.value} ${l.unit || ''} on ${fmt(l.measured_at)}`)
      }
    }
  }

  return {
    patient: patient as Patient | null,
    conditions: conditionGroups,
    alerts,
    alert_count: alerts.length,
    vitals: vitals_summary,
    glucose: glucose_summary,
    medications: medications_summary,
    labs: labItems,
    wound_sites: woundSites,
    symptoms: (symptoms as Symptom[]) || [],
    appointments_upcoming: apptsUpcoming,
    appointments_recent: apptsRecent,
    actions_open: actionsOpen,
    actions_recent_done: actionsDone,
    notes: (notes as GoodTracking[]) || [],
    last_updated: now.toISOString(),
  }
}

export function subscribeToSummary(onChange: () => void): () => void {
  const tables = ['vitals', 'glucose_readings', 'lab_results', 'medications', 'medication_log', 'symptoms', 'wounds', 'appointments', 'action_items', 'good_tracking', 'conditions', 'patient']
  const channel = supabase.channel('summary-live')
  let timer: ReturnType<typeof setTimeout> | null = null

  for (const table of tables) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(onChange, 2500)
    })
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') console.log('[summary] live updates active')
    if (status === 'CHANNEL_ERROR') console.error('[summary] realtime error')
  })

  return () => {
    if (timer) clearTimeout(timer)
    supabase.removeChannel(channel)
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
