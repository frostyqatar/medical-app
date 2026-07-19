import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  ClipboardList,
  FileText,
  FlaskConical,
  ListTodo,
  Stethoscope,
  StickyNote,
} from 'lucide-react';

export type MoreNavItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const MORE_NAV_ITEMS: MoreNavItem[] = [
  { to: '/labs', label: 'Labs', description: 'Results, flags & trends', icon: FlaskConical },
  { to: '/symptoms', label: 'Symptoms', description: 'Log how she feels', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', description: 'Upcoming visits', icon: CalendarClock },
  { to: '/action-items', label: 'Action items', description: 'Care team follow-ups', icon: ListTodo },
  { to: '/plans', label: 'Plans', description: 'Care plans & notes', icon: ClipboardList },
  { to: '/notes', label: 'Notes', description: 'Day-to-day observations', icon: StickyNote },
  { to: '/weekly-summary', label: 'Weekly summary', description: 'Trends & report', icon: FileText },
];
