import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Stethoscope, Plus, AlertTriangle, X } from 'lucide-react';
import { fetchSymptoms, fetchSymptomTypes, createSymptom, deleteSymptom } from '@/api';
import type { Symptom } from '@/api';
import { toast } from '@/hooks/use-toast';

const COMMON_TYPES = [
  'phantom limb pain',
  'left foot numbness',
  'GERD/heartburn',
  'dizziness',
  'fever',
  'headache',
  'fatigue',
  'nausea',
  'joint pain',
  'rash/itching',
] as const;

const TIME_RANGES = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: 'All', value: 'all' },
] as const;

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSeverityColor(value: number) {
  if (value <= 3) return 'bg-green-500';
  if (value <= 6) return 'bg-amber-500';
  return 'bg-red-500';
}

function getSeverityBadgeVariant(value: number): 'secondary' | 'destructive' {
  if (value <= 3) return 'secondary';
  if (value <= 6) return 'secondary';
  return 'destructive';
}

function getSeverityLabel(value: number) {
  if (value <= 3) return 'Mild';
  if (value <= 6) return 'Moderate';
  return 'Severe';
}

function SeverityBar({ value }: { value: number }) {
  const color = getSeverityColor(value);
  return (
    <div className="flex items-center gap-2">
      <Badge variant={getSeverityBadgeVariant(value)} className="tabular-nums shrink-0">
        {value}/10 {getSeverityLabel(value)}
      </Badge>
      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<Symptom[] | null>(null);
  const [types, setTypes] = useState<string[] | null>(null);
  const [formType, setFormType] = useState('');
  const [formSeverity, setFormSeverity] = useState([5]);
  const [formNotes, setFormNotes] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [timeRange, setTimeRange] = useState('7');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Symptom | null>(null);

  const loadSymptoms = useCallback(
    async (days?: number, type?: string) => {
      setSymptoms(null);
      try {
        const data = await fetchSymptoms(days, type || undefined);
        setSymptoms(data);
        setError(null);
      } catch {
        setError('Failed to load symptoms');
      }
    },
    [],
  );

  useEffect(() => {
    const days = timeRange === 'all' ? undefined : Number(timeRange);
    const type = selectedType === 'all' ? undefined : selectedType;
    loadSymptoms(days, type);
  }, [timeRange, selectedType, loadSymptoms]);

  useEffect(() => {
    fetchSymptomTypes()
      .then(setTypes)
      .catch(() => {});
  }, []);

  function handleTypeChange(value: string) {
    setSelectedType(value);
  }

  function handleTimeRangeChange(value: string) {
    setTimeRange(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formType.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSymptom({
        type: formType.trim(),
        severity: formSeverity[0],
        notes: formNotes.trim() || undefined,
        noted_at: new Date().toISOString(),
      });
      setFormType('');
      setFormSeverity([5]);
      setFormNotes('');
      const days = timeRange === 'all' ? undefined : Number(timeRange);
      const type = selectedType === 'all' ? undefined : selectedType;
      loadSymptoms(days, type);
    } catch {
      setError('Failed to record symptom');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteSymptom(target.id);
      const days = timeRange === 'all' ? undefined : Number(timeRange);
      const type = selectedType === 'all' ? undefined : selectedType;
      loadSymptoms(days, type);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete symptom entry' });
    }
  }

  const filteredSymptoms = symptoms
    ? [...symptoms].sort(
        (a, b) => new Date(b.noted_at).getTime() - new Date(a.noted_at).getTime(),
      )
    : null;

  const availableTypes = types ?? COMMON_TYPES;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Symptoms</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            Log a Symptom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="symptom-type">Type</Label>
              <Input
                id="symptom-type"
                placeholder="Search or type a symptom..."
                list="symptom-types-list"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <datalist id="symptom-types-list">
                {COMMON_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="symptom-severity">Severity</Label>
                <span className="text-sm font-medium tabular-nums">
                  {formSeverity[0]}/10
                </span>
              </div>
              <Slider
                id="symptom-severity"
                min={0}
                max={10}
                step={1}
                value={formSeverity}
                onValueChange={setFormSeverity}
              />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span className={formSeverity[0] <= 3 ? 'text-green-600 font-medium' : ''}>
                  Mild
                </span>
                <span
                  className={
                    formSeverity[0] >= 4 && formSeverity[0] <= 6
                      ? 'text-amber-600 font-medium'
                      : ''
                  }
                >
                  Moderate
                </span>
                <span className={formSeverity[0] >= 7 ? 'text-red-600 font-medium' : ''}>
                  Severe
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="symptom-notes">Notes</Label>
              <Textarea
                id="symptom-notes"
                placeholder="Any additional details..."
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={submitting || !formType.trim()} className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              {submitting ? 'Logging...' : 'Log Symptom'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-full sm:w-64">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
            <TabsList>
              {TIME_RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value} className="min-h-[44px]">
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {filteredSymptoms === null ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSymptoms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No symptoms recorded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSymptoms.map((symptom) => {
              const severityNum = symptom.severity ?? 0;
              return (
                <Card key={symptom.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="shrink-0">
                            {symptom.type}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          {formatDateTime(symptom.noted_at)}
                        </p>
                        {symptom.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {symptom.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <SeverityBar value={severityNum} />
                        <button
                          onClick={() => setDeleteTarget(symptom)}
                          aria-label={`Delete ${symptom.type} entry`}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Symptom Entry</DialogTitle>
            <DialogDescription>
              This will permanently delete this symptom entry. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm font-medium py-2">
              {deleteTarget.type} &middot; {deleteTarget.severity}/10 &middot; {formatDateTime(deleteTarget.noted_at)}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="min-h-[44px]" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
