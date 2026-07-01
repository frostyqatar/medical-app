import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Pill, Activity, Droplet, ListTodo, Sparkles } from 'lucide-react';
import {
  fetchMedications,
  fetchLatestVitals,
  fetchLatestGlucose,
  fetchAlerts,
  fetchActionItems,
  logMedication,
  undoMedicationLog,
} from '@/api';
import type { Medication, Vital, Glucose, AlertResponse, ActionItem } from '@/api';
import { usePageContext } from '@/context/ChatContext';
import { useChatContext } from '@/context/ChatContext';

function formatContext(meds: Medication[] | null, vitals: Vital | null | undefined, glucose: Glucose | null | undefined, alerts: AlertResponse | null, actions: ActionItem[] | null) {
  const parts: string[] = []
  if (meds) parts.push(`Medications: ${meds.map(m => `${m.drug} ${m.dose} (${m.purpose})`).join('; ')}`)
  if (vitals) parts.push(`Latest vitals: BP ${vitals.bp_sys}/${vitals.bp_dia}, HR ${vitals.hr}, Temp ${vitals.temp_c}°C, SpO2 ${vitals.spo2}%`)
  if (glucose) parts.push(`Latest glucose: ${glucose.value_mgdl} mg/dL (${glucose.context})`)
  if (alerts) parts.push(`Active alerts: ${alerts.count} — ${alerts.alerts.slice(0,5).join(' | ')}`)
  if (actions) parts.push(`HIGH priority actions: ${actions.map(a => a.item).join('; ')}`)
  return parts.join('\n')
}

function SectionHeader({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="font-medium">{title}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="ml-auto">
          {badge}
        </Badge>
      )}
    </div>
  );
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

export default function Today() {
  const [medications, setMedications] = useState<Medication[] | null>(null);
  const [vitals, setVitals] = useState<Vital | null | undefined>(undefined);
  const [glucose, setGlucose] = useState<Glucose | null | undefined>(undefined);
  const [alerts, setAlerts] = useState<AlertResponse | null>(null);
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [checkedMeds, setCheckedMeds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMedications(true)
      .then(setMedications)
      .catch(() => setErrors((e) => ({ ...e, medications: 'Failed to load medications' })));

    fetchLatestVitals()
      .then((v) => setVitals(v ?? null))
      .catch(() => setErrors((e) => ({ ...e, vitals: 'Failed to load vitals' })));

    fetchLatestGlucose()
      .then((g) => setGlucose(g ?? null))
      .catch(() => setErrors((e) => ({ ...e, glucose: 'Failed to load glucose' })));

    fetchAlerts()
      .then(setAlerts)
      .catch(() => setErrors((e) => ({ ...e, alerts: 'Failed to load alerts' })));

    fetchActionItems('open', 'HIGH')
      .then(setActions)
      .catch(() => setErrors((e) => ({ ...e, actions: 'Failed to load action items' })));
  }, []);

  const pushContext = usePageContext(formatContext(medications, vitals, glucose, alerts, actions));
  useEffect(() => { pushContext() }, [pushContext]);

  const { sendMessage } = useChatContext();

  async function handleMedCheck(med: Medication) {
    if (checkedMeds.has(med.id)) {
      setCheckedMeds((prev) => {
        const next = new Set(prev);
        next.delete(med.id);
        return next;
      });
      try {
        await undoMedicationLog(med.id);
      } catch {
        setCheckedMeds((prev) => new Set(prev).add(med.id));
      }
    } else {
      setCheckedMeds((prev) => new Set(prev).add(med.id));
      try {
        await logMedication({
          med_id: med.id,
          scheduled_for: new Date().toISOString(),
          status: 'taken',
        });
      } catch {
        setCheckedMeds((prev) => {
          const next = new Set(prev);
          next.delete(med.id);
          return next;
        });
      }
    }
  }

  const activeUncheckedMeds = medications?.filter((m) => !checkedMeds.has(m.id)) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>

      {/* Due Medications */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={Pill}
            title="Due Medications"
            badge={activeUncheckedMeds.length}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {medications === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : medications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active medications.</p>
          ) : (
            medications.map((med) => {
              const taken = checkedMeds.has(med.id);
              return (
                <div
                  key={med.id}
                  className="flex items-center gap-2 py-1.5"
                >
                  <Checkbox
                    checked={taken}
                    onCheckedChange={() => handleMedCheck(med)}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        taken ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {med.drug}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {med.dose} &middot; {med.schedule}
                    </p>
                    {med.description && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 whitespace-normal">{med.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => sendMessage(`what is ${med.drug}?`)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary shrink-0"
                    title={`Ask about ${med.drug}`}
                    aria-label={`Ask AI about ${med.drug}`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Latest Vitals */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Latest Vitals" />
        </CardHeader>
        <CardContent>
          {vitals === undefined ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : vitals === null ? (
            <p className="text-sm text-muted-foreground py-2">No vitals recorded yet.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                {formatDateTime(vitals.measured_at)}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {vitals.bp_sys ?? '—'} / {vitals.bp_dia ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {vitals.hr ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {vitals.temp_c != null
                      ? `${vitals.temp_c}°C`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SpO₂</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {vitals.spo2 != null
                      ? `${vitals.spo2}%`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {vitals.weight_kg != null ? `${vitals.weight_kg} kg` : '—'}
                  </p>
                </div>
              </div>
            </>
          )}
          {errors.vitals && (
            <p className="text-sm text-destructive mt-2">{errors.vitals}</p>
          )}
        </CardContent>
      </Card>

      {/* Latest Glucose */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Droplet} title="Latest Glucose" />
        </CardHeader>
        <CardContent>
          {glucose === undefined ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ) : glucose === null ? (
            <p className="text-sm text-muted-foreground py-2">No glucose readings yet.</p>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold tabular-nums">
                {glucose.value_mgdl}
              </span>
              <span className="text-sm text-muted-foreground">mg/dL</span>
              {glucose.context && (
                <Badge variant="outline">{glucose.context}</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDateTime(glucose.measured_at)}
              </span>
            </div>
          )}
          {errors.glucose && (
            <p className="text-sm text-destructive mt-2">{errors.glucose}</p>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={AlertTriangle}
            title="Active Alerts"
            badge={alerts?.count ?? 0}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts === null ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : alerts.alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active alerts.</p>
          ) : (
            alerts.alerts.map((alert, i) => (
              <Alert key={i} variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{alert}</AlertTitle>
              </Alert>
            ))
          )}
          {errors.alerts && (
            <p className="text-sm text-destructive">{errors.alerts}</p>
          )}
        </CardContent>
      </Card>

      {/* Open HIGH Priority Actions */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={ListTodo}
            title="Open HIGH Priority Actions"
            badge={actions?.length ?? 0}
          />
        </CardHeader>
        <CardContent>
          {actions === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : actions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No open high-priority actions.</p>
          ) : (
            <div className="space-y-2">
              {actions.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-1">
                  <Badge
                    variant={item.priority === 'HIGH' ? 'destructive' : 'outline'}
                    className="mt-0.5 shrink-0"
                  >
                    {item.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.item}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.category}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.actions && (
            <p className="text-sm text-destructive mt-2">{errors.actions}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
