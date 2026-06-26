import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Activity, Droplet, Pill, AlertTriangle, CalendarClock,
  TrendingUp, TrendingDown, Minus, WifiOff, RefreshCw, Printer,
  CheckCircle2, Stethoscope, ClipboardList, NotebookPen, Syringe, Zap,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import { fetchLiveSummary, subscribeToSummary } from '@/api'
import type { LiveSummaryData, TrendArrow as TrendArrowType } from '@/api'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

function TrendIcon({ trend }: { trend: TrendArrowType | null }) {
  if (!trend) return <span className="text-[10px] text-muted-foreground">—</span>
  const { direction, change, change_pct, is_concern } = trend
  const cls = is_concern ? 'text-destructive' : direction === 'stable' ? 'text-muted-foreground' : 'text-emerald-600'
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {direction !== 'stable' && <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>}
    </span>
  )
}

function CollapsibleSection({ title, icon: Icon, badge, defaultOpen, children }: {
  title: string; icon: React.ComponentType<{ className?: string }>; badge?: number; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <Card className="rounded-xl">
      <button className="w-full" onClick={() => setOpen(!open)}>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {title}
            {badge != null && badge > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{badge}</Badge>}
          </CardTitle>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  )
}

export default function WeeklySummaryMobile() {
  const [summary, setSummary] = useState<LiveSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(true)

  const load = useCallback(() => {
    fetchLiveSummary().then(setSummary).catch(err => setError(err instanceof Error ? err.message : 'Failed'))
  }, [])

  useEffect(() => {
    load()
    const unsub = subscribeToSummary(() => { setLive(true); load() })
    return unsub
  }, [load])

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Summary</h1>
      <Card className="rounded-xl border-destructive/50">
        <CardContent className="py-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-3 min-h-[44px]" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry</Button>
        </CardContent>
      </Card>
    </div>
  )

  const loading = !summary

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Summary</h1>
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    )
  }

  const s = summary

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Summary</h1>
          {live && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Alert Banner */}
      {s.alert_count > 0 && (
        <Card className="rounded-xl border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">{s.alert_count} alert{s.alert_count !== 1 ? 's' : ''}</p>
                <div className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-300 max-h-14 overflow-y-auto space-y-0.5">
                  {s.alerts.slice(0, 3).map((a, i) => <p key={i}>{a}</p>)}
                  {s.alerts.length > 3 && <p>+{s.alerts.length - 3} more</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Activity, label: 'BP', value: s.vitals.latest ? `${s.vitals.latest.bp_sys ?? '—'}/${s.vitals.latest.bp_dia ?? '—'}` : '—' },
          { icon: Droplet, label: 'Glucose', value: s.glucose.latest ? `${s.glucose.latest.value_mgdl} mg/dL` : '—' },
          { icon: Pill, label: 'Adherence', value: s.medications.active.length ? `${s.medications.adherence_overall.pct}%` : '—' },
          { icon: AlertTriangle, label: 'Open Actions', value: s.actions_open.length },
        ].map(stat => (
          <div key={stat.label} className="bg-muted/40 rounded-lg p-2.5 flex items-center gap-2">
            <stat.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-base font-bold tabular-nums leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Vitals */}
      <CollapsibleSection title="Vitals" icon={Stethoscope}>
        {loading ? <Skeleton className="h-24 w-full" /> : (
          <div className="space-y-2.5">
            {s.vitals.latest && (
              <div className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">Latest · {formatDate(s.vitals.latest.measured_at)}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[10px] text-muted-foreground">BP</p><p className="text-sm font-bold">{s.vitals.latest.bp_sys ?? '—'}/{s.vitals.latest.bp_dia ?? '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">HR</p><p className="text-sm font-bold">{s.vitals.latest.hr ?? '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Temp</p><p className="text-sm font-bold">{s.vitals.latest.temp_c != null ? s.vitals.latest.temp_c + '°' : '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">SpO₂</p><p className="text-sm font-bold">{s.vitals.latest.spo2 != null ? s.vitals.latest.spo2 + '%' : '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Wt</p><p className="text-sm font-bold">{s.vitals.latest.weight_kg != null ? s.vitals.latest.weight_kg + 'kg' : '—'}</p></div>
                </div>
              </div>
            )}
            <div className="space-y-1 text-[11px]">
              {[{ l: 'BP Sys', min: s.vitals.range_7d?.bp_sys_min, max: s.vitals.range_7d?.bp_sys_max, t: s.vitals.trend_bp_sys },
                { l: 'BP Dia', min: s.vitals.range_7d?.bp_dia_min, max: s.vitals.range_7d?.bp_dia_max, t: s.vitals.trend_bp_dia },
                { l: 'HR', min: s.vitals.range_7d?.hr_min, max: s.vitals.range_7d?.hr_max, t: s.vitals.trend_hr },
                { l: 'Temp', min: s.vitals.range_7d?.temp_min, max: s.vitals.range_7d?.temp_max, t: s.vitals.trend_temp },
                { l: 'SpO₂', min: s.vitals.range_7d?.spo2_min, max: s.vitals.range_7d?.spo2_max, t: s.vitals.trend_spo2 },
              ].map(r => (
                <div key={r.l} className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground">{r.l}</span>
                  <span className="tabular-nums font-medium">{r.min != null ? `${r.min}–${r.max}` : '—'}</span>
                  <TrendIcon trend={r.t} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Glucose */}
      <CollapsibleSection title="Glucose" icon={Droplet}>
        {loading ? <Skeleton className="h-20 w-full" /> : (
          <div className="space-y-2">
            {s.glucose.latest && (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5">
                <div>
                  <p className="text-[10px] text-muted-foreground">Latest</p>
                  <p className="text-lg font-bold">{s.glucose.latest.value_mgdl} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></p>
                </div>
                <div className="text-right">
                  {s.glucose.latest.context && <Badge variant="outline" className="text-[10px]">{s.glucose.latest.context}</Badge>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(s.glucose.latest.measured_at)}</p>
                </div>
              </div>
            )}
            {s.glucose.range_7d.reading_count > 0 && (
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-muted/20 rounded p-1.5"><p className="text-[10px] text-muted-foreground">Min</p><p className="font-bold">{s.glucose.range_7d.min_val}</p></div>
                <div className="bg-muted/20 rounded p-1.5"><p className="text-[10px] text-muted-foreground">Avg</p><p className="font-bold">{s.glucose.range_7d.avg_val}</p></div>
                <div className="bg-muted/20 rounded p-1.5"><p className="text-[10px] text-muted-foreground">Max</p><p className="font-bold">{s.glucose.range_7d.max_val}</p></div>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">Trend:</span>
              <TrendIcon trend={s.glucose.trend} />
              <span className="text-muted-foreground ml-auto">{s.glucose.range_7d.reading_count} readings</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Medications */}
      <CollapsibleSection title="Medications" icon={Pill} badge={s.medications.active.length}>
        {loading ? <Skeleton className="h-20 w-full" /> : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{s.medications.adherence_overall.pct}%</span>
              <span className="text-[10px] text-muted-foreground">{s.medications.adherence_overall.taken}/{s.medications.adherence_overall.total} doses</span>
            </div>
            <Progress value={s.medications.adherence_overall.total > 0 ? s.medications.adherence_overall.pct : 0} className="h-2" />
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {s.medications.active.map(m => {
                const adh = s.medications.adherence_by_med.find(a => a.med_id === m.id)
                return (
                  <div key={m.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-muted/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.drug}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.dose} · {m.schedule}</p>
                    </div>
                    <span className="tabular-nums shrink-0">{adh?.total ? `${adh.pct}%` : '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Conditions */}
      <CollapsibleSection title="Conditions" icon={ClipboardList} badge={s.conditions.reduce((sum, g) => sum + g.items.length, 0)} defaultOpen={false}>
        {loading ? <Skeleton className="h-20 w-full" /> : (
          <div className="space-y-1.5">
            {s.conditions.map(g => (
              <div key={g.category}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{g.category}</p>
                {g.items.map(c => (
                  <div key={c.code} className="flex items-start gap-1.5 text-[11px] py-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">{c.code}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.notes && <p className="text-[10px] text-muted-foreground">{c.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Labs */}
      <CollapsibleSection title="Lab Results" icon={Syringe} badge={s.labs.filter(l => l.latest.flag === 'H' || l.latest.flag === 'L').length} defaultOpen={false}>
        {loading ? <Skeleton className="h-20 w-full" /> : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {s.labs.filter(l => l.latest.flag === 'H' || l.latest.flag === 'L').map(l => (
              <div key={l.test} className="flex items-center gap-2 text-[11px] py-1 border-b border-muted/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{l.test}</p>
                  <p className="text-[10px] text-muted-foreground">{l.latest.value}{l.latest.unit ? ` ${l.latest.unit}` : ''}</p>
                </div>
                {l.latest.flag === 'H' && <Badge variant="destructive" className="text-[10px]">H</Badge>}
                {l.latest.flag === 'L' && <Badge variant="destructive" className="text-[10px]">L</Badge>}
                <span className="text-[10px] text-muted-foreground">{formatDate(l.latest.measured_at)}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Wounds */}
      <CollapsibleSection title="Wounds" icon={FileText} badge={s.wound_sites.length}>
        {loading ? <Skeleton className="h-16 w-full" /> : s.wound_sites.length === 0 ? <p className="text-xs text-muted-foreground">No records.</p> : (
          <div className="space-y-2">
            {s.wound_sites.map(ws => {
              const w = ws.latest
              const concern = (w.odor ?? 0) > 0 || (w.color_change ?? 0) > 0
              return (
                <div key={ws.site} className={`border rounded-lg p-2 space-y-1 ${concern ? 'border-red-200 bg-red-50/30' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{ws.site}</span>
                    {concern && <Badge variant="destructive" className="text-[10px]">!</Badge>}
                    <span className={`text-[10px] ml-auto ${ws.status === 'improving' ? 'text-emerald-600' : ws.status === 'worsening' ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {ws.status} · {ws.days_since}d
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2">
                    {w.size_note && <span>Size: {w.size_note}</span>}
                    {w.discharge && <span>Discharge: {w.discharge}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* Symptoms */}
      <CollapsibleSection title="Symptoms" icon={Activity} badge={s.symptoms.length}>
        {loading ? <Skeleton className="h-16 w-full" /> : s.symptoms.length === 0 ? <p className="text-xs text-muted-foreground">None reported.</p> : (
          <div className="space-y-1.5">
            {s.symptoms.map(sy => {
              const sev = sy.severity ?? 0
              const variant = sev <= 3 ? 'secondary' as const : sev <= 6 ? 'default' as const : 'destructive' as const
              const label = sev <= 3 ? 'mild' : sev <= 6 ? 'moderate' : 'severe'
              return (
                <div key={sy.id} className="flex items-center gap-2 text-[11px]">
                  <Badge variant={variant} className="text-[10px]">{label}</Badge>
                  <span>{sy.type}</span>
                  <span className="text-muted-foreground ml-auto">{formatDate(sy.noted_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* Notes */}
      <CollapsibleSection title="Notes" icon={NotebookPen} badge={s.notes.length} defaultOpen={false}>
        {loading ? <Skeleton className="h-16 w-full" /> : s.notes.length === 0 ? <p className="text-xs text-muted-foreground">No notes.</p> : (
          <div className="space-y-1.5">
            {s.notes.map(n => (
              <div key={n.id} className="border-l-2 border-muted pl-2 py-0.5">
                <p className="text-[11px] whitespace-pre-wrap line-clamp-3">{n.note}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Appointments */}
      <CollapsibleSection title="Appointments" icon={CalendarClock} badge={s.appointments_upcoming.length}>
        {loading ? <Skeleton className="h-16 w-full" /> : (
          <div className="space-y-2">
            {s.appointments_upcoming.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Upcoming</p>
                {s.appointments_upcoming.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-[11px] py-0.5">
                    <Badge variant="outline" className="text-[10px]">{a.specialty || 'Appt'}</Badge>
                    <span>{formatDateTime(a.scheduled_for)}</span>
                  </div>
                ))}
              </div>
            )}
            {s.appointments_recent.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Recent</p>
                {s.appointments_recent.slice(0, 3).map(a => (
                  <div key={a.id} className="flex items-start gap-1.5 text-[11px] py-0.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">{a.specialty}</span>
                      <span className="text-muted-foreground ml-1">{formatDate(a.scheduled_for)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {s.appointments_upcoming.length === 0 && s.appointments_recent.length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
          </div>
        )}
      </CollapsibleSection>

      {/* Actions */}
      <CollapsibleSection title="Action Items" icon={Zap} badge={s.actions_open.length}>
        {loading ? <Skeleton className="h-16 w-full" /> : (
          <div className="space-y-2">
            {s.actions_open.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Open</p>
                {s.actions_open.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-[11px] py-0.5">
                    <Badge variant={a.priority === 'HIGH' ? 'destructive' : 'outline'} className="text-[10px] mt-0.5">{a.priority}</Badge>
                    <span>{a.item}</span>
                  </div>
                ))}
              </div>
            )}
            {s.actions_recent_done.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Done</p>
                {s.actions_recent_done.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-start gap-1.5 text-[11px] py-0.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="line-through text-muted-foreground">{a.item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>

      <Separator />
      <p className="text-[10px] text-muted-foreground text-center pb-5">Live Summary · {s.patient?.id || 'PT-ANON'}</p>
    </div>
  )
}
