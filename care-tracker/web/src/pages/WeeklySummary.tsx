import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  FileText, Printer, Activity, Droplet, Pill, AlertTriangle, CalendarClock,
  TrendingUp, TrendingDown, Minus, WifiOff, RefreshCw,
  CheckCircle2, Stethoscope, ClipboardList, NotebookPen, Syringe, Zap,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { fetchLiveSummary, subscribeToSummary } from '@/api'
import type {
  LiveSummaryData, TrendArrow as TrendArrowType
} from '@/api'

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtLabel(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function TrendIcon({ trend, label }: { trend: TrendArrowType | null; label?: string }) {
  if (!trend) return <span className="text-[11px] text-muted-foreground">—</span>
  const { direction, change, change_pct, is_concern } = trend
  const cls = is_concern ? 'text-destructive' : direction === 'stable' ? 'text-muted-foreground' : 'text-emerald-600'
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {direction !== 'stable' && (
        <span>{change > 0 ? '+' : ''}{change.toFixed(1)}{change_pct !== 0 ? ` (${change_pct > 0 ? '+' : ''}${change_pct}%)` : ''}</span>
      )}
      {label && <span className="ml-0.5 opacity-70">{label}</span>}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 flex items-start gap-3">
      <div className={`p-1.5 rounded-md shrink-0 ${color || 'bg-primary/10 text-primary'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

const printStyles = `
  @media print {
    @page { size: A4; margin: 12mm; }
    body { background: white !important; font-size: 10pt; }
    .print\\:hidden { display: none !important; }
    .print\\:break { page-break-before: always; }
  }
`

export default function WeeklySummaryPage() {
  const [summary, setSummary] = useState<LiveSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(true)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [showAllMeds, setShowAllMeds] = useState(false)
  const [showAllLabs, setShowAllLabs] = useState(false)

  const load = useCallback(() => {
    fetchLiveSummary().then(setSummary).catch(err => setError(err instanceof Error ? err.message : 'Failed'))
  }, [])

  useEffect(() => {
    load()
    const unsub = subscribeToSummary(() => {
      setLive(true)
      load()
    })
    return unsub
  }, [load])

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Live Summary</h1>
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const loading = !summary

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Live Summary</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  const s = summary

  const medsToShow = showAllMeds ? s.medications.active : s.medications.active.filter(m => {
    const adh = s.medications.adherence_by_med.find(a => a.med_id === m.id)
    return adh && adh.total > 0
  })
  const hiddenMeds = s.medications.active.length - medsToShow.length

  const labsToShow = showAllLabs ? s.labs : s.labs.filter(l => l.latest.flag === 'H' || l.latest.flag === 'L')
  const hiddenLabs = s.labs.length - labsToShow.length

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <style>{printStyles}</style>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Live Summary</h1>
          {live ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <WifiOff className="h-3 w-3" /> offline
            </span>
          )}
          {!loading && (
            <span className="text-[11px] text-muted-foreground">
              updated {formatDateTime(s.last_updated)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={load} className="min-h-[44px]">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="min-h-[44px]">
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
        </div>
      </div>

      <h1 className="text-xl font-semibold tracking-tight hidden print:block mb-2">Patient Summary</h1>

      {/* ── Alert Banner ── */}
      {s.alert_count > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 print:hidden">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {s.alert_count} alert{s.alert_count !== 1 ? 's' : ''} this week
                </p>
                <div className="mt-1 text-xs text-amber-700 dark:text-amber-300 max-h-24 overflow-y-auto space-y-0.5">
                  {s.alerts.slice(0, 6).map((a, i) => <p key={i}>{a}</p>)}
                  {s.alerts.length > 6 && <p className="text-amber-500">+{s.alerts.length - 6} more</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Activity}
          label="Latest BP"
          value={s.vitals.latest ? `${s.vitals.latest.bp_sys ?? '—'}/${s.vitals.latest.bp_dia ?? '—'}` : '—'}
          sub={s.vitals.latest ? formatDate(s.vitals.latest.measured_at) : 'no data'}
          color="bg-red-100 text-red-700"
        />
        <KpiCard
          icon={Droplet}
          label="Latest Glucose"
          value={s.glucose.latest ? `${s.glucose.latest.value_mgdl} mg/dL` : '—'}
          sub={s.glucose.latest?.context || (s.glucose.latest ? formatDate(s.glucose.latest.measured_at) : 'no data')}
          color="bg-blue-100 text-blue-700"
        />
        <KpiCard
          icon={Pill}
          label="Adherence (7d)"
          value={s.medications.active.length ? `${s.medications.adherence_overall.pct}%` : '—'}
          sub={`${s.medications.adherence_overall.taken}/${s.medications.adherence_overall.total} doses`}
          color="bg-emerald-100 text-emerald-700"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Open Actions"
          value={s.actions_open.length}
          sub={`${s.actions_open.filter(a => a.priority === 'HIGH').length} HIGH priority`}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* ── Vitals + Glucose ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vitals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Vitals · Past 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {s.vitals.latest && (
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <p className="text-[11px] text-muted-foreground mb-1">Latest · {formatDate(s.vitals.latest.measured_at)}</p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div><p className="text-[10px] text-muted-foreground">BP</p><p className="text-sm font-bold tabular-nums">{s.vitals.latest.bp_sys ?? '—'}/{s.vitals.latest.bp_dia ?? '—'}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">HR</p><p className="text-sm font-bold tabular-nums">{s.vitals.latest.hr ?? '—'}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Temp</p><p className="text-sm font-bold tabular-nums">{s.vitals.latest.temp_c != null ? s.vitals.latest.temp_c + '°' : '—'}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">SpO₂</p><p className="text-sm font-bold tabular-nums">{s.vitals.latest.spo2 != null ? s.vitals.latest.spo2 + '%' : '—'}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Wt</p><p className="text-sm font-bold tabular-nums">{s.vitals.latest.weight_kg != null ? s.vitals.latest.weight_kg + 'kg' : '—'}</p></div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { label: 'BP Sys', r: s.vitals.range_7d, min: s.vitals.range_7d?.bp_sys_min, max: s.vitals.range_7d?.bp_sys_max, trend: s.vitals.trend_bp_sys, unit: 'mmHg' },
                    { label: 'BP Dia', r: s.vitals.range_7d, min: s.vitals.range_7d?.bp_dia_min, max: s.vitals.range_7d?.bp_dia_max, trend: s.vitals.trend_bp_dia, unit: 'mmHg' },
                    { label: 'HR', r: s.vitals.range_7d, min: s.vitals.range_7d?.hr_min, max: s.vitals.range_7d?.hr_max, trend: s.vitals.trend_hr, unit: 'bpm' },
                    { label: 'Temp', r: s.vitals.range_7d, min: s.vitals.range_7d?.temp_min, max: s.vitals.range_7d?.temp_max, trend: s.vitals.trend_temp, unit: '°C' },
                    { label: 'SpO₂', r: s.vitals.range_7d, min: s.vitals.range_7d?.spo2_min, max: s.vitals.range_7d?.spo2_max, trend: s.vitals.trend_spo2, unit: '%' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-muted-foreground shrink-0">{row.label}</span>
                      <span className="tabular-nums font-medium w-20 shrink-0 text-right">
                        {row.min != null ? `${row.min}–${row.max} ${row.unit}` : '—'}
                      </span>
                      <span className="flex-1"><TrendIcon trend={row.trend} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Glucose */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplet className="h-4 w-4 text-muted-foreground" />
              Glucose · Past 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-20" />
              </div>
            ) : (
              <div className="space-y-3">
                {s.glucose.latest && (
                  <div className="bg-muted/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Latest</p>
                      <p className="text-xl font-bold tabular-nums">{s.glucose.latest.value_mgdl} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></p>
                    </div>
                    <div className="text-right">
                      {s.glucose.latest.context && <Badge variant="outline" className="text-[10px]">{s.glucose.latest.context}</Badge>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(s.glucose.latest.measured_at)}</p>
                    </div>
                  </div>
                )}
                {s.glucose.range_7d.reading_count > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/20 rounded p-1.5">
                        <p className="text-[10px] text-muted-foreground">Min</p>
                        <p className="text-sm font-bold tabular-nums">{s.glucose.range_7d.min_val}</p>
                      </div>
                      <div className="bg-muted/20 rounded p-1.5">
                        <p className="text-[10px] text-muted-foreground">Avg</p>
                        <p className="text-sm font-bold tabular-nums">{s.glucose.range_7d.avg_val}</p>
                      </div>
                      <div className="bg-muted/20 rounded p-1.5">
                        <p className="text-[10px] text-muted-foreground">Max</p>
                        <p className="text-sm font-bold tabular-nums">{s.glucose.range_7d.max_val}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Trend:</span>
                      <TrendIcon trend={s.glucose.trend} />
                      <span className="text-muted-foreground ml-auto">{s.glucose.range_7d.reading_count} readings</span>
                    </div>
                    {s.glucose.by_context.length > 0 && (
                      <div className="border-t pt-2 mt-1">
                        <p className="text-[11px] text-muted-foreground mb-1.5">By context</p>
                        <div className="space-y-1">
                          {s.glucose.by_context.slice(0, 5).map(c => (
                            <div key={c.context} className="flex items-center gap-2 text-xs">
                              <span className="w-20 text-muted-foreground capitalize shrink-0">{c.context.replace('_', ' ')}</span>
                              <span className="tabular-nums font-medium">{c.avg} mg/dL</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">{c.count}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Medications ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            Medications · {s.medications.active.length} active
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : s.medications.active.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active medications.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums">
                    {s.medications.adherence_overall.total > 0 ? `${s.medications.adherence_overall.pct}%` : '—'}
                  </span>
                  <Progress
                    value={s.medications.adherence_overall.total > 0 ? s.medications.adherence_overall.pct : 0}
                    className="h-2.5 w-32"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {s.medications.adherence_overall.taken} / {s.medications.adherence_overall.total} doses taken
                </span>
              </div>

              {s.medications.recently_added.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-md p-2 text-xs">
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">Newly added: </span>
                  {s.medications.recently_added.map(m => m.drug).join(', ')}
                </div>
              )}
              {s.medications.recently_stopped.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-md p-2 text-xs">
                  <span className="font-medium text-red-700 dark:text-red-300">Recently stopped: </span>
                  {s.medications.recently_stopped.map(m => m.drug).join(', ')}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1.5 font-medium">Drug</th>
                      <th className="text-left py-1.5 font-medium hidden sm:table-cell">Dose</th>
                      <th className="text-left py-1.5 font-medium hidden sm:table-cell">Schedule</th>
                      <th className="text-left py-1.5 font-medium hidden md:table-cell">Purpose</th>
                      <th className="text-right py-1.5 font-medium">Adherence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medsToShow.map(m => {
                      const adh = s.medications.adherence_by_med.find(a => a.med_id === m.id)
                      const pct = adh?.total ? adh.pct : null
                      return (
                        <tr key={m.id} className="border-b border-muted/50">
                          <td className="py-1.5 pr-2 font-medium">{m.drug}</td>
                          <td className="py-1.5 pr-2 hidden sm:table-cell text-muted-foreground">{m.dose || '—'}</td>
                          <td className="py-1.5 pr-2 hidden sm:table-cell text-muted-foreground text-[10px]">{m.schedule || '—'}</td>
                          <td className="py-1.5 pr-2 hidden md:table-cell">
                            {m.purpose ? <Badge variant="secondary" className="text-[10px]">{m.purpose}</Badge> : '—'}
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {pct != null ? (
                              <span className={pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}>
                                {pct}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {hiddenMeds > 0 && (
                <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => setShowAllMeds(!showAllMeds)}>
                  {showAllMeds ? 'Show fewer' : `Show all ${s.medications.active.length} medications`}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Conditions ── */}
      <Card className="print:break">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Active Conditions · {s.conditions.reduce((sum, g) => sum + g.items.length, 0)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : s.conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active conditions.</p>
          ) : (
            <div className="space-y-1">
              {s.conditions.map(group => {
                const isOpen = expandedCats.has(group.category)
                return (
                  <div key={group.category}>
                    <button
                      className="w-full flex items-center gap-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => toggleCat(group.category)}
                    >
                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                      {group.category}
                      <Badge variant="secondary" className="text-[10px] ml-auto">{group.items.length}</Badge>
                    </button>
                    {isOpen && (
                      <div className="ml-5 space-y-0.5 pb-1">
                        {group.items.map(c => (
                          <div key={c.code} className="flex items-start gap-2 py-0.5">
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">{c.code}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{c.name}</p>
                              {c.notes && <p className="text-[10px] text-muted-foreground truncate">{c.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Labs + Wounds ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Labs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Syringe className="h-4 w-4 text-muted-foreground" />
              Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : s.labs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No lab results.</p>
            ) : (
              <div className="space-y-1.5">
                {labsToShow.map(l => (
                  <div key={l.test} className="flex items-center gap-2 text-xs py-1 border-b border-muted/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{l.test}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {l.latest.value != null ? l.latest.value : '—'}{l.latest.unit ? ` ${l.latest.unit}` : ''}
                        {(l.latest.ref_low != null || l.latest.ref_high != null) && (
                          <span className="ml-1">(ref: {l.latest.ref_low ?? '—'}–{l.latest.ref_high ?? '—'})</span>
                        )}
                      </p>
                    </div>
                    {l.latest.flag === 'H' && <Badge variant="destructive" className="text-[10px] shrink-0">HIGH</Badge>}
                    {l.latest.flag === 'L' && <Badge variant="destructive" className="text-[10px] shrink-0">LOW</Badge>}
                    {l.delta_value != null && (
                      <span className={`shrink-0 text-[10px] tabular-nums ${l.trend === 'up' ? 'text-red-500' : l.trend === 'down' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                        {l.delta_value > 0 ? '+' : ''}{l.delta_value.toFixed(1)}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(l.latest.measured_at)}</span>
                  </div>
                ))}
                {hiddenLabs > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => setShowAllLabs(!showAllLabs)}>
                    {showAllLabs ? 'Show only abnormal' : `Show all ${s.labs.length} tests`}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wounds */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Wound Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : s.wound_sites.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No wound records.</p>
            ) : (
              <div className="space-y-2">
                {s.wound_sites.map(ws => {
                  const w = ws.latest
                  const isConcern = (w.odor ?? 0) > 0 || (w.color_change ?? 0) > 0
                  return (
                    <div key={ws.site} className={`border rounded-lg p-2.5 space-y-1 ${isConcern ? 'border-red-200 bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{ws.site}</span>
                        {isConcern && <Badge variant="destructive" className="text-[10px]">!</Badge>}
                        <span className={`text-[10px] ml-auto ${ws.status === 'improving' ? 'text-emerald-600' : ws.status === 'worsening' ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {ws.status} · {ws.days_since}d ago
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2">
                        {w.size_note && <span>Size: {w.size_note}</span>}
                        {w.discharge && <span>Discharge: {w.discharge}</span>}
                        {w.appearance && <span>Appearance: {w.appearance}</span>}
                      </div>
                      {w.notes && <p className="text-[10px] text-muted-foreground">{w.notes}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Symptoms + Notes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Symptoms */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Symptoms This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : s.symptoms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No symptoms reported.</p>
            ) : (
              <div className="space-y-2">
                {s.symptoms.map(sy => {
                  const sev = sy.severity ?? 0
                  const variant = sev <= 3 ? 'secondary' as const : sev <= 6 ? 'default' as const : 'destructive' as const
                  const label = sev <= 3 ? 'mild' : sev <= 6 ? 'moderate' : 'severe'
                  return (
                    <div key={sy.id} className="flex items-center gap-2 py-1">
                      <Badge variant={variant} className="text-[10px] shrink-0">{label}</Badge>
                      <span className="text-xs flex-1">{sy.type || 'Unknown'}</span>
                      {sy.notes && <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{sy.notes}</span>}
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(sy.noted_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-muted-foreground" />
              Notes This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : s.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No notes this week.</p>
            ) : (
              <div className="space-y-2">
                {s.notes.slice(0, 8).map(n => (
                  <div key={n.id} className="border-l-2 border-muted pl-2.5 py-0.5">
                    <p className="text-xs whitespace-pre-wrap line-clamp-3">{n.note}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fmtLabel(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Appointments + Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appointments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {s.appointments_upcoming.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Upcoming</p>
                    <div className="space-y-1">
                      {s.appointments_upcoming.map(a => (
                        <div key={a.id} className="flex items-center gap-2 text-xs py-0.5">
                          <Badge variant="outline" className="text-[10px] shrink-0">{a.specialty || 'Appt'}</Badge>
                          <span className="flex-1">{formatDateTime(a.scheduled_for)}</span>
                          {a.status && <Badge variant="secondary" className="text-[10px]">{a.status}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s.appointments_recent.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Recently completed</p>
                    <div className="space-y-1">
                      {s.appointments_recent.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-start gap-2 text-xs py-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">{a.specialty || 'Appointment'}</span>
                            <span className="text-muted-foreground ml-1.5">{formatDate(a.scheduled_for)}</span>
                            {a.outcome && <p className="text-[10px] text-muted-foreground truncate">{a.outcome}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s.appointments_upcoming.length === 0 && s.appointments_recent.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No appointments.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {s.actions_open.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                      Open · {s.actions_open.length}
                    </p>
                    <div className="space-y-1.5">
                      {s.actions_open.map(a => (
                        <div key={a.id} className="flex items-start gap-2 text-xs">
                          <Badge variant={a.priority === 'HIGH' ? 'destructive' : 'outline'} className="text-[10px] mt-0.5 shrink-0">
                            {a.priority}
                          </Badge>
                          <div className="min-w-0">
                            <p className="font-medium">{a.item}</p>
                            {a.category && <p className="text-[10px] text-muted-foreground">{a.category}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s.actions_recent_done.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Recently done</p>
                    <div className="space-y-1">
                      {s.actions_recent_done.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="line-through text-muted-foreground">{a.item}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s.actions_open.length === 0 && s.actions_recent_done.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No action items.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Footer ── */}
      <Separator className="print:hidden" />
      <div className="text-xs text-muted-foreground text-center pb-6 print:hidden">
        {s.patient?.id || 'PT-ANON'} · Last updated {formatDateTime(s.last_updated)}
      </div>
    </div>
  )
}
