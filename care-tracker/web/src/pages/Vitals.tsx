import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Activity, Heart, Thermometer, Scale, Waves, X, Pencil } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ReferenceArea,
  Brush,
} from 'recharts';
import { fetchVitals, fetchLatestVitals, createVital, deleteVital, updateVital } from '@/api';
import type { Vital } from '@/api';

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
] as const;

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CHART_HEIGHT = 200;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
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
  );
};

const gradientDefs = (
  <defs>
    <linearGradient id="gradSys" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} /></linearGradient>
    <linearGradient id="gradDia" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} /><stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.02} /></linearGradient>
    <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient>
    <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.2} /><stop offset="100%" stopColor="#f97316" stopOpacity={0.02} /></linearGradient>
    <linearGradient id="gradSpo2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
    <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient>
  </defs>
);

const chartMargin = { top: 5, right: 15, left: 0, bottom: 0 };

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function VitalsPage() {
  const [vitals, setVitals] = useState<Vital[] | null>(null);
  const [latest, setLatest] = useState<Vital | null | undefined>(undefined);
  const [range, setRange] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    bp_sys: '',
    bp_dia: '',
    hr: '',
    temp_c: '',
    spo2: '',
    weight_kg: '',
    notes: '',
  });

  const loadVitals = useCallback(async (days: number) => {
    setVitals(null);
    try {
      const data = await fetchVitals(days);
      setVitals(data);
      setError(null);
    } catch {
      setError('Failed to load vitals');
    }
  }, []);

  useEffect(() => {
    loadVitals(range);
  }, [range, loadVitals]);

  useEffect(() => {
    fetchLatestVitals()
      .then((v) => setLatest(v ?? null))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
      });
      setForm({
        bp_sys: '',
        bp_dia: '',
        hr: '',
        temp_c: '',
        spo2: '',
        weight_kg: '',
        notes: '',
      });
      loadVitals(range);
      fetchLatestVitals()
        .then((v) => setLatest(v ?? null))
        .catch(() => {});
    } catch {
      setError('Failed to record vitals');
    } finally {
      setSubmitting(false);
    }
  }

  function loadAll() { loadVitals(range); fetchLatestVitals().then(v => setLatest(v ?? null)).catch(() => {}) }

  const EMPTY = { bp_sys: '', bp_dia: '', hr: '', temp_c: '', spo2: '', weight_kg: '', notes: '' }
  const [editing, setEditing] = useState<Vital | null>(null)
  const [editForm, setEditForm] = useState(EMPTY)

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

  async function handleDeleteVital(id: number) { await deleteVital(id); loadAll() }

  const sorted = vitals ? [...vitals].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()) : []

  const chartData = vitals
    ? [...vitals]
        .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
        .map((v) => ({
          date: formatDate(v.measured_at),
          measured_at: v.measured_at,
          bp_sys: v.bp_sys,
          bp_dia: v.bp_dia,
          hr: v.hr,
          temp_c: v.temp_c,
          spo2: v.spo2,
          weight_kg: v.weight_kg,
        }))
    : [];

  const hasBp = vitals?.some((v) => v.bp_sys != null || v.bp_dia != null);
  const hasHr = vitals?.some((v) => v.hr != null);
  const hasTemp = vitals?.some((v) => v.temp_c != null);
  const hasSpo2 = vitals?.some((v) => v.spo2 != null);
  const hasWeight = vitals?.some((v) => v.weight_kg != null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Vitals</h1>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bp_sys">Systolic BP</Label>
                <Input
                  id="bp_sys"
                  type="number"
                  inputMode="numeric"
                  placeholder="120"
                  value={form.bp_sys}
                  onChange={(e) => setForm({ ...form, bp_sys: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bp_dia">Diastolic BP</Label>
                <Input
                  id="bp_dia"
                  type="number"
                  inputMode="numeric"
                  placeholder="80"
                  value={form.bp_dia}
                  onChange={(e) => setForm({ ...form, bp_dia: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hr">Heart Rate</Label>
                <Input
                  id="hr"
                  type="number"
                  inputMode="numeric"
                  placeholder="72"
                  value={form.hr}
                  onChange={(e) => setForm({ ...form, hr: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temp_c">Temperature (°C)</Label>
                <Input
                  id="temp_c"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="36.6"
                  value={form.temp_c}
                  onChange={(e) => setForm({ ...form, temp_c: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spo2">SpO₂ (%)</Label>
                <Input
                  id="spo2"
                  type="number"
                  inputMode="numeric"
                  placeholder="98"
                  value={form.spo2}
                  onChange={(e) => setForm({ ...form, spo2: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="70"
                  value={form.weight_kg}
                  onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={submitting} className="min-h-[44px]">
              {submitting ? 'Recording...' : 'Record Vitals'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Latest Values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Latest Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latest === undefined ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : latest === null ? (
            <p className="text-sm text-muted-foreground py-2">No vitals recorded yet.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(latest.measured_at)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(latest)}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-primary/10 text-muted-foreground hover:text-primary shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Delete this vitals reading?')) return;
                      await handleDeleteVital(latest.id);
                    }}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Pressure</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {latest.bp_sys != null ? latest.bp_sys : 'N/A'} / {latest.bp_dia != null ? latest.bp_dia : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">mmHg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {latest.hr != null ? `${latest.hr} bpm` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {latest.temp_c != null
                        ? `${latest.temp_c}°C`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SpO₂</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {latest.spo2 != null
                        ? `${latest.spo2}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {latest.weight_kg != null ? `${latest.weight_kg} kg` : 'N/A'}
                    </p>
                  </div>
                </div>
              {latest.notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">{latest.notes}</p>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trends</h2>
        </div>

        <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v))}>
          <TabsList>
            {TIME_RANGES.map((r) => (
              <TabsTrigger key={r.value} value={String(r.value)} className="min-h-[44px]">
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TIME_RANGES.map((r) => (
            <TabsContent key={r.value} value={String(r.value)} className="space-y-4">
              {vitals === null ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[200px] w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : vitals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No vitals recorded in this period.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* BP Chart */}
                  {hasBp && (
                    <ChartCard title="Blood Pressure (mmHg)" icon={Activity}>
                      <div className="[&_.recharts-wrapper]:cursor-grab [&_.recharts-wrapper]:active:cursor-grabbing" style={{ overflow: 'visible' }}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <LineChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} yAxisId="left" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <ReferenceArea y1={180} y2={250} yAxisId="left" fill="#ef4444" fillOpacity={0.06} />
                          <ReferenceArea y1={140} y2={180} yAxisId="left" fill="#f97316" fillOpacity={0.06} />
                          <ReferenceArea y1={0} y2={90} yAxisId="left" fill="#ef4444" fillOpacity={0.06} />
                          <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="bp_sys" fill="url(#gradSys)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls name="Systolic" yAxisId="left" />
                          <Line type="monotone" dataKey="bp_dia" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} connectNulls name="Diastolic" yAxisId="left" />
                          <Brush dataKey="date" height={24} stroke="hsl(var(--border))" tickFormatter={() => ''} travellerWidth={8} />
                        </LineChart>
                      </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  )}

                  {/* Heart Rate Chart */}
                  {hasHr && (
                    <ChartCard title="Heart Rate (bpm)" icon={Heart}>
                      <div className="[&_.recharts-wrapper]:cursor-grab [&_.recharts-wrapper]:active:cursor-grabbing" style={{ overflow: 'visible' }}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceArea y1={110} y2={200} fill="#ef4444" fillOpacity={0.06} />
                          <ReferenceArea y1={0} y2={50} fill="#ef4444" fillOpacity={0.06} />
                          <ReferenceArea y1={100} y2={110} fill="#f97316" fillOpacity={0.06} />
                          <ReferenceLine y={100} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="hr" fill="url(#gradHr)" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls name="Heart Rate" />
                          <Brush dataKey="date" height={24} stroke="hsl(var(--border))" tickFormatter={() => ''} travellerWidth={8} />
                        </AreaChart>
                      </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  )}

                  {/* Temperature Chart */}
                  {hasTemp && (
                    <ChartCard title="Temperature (°C)" icon={Thermometer}>
                      <div className="[&_.recharts-wrapper]:cursor-grab [&_.recharts-wrapper]:active:cursor-grabbing" style={{ overflow: 'visible' }}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceArea y1={38} y2={42} fill="#ef4444" fillOpacity={0.06} />
                          <ReferenceArea y1={37.5} y2={38} fill="#f97316" fillOpacity={0.06} />
                          <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={37.5} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="temp_c" fill="url(#gradTemp)" stroke="#f97316" strokeWidth={2} dot={false} connectNulls name="Temperature" />
                          <Brush dataKey="date" height={24} stroke="hsl(var(--border))" tickFormatter={() => ''} travellerWidth={8} />
                        </AreaChart>
                      </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  )}

                  {/* SpO2 Chart */}
                  {hasSpo2 && (
                    <ChartCard title="SpO₂ (%)" icon={Waves}>
                      <div className="[&_.recharts-wrapper]:cursor-grab [&_.recharts-wrapper]:active:cursor-grabbing" style={{ overflow: 'visible' }}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} domain={[80, 100]} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceArea y1={0} y2={92} fill="#ef4444" fillOpacity={0.06} />
                          <ReferenceArea y1={92} y2={95} fill="#f97316" fillOpacity={0.06} />
                          <ReferenceLine y={92} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={95} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="spo2" fill="url(#gradSpo2)" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls name="SpO₂" />
                          <Brush dataKey="date" height={24} stroke="hsl(var(--border))" tickFormatter={() => ''} travellerWidth={8} />
                        </AreaChart>
                      </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  )}

                  {/* Weight Chart */}
                  {hasWeight && (
                    <ChartCard title="Weight (kg)" icon={Scale}>
                      <div className="[&_.recharts-wrapper]:cursor-grab [&_.recharts-wrapper]:active:cursor-grabbing" style={{ overflow: 'visible' }}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="weight_kg" fill="url(#gradWeight)" stroke="#8b5cf6" strokeWidth={2} dot={false} connectNulls name="Weight" />
                          <Brush dataKey="date" height={24} stroke="hsl(var(--border))" tickFormatter={() => ''} travellerWidth={8} />
                        </AreaChart>
                      </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* History List */}
      {vitals && vitals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="space-y-2">
            {sorted.map(v => (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">{formatDateTime(v.measured_at)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(v)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteVital(v.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-muted-foreground">BP </span><span className="font-medium">{v.bp_sys != null ? `${v.bp_sys}/${v.bp_dia ?? '—'}` : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">HR </span><span className="font-medium">{v.hr != null ? v.hr : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Temp </span><span className="font-medium">{v.temp_c != null ? `${v.temp_c}°C` : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">SpO₂ </span><span className="font-medium">{v.spo2 != null ? `${v.spo2}%` : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Weight </span><span className="font-medium">{v.weight_kg != null ? `${v.weight_kg} kg` : 'N/A'}</span></div>
                  </div>
                  {v.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">{v.notes}</p>}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1"><Label htmlFor="e_bp_sys">Systolic BP</Label><Input id="e_bp_sys" type="number" inputMode="numeric" value={editForm.bp_sys} onChange={e => setEditForm(f => ({ ...f, bp_sys: e.target.value }))} /></div>
                <div className="space-y-1"><Label htmlFor="e_bp_dia">Diastolic BP</Label><Input id="e_bp_dia" type="number" inputMode="numeric" value={editForm.bp_dia} onChange={e => setEditForm(f => ({ ...f, bp_dia: e.target.value }))} /></div>
                <div className="space-y-1"><Label htmlFor="e_hr">Heart Rate</Label><Input id="e_hr" type="number" inputMode="numeric" value={editForm.hr} onChange={e => setEditForm(f => ({ ...f, hr: e.target.value }))} /></div>
                <div className="space-y-1"><Label htmlFor="e_temp">Temp (°C)</Label><Input id="e_temp" type="number" inputMode="decimal" step="0.1" value={editForm.temp_c} onChange={e => setEditForm(f => ({ ...f, temp_c: e.target.value }))} /></div>
                <div className="space-y-1"><Label htmlFor="e_spo2">SpO₂ (%)</Label><Input id="e_spo2" type="number" inputMode="numeric" value={editForm.spo2} onChange={e => setEditForm(f => ({ ...f, spo2: e.target.value }))} /></div>
                <div className="space-y-1"><Label htmlFor="e_weight">Weight (kg)</Label><Input id="e_weight" type="number" inputMode="decimal" step="0.1" value={editForm.weight_kg} onChange={e => setEditForm(f => ({ ...f, weight_kg: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="e_notes">Notes</Label><Input id="e_notes" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" className="min-h-[44px]" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
