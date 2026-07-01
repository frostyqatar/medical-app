import { useEffect, useState, useCallback, useRef, type DragEvent, type TouchEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ListTodo, Plus, ArrowRight, ArrowLeft, CheckCircle2, MessageSquare, Trash2, GripVertical } from 'lucide-react';
import { fetchActionItems, createActionItem, updateActionItem, deleteActionItem } from '@/api';
import type { ActionItem } from '@/api';
import { cn } from '@/lib/utils';

type Priority = ActionItem['priority'];
type Status = ActionItem['status'];

const COLUMNS = [
  { key: 'open' as const, label: 'Open', icon: ListTodo },
  { key: 'answered' as const, label: 'Answered', icon: MessageSquare },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2 },
];

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'ALL' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'MED', label: 'MED' },
  { value: 'LOW', label: 'LOW' },
  { value: 'ONGOING', label: 'ONGOING' },
] as const;

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function PriorityBadge({ priority }: { priority: Priority }) {
  switch (priority) {
    case 'HIGH':
      return <Badge variant="destructive">HIGH</Badge>;
    case 'MED':
      return (
        <Badge className="bg-amber-500 text-white border-transparent hover:bg-amber-600">
          MED
        </Badge>
      );
    case 'LOW':
      return <Badge variant="secondary">LOW</Badge>;
    case 'ONGOING':
      return <Badge>ONGOING</Badge>;
  }
}

export default function ActionItems() {
  const [items, setItems] = useState<ActionItem[] | null>(null);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [savingAnswerId, setSavingAnswerId] = useState<number | null>(null);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ActionItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [draggedItem, setDraggedItem] = useState<ActionItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  const touchDragRef = useRef<{
    item: ActionItem;
    startX: number;
    startY: number;
    clone: HTMLElement | null;
    scrollInterval: ReturnType<typeof setInterval> | null;
  } | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [form, setForm] = useState({
    priority: 'MED' as Priority,
    item: '',
    category: '',
  });

  const loadItems = useCallback(async () => {
    setItems(null);
    try {
      const data = await fetchActionItems();
      setItems(data);
      setError(null);
    } catch {
      setError('Failed to load action items');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleMove(item: ActionItem, newStatus: Status) {
    setMovingId(item.id);
    try {
      await updateActionItem(item.id, { status: newStatus });
      await loadItems();
    } catch {
      setError('Failed to update action item');
    } finally {
      setMovingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createActionItem({
        priority: form.priority,
        item: form.item,
        category: form.category || undefined,
        status: 'open',
      });
      setForm({ priority: 'MED', item: '', category: '' });
      setDialogOpen(false);
      await loadItems();
    } catch {
      setError('Failed to create action item');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditAnswer(item: ActionItem) {
    setEditingAnswerId(item.id);
    setAnswerText(item.answer ?? '');
  }

  function cancelEditAnswer() {
    setEditingAnswerId(null);
    setAnswerText('');
  }

  async function handleSaveAnswer(item: ActionItem) {
    setSavingAnswerId(item.id);
    try {
      await updateActionItem(item.id, { answer: answerText || undefined });
      setEditingAnswerId(null);
      setAnswerText('');
      await loadItems();
    } catch {
      setError('Failed to save answer');
    } finally {
      setSavingAnswerId(null);
    }
  }

  function startEditItem(item: ActionItem) {
    setEditingItemId(item.id);
    setEditingItemText(item.item);
  }

  function cancelEditItem() {
    setEditingItemId(null);
    setEditingItemText('');
  }

  async function handleSaveItem(item: ActionItem) {
    if (!editingItemText.trim()) return;
    setSavingItemId(item.id);
    try {
      await updateActionItem(item.id, { item: editingItemText.trim() });
      setEditingItemId(null);
      setEditingItemText('');
      await loadItems();
    } catch {
      setError('Failed to save item');
    } finally {
      setSavingItemId(null);
    }
  }

  function handleItemKeyDown(e: React.KeyboardEvent, item: ActionItem) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveItem(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditItem();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteActionItem(deleteTarget.id);
      setDeleteTarget(null);
      await loadItems();
    } catch {
      setError('Failed to delete action item');
    } finally {
      setDeletingId(null);
    }
  }

  function handleDragStart(e: DragEvent, item: ActionItem) {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
  }

  function handleDragOver(e: DragEvent, column: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(column);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: DragEvent, targetStatus: Status) {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggedItem(null);
      return;
    }
    setMovingId(draggedItem.id);
    try {
      await updateActionItem(draggedItem.id, { status: targetStatus });
      setDraggedItem(null);
      await loadItems();
    } catch {
      setError('Failed to move action item');
    } finally {
      setMovingId(null);
    }
  }

  function handleDragEnd() {
    setDraggedItem(null);
    setDragOverColumn(null);
  }

  function getColumnUnderTouch(x: number, y: number): Status | null {
    for (const col of COLUMNS) {
      const el = columnRefs.current[col.key];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return col.key;
      }
    }
    return null;
  }

  function handleTouchStart(e: TouchEvent, item: ActionItem) {
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.zIndex = '100';
    clone.style.width = `${target.offsetWidth}px`;
    clone.style.opacity = '0.85';
    clone.style.pointerEvents = 'none';
    clone.style.transform = 'rotate(2deg) scale(1.02)';
    clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    clone.style.left = `${touch.clientX - target.offsetWidth / 2}px`;
    clone.style.top = `${touch.clientY - 20}px`;
    document.body.appendChild(clone);
    touchDragRef.current = { item, startX: touch.clientX, startY: touch.clientY, clone, scrollInterval: null };
    setDragOverColumn(item.status);
  }

  function handleTouchMove(e: TouchEvent) {
    const drag = touchDragRef.current;
    if (!drag?.clone) return;
    e.preventDefault();
    const touch = e.touches[0];
    drag.clone.style.left = `${touch.clientX - drag.clone.offsetWidth / 2}px`;
    drag.clone.style.top = `${touch.clientY - 20}px`;

    const col = getColumnUnderTouch(touch.clientX, touch.clientY);
    if (col && col !== dragOverColumn) {
      setDragOverColumn(col);
      if (drag.scrollInterval) clearInterval(drag.scrollInterval);
      drag.scrollInterval = null;
    }
  }

  async function handleTouchEnd(e: TouchEvent) {
    const drag = touchDragRef.current;
    if (!drag) return;
    if (drag.scrollInterval) { clearInterval(drag.scrollInterval); drag.scrollInterval = null; }
    if (drag.clone) { document.body.removeChild(drag.clone); }
    const touch = e.changedTouches[0];
    const targetCol = getColumnUnderTouch(touch.clientX, touch.clientY);
    touchDragRef.current = null;

    if (targetCol && targetCol !== drag.item.status) {
      setMovingId(drag.item.id);
      try {
        await updateActionItem(drag.item.id, { status: targetCol });
        await loadItems();
      } catch {
        setError('Failed to move action item');
      } finally {
        setMovingId(null);
      }
    }
    setDragOverColumn(null);
  }

  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  function scrollKanban(direction: 'left' | 'right') {
    const el = kanbanScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -el.offsetWidth : el.offsetWidth, behavior: 'smooth' });
  }

  const displayItems = (status: Status) => {
    if (!items) return null;
    return items
      .filter((item) => {
        if (item.status !== status) return false;
        if (priorityFilter === 'ALL') return true;
        return item.priority === priorityFilter;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  if (items === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Action Items</h1>
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <Card key={col.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <col.icon className="h-4 w-4 text-muted-foreground" />
                  {col.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Action Items</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button className="min-h-[44px]" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Action Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="action-priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                >
                  <SelectTrigger id="action-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="MED">MED</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="ONGOING">ONGOING</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="action-item">Item</Label>
                <Textarea
                  id="action-item"
                  placeholder="Describe the action item..."
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="action-category">Category</Label>
                <Input
                  id="action-category"
                  placeholder="e.g. wound-care, medication, standing"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting || !form.item.trim()}>
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={priorityFilter} onValueChange={setPriorityFilter}>
        <TabsList className="flex-wrap justify-start">
          {FILTER_OPTIONS.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Mobile column pagination */}
      <div className="flex items-center gap-2 lg:hidden">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => {
              const el = columnRefs.current[col.key];
              if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[44px] flex items-center',
              dragOverColumn === col.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-input hover:bg-accent'
            )}
          >
            {col.label} {displayItems(col.key)?.length !== undefined && `(${displayItems(col.key)!.length})`}
          </button>
        ))}
      </div>

      <div
        ref={kanbanScrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {COLUMNS.map((col) => {
          const colItems = displayItems(col.key);
          const Icon = col.icon;
          return (
            <div
              key={col.key}
              ref={(el) => { columnRefs.current[col.key] = el; }}
              className="flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-auto snap-center"
            >
            <Card
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={cn(
                'transition-colors h-full',
                dragOverColumn === col.key && 'ring-2 ring-primary/60 bg-accent/30'
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {col.label}
                  {colItems && (
                    <Badge variant="secondary" className="ml-auto">
                      {colItems.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {colItems === null ? (
                  <Skeleton className="h-20 w-full" />
                ) : colItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No items
                  </p>
                ) : (
                  colItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, item)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={cn(
                        'transition-opacity',
                        movingId === item.id && 'opacity-50'
                      )}
                    >
                      <Card className="border shadow-none">
                        <CardContent className="p-3 sm:p-4 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground mt-0.5 p-2 -m-2 hidden sm:flex items-center justify-center" aria-hidden="true">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <PriorityBadge priority={item.priority} />
                            {item.category && (
                              <Badge variant="outline" className="">
                                {item.category}
                              </Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-11 w-11 ml-auto text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(item)} title="Delete" aria-label="Delete action item"><Trash2 className="h-4 w-4" /></Button>
                          </div>

                          {editingItemId === item.id ? (
                            <div className="space-y-1.5">
                              <Textarea
                                value={editingItemText}
                                onChange={(e) => setEditingItemText(e.target.value)}
                                onKeyDown={(e) => handleItemKeyDown(e, item)}
                                rows={2}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  className="min-h-[44px]"
                                  variant="default"
                                  onClick={() => handleSaveItem(item)}
                                  disabled={savingItemId === item.id || !editingItemText.trim()}
                                >
                                  {savingItemId === item.id ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                  className="min-h-[44px]"
                                  variant="ghost"
                                  onClick={cancelEditItem}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="text-sm cursor-pointer hover:text-primary/80 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditItem(item);
                              }}
                            >
                              {item.item}
                            </p>
                          )}

                          {col.key === 'answered' && (
                            <div className="space-y-1.5">
                              {item.answer ? (
                                <div className="bg-muted/50 rounded-md p-2">
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {item.answer}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground italic">
                                  No answer yet
                                </p>
                              )}
                              {editingAnswerId === item.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Enter answer..."
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      className="min-h-[44px]"
                                      variant="default"
                                      onClick={() => handleSaveAnswer(item)}
                                      disabled={savingAnswerId === item.id}
                                    >
                                      {savingAnswerId === item.id ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      className="min-h-[44px]"
                                      variant="ghost"
                                      onClick={cancelEditAnswer}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  className="min-h-[44px] w-full"
                                  variant="outline"
                                  onClick={() => startEditAnswer(item)}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {item.answer ? 'Update Answer' : 'Add Answer'}
                                </Button>
                              )}
                            </div>
                          )}

                          <Separator />

                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {formatDate(item.created_at)}
                            </span>
                            <div className="flex items-center gap-1">
                              {col.key === 'open' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-11 w-11"
                                  onClick={() => handleMove(item, 'answered')}
                                  disabled={movingId === item.id}
                                  aria-label="Move to Answered"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                              {col.key === 'answered' && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-11 w-11"
                                    onClick={() => handleMove(item, 'open')}
                                    disabled={movingId === item.id}
                                    aria-label="Move back to Open"
                                  >
                                    <ArrowLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-11 w-11"
                                    onClick={() => handleMove(item, 'done')}
                                    disabled={movingId === item.id}
                                    aria-label="Mark as Done"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {col.key === 'done' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-11 w-11"
                                  onClick={() => handleMove(item, 'answered')}
                                  disabled={movingId === item.id}
                                  aria-label="Move back to Answered"
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            </div>
          );
        })}
      </div>

      <style>{`
        .snap-x { scroll-snap-type: x mandatory; }
        .snap-center { scroll-snap-align: center; }
        @media (min-width: 1024px) {
          .lg\\:grid { display: grid; }
          .lg\\:overflow-visible { overflow: visible; }
        }
      `}</style>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Action Item</DialogTitle>
            <DialogDescription>
              This will permanently delete this action item. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={deleteTarget.priority} />
                {deleteTarget.category && (
                  <Badge variant="outline" className="">
                    {deleteTarget.category}
                  </Badge>
                )}
              </div>
              <p className="text-sm">{deleteTarget.item}</p>
              <p className="text-xs text-muted-foreground">
                Created {formatDate(deleteTarget.created_at)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId === deleteTarget?.id}
            >
              {deletingId === deleteTarget?.id ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
