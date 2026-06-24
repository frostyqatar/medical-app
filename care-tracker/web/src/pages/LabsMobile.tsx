import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FlaskConical, Plus, ChevronDown, ChevronUp, Trash2, TrendingUp, TrendingDown, Minus, Info, Droplet } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Brush } from 'recharts'
import { fetchLabs, fetchLabTests, fetchLabTrend, createLab, deleteLab, fetchLatestGlucose } from '@/api'
import type { Lab, Glucose } from '@/api'
import { getLabInfo } from './labInfo'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function getFlag(flag: string | null) { if (flag === 'H') return { variant: 'destructive' as const, label: 'H' }; if (flag === 'L') return { variant: 'default' as const, className: 'bg-yellow-500 text-white', label: 'L' }; return { variant: 'secondary' as const, label: 'N' } }
function refRange(lab: Lab): string { const l = lab.ref_low; const h = lab.ref_high; if (l != null && h != null) return `${l}–${h}`; if (l != null) return `≥ ${l}`; if (h != null) return `≤ ${h}`; return 'N/A' }

function trendArrow(current: Lab, previous?: Lab) {
  if (!previous || previous.value == null || current.value == null) return null
  const diff = current.value - previous.value
  if (Math.abs(diff) < 0.01) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  if (diff > 0) return <TrendingUp className="h-3.5 w-3.5 text-red-500" />
  return <TrendingDown className="h-3.5 w-3.5 text-green-500" />
}

export default function LabsMobile() {
  const [labs, setLabs] = useState<Lab[] | null>(null)
  const [tests, setTests] = useState<string[] | null>(null)
  const [selectedTest, setSelectedTest] = useState<string>('__all__')
  const [trend, setTrend] = useState<Lab[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedTest, setExpandedTest] = useState<string | null>(null)
  const [latestGlucose, setLatestGlucose] = useState<Glucose | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ test: '', value: '', unit: '', date: new Date().toISOString().slice(0, 16) })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lab | null>(null)

  const load = useCallback(async (test?: string) => { setLabs(null); try { setLabs(await fetchLabs(test)); setError(null) } catch { setError('Failed to load') } }, [])
  useEffect(() => { fetchLabTests().then(setTests).catch(() => setTests([])) }, [])
  useEffect(() => { load(selectedTest === '__all__' ? undefined : selectedTest) }, [selectedTest, load])
  useEffect(() => { if (selectedTest === '__all__') { setTrend(null); return }; fetchLabTrend(selectedTest).then(setTrend).catch(() => setTrend(null)) }, [selectedTest])
  useEffect(() => {
    if (selectedTest === 'Glucose (fasting)') {
      fetchLatestGlucose().then(g => setLatestGlucose(g)).catch(() => setLatestGlucose(null))
    } else {
      setLatestGlucose(null)
    }
  }, [selectedTest])

  const labsByTest: Record<string, Lab[]> = {}
  for (const lab of labs || []) { if (!labsByTest[lab.test]) labsByTest[lab.test] = []; labsByTest[lab.test].push(lab) }
  for (const k of Object.keys(labsByTest)) { labsByTest[k].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.test || !form.value) return
    setSaving(true)
    try {
      await createLab({ measured_at: new Date(form.date || Date.now()).toISOString(), test: form.test, value: parseFloat(form.value), unit: form.unit || null, flag: null, notes: null })
      setShowForm(false); setForm({ test: '', value: '', unit: '', date: new Date().toISOString().slice(0, 16) })
      load(selectedTest === '__all__' ? undefined : selectedTest)
    } catch { setError('Failed to save') } finally { setSaving(false) }
  }

  async function handleDelete() { if (!deleteTarget) return; await deleteLab(deleteTarget.id); setDeleteTarget(null); load(selectedTest === '__all__' ? undefined : selectedTest) }

  const chartData = trend ? [...trend].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()).map(v => ({ date: formatDate(v.measured_at), value: v.value })) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Labs</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setShowForm(true)}><Plus className="h-5 w-5" /></Button>
      </div>

      <Select value={selectedTest} onValueChange={setSelectedTest}>
        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Filter by test" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Tests</SelectItem>
          {tests?.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>

      {labs === null ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : labs.length === 0 ? (
        <Card className="rounded-xl"><CardContent className="p-8 text-center"><FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No lab results.</p></CardContent></Card>
      ) : selectedTest === '__all__' ? (
        <div className="space-y-2">
          {Object.entries(labsByTest).map(([test, group]) => {
            const latest = group[0]
            const isExpanded = expandedTest === test
            const f = getFlag(latest.flag)
            return (
              <Card key={test} className="rounded-xl">
                <CardContent className="p-0">
                  <button className="w-full p-4 text-left" onClick={() => setExpandedTest(isExpanded ? null : test)}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium text-sm">{test}</span>
                        <p className="text-xs text-muted-foreground">{latest.value != null ? latest.value : '—'}{latest.unit ? ` ${latest.unit}` : ''} &middot; {formatDate(latest.measured_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={f.variant} className={f as any}>{f.label}</Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3">
                      <p className="text-xs text-muted-foreground">Ref range: {refRange(latest)}</p>
                      {latest.notes && <p className="text-xs text-muted-foreground">{latest.notes}</p>}
                      {(() => {
                        const info = getLabInfo(test)
                        if (!info) return null
                        return (
                          <div className="bg-muted/30 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              <p className="text-xs">{info.what}</p>
                            </div>
                            {(latest.flag === 'H' && info.high) && <p className="text-xs text-muted-foreground"><span className="font-medium text-amber-600">High:</span> {info.high}</p>}
                            {(latest.flag === 'L' && info.low) && <p className="text-xs text-muted-foreground"><span className="font-medium text-blue-600">Low:</span> {info.low}</p>}
                            {info.treatment && <p className="text-xs text-muted-foreground"><span className="font-medium text-green-600">Treatment:</span> {info.treatment}</p>}
                          </div>
                        )
                      })()}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="min-h-[44px] flex-1" onClick={() => { setSelectedTest(test); setExpandedTest(null) }}>View Trend</Button>
                        <Button variant="ghost" size="sm" className="min-h-[44px] text-red-500" onClick={() => setDeleteTarget(latest)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <Card className="rounded-xl"><CardContent className="p-3">
              <div className="[&_.recharts-responsive-container]:!overflow-visible [&_.recharts-wrapper]:cursor-grab [&_.recharts-wrapper]:active:cursor-grabbing" style={{ overflow: 'visible' }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <RTooltip />
                  {trend?.[0]?.ref_low != null && (
                    <>
                      <ReferenceArea y1={0} y2={trend[0].ref_low} fill="#ef4444" fillOpacity={0.05} />
                      <ReferenceLine y={trend[0].ref_low} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${trend[0].ref_low}`, position: 'left', fontSize: 10, fill: '#ef4444' }} />
                    </>
                  )}
                  {trend?.[0]?.ref_high != null && (
                    <>
                      <ReferenceArea y1={trend[0].ref_high} y2={trend[0].ref_high * 2} fill="#ef4444" fillOpacity={0.05} />
                      <ReferenceLine y={trend[0].ref_high} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${trend[0].ref_high}`, position: 'left', fontSize: 10, fill: '#ef4444' }} />
                    </>
                  )}
                  <Area type="monotone" dataKey="value" fill="url(#labGrad)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Brush dataKey="date" height={24} stroke="hsl(var(--border))" tickFormatter={() => ''} travellerWidth={8} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </CardContent></Card>
          )}

          {selectedTest === 'Glucose (fasting)' && latestGlucose && (
            <Card className="rounded-xl border-amber-200 bg-amber-50/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Droplet className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Latest home glucose reading</p>
                  <p className="text-sm font-semibold">{latestGlucose.value_mgdl} mg/dL <Badge variant="outline" className="text-[10px] ml-1">{latestGlucose.context?.replace('_', ' ') || 'random'}</Badge></p>
                  <p className="text-[11px] text-muted-foreground">{new Date(latestGlucose.measured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTest !== '__all__' && (() => {
            const info = getLabInfo(selectedTest)
            if (!info) return null
            return (
              <Card className="rounded-xl"><CardContent className="p-3 space-y-1.5">
                <div className="flex items-start gap-1.5"><Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><p className="text-xs font-medium">About {selectedTest}</p></div>
                <p className="text-xs text-muted-foreground">{info.what}</p>
                {info.high && <p className="text-xs"><span className="font-medium text-amber-600">High:</span> <span className="text-muted-foreground">{info.high}</span></p>}
                {info.low && <p className="text-xs"><span className="font-medium text-blue-600">Low:</span> <span className="text-muted-foreground">{info.low}</span></p>}
                {info.treatment && <p className="text-xs"><span className="font-medium text-green-600">Treatment:</span> <span className="text-muted-foreground">{info.treatment}</span></p>}
              </CardContent></Card>
            )
          })()}

          <div className="space-y-2">
            {[...(labs || [])].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()).map((lab, idx, arr) => {
              const f = getFlag(lab.flag)
              const prev = arr[idx + 1]
              return (
                <Card key={lab.id} className="rounded-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{formatDateTime(lab.measured_at)}</span>
                      <div className="flex items-center gap-1">
                        {trendArrow(lab, prev)}
                        <Badge variant={f.variant} className={(f as any).className}>{f.label}</Badge>
                      </div>
                    </div>
                    <p className="font-bold text-lg">{lab.value != null ? lab.value : '—'}<span className="text-sm font-normal text-muted-foreground ml-1">{lab.unit}</span></p>
                    <p className="text-[11px] text-muted-foreground">Ref: {refRange(lab)}</p>
                    {lab.notes && <p className="text-xs text-muted-foreground mt-1">{lab.notes}</p>}
                    <Button variant="ghost" size="sm" className="mt-2 text-red-500 min-h-[44px]" onClick={() => setDeleteTarget(lab)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Record Lab</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1"><Label>Test</Label>
              <Select value={form.test} onValueChange={v => setForm(f => ({ ...f, test: v }))}>
                <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                <SelectContent>{tests?.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Value</Label><Input type="number" inputMode="decimal" step="any" placeholder="8.2" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Unit</Label><Input placeholder="e.g. mg/dL" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Date</Label><Input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="min-h-[44px]" disabled={saving || !form.test || !form.value}>{saving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Delete Result</DialogTitle></DialogHeader>
          {deleteTarget && <p className="text-sm">{deleteTarget.test} — {deleteTarget.value}{deleteTarget.unit ? ` ${deleteTarget.unit}` : ''}</p>}
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="min-h-[44px]" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
