import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ListTodo, Plus, ArrowRight, ArrowLeft, CheckCircle2, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchActionItems, createActionItem, updateActionItem, deleteActionItem } from '@/api'
import type { ActionItem } from '@/api'
import { cn } from '@/lib/utils'

type Priority = ActionItem['priority']
type Status = ActionItem['status']

const COLUMNS = [
  { key: 'open' as const, label: 'Open', icon: ListTodo },
  { key: 'answered' as const, label: 'Answered', icon: MessageSquare },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2 },
]

function PriorityBadge({ p }: { p: Priority }) {
  if (p === 'HIGH') return <Badge variant="destructive" className="text-[10px]">HIGH</Badge>
  if (p === 'MED') return <Badge className="bg-amber-500 text-white text-[10px]">MED</Badge>
  if (p === 'LOW') return <Badge variant="secondary" className="text-[10px]">LOW</Badge>
  return <Badge className="text-[10px]">ONGOING</Badge>
}

function formatDate(ts: string) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }

export default function ActionItemsMobile() {
  const [items, setItems] = useState<ActionItem[] | null>(null)
  const [activeCol, setActiveCol] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ priority: 'MED' as Priority, item: '', category: '' })
  const [deleteTarget, setDeleteTarget] = useState<ActionItem | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [answeringId, setAnsweringId] = useState<number | null>(null)
  const [answerText, setAnswerText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => { setItems(null); try { setItems(await fetchActionItems()); setError(null) } catch { setError('Failed') } }, [])
  useEffect(() => { load() }, [load])

  const colItems = (status: Status) => (items || []).filter(i => i.status === status).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  async function handleMove(id: number, status: Status) { await updateActionItem(id, { status }); load() }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try { await createActionItem({ priority: form.priority, item: form.item, category: form.category || undefined, status: 'open' }); setForm({ priority: 'MED', item: '', category: '' }); setAddOpen(false); load() } catch { setError('Failed') } finally { setSubmitting(false) }
  }

  async function handleDelete() { if (!deleteTarget) return; await deleteActionItem(deleteTarget.id); setDeleteTarget(null); load() }

  async function handleSaveEdit(item: ActionItem) { await updateActionItem(item.id, { item: editText.trim() }); setEditingId(null); load() }
  async function handleSaveAnswer(item: ActionItem) { await updateActionItem(item.id, { answer: answerText || undefined }); setAnsweringId(null); load() }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const cards = el.querySelectorAll('[data-col]')
    cards[activeCol]?.scrollIntoView({ behavior: 'smooth', inline: 'center' })
  }, [activeCol])

  const col = COLUMNS[activeCol]
  const displayItems = colItems(col.key)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Actions</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setAddOpen(true)} aria-label="Add action item"><Plus className="h-5 w-5" /></Button>
      </div>

      {/* Column selector */}
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveCol(c => Math.max(0, c - 1))} disabled={activeCol === 0} aria-label="Previous column" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex-1 flex gap-1">
          {COLUMNS.map((c, i) => {
            const count = colItems(c.key).length
            return (
              <button
                key={c.key}
                onClick={() => setActiveCol(i)}
                aria-pressed={i === activeCol}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors min-h-[44px]',
                  i === activeCol ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <c.icon className="h-3.5 w-3.5" />
                {c.label} ({count})
              </button>
            )
          })}
        </div>
        <button onClick={() => setActiveCol(c => Math.min(COLUMNS.length - 1, c + 1))} disabled={activeCol === COLUMNS.length - 1} aria-label="Next column" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
      </div>

      {items === null ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : displayItems.length === 0 ? (
        <Card className="rounded-xl"><CardContent className="p-8 text-center"><col.icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No {col.label.toLowerCase()} items.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {displayItems.map(item => (
            <Card key={item.id} className="rounded-xl"><CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <PriorityBadge p={item.priority} />
                {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                <Button variant="ghost" size="icon" className="h-10 w-10 ml-auto text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(item)} aria-label="Delete action item"><Trash2 className="h-4 w-4" /></Button>
              </div>

              {editingId === item.id ? (
                <div className="space-y-2">
                  <Input value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" className="min-h-[44px]" onClick={() => handleSaveEdit(item)}>Save</Button>
                    <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm cursor-pointer" onClick={() => { setEditingId(item.id); setEditText(item.item) }}>{item.item}</p>
              )}

              {col.key === 'answered' && (
                answeringId === item.id ? (
                  <div className="space-y-2">
                    <Input placeholder="Answer..." value={answerText} onChange={e => setAnswerText(e.target.value)} autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" className="min-h-[44px]" onClick={() => handleSaveAnswer(item)}>Save</Button>
                      <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => setAnsweringId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : item.answer ? (
                  <div className="bg-muted/50 rounded-lg p-2 text-sm text-muted-foreground">{item.answer}</div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full min-h-[44px]" onClick={() => { setAnsweringId(item.id); setAnswerText(item.answer || '') }}><MessageSquare className="h-3.5 w-3.5 mr-1" />Add Answer</Button>
                )
              )}

              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-[11px] text-muted-foreground">{formatDate(item.created_at)}</span>
                <div className="flex gap-1">
                  {col.key === 'open' && (
                    <Button size="sm" variant="ghost" className="h-10 w-10" onClick={() => handleMove(item.id, 'answered')} aria-label="Move to Answered"><ArrowRight className="h-4 w-4" /></Button>
                  )}
                  {col.key === 'answered' && (
                    <>
                      <Button size="sm" variant="ghost" className="h-10 w-10" onClick={() => handleMove(item.id, 'open')} aria-label="Move back to Open"><ArrowLeft className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="h-10 w-10" onClick={() => handleMove(item.id, 'done')} aria-label="Mark as Done"><CheckCircle2 className="h-4 w-4" /></Button>
                    </>
                  )}
                  {col.key === 'done' && (
                    <Button size="sm" variant="ghost" className="h-10 w-10" onClick={() => handleMove(item.id, 'answered')} aria-label="Move back to Answered"><ArrowLeft className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Action</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1"><Label>Priority</Label>
              <div className="flex gap-1.5">
                {(['LOW', 'MED', 'HIGH', 'ONGOING'] as Priority[]).map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-medium border min-h-[44px]', form.priority === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent')}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label>Item</Label><Input placeholder="Describe the action..." value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Category</Label><Input placeholder="e.g. wound-care" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={submitting || !form.item.trim()}>{submitting ? 'Creating...' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Delete</DialogTitle></DialogHeader>
          {deleteTarget && <p className="text-sm">{deleteTarget.item}</p>}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 min-h-[44px]" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
