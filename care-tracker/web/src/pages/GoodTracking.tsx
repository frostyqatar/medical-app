import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { StickyNote, Plus, X, Clock } from 'lucide-react';
import { useGoodTracking } from '@/hooks/useGoodTracking';
import type { GoodTracking } from '@/api';

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TIME_RANGES = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: 'All', value: 'all' },
] as const;

export default function NotesPage() {
  const [timeRange, setTimeRange] = useState('7');
  const { items, error, create, update, remove } = useGoodTracking(timeRange === 'all' ? undefined : Number(timeRange));
  const [formNote, setFormNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<GoodTracking | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formNote.trim()) return;
    setSubmitting(true);
    const ok = await create(formNote.trim());
    if (ok) setFormNote('');
    setSubmitting(false);
  }

  function startEdit(item: GoodTracking) {
    setEditingId(item.id);
    setEditNote(item.note);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNote('');
  }

  async function handleSaveEdit(item: GoodTracking) {
    if (!editNote.trim()) return;
    setSavingId(item.id);
    const ok = await update(item.id, editNote.trim());
    if (ok) { setEditingId(null); setEditNote(''); }
    setSavingId(null);
  }

  function handleEditKeyDown(e: React.KeyboardEvent, item: GoodTracking) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const ok = await remove(deleteTarget.id);
    if (ok) setDeleteTarget(null);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            Add a Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="good-note">Note</Label>
              <Input
                id="good-note"
                placeholder="Something you want to note..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                autoCapitalize="sentences"
              />
            </div>
            <Button type="submit" disabled={submitting || !formNote.trim()} className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              {submitting ? 'Adding...' : 'Add'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            {TIME_RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {items === null ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <StickyNote className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item)}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={cancelEdit}
                            className="min-h-[44px]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSaveEdit(item)}
                            disabled={savingId === item.id || !editNote.trim()}
                            className="min-h-[44px]"
                          >
                            {savingId === item.id ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="min-w-0 flex-1 cursor-pointer hover:text-primary/80 transition-colors"
                        onClick={() => startEdit(item)}
                      >
                        <p className="text-sm">{item.note}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        aria-label="Delete note"
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              This will permanently delete this note. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm py-2">{deleteTarget.note}</p>
          )}
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
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
