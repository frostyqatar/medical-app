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
                    <ChartCard title="Blood Pressure" icon={Activity}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="bp_sys"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            name="Systolic"
                            connectNulls
                          />
                          <Line
                            type="monotone"
                            dataKey="bp_dia"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={2}
                            dot={false}
                            name="Diastolic"
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Heart Rate Chart */}
                  {hasHr && (
                    <ChartCard title="Heart Rate" icon={Heart}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="hr"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            name="Heart Rate"
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Temperature Chart */}
                  {hasTemp && (
                    <ChartCard title="Temperature" icon={Thermometer}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="temp_c"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary) / 0.15)"
                            strokeWidth={2}
                            dot={false}
                            name="Temperature"
                            connectNulls
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* SpO2 Chart */}
                  {hasSpo2 && (
                    <ChartCard title="SpO₂" icon={Waves}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} domain={[80, 100]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="spo2"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            name="SpO₂"
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Weight Chart */}
                  {hasWeight && (
                    <ChartCard title="Weight" icon={Scale}>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="weight_kg"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            name="Weight"
                            connectNulls
                          />
                        </LineChart>
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
