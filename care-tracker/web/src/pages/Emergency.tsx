import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Thermometer,
  Footprints,
  Brain,
  Activity,
  Bandage,
  Phone,
  Pill,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { fetchExport } from '@/api';

const SYMPTOMS = [
  {
    icon: Brain,
    title: 'Possible sepsis pattern',
    detail: 'Drowsiness + feeling cold + rapid breathing',
    description: 'This combination may signal sepsis. Seek emergency care now.',
    level: 'critical' as const,
  },
  {
    icon: Footprints,
    title: 'Foot color or temperature change',
    detail: 'Left foot cold, pale, blue, or dark',
    description: 'Sudden vascular compromise risk — contact the care team today.',
    level: 'critical' as const,
  },
  {
    icon: Thermometer,
    title: 'Fever',
    detail: 'Temperature ≥ 38°C',
    description: 'Infection risk is elevated with amputation and diabetes history.',
    level: 'urgent' as const,
  },
  {
    icon: Bandage,
    title: 'Wound changes',
    detail: 'New odor, color change, or discharge',
    description: 'New drainage, odor, or discoloration on the left foot or stump.',
    level: 'urgent' as const,
  },
  {
    icon: Activity,
    title: 'New or worsening numbness',
    detail: 'Left-leg numbness',
    description: 'Any new or worsening sensation loss should be assessed urgently.',
    level: 'urgent' as const,
  },
  {
    icon: Activity,
    title: 'Uncontrolled pain',
    detail: 'Pain severity ≥ 7 / 10',
    description: 'Severe pain not controlled with current management needs review.',
    level: 'watch' as const,
  },
] as const;

function handleExport() {
  fetchExport()
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patient-export.json';
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((err) => console.error('Export failed:', err));
}

export default function Emergency() {
  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        eyebrow="Red flags"
        title="Emergency signs"
        description="If any of these appear, act now — do not wait for the next appointment."
      />

      <div className="sticky top-14 lg:top-4 z-30 -mx-1 px-1">
        <div className="rounded-2xl border border-urgent/40 bg-urgent text-urgent-foreground p-4 shadow-lift">
          <div className="flex items-start gap-3">
            <Phone className="h-6 w-6 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base">Seek urgent care now</p>
              <p className="text-sm text-urgent-foreground/90 mt-1 leading-relaxed">
                Contact the care team immediately or go to the nearest emergency department. If you
                cannot reach them, call emergency services.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm" className="bg-white text-urgent hover:bg-white/90">
                  <Link to="/medications">
                    <Pill className="h-3.5 w-3.5" />
                    Medication list
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={handleExport}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SYMPTOMS.map((symptom) => (
          <article
            key={symptom.title}
            className={
              symptom.level === 'critical'
                ? 'rounded-xl border border-urgent/35 bg-urgent/5 p-4'
                : symptom.level === 'urgent'
                  ? 'rounded-xl border border-warning/30 bg-warning/5 p-4'
                  : 'rounded-xl border bg-card p-4 shadow-sm'
            }
          >
            <div className="flex items-start gap-3">
              <span
                className={
                  symptom.level === 'critical'
                    ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-urgent/15 text-urgent'
                    : symptom.level === 'urgent'
                      ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning'
                      : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground'
                }
              >
                <symptom.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">{symptom.title}</h2>
                  <Badge
                    variant={
                      symptom.level === 'critical' ? 'urgent' : symptom.level === 'urgent' ? 'warning' : 'muted'
                    }
                  >
                    {symptom.level === 'critical' ? 'Act now' : symptom.level === 'urgent' ? 'Urgent' : 'Watch'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground/90">{symptom.detail}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{symptom.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-dashed bg-surface/70 px-4 py-3 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          This tracker flags items for human review. It does not provide medical advice — always
          confirm with the treating physician.
        </p>
      </div>
    </div>
  );
}
