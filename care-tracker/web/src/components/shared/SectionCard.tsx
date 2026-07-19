import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SectionCardProps = {
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SectionCard({
  title,
  icon: Icon,
  badge,
  href,
  hrefLabel = 'View all',
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section className={cn('rounded-xl border bg-card shadow-sm overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 border-b bg-surface/50 px-4 py-3 sm:px-5">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {badge}
        {href && (
          <Link
            to={href}
            className="ml-auto inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
          >
            {hrefLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className={cn('p-4 sm:p-5', contentClassName)}>{children}</div>
    </section>
  );
}
