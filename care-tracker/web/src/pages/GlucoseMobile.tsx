import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Droplet, TrendingUp, TrendingDown, Minus, X, FlaskConical } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fetchGlucose, createGlucose, deleteGlucose, fetchLabs } from '@/api'
import type { Glucose, Lab } from '@/api'

const CONTEXTS = ['fasting', 'pre_meal', 'post_meal', 'random', 'bedtime']
function contextLabel(t: string | null) { 
  if (!t) return 'Unknown'
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function glucoseColor(v: number) { if (v < 70 || v > 250) return 'text-red-600'; if (v > 180) return 'text-amber-600'; return 'text-green-600' }

export default function GlucoseMobile() {
  const [data, setData] = useState<Glucose[] | null>(null)
  const [range, setRange] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ value_mgdl: '', context: 'random', notes: '', date: new Date().toISOString().slice(0, 10) })
  const [labGlucose, setLabGlucose] = useState<Lab | null>(null)

  const load = useCallback(async (days: number) => { setData(null); try { setData(await fetchGlucose(days)); setError(null) } catch { setError('Failed to load') } }, [])
  useEffect(() => { load(range) }, [range, load])
  useEffect(() => {
    fetchLabs('Glucose (fasting)').then(labs => {
      const sorted = (labs || []).sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      setLabGlucose(sorted[0] || null)
    }).catch(() => setLabGlucose(null))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.value_mgdl) return
    setSubmitting(true)
    try {
      await createGlucose({ value_mgdl: Number(form.value_mgdl), context: form.context as Glucose['context'], notes: form.notes || undefined, measured_at: new Date(form.date || Date.now()).toISOString() })
      setForm({ value_mgdl: '', context: 'random', notes: '', date: new Date().toISOString().slice(0, 10) })
      load(range)
    } catch { setError('Failed') } finally { setSubmitting(false) }
  }

  async function handleDelete(id: number) { await deleteGlucose(id); load(range) }

  const sorted = data ? [...data].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()) : []
  const chartData = sorted.map(g => ({ date: formatDate(g.measured_at), value: g.value_mgdl }))
  const values = sorted.map(g => g.value_mgdl)
  const stats = values.length > 0 ? { min: Math.min(...values), max: Math.max(...values), avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length), count: values.length } : null

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Glucose</h1>

      <Card className="rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-base">Record Reading</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Value (mg/dL)</Label><Input type="number" inputMode="numeric" placeholder="120" value={form.value_mgdl} onChange={e => setForm(f => ({ ...f, value_mgdl: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Context</Label>
                <Select value={form.context} onValueChange={v => setForm(f => ({ ...f, context: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTEXTS.map(c => <SelectItem key={c} value={c}>{contextLabel(c)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full min-h-[44px]">{submitting ? 'Recording...' : 'Record'}</Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-xl"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Min</p><p className={`text-xl font-bold ${glucoseColor(stats.min)}`}>{stats.min}</p></CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Avg</p><p className={`text-xl font-bold ${glucoseColor(stats.avg)}`}>{stats.avg}</p></CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Max</p><p className={`text-xl font-bold ${glucoseColor(stats.max)}`}>{stats.max}</p></CardContent></Card>
          </div>
          {labGlucose && (
            <Card className="rounded-xl border-blue-200 bg-blue-50/40">
              <CardContent className="p-3 flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Last lab glucose (fasting)</p>
                  <p className="text-sm font-semibold">{labGlucose.value} {labGlucose.unit}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(labGlucose.measured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Tabs value={String(range)} onValueChange={v => setRange(Number(v))}>
        <TabsList className="w-full justify-start">
          {[{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }].map(r => (
            <TabsTrigger key={r.value} value={String(r.value)} className="min-h-[44px] flex-1">{r.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {data === null ? (
        <Skeleton className="h-[250px] w-full rounded-xl" />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No readings yet.</p>
      ) : (
        <>
          <Card className="rounded-xl"><CardContent className="p-3">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={35} />
                <Tooltip />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Low 70', position: 'left', fontSize: 10, fill: '#ef4444' }} />
                <ReferenceLine y={180} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'High 180', position: 'left', fontSize: 10, fill: '#f97316' }} />
                <Area type="monotone" dataKey="value" fill="url(#glucoseGrad)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent></Card>

          <div className="space-y-2">
            {[...sorted].reverse().map(g => {
              const borderColor = g.value_mgdl < 70 ? 'border-l-red-500' : g.value_mgdl > 250 ? 'border-l-red-500' : g.value_mgdl > 180 ? 'border-l-amber-500' : 'border-l-green-500'
              return (
              <Card key={g.id} className={`rounded-xl border-l-4 ${borderColor}`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${glucoseColor(g.value_mgdl)}`}>{g.value_mgdl}</span>
                      <span className="text-xs text-muted-foreground">mg/dL</span>
                      <Badge variant="outline" className="text-[10px]">{contextLabel(g.context)}</Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(g.measured_at)}</span>
                    {g.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{g.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-red-500 shrink-0"><X className="h-4 w-4" /></button>
                </CardContent>
              </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
