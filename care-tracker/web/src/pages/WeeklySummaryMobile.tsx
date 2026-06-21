import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FileText, Printer, Activity, Droplet, Pill, AlertTriangle, CalendarClock } from 'lucide-react'
import { fetchWeeklySummary } from '@/api'
import type { WeeklySummaryData } from '@/api'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function sevLabel(s: number) { if (s <= 3) return 'mild'; if (s <= 6) return 'moderate'; return 'severe' }
function sevVar(s: number) { if (s <= 3) return 'secondary' as const; if (s <= 6) return 'default' as const; return 'destructive' as const }

export default function WeeklySummaryMobile() {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchWeeklySummary().then(setSummary).catch(e => setError(e instanceof Error ? e.message : 'Failed')) }, [])

  if (error) return <div className="space-y-4"><h1 className="text-xl font-semibold">Summary</h1><p className="text-destructive">{error}</p></div>
  const loading = !summary

  const p = summary?.patient ?? null
  const vr = summary?.vitals_range ?? null
  const gs = summary?.glucose_summary ?? null
  const adh = summary?.adherence ?? null
  const sym = summary?.new_symptoms ?? []
  const wnd = summary?.wound_status ?? []
  const labs = summary?.lab_summary ?? []
  const hiAct = summary?.high_priority_actions?.filter(a => a.status === 'open') ?? []
  const openAct = summary?.open_actions ?? []
  const appts = summary?.upcoming_appointments ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Summary</h1>
        <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
      </div>

      {/* Patient */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Patient</CardTitle></CardHeader>
        <CardContent>
          {loading ? <><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></>
            : <div className="text-sm space-y-1">
              <span className="font-medium">{p?.id ?? 'PT-ANON'}</span>
              {p?.age != null && <span className="text-muted-foreground ml-3">Age: {p.age}</span>}
              {p?.sex && <span className="text-muted-foreground ml-3">Sex: {p.sex}</span>}
              {p?.mobility_note && <Badge variant="outline" className="ml-2">{p.mobility_note}</Badge>}
              </div>}
        </CardContent>
      </Card>

      {/* Vitals */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Vitals (7d)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[11px] text-muted-foreground">BP</p><p className="font-semibold">{vr?.bp_sys_min != null ? `${vr.bp_sys_min}/${vr.bp_dia_min}–${vr.bp_sys_max}/${vr.bp_dia_max}` : '—'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">HR</p><p className="font-semibold">{vr?.hr_min != null ? `${vr.hr_min}–${vr.hr_max}` : '—'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Temp</p><p className="font-semibold">{vr?.temp_min != null ? `${vr.temp_min}–${vr.temp_max}&deg;C` : '—'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">SpO&sup2;</p><p className="font-semibold">{vr?.spo2_min != null ? `${vr.spo2_min}–${vr.spo2_max}%` : '—'}</p></div>
            </div>}
        </CardContent>
      </Card>

      {/* Glucose */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Droplet className="h-3.5 w-3.5" />Glucose</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[11px] text-muted-foreground">Min</p><p className="font-semibold">{gs?.min_val ?? '—'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Max</p><p className="font-semibold">{gs?.max_val ?? '—'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Avg</p><p className="font-semibold">{gs?.avg_val != null ? gs.avg_val.toFixed(1) : '—'}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Readings</p><p className="font-semibold">{gs?.reading_count ?? 0}</p></div>
            </div>}
        </CardContent>
      </Card>

      {/* Adherence */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Pill className="h-3.5 w-3.5" />Medication Adherence</CardTitle></CardHeader>
        <CardContent>
          {loading ? <><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-2 w-full" /></>
            : <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><span>{adh && adh.total > 0 ? `${((adh.taken / adh.total) * 100).toFixed(0)}%` : '—'}</span><span className="text-xs text-muted-foreground">{adh?.taken ?? 0}/{adh?.total ?? 0}</span></div>
              <Progress value={adh && adh.total > 0 ? (adh.taken / adh.total) * 100 : 0} className="h-2.5" />
            </div>}
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">New Symptoms</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20 w-full" /> : sym.length === 0 ? <p className="text-sm text-muted-foreground">None reported.</p> : (
            <div className="space-y-2">
              {sym.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <Badge variant={sevVar(s.severity ?? 0)} className="text-[10px]">{sevLabel(s.severity ?? 0)}</Badge>
                  <span className="text-sm">{s.type}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{formatDate(s.noted_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wounds */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Wound Status</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16 w-full" /> : wnd.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
            <div className="space-y-2">
              {wnd.map(w => (
                <div key={w.id} className="border rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">{w.site}</span>{(w.odor || w.color_change) && <Badge variant="destructive" className="text-[10px]">!</Badge>}<span className="text-[11px] text-muted-foreground ml-auto">{formatDate(w.assessed_at)}</span></div>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2">{w.size_note && <span>Size: {w.size_note}</span>}{w.discharge && <span>Discharge: {w.discharge}</span>}{w.appearance && <span>Bed: {w.appearance}</span>}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labs */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Lab Changes</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20 w-full" /> : labs.length === 0 ? <p className="text-sm text-muted-foreground">No recent results.</p> : (
            <div className="space-y-2">
              {labs.map(l => (
                <div key={l.id} className="flex items-center gap-2">
                  {(l.flag === 'H' || l.flag === 'L') && <Badge variant="destructive" className="text-[10px]">!</Badge>}
                  <div className="flex-1 min-w-0"><span className="text-sm font-medium">{l.test}</span><span className="text-xs text-muted-foreground ml-2">{l.value}{l.unit ? ` ${l.unit}` : ''}</span></div>
                  <span className="text-[11px] text-muted-foreground">{formatDate(l.measured_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HIGH Actions */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-destructive" />Open HIGH Actions</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16 w-full" /> : hiAct.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
            <div className="space-y-2">{hiAct.map(i => <div key={i.id} className="flex items-start gap-2"><Badge variant="destructive" className="text-[10px] shrink-0">HIGH</Badge><span className="text-sm">{i.item}</span></div>)}</div>
          )}
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />Appointments</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16 w-full" /> : appts.length === 0 ? <p className="text-sm text-muted-foreground">None upcoming.</p> : (
            <div className="space-y-2">{appts.slice(0, 5).map(a => <div key={a.id} className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{a.specialty || 'Appt'}</Badge><span className="text-xs text-muted-foreground">{formatDateTime(a.scheduled_for)}</span></div>)}</div>
          )}
        </CardContent>
      </Card>

      {/* Open Actions */}
      <Card className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">All Open Actions</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16 w-full" /> : openAct.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
            <div className="space-y-2">{openAct.map(i => <div key={i.id} className="flex items-start gap-2"><Badge variant="outline" className="text-[10px] shrink-0">{i.priority}</Badge><span className="text-sm">{i.item}</span></div>)}</div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-[11px] text-muted-foreground text-center pb-5">Weekly Summary</p>
    </div>
  )
}
