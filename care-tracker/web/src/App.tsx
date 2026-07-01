import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  CalendarClock,
  Droplet,
  FileText,
  FlaskConical,
  ListTodo,
  Pill,
  Stethoscope,
  ClipboardList,
  StickyNote,
  Download,
  LogOut,
  AlertTriangle,
  Home,
  Bandage,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPatient, fetchExport } from '@/api';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/api';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/medications', label: 'Meds', icon: Pill },
  { to: '/vitals', label: 'Vitals', icon: Activity },
  { to: '/glucose', label: 'Glucose', icon: Droplet },
  { to: '/labs', label: 'Labs', icon: FlaskConical },
  { to: '/symptoms', label: 'Symptoms', icon: Stethoscope },
  { to: '/wounds', label: 'Wounds', icon: Bandage },
  { to: '/appointments', label: 'Appts', icon: CalendarClock },
  { to: '/action-items', label: 'Actions', icon: ListTodo },
  { to: '/weekly-summary', label: 'Summary', icon: FileText },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/plans', label: 'Plans', icon: ClipboardList },
  { to: '/emergency', label: 'Emergency', icon: AlertTriangle },
];

function handleExport() {
  fetchExport()
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'patient-export.json'
      a.click()
      URL.revokeObjectURL(url)
    })
    .catch((err) => console.error('Export failed:', err))
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
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r bg-background">
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">Care Tracker</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={({ isActive }: { isActive: boolean }) => isActive ? 'page' : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t px-5 py-4 space-y-3">
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <button
          onClick={() => { setExporting(true); handleExport(); setTimeout(() => setExporting(false), 1000); }}
          disabled={exporting}
          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] w-full"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
        <div className="space-y-1">
          <div className="text-sm font-medium">{patient?.id ?? 'PT-ANON'}</div>
          {patient && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {patient.age != null && (
                <div>{patient.age} y/o{patient.sex ? ` ${patient.sex}` : ''}</div>
              )}
              {patient.mobility_note && (
                <div className="truncate">{patient.mobility_note}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory px-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={({ isActive }: { isActive: boolean }) => isActive ? 'page' : undefined}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[52px] px-2 py-1.5 text-[11px] font-medium transition-colors shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate max-w-[60px] text-center leading-tight">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => { setExporting(true); handleExport(); setTimeout(() => setExporting(false), 1000); }}
          disabled={exporting}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[52px] px-2 py-1.5 text-[11px] font-medium text-muted-foreground shrink-0 snap-start"
        >
          <Download className="h-5 w-5" />
          <span className="truncate max-w-[60px] text-center leading-tight">{exporting ? '...' : 'Export'}</span>
        </button>
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[52px] px-2 py-1.5 text-[11px] font-medium text-muted-foreground shrink-0 snap-start"
        >
          <LogOut className="h-5 w-5" />
          <span className="truncate max-w-[60px] text-center leading-tight">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:pl-60 pb-20 lg:pb-0">
        <div className="container py-6 px-4 md:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
