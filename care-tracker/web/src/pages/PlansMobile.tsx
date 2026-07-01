import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, X, Clock, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlans } from '@/hooks/usePlans'
import type { Plan } from '@/api'

const COLORS = [
  { value: 'default', bg: 'bg-card', border: 'border', label: 'Default' },
  { value: 'red', bg: 'bg-red-100', border: 'border-red-200', label: 'Red' },
  { value: 'orange', bg: 'bg-orange-100', border: 'border-orange-200', label: 'Orange' },
  { value: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', label: 'Yellow' },
  { value: 'green', bg: 'bg-green-100', border: 'border-green-200', label: 'Green' },
  { value: 'blue', bg: 'bg-blue-100', border: 'border-blue-200', label: 'Blue' },
  { value: 'purple', bg: 'bg-purple-100', border: 'border-purple-200', label: 'Purple' },
]

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function getStyle(c: string) { return COLORS.find(x => x.value === c) ?? COLORS[0] }

export default function PlansMobile() {
  const { plans, error, create, update, remove } = usePlans()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', color: 'default' })
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [editF, setEditF] = useState({ title: '', content: '', color: 'default' })
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!form.title.trim()) return; setSubmitting(true)
    const ok = await create({ title: form.title.trim(), content: form.content.trim() || undefined, color: form.color })
    if (ok) { setForm({ title: '', content: '', color: 'default' }); setAddOpen(false) }
    setSubmitting(false)
  }

  async function handleSave(plan: Plan) {
    if (!editF.title.trim()) return; setSubmitting(true)
    const ok = await update(plan.id, { title: editF.title.trim(), content: editF.content.trim() || '', color: editF.color })
    if (ok) setEditing(null)
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plans</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setAddOpen(true)} aria-label="Add plan"><Plus className="h-5 w-5" /></Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {plans === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : plans.length === 0 ? (
        <Card className="rounded-xl"><CardContent className="p-8 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No plans yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => {
            const style = getStyle(editing?.id === plan.id ? editF.color : plan.color)
            if (editing?.id === plan.id) {
              return (
                <div key={plan.id} className={cn('rounded-xl border p-4 space-y-3', style.bg, style.border)}>
                  <Input value={editF.title} onChange={e => setEditF(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="font-medium" autoFocus />
                  <Input value={editF.content} onChange={e => setEditF(f => ({ ...f, content: e.target.value }))} placeholder="Details..." />
                  <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c.value} type="button" onClick={() => setEditF(f => ({ ...f, color: c.value }))}
                        className={cn('min-w-[44px] min-h-[44px] rounded-full border-2 transition-all', c.bg, editF.color === c.value ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-muted-foreground/20')} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="min-h-[44px] flex-1" onClick={() => handleSave(plan)}>Save</Button>
                    <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )
            }
            return (
              <div key={plan.id} className={cn('rounded-xl border p-4 space-y-2', style.bg, style.border)} onClick={() => { setEditing(plan); setEditF({ title: plan.title, content: plan.content ?? '', color: plan.color }) }}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm">{plan.title}</h3>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(plan) }} aria-label={`Delete plan "${plan.title}"`} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-black/10 text-muted-foreground hover:text-destructive shrink-0"><X className="h-4 w-4" /></button>
                </div>
                {plan.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.content}</p>}
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(plan.created_at)}</p>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Plan</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1"><Label>Title</Label><Input placeholder="Plan title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Content</Label><Input placeholder="Details..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={cn('min-w-[44px] min-h-[44px] rounded-full border-2 transition-all', c.bg, form.color === c.value ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-muted-foreground/20')} />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={submitting || !form.title.trim()}>{submitting ? 'Creating...' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Delete Plan</DialogTitle></DialogHeader>
          {deleteTarget && <p className="text-sm font-medium">{deleteTarget.title}</p>}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 min-h-[44px]" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
