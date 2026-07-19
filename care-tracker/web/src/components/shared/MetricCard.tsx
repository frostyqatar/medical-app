import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'urgent' | 'info';
  className?: string;
};

const toneBorder: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'border-border',
  success: 'border-success/30',
  warning: 'border-warning/30',
  urgent: 'border-urgent/30',
  info: 'border-info/30',
};

export function MetricCard({ label, value, unit, hint, tone = 'default', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-soft',
        toneBorder[tone],
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
