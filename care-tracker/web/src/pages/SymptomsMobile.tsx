import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Stethoscope, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fetchSymptoms, fetchSymptomTypes, createSymptom, deleteSymptom } from '@/api'
import type { Symptom } from '@/api'

const COMMON_TYPES = ['phantom limb pain', 'left foot numbness', 'GERD/heartburn', 'dizziness', 'fever', 'headache', 'fatigue', 'nausea', 'joint pain', 'rash/itching']

function formatDateTime(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function severityColor(v: number) { if (v <= 3) return 'bg-green-500'; if (v <= 6) return 'bg-amber-500'; return 'bg-red-500' }
function severityLabel(v: number) { if (v <= 3) return 'Mild'; if (v <= 6) return 'Moderate'; return 'Severe' }

export default function SymptomsMobile() {
  const [symptoms, setSymptoms] = useState<Symptom[] | null>(null)
  const [types, setTypes] = useState<string[] | null>(null)
  const [selectedType, setSelectedType] = useState('all')
  const [timeRange, setTimeRange] = useState('7')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formType, setFormType] = useState('')
  const [formSeverity, setFormSeverity] = useState([5])
  const [formNotes, setFormNotes] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Symptom | null>(null)

  const load = useCallback(async (days?: number, type?: string) => {
    setSymptoms(null)
    try { setSymptoms(await fetchSymptoms(days, type || undefined)); setError(null) } catch { setError('Failed to load') }
  }, [])

  useEffect(() => { load(timeRange === 'all' ? undefined : Number(timeRange), selectedType === 'all' ? undefined : selectedType) }, [timeRange, selectedType, load])
  useEffect(() => { fetchSymptomTypes().then(setTypes).catch(() => {}) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formType.trim()) return
    setSubmitting(true)
    try {
      await createSymptom({ type: formType.trim(), severity: formSeverity[0], notes: formNotes.trim() || undefined, noted_at: new Date().toISOString() })
      setFormType(''); setFormSeverity([5]); setFormNotes('')
      load(timeRange === 'all' ? undefined : Number(timeRange), selectedType === 'all' ? undefined : selectedType)
    } catch { setError('Failed to record') } finally { setSubmitting(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteSymptom(target.id)
      load(timeRange === 'all' ? undefined : Number(timeRange), selectedType === 'all' ? undefined : selectedType)
    } catch {
      setError('Failed to delete symptom entry')
    }
  }

  const filtered = symptoms ? [...symptoms].sort((a, b) => new Date(b.noted_at).getTime() - new Date(a.noted_at).getTime()) : null
  const availableTypes = types ?? COMMON_TYPES

  function sevTrend(sym: Symptom, idx: number): React.ReactNode {
    if (!filtered) return null
    const prev = filtered.slice(idx + 1).find(s => s.type === sym.type)
    if (!prev || prev.severity == null || sym.severity == null) return null
    const diff = sym.severity - prev.severity
    if (diff > 1) return <TrendingUp className="h-3.5 w-3.5 text-red-500" />
    if (diff < -1) return <TrendingDown className="h-3.5 w-3.5 text-green-500" />
    if (Math.abs(diff) <= 1) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
    return null
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Symptoms</h1>

      <Card className="rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground" />Log Symptom</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Input placeholder="Search or type..." list="sym-list" value={formType} onChange={e => setFormType(e.target.value)} autoCapitalize="off" autoCorrect="off" />
              <datalist id="sym-list">{COMMON_TYPES.map(t => <option key={t} value={t} />)}</datalist>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><Label className="text-xs">Severity</Label><span className="text-sm font-bold">{formSeverity[0]}/10</span></div>
              <Slider min={0} max={10} step={1} value={formSeverity} onValueChange={setFormSeverity} />
              <div className="flex justify-between text-[10px] text-muted-foreground"><span>Mild</span><span>Moderate</span><span>Severe</span></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Any details..." value={formNotes} onChange={e => setFormNotes(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting || !formType.trim()} className="w-full min-h-[44px]">{submitting ? 'Logging...' : 'Log Symptom'}</Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {availableTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            {[{ label: '7d', value: '7' }, { label: '30d', value: '30' }, { label: 'All', value: 'all' }].map(r => (
              <TabsTrigger key={r.value} value={r.value} className="min-h-[44px]">{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl"><CardContent className="p-8 text-center"><p className="text-sm text-muted-foreground">No symptoms recorded.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, idx) => {
            const sv = s.severity ?? 0
            const trend = sevTrend(s, idx)
            return (
              <Card key={s.id} className="rounded-xl"><CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap"><Badge variant="outline" className="text-xs">{s.type}</Badge>{trend}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(s.noted_at)}</p>
                    {s.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={sv <= 6 ? 'secondary' : 'destructive'} className="text-xs">{sv}/10 {severityLabel(sv)}</Badge>
                    <button onClick={() => setDeleteTarget(s)} aria-label={`Delete ${s.type} entry`} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${severityColor(sv)}`} style={{ width: `${(sv / 10) * 100}%` }} /></div>
              </CardContent></Card>
            )
          })}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Symptom Entry</DialogTitle>
            <DialogDescription>This will permanently delete this symptom entry. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm font-medium py-2">{deleteTarget.type} &middot; {deleteTarget.severity}/10 &middot; {formatDateTime(deleteTarget.noted_at)}</p>
          )}
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="min-h-[44px]" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
