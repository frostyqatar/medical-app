import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Heart, Thermometer, Waves, Scale } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchVitals, fetchLatestVitals, createVital } from '@/api'
import type { Vital } from '@/api'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function vitalColor(type: string, value: number | null): string {
  if (value == null) return ''
  if (type === 'bp_sys') {
    if (value >= 180 || value < 90) return 'text-red-500'
    if (value >= 140) return 'text-amber-500'
    return ''
  }
  if (type === 'bp_dia') {
    if (value >= 110) return 'text-red-500'
    if (value >= 90) return 'text-amber-500'
    return ''
  }
  if (type === 'hr') {
    if (value < 50 || value > 110) return 'text-red-500'
    if (value > 100) return 'text-amber-500'
    return ''
  }
  if (type === 'temp_c') {
    if (value >= 38) return 'text-red-500'
    if (value >= 37.5) return 'text-amber-500'
    return ''
  }
  if (type === 'spo2') {
    if (value < 92) return 'text-red-500'
    if (value <= 94) return 'text-amber-500'
    return ''
  }
  return ''
}

export default function VitalsMobile() {
  const [vitals, setVitals] = useState<Vital[] | null>(null)
  const [latest, setLatest] = useState<Vital | null | undefined>(undefined)
  const [range, setRange] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ bp_sys: '', bp_dia: '', hr: '', temp_c: '', spo2: '', weight_kg: '', notes: '' })

  const load = useCallback(async (days: number) => {
    setVitals(null)
    try { setVitals(await fetchVitals(days)); setError(null) } catch { setError('Failed to load') }
  }, [])

  useEffect(() => { load(range) }, [range, load])
  useEffect(() => { fetchLatestVitals().then(v => setLatest(v ?? null)).catch(() => {}) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createVital({
        measured_at: new Date().toISOString(),
        bp_sys: form.bp_sys ? Number(form.bp_sys) : undefined,
        bp_dia: form.bp_dia ? Number(form.bp_dia) : undefined,
        hr: form.hr ? Number(form.hr) : undefined,
        temp_c: form.temp_c ? Number(form.temp_c) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        notes: form.notes || undefined,
      })
      setForm({ bp_sys: '', bp_dia: '', hr: '', temp_c: '', spo2: '', weight_kg: '', notes: '' })
      load(range)
      fetchLatestVitals().then(v => setLatest(v ?? null)).catch(() => {})
    } catch { setError('Failed to record') } finally { setSubmitting(false) }
  }

  const chartData = vitals ? [...vitals].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()).map(v => ({
    date: formatDate(v.measured_at), bp_sys: v.bp_sys, bp_dia: v.bp_dia, hr: v.hr, temp_c: v.temp_c, spo2: v.spo2, weight_kg: v.weight_kg,
  })) : []

  const hasBp = vitals?.some(v => v.bp_sys != null || v.bp_dia != null)
  const hasHr = vitals?.some(v => v.hr != null)
  const hasTemp = vitals?.some(v => v.temp_c != null)
  const hasSpo2 = vitals?.some(v => v.spo2 != null)
  const hasWeight = vitals?.some(v => v.weight_kg != null)

  const CHART_H = 180

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vitals</h1>

      <Card className="rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-base">Record Vitals</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Systolic BP</Label><Input type="number" inputMode="numeric" placeholder="120" value={form.bp_sys} onChange={e => setForm(f => ({ ...f, bp_sys: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Diastolic BP</Label><Input type="number" inputMode="numeric" placeholder="80" value={form.bp_dia} onChange={e => setForm(f => ({ ...f, bp_dia: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Heart Rate</Label><Input type="number" inputMode="numeric" placeholder="72" value={form.hr} onChange={e => setForm(f => ({ ...f, hr: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Temp (&deg;C)</Label><Input type="number" inputMode="decimal" step="0.1" placeholder="36.6" value={form.temp_c} onChange={e => setForm(f => ({ ...f, temp_c: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">SpO&sup2; (%)</Label><Input type="number" inputMode="numeric" placeholder="98" value={form.spo2} onChange={e => setForm(f => ({ ...f, spo2: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Weight (kg)</Label><Input type="number" inputMode="decimal" step="0.1" placeholder="70" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} /></div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full min-h-[44px]">{submitting ? 'Recording...' : 'Record Vitals'}</Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {latest && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Latest &mdash; {formatDateTime(latest.measured_at)}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div><p className="text-[11px] text-muted-foreground">BP</p><p className={`text-lg font-bold ${vitalColor('bp_sys', latest.bp_sys)}`}>{latest.bp_sys != null ? latest.bp_sys : 'N/A'}/{latest.bp_dia != null ? latest.bp_dia : 'N/A'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">HR</p><p className={`text-lg font-bold ${vitalColor('hr', latest.hr)}`}>{latest.hr != null ? `${latest.hr} bpm` : 'N/A'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Temp</p><p className={`text-lg font-bold ${vitalColor('temp_c', latest.temp_c)}`}>{latest.temp_c != null ? `${latest.temp_c}°C` : 'N/A'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">SpO&sup2;</p><p className={`text-lg font-bold ${vitalColor('spo2', latest.spo2)}`}>{latest.spo2 != null ? `${latest.spo2}%` : 'N/A'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Weight</p><p className="text-lg font-bold">{latest.weight_kg != null ? `${latest.weight_kg} kg` : 'N/A'}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={String(range)} onValueChange={v => setRange(Number(v))}>
        <TabsList className="w-full justify-start">
          {[{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }].map(r => (
            <TabsTrigger key={r.value} value={String(r.value)} className="min-h-[44px] flex-1">{r.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {vitals === null ? (
        <Skeleton className="h-[200px] w-full rounded-xl" />
      ) : vitals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No vitals recorded.</p>
      ) : (
        <div className="space-y-3">
          {hasBp && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Blood Pressure</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={35} /><Tooltip />
                  <Line type="monotone" dataKey="bp_sys" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="bp_dia" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasHr && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Heart className="h-3.5 w-3.5" />Heart Rate</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={35} /><Tooltip /><Line type="monotone" dataKey="hr" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls /></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasTemp && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" />Temperature</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={35} domain={['auto', 'auto']} /><Tooltip /><Line type="monotone" dataKey="temp_c" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls /></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasSpo2 && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Waves className="h-3.5 w-3.5" />SpO&sup2;</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={35} domain={[80, 100]} /><Tooltip /><Line type="monotone" dataKey="spo2" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls /></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasWeight && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Scale className="h-3.5 w-3.5" />Weight</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={35} domain={['auto', 'auto']} /><Tooltip /><Line type="monotone" dataKey="weight_kg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls /></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  )
}
