import { NavLink } from 'react-router-dom';
import { Download, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MORE_NAV_ITEMS } from '@/components/shared/navConfig';

type MoreSheetProps = {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onLogout: () => void;
  exporting?: boolean;
};

export function MoreSheet({ open, onClose, onExport, onLogout, exporting }: MoreSheetProps) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="More navigation">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border bg-card shadow-lift animate-fade-in pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-semibold">More</p>
            <p className="text-xs text-muted-foreground">Tracking, care & account</p>
          </div>
          <Button variant="ghost" size="touchIcon" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="grid gap-1 p-3">
          {MORE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 min-h-[52px] transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                )
              }
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.description}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mb-2 border-t pt-2 space-y-1">
          <button
            type="button"
            onClick={() => {
              onExport();
              onClose();
            }}
            disabled={exporting}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 min-h-[52px] text-left hover:bg-muted"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-muted-foreground">
              <Download className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{exporting ? 'Exporting…' : 'Export data'}</span>
              <span className="block text-xs text-muted-foreground">Download JSON backup</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 min-h-[52px] text-left hover:bg-muted text-destructive"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Sign out</span>
              <span className="block text-xs text-muted-foreground/80">End this session</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
