import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, ClipboardList, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlans } from '@/hooks/usePlans';
import type { Plan } from '@/api';

const COLORS = [
  { value: 'default', bg: 'bg-card', border: 'border', label: 'Default' },
  { value: 'red', bg: 'bg-red-100 dark:bg-red-950', border: 'border-red-200 dark:border-red-900', label: 'Red' },
  { value: 'orange', bg: 'bg-orange-100 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-900', label: 'Orange' },
  { value: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-900', label: 'Yellow' },
  { value: 'green', bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-200 dark:border-green-900', label: 'Green' },
  { value: 'blue', bg: 'bg-blue-100 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-900', label: 'Blue' },
  { value: 'purple', bg: 'bg-purple-100 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-900', label: 'Purple' },
];

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getColorStyle(color: string) {
  const c = COLORS.find((c) => c.value === color);
  return c ?? COLORS[0];
}

export default function PlansPage() {
  const { plans, error, create, update, remove } = usePlans();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState('default');
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('default');

  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);
    const ok = await create({
      title: formTitle.trim(),
      content: formContent.trim() || undefined,
      color: formColor,
    });
    if (ok) {
      setFormTitle('');
      setFormContent('');
      setFormColor('default');
      setDialogOpen(false);
    }
    setSubmitting(false);
  }

  function startEdit(plan: Plan) {
    setEditingPlan(plan);
    setEditTitle(plan.title);
    setEditContent(plan.content ?? '');
    setEditColor(plan.color);
  }

  function cancelEdit() {
    setEditingPlan(null);
    setEditTitle('');
    setEditContent('');
    setEditColor('default');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan || !editTitle.trim()) return;
    setSavingId(editingPlan.id);
    const ok = await update(editingPlan.id, {
      title: editTitle.trim(),
      content: editContent.trim() || '',
      color: editColor,
    });
    if (ok) setEditingPlan(null);
    setSavingId(null);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await remove(deleteTarget.id);
    if (ok) setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)} className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-title">Title</Label>
                <Input
                  id="plan-title"
                  placeholder="Plan title..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-content">Content</Label>
                <Textarea
                  id="plan-content"
                  placeholder="Details..."
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className={cn(
                        'min-w-[44px] min-h-[44px] rounded-full border-2 transition-all',
                        c.bg,
                        formColor === c.value
                          ? 'border-primary ring-2 ring-primary/30 scale-110'
                          : 'border-muted-foreground/20 hover:scale-105',
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={submitting || !formTitle.trim()} className="min-h-[44px]">
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {plans === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-4/5 mb-1" />
                <Skeleton className="h-3 w-3/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No plans yet. Create one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {plans.map((plan) => {
            const isEditing = editingPlan?.id === plan.id;
            const style = getColorStyle(isEditing ? editColor : plan.color);

            if (isEditing) {
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'break-inside-avoid rounded-lg border p-4',
                    style.bg,
                    style.border,
                  )}
                >
                  <form onSubmit={handleSaveEdit} className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      placeholder="Title"
                      className="font-medium"
                      autoFocus
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      placeholder="Details..."
                      rows={3}
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setEditColor(c.value)}
                          className={cn(
                            'min-w-[44px] min-h-[44px] rounded-full border-2 transition-all',
                            c.bg,
                            editColor === c.value
                              ? 'border-primary ring-2 ring-primary/30 scale-110'
                              : 'border-muted-foreground/20 hover:scale-105',
                          )}
                          title={c.label}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={savingId === plan.id || !editTitle.trim()}
                        className="min-h-[44px]"
                      >
                        {savingId === plan.id ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="min-h-[44px]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              );
            }

            return (
              <div
                key={plan.id}
                className={cn(
                  'break-inside-avoid rounded-lg border p-4 cursor-pointer transition-shadow hover:shadow-md',
                  style.bg,
                  style.border,
                )}
                onClick={() => startEdit(plan)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm">{plan.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(plan);
                    }}
                    aria-label={`Delete plan "${plan.title}"`}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-black/10 text-muted-foreground hover:text-red-500 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {plan.content && (
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {plan.content}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-3 text-xs sm:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(plan.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              This will permanently delete this plan. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm font-medium py-2">{deleteTarget.title}</p>
          )}
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
