import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Activity, Heart, Thermometer, Waves, Scale, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { fetchVitals, fetchLatestVitals, createVital, deleteVital, updateVital } from '@/api'
import type { Vital } from '@/api'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function toDatetimeLocal(ts: string): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
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

const EMPTY_FORM = { bp_sys: '', bp_dia: '', hr: '', temp_c: '', spo2: '', weight_kg: '', notes: '' }

export default function VitalsMobile() {
  const [vitals, setVitals] = useState<Vital[] | null>(null)
  const [latest, setLatest] = useState<Vital | null | undefined>(undefined)
  const [range, setRange] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<Vital | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  const load = useCallback(async (days: number) => {
    setVitals(null)
    try { setVitals(await fetchVitals(days)); setError(null) } catch { setError('Failed to load') }
  }, [])

  useEffect(() => { load(range) }, [range, load])
  useEffect(() => { fetchLatestVitals().then(v => setLatest(v ?? null)).catch(() => {}) }, [])

  function loadAll() { load(range); fetchLatestVitals().then(v => setLatest(v ?? null)).catch(() => {}) }

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
      setForm(EMPTY_FORM)
      loadAll()
    } catch { setError('Failed to record') } finally { setSubmitting(false) }
  }

  function openEdit(v: Vital) {
    setEditing(v)
    setEditForm({
      bp_sys: v.bp_sys != null ? String(v.bp_sys) : '',
      bp_dia: v.bp_dia != null ? String(v.bp_dia) : '',
      hr: v.hr != null ? String(v.hr) : '',
      temp_c: v.temp_c != null ? String(v.temp_c) : '',
      spo2: v.spo2 != null ? String(v.spo2) : '',
      weight_kg: v.weight_kg != null ? String(v.weight_kg) : '',
      notes: v.notes || '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSubmitting(true)
    try {
      await updateVital(editing.id, {
        bp_sys: editForm.bp_sys ? Number(editForm.bp_sys) : null as any,
        bp_dia: editForm.bp_dia ? Number(editForm.bp_dia) : null as any,
        hr: editForm.hr ? Number(editForm.hr) : null as any,
        temp_c: editForm.temp_c ? Number(editForm.temp_c) : null as any,
        spo2: editForm.spo2 ? Number(editForm.spo2) : null as any,
        weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null as any,
        notes: editForm.notes || null as any,
      })
      setEditing(null)
      loadAll()
    } catch { setError('Failed to update') } finally { setSubmitting(false) }
  }

  async function handleDelete(id: number) { await deleteVital(id); loadAll() }

  const sorted = vitals ? [...vitals].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()) : []
  const chartData = vitals ? [...vitals].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()).map(v => ({
    date: formatDate(v.measured_at), bp_sys: v.bp_sys, bp_dia: v.bp_dia, hr: v.hr, temp_c: v.temp_c, spo2: v.spo2, weight_kg: v.weight_kg,
  })) : []

  const hasBp = vitals?.some(v => v.bp_sys != null || v.bp_dia != null)
  const hasHr = vitals?.some(v => v.hr != null)
  const hasTemp = vitals?.some(v => v.temp_c != null)
  const hasSpo2 = vitals?.some(v => v.spo2 != null)
  const hasWeight = vitals?.some(v => v.weight_kg != null)

  const CHART_H = 200
  const [chartsOpen, setChartsOpen] = useState(true)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2.5 text-xs space-y-1">
        <p className="font-medium text-muted-foreground">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{p.value}{p.dataKey === 'temp_c' ? '°C' : p.dataKey === 'spo2' ? '%' : p.dataKey === 'hr' ? ' bpm' : p.dataKey === 'weight_kg' ? ' kg' : ' mmHg'}</span>
          </div>
        ))}
      </div>
    )
  }

  const gradientDefs = (
    <defs>
      <linearGradient id="gradSys" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} /></linearGradient>
      <linearGradient id="gradDia" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} /><stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.02} /></linearGradient>
      <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient>
      <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.2} /><stop offset="100%" stopColor="#f97316" stopOpacity={0.02} /></linearGradient>
      <linearGradient id="gradSpo2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
      <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient>
    </defs>
  )

  const sharedChartProps = { margin: { top: 5, right: 5, left: -10, bottom: 0 } }

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
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Any notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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
          <button
            onClick={() => setChartsOpen(o => !o)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider px-1"
          >
            Trends
            {chartsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {chartsOpen && (
            <>
          {hasBp && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Blood Pressure (mmHg)</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <LineChart data={chartData} {...sharedChartProps}>
                  {gradientDefs}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                  <Area type="monotone" dataKey="bp_sys" fill="url(#gradSys)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls name="Systolic" />
                  <Line type="monotone" dataKey="bp_dia" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} connectNulls name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasHr && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" />Heart Rate (bpm)</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <AreaChart data={chartData} {...sharedChartProps}>
                  {gradientDefs}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={100} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                  <Area type="monotone" dataKey="hr" fill="url(#gradHr)" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls name="HR" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasTemp && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" />Temperature (°C)</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <AreaChart data={chartData} {...sharedChartProps}>
                  {gradientDefs}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine y={37.5} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                  <Area type="monotone" dataKey="temp_c" fill="url(#gradTemp)" stroke="#f97316" strokeWidth={2} dot={false} connectNulls name="Temp" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasSpo2 && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Waves className="h-3.5 w-3.5" />SpO₂ (%)</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <AreaChart data={chartData} {...sharedChartProps}>
                  {gradientDefs}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} domain={[80, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={92} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine y={95} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                  <Area type="monotone" dataKey="spo2" fill="url(#gradSpo2)" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls name="SpO₂" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          {hasWeight && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Scale className="h-3.5 w-3.5" />Weight (kg)</p>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <AreaChart data={chartData} {...sharedChartProps}>
                  {gradientDefs}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="weight_kg" fill="url(#gradWeight)" stroke="#8b5cf6" strokeWidth={2} dot={false} connectNulls name="Weight" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
            </>
          )}

          {/* Scrollable history list */}
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mt-2">History</h3>
          <div className="space-y-2">
            {sorted.map(v => (
              <Card key={v.id} className="rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(v.measured_at)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(v)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
                    <div><span className="text-muted-foreground">BP </span><span className={`font-medium ${vitalColor('bp_sys', v.bp_sys)}`}>{v.bp_sys != null ? `${v.bp_sys}/${v.bp_dia ?? '—'}` : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">HR </span><span className={`font-medium ${vitalColor('hr', v.hr)}`}>{v.hr != null ? v.hr : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Temp </span><span className={`font-medium ${vitalColor('temp_c', v.temp_c)}`}>{v.temp_c != null ? `${v.temp_c}°` : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">SpO₂ </span><span className={`font-medium ${vitalColor('spo2', v.spo2)}`}>{v.spo2 != null ? `${v.spo2}%` : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Wt </span><span className="font-medium">{v.weight_kg != null ? `${v.weight_kg}kg` : 'N/A'}</span></div>
                  </div>
                  {v.notes && <p className="text-[11px] text-muted-foreground mt-1.5 italic line-clamp-1">{v.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={o => { if (!o) setEditing(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vitals</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-3">
              <p className="text-xs text-muted-foreground">{formatDateTime(editing.measured_at)}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Systolic BP</Label><Input type="number" inputMode="numeric" value={editForm.bp_sys} onChange={e => setEditForm(f => ({ ...f, bp_sys: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Diastolic BP</Label><Input type="number" inputMode="numeric" value={editForm.bp_dia} onChange={e => setEditForm(f => ({ ...f, bp_dia: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Heart Rate</Label><Input type="number" inputMode="numeric" value={editForm.hr} onChange={e => setEditForm(f => ({ ...f, hr: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Temp (&deg;C)</Label><Input type="number" inputMode="decimal" step="0.1" value={editForm.temp_c} onChange={e => setEditForm(f => ({ ...f, temp_c: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">SpO&sup2; (%)</Label><Input type="number" inputMode="numeric" value={editForm.spo2} onChange={e => setEditForm(f => ({ ...f, spo2: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Weight (kg)</Label><Input type="number" inputMode="decimal" step="0.1" value={editForm.weight_kg} onChange={e => setEditForm(f => ({ ...f, weight_kg: e.target.value }))} /></div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" className="min-h-[44px]" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
