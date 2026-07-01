import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StickyNote, X, Clock } from 'lucide-react'
import { useGoodTracking } from '@/hooks/useGoodTracking'
import type { GoodTracking } from '@/api'

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

export default function NotesMobile() {
  const [timeRange, setTimeRange] = useState('7')
  const { items, error, create, update, remove } = useGoodTracking(timeRange === 'all' ? undefined : Number(timeRange))
  const [formNote, setFormNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<GoodTracking | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!formNote.trim()) return; setSubmitting(true)
    const ok = await create(formNote.trim())
    if (ok) setFormNote('')
    setSubmitting(false)
  }

  async function handleSave(item: GoodTracking) {
    const ok = await update(item.id, editNote.trim())
    if (ok) setEditingId(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Notes</h1>

      <Card className="rounded-xl"><CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">New Note</Label><Input placeholder="What's on your mind..." value={formNote} onChange={e => setFormNote(e.target.value)} autoCapitalize="sentences" /></div>
          <Button type="submit" disabled={submitting || !formNote.trim()} className="w-full min-h-[44px]">{submitting ? 'Adding...' : 'Add Note'}</Button>
        </form>
      </CardContent></Card>

      <Tabs value={timeRange} onValueChange={setTimeRange}>
        <TabsList className="w-full justify-start">
          {[{ label: '7d', value: '7' }, { label: '30d', value: '30' }, { label: 'All', value: 'all' }].map(r => (
            <TabsTrigger key={r.value} value={r.value} className="flex-1 min-h-[44px]">{r.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl"><CardContent className="p-8 text-center"><StickyNote className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No notes yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="rounded-xl"><CardContent className="p-4">
              {editingId === item.id ? (
                <div className="space-y-2">
                  <Input value={editNote} onChange={e => setEditNote(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSave(item); if (e.key === 'Escape') setEditingId(null) }} />
                  <div className="flex gap-2">
                    <Button size="sm" className="min-h-[44px] flex-1" onClick={() => handleSave(item)}>Save</Button>
                    <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setEditingId(item.id); setEditNote(item.note) }}>
                    <p className="text-sm whitespace-pre-wrap">{item.note}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(item.created_at)}</p>
                  </div>
                  <button onClick={() => setDeleteTarget(item)} aria-label="Delete note" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-destructive shrink-0"><X className="h-4 w-4" /></button>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Delete Note</DialogTitle></DialogHeader>
          {deleteTarget && <p className="text-sm py-2">{deleteTarget.note}</p>}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 min-h-[44px]" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
