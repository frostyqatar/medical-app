import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Activity, Droplet, Pill, AlertTriangle, CalendarClock } from 'lucide-react';
import { fetchWeeklySummary } from '@/api';
import type { WeeklySummaryData } from '@/api';

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

function severityLabel(severity: number) {
  if (severity <= 3) return 'mild';
  if (severity <= 6) return 'moderate';
  return 'severe';
}

function severityVariant(severity: number) {
  if (severity <= 3) return 'secondary' as const;
  if (severity <= 6) return 'default' as const;
  return 'destructive' as const;
}

const printStyles = `
  @media print {
    @page { size: A4; margin: 12mm; }
    body { background: white !important; font-size: 10pt; }
    .print\\:hidden { display: none !important; }
  }
`;

export default function WeeklySummaryPage() {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklySummary()
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load weekly summary')
      );
  }, []);

  const loading = !summary;

  const patient = summary?.patient ?? null;
  const vitalsRange = summary?.vitals_range ?? null;
  const glucoseSummary = summary?.glucose_summary ?? null;
  const adherence = summary?.adherence ?? null;
  const newSymptoms = summary?.new_symptoms ?? [];
  const wounds = summary?.wound_status ?? [];
  const labs = summary?.lab_summary ?? [];
  const highPriorityActions =
    summary?.high_priority_actions?.filter((a) => a.status === 'open') ?? [];
  const openActions = summary?.open_actions ?? [];
  const appointments = summary?.upcoming_appointments ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Summary</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{printStyles}</style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Summary</h1>
        <Button onClick={() => window.print()} variant="outline" className="min-h-[44px]">
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
      </div>

      <h1 className="text-xl font-semibold tracking-tight hidden print:block mb-4">
        Weekly Summary
      </h1>

      {/* Patient Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>{patient?.id ?? 'PT-ANON'}</span>
              {patient?.age != null && (
                <span className="text-muted-foreground">
                  Age: {patient.age}
                </span>
              )}
              {patient?.sex && (
                <span className="text-muted-foreground">
                  Sex: {patient.sex}
                </span>
              )}
              {patient?.mobility_note && (
                <Badge variant="outline">{patient.mobility_note}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vitals Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Vitals Range (Past 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Blood Pressure</p>
                <p className="text-base font-semibold tabular-nums">
                  {vitalsRange?.bp_sys_min != null && vitalsRange?.bp_dia_min != null
                    ? `${vitalsRange.bp_sys_min}/${vitalsRange.bp_dia_min} – ${vitalsRange.bp_sys_max}/${vitalsRange.bp_dia_max}`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">mmHg (min – max)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heart Rate</p>
                <p className="text-base font-semibold tabular-nums">
                  {vitalsRange?.hr_min != null
                    ? `${vitalsRange.hr_min} – ${vitalsRange.hr_max}`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="text-base font-semibold tabular-nums">
                  {vitalsRange?.temp_min != null
                    ? `${vitalsRange.temp_min} – ${vitalsRange.temp_max}°C`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SpO₂</p>
                <p className="text-base font-semibold tabular-nums">
                  {vitalsRange?.spo2_min != null
                    ? `${vitalsRange.spo2_min} – ${vitalsRange.spo2_max}%`
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Glucose Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            Glucose Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-base font-semibold tabular-nums">
                  {glucoseSummary?.min_val ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">mg/dL</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-base font-semibold tabular-nums">
                  {glucoseSummary?.max_val ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">mg/dL</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-base font-semibold tabular-nums">
                  {glucoseSummary?.avg_val != null
                    ? glucoseSummary.avg_val.toFixed(1)
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">mg/dL</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Readings</p>
                <p className="text-base font-semibold tabular-nums">
                  {glucoseSummary?.reading_count ?? 0}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medication Adherence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            Medication Adherence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {adherence && adherence.total > 0
                    ? `${((adherence.taken / adherence.total) * 100).toFixed(0)}%`
                    : '—'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {adherence?.taken ?? 0} taken / {adherence?.total ?? 0} scheduled
                </span>
              </div>
              <Progress
                value={
                  adherence && adherence.total > 0
                    ? (adherence.taken / adherence.total) * 100
                    : 0
                }
                className="h-3"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Symptoms This Week */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            New Symptoms This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : newSymptoms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No new symptoms reported.</p>
          ) : (
            <div className="space-y-2">
              {newSymptoms.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-1">
                  <Badge
                    variant={severityVariant(s.severity ?? 0)}
                    className="shrink-0"
                  >
                    {severityLabel(s.severity ?? 0)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.type ?? 'Unknown'}</p>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground">{s.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(s.noted_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wound Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Wound Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : wounds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No wound records.</p>
          ) : (
            <div className="space-y-3">
              {wounds.map((w) => (
                <div key={w.id} className="border rounded-md p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{w.site}</span>
                    {(!!w.odor || !!w.color_change) && (
                      <Badge variant="destructive">
                        Infection Signs
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDate(w.assessed_at)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                    {w.size_note && <span>Size: {w.size_note}</span>}
                    {w.discharge && <span>Discharge: {w.discharge}</span>}
                    {w.appearance && <span>Bed: {w.appearance}</span>}
                  </div>
                  {w.notes && (
                    <p className="text-xs text-muted-foreground">{w.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Changes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            Lab Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : labs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No recent lab results.</p>
          ) : (
            <div className="space-y-2">
              {labs.map((lab) => (
                <div key={lab.id} className="flex items-center gap-3 py-1">
                  {(lab.flag === 'H' || lab.flag === 'L') && (
                    <Badge variant="destructive" className="shrink-0">!</Badge>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{lab.test}</p>
                    <p className="text-xs text-muted-foreground">
                      {lab.value != null ? lab.value : '—'}
                      {lab.unit ? ` ${lab.unit}` : ''}
                      {(lab.ref_low != null || lab.ref_high != null) && (
                        <span className="ml-1">
                          (ref: {lab.ref_low ?? '—'}–{lab.ref_high ?? '—'})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(lab.measured_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open HIGH Priority Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Open HIGH Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : highPriorityActions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No open high-priority actions.</p>
          ) : (
            <div className="space-y-2">
              {highPriorityActions.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-1">
                  <Badge variant="destructive" className="mt-0.5 shrink-0">
                    HIGH
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.item}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-start gap-3 py-1">
                  <Badge variant="outline" className="shrink-0">
                    {apt.specialty ?? 'Appointment'}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(apt.scheduled_for)}
                      {apt.status && (
                        <span className="ml-2">
                          <Badge variant="outline">
                            {apt.status}
                          </Badge>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Open Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            All Open Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : openActions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No open actions.</p>
          ) : (
            <div className="space-y-2">
              {openActions.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-1">
                  <Badge
                    variant="outline"
                    className="shrink-0"
                  >
                    {item.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.item}</p>
                    {item.answer && (
                      <p className="text-xs text-muted-foreground">{item.answer}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      <div className="text-xs text-muted-foreground text-center pb-6 print:hidden">
        Weekly Summary Report
      </div>
    </div>
  );
}
