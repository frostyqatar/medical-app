import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Download,
  Droplet,
  FileText,
  FlaskConical,
  Home,
  ListTodo,
  LogOut,
  Menu,
  Pill,
  Stethoscope,
  StickyNote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPatient, fetchExport } from '@/api';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/api';
import { Button } from '@/components/ui/button';
import { MoreSheet } from '@/components/shared/MoreSheet';
import { MORE_NAV_ITEMS } from '@/components/shared/navConfig';

type NavItem = { to: string; label: string; icon: LucideIcon; fullLabel?: string };

const SIDEBAR_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Today',
    items: [
      { to: '/today', label: 'Today', icon: Home },
      { to: '/emergency', label: 'Emergency', icon: AlertTriangle },
    ],
  },
  {
    title: 'Track',
    items: [
      { to: '/medications', label: 'Medications', icon: Pill },
      { to: '/vitals', label: 'Vitals', icon: Activity },
      { to: '/glucose', label: 'Glucose', icon: Droplet },
      { to: '/labs', label: 'Labs', icon: FlaskConical },
      { to: '/symptoms', label: 'Symptoms', icon: Stethoscope },
    ],
  },
  {
    title: 'Care',
    items: [
      { to: '/appointments', label: 'Appointments', icon: CalendarClock },
      { to: '/action-items', label: 'Action items', icon: ListTodo },
      { to: '/plans', label: 'Plans', icon: ClipboardList },
      { to: '/notes', label: 'Notes', icon: StickyNote },
    ],
  },
  {
    title: 'Review',
    items: [{ to: '/weekly-summary', label: 'Weekly summary', icon: FileText }],
  },
];

const MOBILE_PRIMARY: NavItem[] = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/medications', label: 'Meds', icon: Pill },
  { to: '/vitals', label: 'Vitals', icon: Activity },
  { to: '/glucose', label: 'Glucose', icon: Droplet },
];

const MORE_PATHS = new Set(MORE_NAV_ITEMS.map((i) => i.to));

function handleExport() {
  return fetchExport()
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

function Sidebar() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [exporting, setExporting] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    fetchPatient()
      .then(setPatient)
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-border/80 bg-card">
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-[15px] leading-tight">Care Tracker</p>
          <p className="text-[11px] text-muted-foreground">Private care companion</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                      item.to === '/emergency' && !isActive && 'text-urgent hover:bg-urgent/10',
                      isActive && item.to === '/emergency' && 'bg-urgent text-urgent-foreground shadow-sm',
                      isActive && item.to !== '/emergency' && 'bg-primary text-primary-foreground shadow-sm',
                      !isActive && item.to !== '/emergency' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t px-4 py-4 space-y-2">
        <div className="rounded-xl bg-surface px-3 py-2.5 mb-2">
          <p className="text-sm font-semibold">{patient?.id ?? 'PT-ANON'}</p>
          {patient && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {patient.age != null && `${patient.age} y/o${patient.sex ? ` ${patient.sex}` : ''}`}
              {patient.mobility_note ? ` · ${patient.mobility_note}` : ''}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="touch"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            setExporting(true);
            handleExport().finally(() => setTimeout(() => setExporting(false), 600));
          }}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export data'}
        </Button>
        <Button variant="ghost" size="touch" className="w-full justify-start text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  return (
    <header
      className="lg:hidden sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Care Tracker</p>
          </div>
        </div>
        <Button asChild variant="urgent" size="sm" className="shrink-0 rounded-full">
          <NavLink to="/emergency" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Emergency
          </NavLink>
        </Button>
      </div>
    </header>
  );
}

function MobileNav({ onOpenMore, moreActive }: { onOpenMore: () => void; moreActive: boolean }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-5 px-1">
        {MOBILE_PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 py-1.5 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-primary [&_.nav-ico]:bg-primary/10'
                  : 'text-muted-foreground',
              )
            }
          >
            <span className="nav-ico flex h-8 w-8 items-center justify-center rounded-xl transition-colors">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="leading-tight">{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onOpenMore}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 py-1.5 text-[11px] font-medium transition-colors',
            moreActive ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
              moreActive && 'bg-primary/10',
            )}
          >
            <Menu className="h-5 w-5" />
          </span>
          <span className="leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const location = useLocation();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const moreActive = useMemo(() => MORE_PATHS.has(location.pathname), [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <MobileTopBar />
        <MobileNav onOpenMore={() => setMoreOpen(true)} moreActive={moreActive} />
        <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="container max-w-6xl py-5 px-4 sm:px-6 lg:py-8 lg:px-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        exporting={exporting}
        onExport={() => {
          setExporting(true);
          handleExport().finally(() => setTimeout(() => setExporting(false), 600));
        }}
        onLogout={logout}
      />
    </div>
  );
}
