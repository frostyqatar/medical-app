import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CalendarClock, CheckCircle2, XCircle, Plus, Clock, Pencil } from 'lucide-react'
import { fetchAppointments, createAppointment, updateAppointment } from '@/api'
import type { Appointment } from '@/api'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }
function formatTime(ts: string) { return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
function formatMonth(date: Date) { return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }
function toDatetimeLocal(ts: string): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function daysFromNow(ts: string): number {
  const now = new Date()
  const then = new Date(ts)
  return Math.ceil((then.getTime() - now.getTime()) / 86400000)
}

function groupByMonth(appts: Appointment[]) {
  const g = new Map<string, Appointment[]>()
  for (const a of appts) { const k = formatMonth(new Date(a.scheduled_for)); if (!g.has(k)) g.set(k, []); g.get(k)!.push(a) }
  return g
}

export default function AppointmentsMobile() {
  const [appts, setAppts] = useState<Appointment[] | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [addOpen, setAddOpen] = useState(false)
  const [doneTarget, setDoneTarget] = useState<Appointment | null>(null)
  const [doneOutcome, setDoneOutcome] = useState('')
  const [form, setForm] = useState({ scheduled: '', specialty: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({ scheduled: '', specialty: '', notes: '' })

  const load = useCallback(async () => { setAppts(null); try { setAppts(await fetchAppointments()); setError(null) } catch { setError('Failed') } }, [])
  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); if (!form.scheduled || !form.specialty.trim()) return
    setSubmitting(true)
    try {
      await createAppointment({ specialty: form.specialty.trim(), scheduled_for: new Date(form.scheduled).toISOString(), notes: form.notes.trim() || undefined, status: 'planned' })
      setForm({ scheduled: '', specialty: '', notes: '' }); setAddOpen(false); load()
    } catch { setError('Failed') } finally { setSubmitting(false) }
  }

  async function handleMarkDone() {
    if (!doneTarget) return; setSubmitting(true)
    try { await updateAppointment(doneTarget.id, { status: 'done', outcome: doneOutcome.trim() || undefined }); setDoneTarget(null); setDoneOutcome(''); load() } catch { setError('Failed') } finally { setSubmitting(false) }
  }

  async function handleCancel(appt: Appointment) { await updateAppointment(appt.id, { status: 'cancelled' }); load() }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget || !editForm.scheduled || !editForm.specialty.trim()) return
    setSubmitting(true)
    try {
      await updateAppointment(editTarget.id, {
        scheduled_for: new Date(editForm.scheduled).toISOString(),
        specialty: editForm.specialty.trim(),
        notes: editForm.notes.trim() || undefined,
      })
      setEditTarget(null); load()
    } catch { setError('Failed') } finally { setSubmitting(false) }
  }

  function openEdit(appt: Appointment) {
    setEditTarget(appt)
    setEditForm({
      scheduled: toDatetimeLocal(appt.scheduled_for),
      specialty: appt.specialty || '',
      notes: appt.notes || '',
    })
  }

  const filtered = (appts || []).filter(a => {
    if (tab === 'upcoming') return a.status === 'planned'
    if (tab === 'past') return a.status === 'done'
    return a.status === 'cancelled'
  }).sort((a, b) => {
    const dir = tab === 'upcoming' ? 1 : -1
    return dir * (new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
  })

  const grouped = groupByMonth(filtered)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Appointments</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setAddOpen(true)}><Plus className="h-5 w-5" /></Button>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1 min-h-[44px]">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="flex-1 min-h-[44px]">Past</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 min-h-[44px]">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {appts === null ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl"><CardContent className="p-8 text-center"><CalendarClock className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{tab === 'upcoming' ? 'No upcoming appointments.' : tab === 'past' ? 'No past appointments.' : 'No cancelled appointments.'}</p></CardContent></Card>
      ) : (
        Array.from(grouped.entries()).map(([month, items]) => (
          <div key={month} className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground px-1">{month}</h3>
              {items.map(appt => {
              const days = daysFromNow(appt.scheduled_for)
              return (
              <Card key={appt.id} className={`rounded-xl ${appt.status === 'planned' && days < 0 ? 'border-red-300 bg-red-50/30' : ''}`}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm">{appt.specialty}</span>
                      {appt.status === 'done' && <Badge className="bg-green-100 text-green-800">Done</Badge>}
                      {appt.status === 'cancelled' && <Badge variant="secondary">Cancelled</Badge>}
                      {appt.status === 'planned' && (
                        <>
                          <Badge className="bg-blue-100 text-blue-800">Planned</Badge>
                          {days < 0 ? (
                            <Badge variant="destructive" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />Overdue</Badge>
                          ) : days >= 0 && days <= 7 ? (
                            <Badge variant={days <= 2 ? 'destructive' : 'default'} className={`text-[10px] ${days > 2 ? 'bg-amber-500' : ''}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                            </Badge>
                          ) : null}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />{formatDate(appt.scheduled_for)} at {formatTime(appt.scheduled_for)}
                    </p>
                    {appt.status === 'done' && appt.outcome && <p className="text-sm mt-2 bg-muted/50 rounded-lg p-2">{appt.outcome}</p>}
                    {appt.status === 'planned' && appt.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{appt.notes}</p>}
                  </div>
                  {appt.status === 'planned' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px] p-0" onClick={() => openEdit(appt)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px] p-0" onClick={() => setDoneTarget(appt)}><CheckCircle2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-0 text-muted-foreground" onClick={() => handleCancel(appt)}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {appt.status !== 'planned' && (
                    <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px] p-0" onClick={() => openEdit(appt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent></Card>
            )})}
          </div>
        ))
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1"><Label>Date &amp; Time</Label><Input type="datetime-local" value={form.scheduled} onChange={e => setForm(f => ({ ...f, scheduled: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Specialty</Label><Input placeholder="e.g. Cardiology" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input placeholder="Any details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="min-h-[44px]" disabled={submitting || !form.scheduled || !form.specialty.trim()}>{submitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={doneTarget !== null} onOpenChange={o => { if (!o) { setDoneTarget(null); setDoneOutcome('') } }}>
        <DialogContent><DialogHeader><DialogTitle>Mark Done</DialogTitle></DialogHeader>
          {doneTarget && <p className="text-sm text-muted-foreground">{doneTarget.specialty} &mdash; {formatDate(doneTarget.scheduled_for)}</p>}
          <div className="space-y-1"><Label>Outcome</Label><Input placeholder="Enter outcome..." value={doneOutcome} onChange={e => setDoneOutcome(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => { setDoneTarget(null); setDoneOutcome('') }}>Cancel</Button>
            <Button className="min-h-[44px]" onClick={handleMarkDone} disabled={submitting}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget !== null} onOpenChange={o => { if (!o) setEditTarget(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Edit Appointment</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="space-y-1"><Label>Date &amp; Time</Label><Input type="datetime-local" value={editForm.scheduled} onChange={e => setEditForm(f => ({ ...f, scheduled: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Specialty</Label><Input placeholder="e.g. Cardiology" value={editForm.specialty} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input placeholder="Any details..." value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" className="min-h-[44px]" disabled={submitting || !editForm.scheduled || !editForm.specialty.trim()}>{submitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
