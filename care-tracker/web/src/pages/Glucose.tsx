import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Droplet, TrendingUp, TrendingDown, Minus, X, Pencil } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { fetchGlucose, fetchLatestGlucose, createGlucose, deleteGlucose, updateGlucose } from '@/api';
import type { Glucose } from '@/api';

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
] as const;

const CONTEXTS: { value: string; label: string }[] = [
  { value: 'fasting', label: 'Fasting' },
  { value: 'pre_meal', label: 'Pre-meal' },
  { value: 'post_meal', label: 'Post-meal' },
  { value: 'random', label: 'Random' },
  { value: 'bedtime', label: 'Bedtime' },
];

const CONTEXT_COLORS: Record<string, string> = {
  fasting: 'hsl(142 76% 36%)',
  pre_meal: 'hsl(200 98% 39%)',
  post_meal: 'hsl(262 83% 58%)',
  random: 'hsl(var(--muted-foreground))',
  bedtime: 'hsl(340 82% 52%)',
};

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function glucoseColor(value: number): string {
  if (value < 70 || value > 250) return 'text-[hsl(0,84%,60%)]';
  if (value > 180) return 'text-[hsl(45,93%,47%)]';
  return 'text-[hsl(142,76%,36%)]';
}

function glucoseBg(value: number): string {
  if (value < 70 || value > 250) return 'bg-red-100 dark:bg-red-950';
  if (value > 180) return 'bg-yellow-100 dark:bg-yellow-950';
  return 'bg-green-100 dark:bg-green-950';
}

function contextLabel(type: string | null): string {
  return CONTEXTS.find((c) => c.value === type)?.label ?? type ?? 'Unknown';
}

export default function GlucosePage() {
  const [glucoseData, setGlucoseData] = useState<Glucose[] | null>(null);
  const [range, setRange] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ value_mgdl: '', context: 'random' as string, notes: '', date: new Date().toISOString().slice(0, 10) });

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ value_mgdl: string; context: string; date: string; notes: string }>({ value_mgdl: '', context: 'random', date: '', notes: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadGlucose = useCallback(async (days: number) => {
    setGlucoseData(null);
    try {
      const data = await fetchGlucose(days);
      setGlucoseData(data);
      setError(null);
    } catch { setError('Failed to load glucose readings'); }
  }, []);

  useEffect(() => { loadGlucose(range); }, [range, loadGlucose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value_mgdl) return;
    setSubmitting(true); setError(null);
    try {
      await createGlucose({
        value_mgdl: Number(form.value_mgdl),
        context: form.context as Glucose['context'],
        notes: form.notes || undefined,
        measured_at: new Date(form.date || Date.now()).toISOString(),
      });
      setForm({ value_mgdl: '', context: 'random', notes: '', date: new Date().toISOString().slice(0, 10) });
      loadGlucose(range);
    } catch { setError('Failed to record glucose reading'); }
    finally { setSubmitting(false); }
  }

  function startEdit(g: Glucose) {
    setEditingId(g.id);
    setEditValues({ value_mgdl: String(g.value_mgdl), context: g.context || 'random', date: g.measured_at.slice(0, 10), notes: g.notes || '' });
  }

  function cancelEdit() { setEditingId(null); }

  async function saveEdit() {
    if (editingId === null) return;
    setSavingEdit(true);
    try {
      await updateGlucose(editingId, {
        value_mgdl: Number(editValues.value_mgdl),
        context: editValues.context as Glucose['context'],
        notes: editValues.notes || null,
        measured_at: new Date(editValues.date || Date.now()).toISOString(),
      });
      setEditingId(null);
      loadGlucose(range);
    } catch { setError('Failed to update reading'); }
    finally { setSavingEdit(false); }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGlucose(id);
      loadGlucose(range);
    } catch { setError('Failed to delete reading'); }
  }

  const sorted = glucoseData ? [...glucoseData].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()) : [];
  const chartData = sorted.map((g) => ({ date: formatDate(g.measured_at), timestamp: g.measured_at, value: g.value_mgdl, type: g.context }));
  const values = sorted.map((g) => g.value_mgdl);
  const stats = values.length > 0 ? { min: Math.min(...values), max: Math.max(...values), avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length), count: values.length } : null;
  const contextTypes = [...new Set(sorted.map((g) => g.context).filter((c): c is NonNullable<typeof c> => c !== null))];
  const reversed = sorted.slice().reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Glucose</h1>

      {/* Entry Form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Record Glucose</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="glucose-value">Value (mg/dL)</Label>
                <Input id="glucose-value" type="number" inputMode="numeric" placeholder="120" value={form.value_mgdl} onChange={(e) => setForm({ ...form, value_mgdl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="glucose-context">Context</Label>
                <Select value={form.context} onValueChange={(v) => setForm({ ...form, context: v })}>
                  <SelectTrigger id="glucose-context"><SelectValue placeholder="Select context" /></SelectTrigger>
                  <SelectContent>{CONTEXTS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="glucose-date">Date</Label>
                <Input id="glucose-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="glucose-notes">Notes</Label>
                <Input id="glucose-notes" placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="min-h-[44px]">{submitting ? 'Recording...' : 'Record Glucose'}</Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className={`text-2xl font-bold tabular-nums ${glucoseColor(stats.min)}`}>{stats.min}</p><p className="text-xs text-muted-foreground">mg/dL</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average</CardTitle><Minus className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className={`text-2xl font-bold tabular-nums ${glucoseColor(stats.avg)}`}>{stats.avg}</p><p className="text-xs text-muted-foreground">mg/dL</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className={`text-2xl font-bold tabular-nums ${glucoseColor(stats.max)}`}>{stats.max}</p><p className="text-xs text-muted-foreground">mg/dL</p></CardContent>
          </Card>
        </div>
      )}

      {/* All Readings — scrollable, 4 visible */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Droplet className="h-4 w-4 text-muted-foreground" />All Readings</CardTitle>
        </CardHeader>
        <CardContent>
          {glucoseData === null ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>
          ) : glucoseData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No readings yet. Record one above.</p>
          ) : (
            <div className="max-h-[340px] overflow-y-auto -mx-2 px-2 space-y-2">
              {reversed.map((g) => {
                const isEditing = editingId === g.id;
                return (
                  <div key={g.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isEditing ? 'bg-accent/30 border-primary/30' : 'bg-card hover:bg-accent/10'}`}>
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Value</Label>
                            <Input className="h-11 text-sm" type="number" inputMode="numeric" value={editValues.value_mgdl} onChange={e => setEditValues({ ...editValues, value_mgdl: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Context</Label>
                            <Select value={editValues.context} onValueChange={v => setEditValues({ ...editValues, context: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{CONTEXTS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Date</Label>
                            <Input className="h-8 text-sm" type="date" value={editValues.date} onChange={e => setEditValues({ ...editValues, date: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Notes</Label>
                            <Input className="h-8 text-sm" value={editValues.notes} onChange={e => setEditValues({ ...editValues, notes: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }} />
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" className="min-h-[44px]" onClick={saveEdit} disabled={savingEdit}>{savingEdit ? '...' : 'Save'}</Button>
                          <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-lg font-semibold tabular-nums ${glucoseColor(g.value_mgdl)}`}>{g.value_mgdl}</span>
                            <span className="text-xs text-muted-foreground">mg/dL</span>
                            <Badge variant="outline" className="text-xs">{contextLabel(g.context)}</Badge>
                            {g.notes && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{g.notes}</span>}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(g.measured_at)}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-primary" onClick={() => startEdit(g)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(g.id)} title="Delete"><X className="h-4 w-4" /></Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Trends</h2></div>
        <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v))}>
          <TabsList>{TIME_RANGES.map((r) => (<TabsTrigger key={r.value} value={String(r.value)} className="min-h-[44px]">{r.label}</TabsTrigger>))}</TabsList>
          {TIME_RANGES.map((r) => (
            <TabsContent key={r.value} value={String(r.value)} className="space-y-4">
              {glucoseData === null ? (
                <Card><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
              ) : glucoseData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No glucose readings in this period.</p>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Droplet className="h-4 w-4 text-muted-foreground" />Glucose Trend</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} />
                          <Tooltip />
                          <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: '70', position: 'left', fontSize: 10 }} />
                          <ReferenceLine y={180} stroke="hsl(45 93% 47%)" strokeDasharray="4 4" label={{ value: '180', position: 'left', fontSize: 10 }} />
                          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Glucose" />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 mt-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" />Low &lt;70</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" />Normal 70-180</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block" />High 180-250</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" />Critical &gt;250</span>
                      </div>
                    </CardContent>
                  </Card>
                  {contextTypes.length > 1 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Context</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                            <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} />
                            <Tooltip />
                            <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                            <ReferenceLine y={180} stroke="hsl(45 93% 47%)" strokeDasharray="4 4" />
                            {contextTypes.map((type) => (
                              <Line key={type} type="monotone" dataKey="value" data={chartData.filter((d) => d.type === type)} stroke={CONTEXT_COLORS[type] ?? 'hsl(var(--muted-foreground))'} strokeWidth={2} dot name={contextLabel(type)} connectNulls />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
