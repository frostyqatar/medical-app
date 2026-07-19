import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Pill,
  Activity,
  Droplet,
  ListTodo,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState } from '@/components/shared/EmptyState';

function formatContext(
  meds: Medication[] | null,
  vitals: Vital | null | undefined,
  glucose: Glucose | null | undefined,
  alerts: AlertResponse | null,
  actions: ActionItem[] | null,
) {
  const parts: string[] = [];
  if (meds) parts.push(`Medications: ${meds.map((m) => `${m.drug} ${m.dose} (${m.purpose})`).join('; ')}`);
  if (vitals)
    parts.push(
      `Latest vitals: BP ${vitals.bp_sys}/${vitals.bp_dia}, HR ${vitals.hr}, Temp ${vitals.temp_c}°C, SpO2 ${vitals.spo2}%`,
    );
  if (glucose) parts.push(`Latest glucose: ${glucose.value_mgdl} mg/dL (${glucose.context})`);
  if (alerts) parts.push(`Active alerts: ${alerts.count} — ${alerts.alerts.slice(0, 5).join(' | ')}`);
  if (actions) parts.push(`HIGH priority actions: ${actions.map((a) => a.item).join('; ')}`);
  return parts.join('\n');
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
  useEffect(() => {
    pushContext();
  }, [pushContext]);

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

  const remaining = medications?.filter((m) => !checkedMeds.has(m.id)).length ?? 0;
  const takenCount = medications ? medications.length - remaining : 0;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={greeting()}
        title="Today"
        description="What needs attention right now — medicines, readings, and open priorities."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/weekly-summary">
              Weekly summary
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      {alerts && alerts.count > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {alerts.count} active alert{alerts.count === 1 ? '' : 's'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {alerts.alerts[0]}
              {alerts.count > 1 ? ` · +${alerts.count - 1} more below` : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Meds remaining"
          value={medications === null ? '—' : remaining}
          hint={medications ? `${takenCount} marked taken` : 'Loading…'}
          tone={remaining > 0 ? 'info' : 'success'}
        />
        <MetricCard
          label="Latest glucose"
          value={glucose === undefined ? '—' : glucose === null ? '—' : glucose.value_mgdl}
          unit={glucose ? 'mg/dL' : undefined}
          hint={glucose ? formatDateTime(glucose.measured_at) : 'No reading yet'}
        />
        <MetricCard
          label="Blood pressure"
          value={
            vitals === undefined || vitals === null
              ? '—'
              : `${vitals.bp_sys ?? '—'}/${vitals.bp_dia ?? '—'}`
          }
          unit={vitals ? 'mmHg' : undefined}
          hint={vitals ? formatDateTime(vitals.measured_at) : 'No vitals yet'}
        />
      </div>

      <SectionCard
        title="Due medications"
        icon={Pill}
        href="/medications"
        badge={
          remaining > 0 ? (
            <Badge variant="info" className="ml-1">
              {remaining} left
            </Badge>
          ) : medications && medications.length > 0 ? (
            <Badge variant="success" className="ml-1">
              All done
            </Badge>
          ) : null
        }
      >
        {medications === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <EmptyState icon={Pill} title="No active medications" description="Add medicines from the Medications page." />
        ) : (
          <ul className="divide-y">
            {medications.map((med) => {
              const taken = checkedMeds.has(med.id);
              return (
                <li key={med.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Checkbox
                    checked={taken}
                    onCheckedChange={() => handleMedCheck(med)}
                    aria-label={`Mark ${med.drug} as ${taken ? 'not taken' : 'taken'}`}
                    className="h-5 w-5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${taken ? 'line-through text-muted-foreground' : ''}`}>
                      {med.drug}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {med.dose} · {med.schedule}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="touchIcon"
                    aria-label={`Ask about ${med.drug}`}
                    onClick={() => sendMessage(`what is ${med.drug}?`)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {errors.medications && <p className="text-sm text-destructive mt-2">{errors.medications}</p>}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Latest vitals" icon={Activity} href="/vitals">
          {vitals === undefined ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : vitals === null ? (
            <EmptyState
              icon={Activity}
              title="No vitals yet"
              description="Record blood pressure, heart rate, and more."
              action={
                <Button asChild size="sm">
                  <Link to="/vitals">Record vitals</Link>
                </Button>
              }
            />
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">{formatDateTime(vitals.measured_at)}</p>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCard label="BP" value={`${vitals.bp_sys ?? '—'}/${vitals.bp_dia ?? '—'}`} unit="mmHg" />
                <MetricCard label="Heart rate" value={vitals.hr ?? '—'} unit="bpm" />
                <MetricCard
                  label="Temp"
                  value={vitals.temp_c != null ? vitals.temp_c : '—'}
                  unit={vitals.temp_c != null ? '°C' : undefined}
                />
                <MetricCard
                  label="SpO₂"
                  value={vitals.spo2 != null ? vitals.spo2 : '—'}
                  unit={vitals.spo2 != null ? '%' : undefined}
                />
              </div>
            </>
          )}
          {errors.vitals && <p className="text-sm text-destructive mt-2">{errors.vitals}</p>}
        </SectionCard>

        <SectionCard title="Latest glucose" icon={Droplet} href="/glucose">
          {glucose === undefined ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : glucose === null ? (
            <EmptyState
              icon={Droplet}
              title="No glucose readings"
              action={
                <Button asChild size="sm">
                  <Link to="/glucose">Log glucose</Link>
                </Button>
              }
            />
          ) : (
            <div className="flex items-end gap-3">
              <div>
                <p className="text-4xl font-semibold tabular-nums tracking-tight">{glucose.value_mgdl}</p>
                <p className="text-sm text-muted-foreground mt-1">mg/dL</p>
              </div>
              <div className="ml-auto text-right space-y-1">
                {glucose.context && <Badge variant="outline">{glucose.context}</Badge>}
                <p className="text-xs text-muted-foreground">{formatDateTime(glucose.measured_at)}</p>
              </div>
            </div>
          )}
          {errors.glucose && <p className="text-sm text-destructive mt-2">{errors.glucose}</p>}
        </SectionCard>
      </div>

      <SectionCard
        title="Active alerts"
        icon={AlertTriangle}
        badge={
          alerts && alerts.count > 0 ? (
            <Badge variant="warning" className="ml-1">
              {alerts.count}
            </Badge>
          ) : null
        }
      >
        {alerts === null ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : alerts.alerts.length === 0 ? (
          <EmptyState title="No active alerts" description="Things look calm based on recent data." />
        ) : (
          <ul className="space-y-2">
            {alerts.alerts.map((alert, i) => (
              <li
                key={i}
                className="flex gap-2.5 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5 text-sm"
              >
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        )}
        {errors.alerts && <p className="text-sm text-destructive">{errors.alerts}</p>}
      </SectionCard>

      <SectionCard
        title="High-priority actions"
        icon={ListTodo}
        href="/action-items"
        badge={
          actions && actions.length > 0 ? (
            <Badge variant="urgent" className="ml-1">
              {actions.length}
            </Badge>
          ) : null
        }
      >
        {actions === null ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : actions.length === 0 ? (
          <EmptyState title="No open high-priority actions" />
        ) : (
          <ul className="divide-y">
            {actions.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Badge variant="urgent" className="mt-0.5 shrink-0">
                  {item.priority}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.item}</p>
                  {item.category && <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {errors.actions && <p className="text-sm text-destructive mt-2">{errors.actions}</p>}
      </SectionCard>
    </div>
  );
}
