import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, CheckCircle2, XCircle, Plus, Pencil } from 'lucide-react';
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
} from '@/api';
import type { Appointment } from '@/api';

type TabValue = 'upcoming' | 'past' | 'cancelled';

const UPCOMING_STATUSES: Appointment['status'][] = ['planned'];

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getStatusBadge(status: Appointment['status']) {
  switch (status) {
    case 'done':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          Done
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
          Planned
        </Badge>
      );
  }
}

function groupByMonth(appointments: Appointment[]): Map<string, Appointment[]> {
  const groups = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const key = formatMonthYear(new Date(a.scheduled_for));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  return groups;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('upcoming');
  const [addOpen, setAddOpen] = useState(false);
  const [doneTarget, setDoneTarget] = useState<Appointment | null>(null);
  const [doneOutcome, setDoneOutcome] = useState('');
  const [formScheduledFor, setFormScheduledFor] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setAppointments(null);
    try {
      const data = await fetchAppointments();
      setAppointments(data);
      setError(null);
    } catch {
      setError('Failed to load appointments');
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formScheduledFor || !formSpecialty.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const scheduledFor = new Date(formScheduledFor).toISOString();
      await createAppointment({
        specialty: formSpecialty.trim(),
        scheduled_for: scheduledFor,
        notes: formNotes.trim() || undefined,
        status: 'planned',
      });
      setFormScheduledFor('');
      setFormSpecialty('');
      setFormNotes('');
      setAddOpen(false);
      loadAppointments();
    } catch {
      setError('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkDone() {
    if (!doneTarget) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateAppointment(doneTarget.id, {
        status: 'done',
        outcome: doneOutcome.trim() || undefined,
      });
      setDoneTarget(null);
      setDoneOutcome('');
      loadAppointments();
    } catch {
      setError('Failed to update appointment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(appointment: Appointment) {
    setSubmitting(true);
    setError(null);
    try {
      await updateAppointment(appointment.id, { status: 'cancelled' });
      loadAppointments();
    } catch {
      setError('Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  }

  const [editTarget, setEditTarget] = useState<Appointment | null>(null)
  const [editScheduled, setEditScheduled] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function toDatetimeLocal(ts: string): string {
    const d = new Date(ts)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function openEdit(appt: Appointment) {
    setEditTarget(appt)
    setEditScheduled(toDatetimeLocal(appt.scheduled_for))
    setEditSpecialty(appt.specialty || '')
    setEditNotes(appt.notes || '')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget || !editScheduled || !editSpecialty.trim()) return
    setSubmitting(true)
    try {
      await updateAppointment(editTarget.id, {
        scheduled_for: new Date(editScheduled).toISOString(),
        specialty: editSpecialty.trim(),
        notes: editNotes.trim() || undefined,
      })
      setEditTarget(null)
      loadAppointments()
    } catch { setError('Failed to update') } finally { setSubmitting(false) }
  }

  function getFilteredAppointments(): Appointment[] {
    if (!appointments) return [];
    switch (activeTab) {
      case 'upcoming':
        return appointments
          .filter((a) => UPCOMING_STATUSES.includes(a.status))
          .sort(
            (a, b) =>
              new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime(),
          );
      case 'past':
        return appointments
          .filter((a) => a.status === 'done')
          .sort(
            (a, b) =>
              new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime(),
          );
      case 'cancelled':
        return appointments
          .filter((a) => a.status === 'cancelled')
          .sort(
            (a, b) =>
              new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime(),
          );
    }
  }

  const filtered = getFilteredAppointments();
  const grouped = groupByMonth(filtered);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="appt-date">Scheduled For</Label>
                <Input
                  id="appt-date"
                  type="datetime-local"
                  value={formScheduledFor}
                  onChange={(e) => setFormScheduledFor(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appt-specialty">Specialty</Label>
                <Input
                  id="appt-specialty"
                  placeholder="e.g. Cardiology, Orthopedics..."
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appt-notes">Notes</Label>
                <Textarea
                  id="appt-notes"
                  placeholder="Any additional details..."
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-h-[44px]"
                  disabled={submitting || !formScheduledFor || !formSpecialty.trim()}
                >
                  {submitting ? 'Creating...' : 'Create Appointment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {appointments === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'upcoming'
                    ? 'No upcoming appointments.'
                    : activeTab === 'past'
                      ? 'No past appointments.'
                      : 'No cancelled appointments.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            Array.from(grouped.entries()).map(([month, groupAppointments]) => (
              <div key={month} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">
                  {month}
                </h3>
                <div className="space-y-2">
                  {groupAppointments.map((appt) => {
                    const isUpcoming = UPCOMING_STATUSES.includes(appt.status);
                    return (
                      <Card key={appt.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {appt.specialty}
                                </span>
                                {getStatusBadge(appt.status)}
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                                <CalendarClock className="h-3 w-3 shrink-0" />
                                <span>
                                  {formatDate(appt.scheduled_for)} at{' '}
                                  {formatTime(appt.scheduled_for)}
                                </span>
                              </div>
                              {appt.status === 'done' && appt.outcome && (
                                <div className="mt-2 p-2 rounded-md bg-muted/50">
                                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                    Outcome
                                  </p>
                                  <p className="text-sm">{appt.outcome}</p>
                                </div>
                              )}
                              {appt.status === 'planned' && appt.notes && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {appt.notes}
                                </p>
                              )}
                            </div>
                            {isUpcoming && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-h-[44px] min-w-[44px] p-0"
                                  onClick={() => openEdit(appt)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  className="min-h-[44px]"
                                  onClick={() => setDoneTarget(appt)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Done
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="min-h-[44px] text-muted-foreground hover:text-destructive"
                                  disabled={submitting}
                                  onClick={() => handleCancel(appt)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            {!isUpcoming && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-[44px] min-w-[44px] p-0 shrink-0"
                                onClick={() => openEdit(appt)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={doneTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDoneTarget(null);
            setDoneOutcome('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Done</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {doneTarget && (
              <p className="text-sm text-muted-foreground">
                {doneTarget.specialty} &mdash;{' '}
                {formatDate(doneTarget.scheduled_for)}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="outcome">Outcome (optional)</Label>
              <Textarea
                id="outcome"
                placeholder="Enter outcome or notes..."
                rows={3}
                value={doneOutcome}
                onChange={(e) => setDoneOutcome(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => {
                setDoneTarget(null);
                setDoneOutcome('');
              }}
            >
              Cancel
            </Button>
            <Button className="min-h-[44px]" onClick={handleMarkDone} disabled={submitting}>
              {submitting ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget !== null} onOpenChange={o => { if (!o) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Appointment</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="space-y-1"><Label>Date &amp; Time</Label><Input type="datetime-local" value={editScheduled} onChange={e => setEditScheduled(e.target.value)} /></div>
            <div className="space-y-1"><Label>Specialty</Label><Input placeholder="e.g. Cardiology" value={editSpecialty} onChange={e => setEditSpecialty(e.target.value)} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input placeholder="Any details..." value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" className="min-h-[44px]" disabled={submitting || !editScheduled || !editSpecialty.trim()}>{submitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
