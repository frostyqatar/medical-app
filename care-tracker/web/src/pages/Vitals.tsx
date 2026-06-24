import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Activity, Heart, Thermometer, Scale, Waves, X } from 'lucide-react';
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
} from 'recharts';
import { fetchVitals, fetchLatestVitals, createVital, deleteVital } from '@/api';
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

const chartMargin = { top: 5, right: 10, left: 0, bottom: 0 };

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
                <button
                  onClick={async () => {
                    if (!window.confirm('Delete this vitals reading?')) return;
                    await deleteVital(latest.id);
                    loadVitals(range);
                    fetchLatestVitals().then((v) => setLatest(v ?? null)).catch(() => setLatest(null));
                  }}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
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
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <LineChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="bp_sys" fill="url(#gradSys)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls name="Systolic" />
                          <Line type="monotone" dataKey="bp_dia" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} connectNulls name="Diastolic" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Heart Rate Chart */}
                  {hasHr && (
                    <ChartCard title="Heart Rate (bpm)" icon={Heart}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={100} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="hr" fill="url(#gradHr)" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls name="Heart Rate" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Temperature Chart */}
                  {hasTemp && (
                    <ChartCard title="Temperature (°C)" icon={Thermometer}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={37.5} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="temp_c" fill="url(#gradTemp)" stroke="#f97316" strokeWidth={2} dot={false} connectNulls name="Temperature" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* SpO2 Chart */}
                  {hasSpo2 && (
                    <ChartCard title="SpO₂ (%)" icon={Waves}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} domain={[80, 100]} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={92} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                          <ReferenceLine y={95} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="spo2" fill="url(#gradSpo2)" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls name="SpO₂" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Weight Chart */}
                  {hasWeight && (
                    <ChartCard title="Weight (kg)" icon={Scale}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData} margin={chartMargin}>
                          {gradientDefs}
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="weight_kg" fill="url(#gradWeight)" stroke="#8b5cf6" strokeWidth={2} dot={false} connectNulls name="Weight" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
