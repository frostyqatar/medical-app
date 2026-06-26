import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Pill, Plus, CheckCircle2, XCircle, Sparkles, Info, Pencil, Trash2 } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  fetchMedications,
  fetchAdherence,
  fetchMedicationLog,
  createMedication,
  updateMedication,
} from '@/api';
import type { Medication, AdherenceRow, MedicationLog } from '@/api';
import { usePageContext } from '@/context/ChatContext';

const CATEGORIES: Record<string, string> = {
  'BP': 'Blood Pressure', 'heart/BP': 'Blood Pressure', 'antiplatelet': 'Cardiovascular', 'anticoagulant': 'Cardiovascular', 'vascular protective': 'Cardiovascular',
  'cholesterol': 'Cholesterol', 'diabetes/weight': 'Diabetes', 'diabetes': 'Diabetes',
  'nerve/phantom pain': 'Neuropathy & Pain', 'nerve pain': 'Neuropathy & Pain',
  'nerve pain/mood': 'Neuropathy & Pain', 'neuropathy': 'Neuropathy & Pain',
  'pain/fever': 'Pain', 'pain': 'Pain', 'joint pain': 'Pain',
  'stomach': 'GI & Stomach', 'constipation': 'GI & Stomach', 'hemorrhoids': 'GI & Stomach',
  'gut motility': 'GI & Stomach',
  'fungal skin': 'Skin', 'itch/rash': 'Skin', 'antifungal': 'Skin',
  'antihistamine': 'Allergy', 'deficiency': 'Vitamins & Supplements',
  'joint': 'Vitamins & Supplements', 'wound': 'Wound Care',
  'skincare': 'Skin Care', 'hair loss': 'Hair Loss',
};

const CATEGORY_ORDER = [
  'Blood Pressure', 'Cardiovascular', 'Cholesterol', 'Diabetes',
  'Neuropathy & Pain', 'Pain', 'GI & Stomach', 'Skin', 'Skin Care',
  'Allergy', 'Vitamins & Supplements', 'Wound Care', 'Hair Loss', 'Other',
];

const CATEGORY_PURPOSE = Object.fromEntries(
  CATEGORY_ORDER.filter((c) => c !== 'Other').map((c) => [
    c, Object.entries(CATEGORIES).find(([, cat]) => cat === c)?.[0] ?? '',
  ])
) as Record<string, string>;

function categorize(purpose: string | null): string {
  if (!purpose) return 'Other';
  if (CATEGORIES[purpose]) return CATEGORIES[purpose];
  return purpose.replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeCategoryOrder(medications: Medication[] | null): string[] {
  if (!medications) return CATEGORY_ORDER;
  const usedKnown = new Set(
    medications.map((m) => categorize(m.purpose)).filter((c) => CATEGORY_ORDER.includes(c))
  );
  const dynamic = [...new Set(
    medications.map((m) => categorize(m.purpose)).filter((c) => !CATEGORY_ORDER.includes(c))
  )].sort();
  return [...CATEGORY_ORDER.filter((c) => usedKnown.has(c)), ...dynamic];
}

const TIME_BUCKET_ORDER = [
  'Morning', 'After Dinner', 'Bedtime', 'Evening',
  'Twice Daily', 'Around the Clock', 'Weekly', 'PRN / As Needed', 'Other',
];

function parseScheduleTime(schedule: string | null): string {
  if (!schedule) return 'Other';
  const lower = schedule.toLowerCase();
  if (lower.includes('after breakfast') || lower.includes('before breakfast')) return 'Morning';
  if (lower.includes('after dinner')) return 'After Dinner';
  if (lower.includes('bedtime')) return 'Bedtime';
  if (lower.includes('evening')) return 'Evening';
  if (lower.includes('2x/day') || lower.includes('twice daily') || lower.includes('with meals')) return 'Twice Daily';
  if (/q[4-8]h/.test(lower)) return 'Around the Clock';
  if (lower.includes('weekly')) return 'Weekly';
  if (lower.includes('prn') || lower.includes('as needed')) return 'PRN / As Needed';
  return 'Other';
}

const ROUTES = ['oral', 'SC', 'IV', 'topical', 'IM'];

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  taken: 'default', missed: 'destructive', skipped: 'secondary', held: 'outline',
};

type EditableField = 'drug' | 'dose' | 'route' | 'schedule' | 'purpose';

interface NewMedForm {
  drug: string; dose: string; route: string; schedule: string; category: string; purpose: string;
}

const EMPTY_NEW_MED: NewMedForm = { drug: '', dose: '', route: '', schedule: '', category: '', purpose: '' };

export default function Medications() {
  const [medications, setMedications] = useState<Medication[] | null>(null);
  const [adherence, setAdherence] = useState<AdherenceRow[] | null>(null);
  const [selectedMedId, setSelectedMedId] = useState<number | null>(null);
  const [medLogData, setMedLogData] = useState<{ medId: number; log: MedicationLog[] } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filterActive, setFilterActive] = useState<number | undefined>(undefined);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editField, setEditField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState<NewMedForm>(EMPTY_NEW_MED);
  const [deactivateTarget, setDeactivateTarget] = useState<Medication | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMedications(filterActive)
      .then((data) => { if (!cancelled) { setMedications(data); setErrors((e) => ({ ...e, medications: '' })); } })
      .catch(() => { if (!cancelled) setErrors((e) => ({ ...e, medications: 'Failed to load medications' })); });
    return () => { cancelled = true; };
  }, [filterActive]);

  useEffect(() => { fetchAdherence(7).then(setAdherence).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedMedId === null) return;
    let cancelled = false;
    fetchMedicationLog(selectedMedId, 14)
      .then((log) => { if (!cancelled) setMedLogData({ medId: selectedMedId, log }); })
      .catch(() => { if (!cancelled) setMedLogData({ medId: selectedMedId, log: [] }); });
    return () => { cancelled = true; };
  }, [selectedMedId]);

  const pushContext = usePageContext(
    medications
      ? `Active medications: ${medications.filter(m => m.active).map(m => `${m.drug} ${m.dose} (${m.purpose}) schedule: ${m.schedule}`).join(' | ')}`
      : ''
  );
  useEffect(() => { pushContext(); }, [pushContext]);

  const { sendMessage } = useChatContext();

  const medLog = medLogData?.medId === selectedMedId ? medLogData.log : null;

  const overallAdherence = (() => {
    if (!adherence || adherence.length === 0) return null;
    const total = adherence.reduce((s, a) => s + a.total_logs, 0);
    const taken = adherence.reduce((s, a) => s + a.taken_count, 0);
    return total > 0 ? Math.round((taken / total) * 100) : 0;
  })();

  function refreshMedications() {
    fetchMedications(filterActive)
      .then((data) => { setMedications(data); setErrors((e) => ({ ...e, medications: '' })); })
      .catch(() => setErrors((e) => ({ ...e, medications: 'Failed to load medications' })));
  }

  function startEdit(medId: number, field: EditableField, currentValue: string | null) {
    setEditingId(medId); setEditField(field); setEditValue(currentValue ?? '');
  }

  function clearEdit() { setEditingId(null); setEditField(null); setEditValue(''); }

  async function handleSaveField() {
    if (editingId === null || editField === null) return;
    try { await updateMedication(editingId, { [editField]: editValue || null }); clearEdit(); refreshMedications(); }
    catch { setErrors((e) => ({ ...e, save: 'Failed to save' })); }
  }

  function handleFieldKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveField(); }
    else if (e.key === 'Escape') { e.preventDefault(); clearEdit(); }
  }

  function handleDeactivate(med: Medication) { setDeactivateTarget(med); }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    try { await updateMedication(deactivateTarget.id, { active: deactivateTarget.active === 1 ? 0 : 1 }); setDeactivateTarget(null); refreshMedications(); }
    catch { setErrors((e) => ({ ...e, save: 'Failed to update status' })); }
  }

  function startNewMed() { setNewMedForm(EMPTY_NEW_MED); setEditingId(null); setEditField(null); setAddModalOpen(true); }

  function handleCategorySelect(category: string) {
    if (category === 'Other') setNewMedForm((f) => ({ ...f, category, purpose: '' }));
    else setNewMedForm((f) => ({ ...f, category, purpose: CATEGORY_PURPOSE[category] || '' }));
  }

  async function handleSaveNewMed() {
    if (!newMedForm.drug || !newMedForm.dose || !newMedForm.schedule || !newMedForm.purpose) return;
    try { await createMedication({ drug: newMedForm.drug, dose: newMedForm.dose, route: newMedForm.route || null, schedule: newMedForm.schedule, purpose: newMedForm.purpose, active: 1 }); setAddModalOpen(false); setNewMedForm(EMPTY_NEW_MED); refreshMedications(); }
    catch { setErrors((e) => ({ ...e, save: 'Failed to create medication' })); }
  }

  function formatDate(ts: string) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  const grouped = (medications ?? []).reduce((acc, med) => { const cat = categorize(med.purpose); if (!acc[cat]) acc[cat] = []; acc[cat].push(med); return acc; }, {} as Record<string, Medication[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Medications</h1>
        <Button size="sm" className="min-h-[44px]" onClick={startNewMed}><Plus className="h-4 w-4" />Add Medication</Button>
      </div>

      {/* Adherence Summary */}
      <Card>
        <CardHeader className="pb-3"><div className="flex items-center gap-2"><Pill className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Overall Adherence (7 days)</CardTitle></div></CardHeader>
        <CardContent>
          {adherence === null ? <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-2 w-full" /></div>
          : overallAdherence === null ? <p className="text-sm text-muted-foreground py-2">No adherence data available.</p>
          : <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">{overallAdherence}% taken</span><span className="text-xs text-muted-foreground">Last 7 days</span></div>
              <Progress value={overallAdherence} className="h-2.5" />
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div><span className="text-xs text-muted-foreground">Taken</span><p className="text-sm font-semibold tabular-nums text-green-600">{adherence.reduce((s, a) => s + a.taken_count, 0)}</p></div>
                <div><span className="text-xs text-muted-foreground">Missed</span><p className="text-sm font-semibold tabular-nums text-red-600">{adherence.reduce((s, a) => s + a.missed_count, 0)}</p></div>
                <div><span className="text-xs text-muted-foreground">Total Logs</span><p className="text-sm font-semibold tabular-nums">{adherence.reduce((s, a) => s + a.total_logs, 0)}</p></div>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader className="pb-3"><div className="flex items-center gap-2"><Pill className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Analytics</CardTitle></div></CardHeader>
        <CardContent>
          {medications === null ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Category</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {computeCategoryOrder(medications).map((cat) => {
                    const count = grouped[cat]?.length ?? 0;
                    if (count === 0) return null;
                    const activeCount = grouped[cat]?.filter((m) => m.active === 1).length ?? 0;
                    return (
                      <div key={cat} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                        <span className="text-lg font-bold tabular-nums">{count}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{cat}</p>
                          <p className="text-[10px] text-muted-foreground">{activeCount} active</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Schedule</h4>
                <div className="space-y-1.5">
                  {(() => {
                    const scheduleCounts: Record<string, number> = {};
                    for (const m of medications.filter((x) => x.active === 1)) {
                      const bucket = parseScheduleTime(m.schedule);
                      scheduleCounts[bucket] = (scheduleCounts[bucket] ?? 0) + 1;
                    }
                    const maxCount = Math.max(...Object.values(scheduleCounts), 1);
                    return TIME_BUCKET_ORDER.map((bucket) => {
                      const count = scheduleCounts[bucket] ?? 0;
                      if (count === 0) return null;
                      return (
                        <div key={bucket} className="flex items-center gap-2">
                          <span className="text-xs w-28 shrink-0 truncate text-muted-foreground">{bucket}</span>
                          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                          </div>
                          <span className="text-xs font-bold tabular-nums w-5 text-right">{count}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                <span className="font-medium">{medications.filter((m) => m.active === 1).length} active</span>
                <span>{medications.filter((m) => m.active === 0).length} inactive</span>
                <span>{medications.length} total</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2"><Pill className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Schedule</CardTitle></div>
            <div className="flex items-center gap-1">
              {[{ label: 'All', value: undefined }, { label: 'Active', value: 1 }, { label: 'Inactive', value: 0 }].map((f) => (
                <Button key={f.label} variant={filterActive === f.value ? 'secondary' : 'ghost'} size="sm" className="min-h-[44px] px-3" onClick={() => setFilterActive(f.value as number | undefined)}>{f.label}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {medications === null ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          : medications.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No medications found.</p>
          : <div className="space-y-8">
              {computeCategoryOrder(medications).map((category) => {
                const medsInCat = grouped[category];
                if (!medsInCat || medsInCat.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {medsInCat.map((med) => {
                        const isEditing = editingId === med.id;
                        return (
                          <div key={med.id} className="border rounded-xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/10" onClick={() => setSelectedMedId(selectedMedId === med.id ? null : med.id)}>
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button onClick={(e) => { e.stopPropagation(); sendMessage(`what is ${med.drug}?`); }} className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-primary shrink-0" title={`Ask about ${med.drug}`}><Sparkles className="h-3.5 w-3.5" /></button>
                                {isEditing && editField === 'drug' ? (
                                  <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleFieldKeyDown} autoFocus readOnly onFocus={(e: any) => e.target.removeAttribute('readOnly')} className="h-10 text-sm flex-1" autoComplete="off" name="med-edit-drug" onClick={(e) => e.stopPropagation()} />
                                ) : (
                                  <span className="font-semibold text-sm truncate" onClick={(e) => { e.stopPropagation(); startEdit(med.id, 'drug', med.drug); }}>{med.drug}</span>
                                )}
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleDeactivate(med); }} className="min-h-[44px] inline-flex items-center shrink-0 ml-2">
                                {med.active === 1 ? <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge> : <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />Inactive</Badge>}
                              </button>
                            </div>

                            {/* Detail rows */}
                            <div className="border-t px-3 py-2 space-y-1.5 bg-muted/20">
                              {(['dose', 'route', 'schedule', 'purpose'] as EditableField[]).map((field) => {
                                const current = med[field] ?? '';
                                const isEditingField = isEditing && editField === field;
                                const label = { dose: 'Dose', route: 'Route', schedule: 'Schedule', purpose: 'Purpose' }[field];
                                return (
                                  <div key={field} className="flex items-center gap-2 text-sm min-h-[36px]">
                                    <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
                                    {isEditingField ? (
                                      <div className="flex-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        {field === 'route' ? (
                                          <Select value={editValue} onValueChange={(v) => { setEditValue(v); updateMedication(med.id, { route: v || null }).then(() => { clearEdit(); refreshMedications(); }).catch(() => setErrors((e) => ({ ...e, save: 'Failed' }))); }}>
                                            <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
                                            <SelectContent>{ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                          </Select>
                                        ) : (
                                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleFieldKeyDown} autoFocus readOnly onFocus={(e: any) => e.target.removeAttribute('readOnly')} className="h-9 text-sm flex-1" autoComplete="off" name={`med-edit-${field}`} />
                                        )}
                                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearEdit}><XCircle className="h-4 w-4" /></Button>
                                      </div>
                                    ) : (
                                      <span className="flex-1 truncate cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 min-h-[28px] flex items-center" onClick={(e) => { e.stopPropagation(); startEdit(med.id, field, med[field] ?? ''); }}>
                                        {current || <span className="text-muted-foreground italic">—</span>}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              {med.description && <p className="text-xs text-muted-foreground pt-1 leading-relaxed">{med.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Drug</TableHead><TableHead>Dose</TableHead><TableHead>Route</TableHead>
                            <TableHead>Schedule</TableHead><TableHead>Purpose</TableHead><TableHead>Status</TableHead><TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medsInCat.map((med) => (
                            <TableRow key={med.id} className="cursor-pointer" onClick={() => setSelectedMedId(selectedMedId === med.id ? null : med.id)}>
                              <TableCell onClick={(e) => { e.stopPropagation(); if (editingId !== med.id || editField !== 'drug') startEdit(med.id, 'drug', med.drug); }}>
                                {editingId === med.id && editField === 'drug' ? (
                                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleFieldKeyDown} autoFocus readOnly onFocus={(e: any) => e.target.removeAttribute('readOnly')} className="h-9 text-sm" autoComplete="off" name="med-edit-drug-dt" />
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium">{med.drug}</span>
                                      <button onClick={(e) => { e.stopPropagation(); sendMessage(`what is ${med.drug}?`); }} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-primary" title={`Ask about ${med.drug}`}><Sparkles className="h-3 w-3" /></button>
                                    </div>
                                    {med.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] sm:max-w-[320px] whitespace-normal leading-relaxed">{med.description}</p>}
                                  </div>
                                )}
                              </TableCell>
                              {(['dose', 'route', 'schedule', 'purpose'] as EditableField[]).map((field) => (
                                <TableCell key={field} onClick={(e) => { e.stopPropagation(); startEdit(med.id, field, med[field] ?? ''); }} className="cursor-pointer hover:bg-muted/50 min-w-[80px] min-h-[44px]">
                                  {editingId === med.id && editField === field ? (
                                    field === 'route' ? (
                                      <Select value={editValue} onValueChange={(v) => { updateMedication(med.id, { route: v || null }).then(() => { clearEdit(); refreshMedications(); }).catch(() => setErrors((e) => ({ ...e, save: 'Failed' }))); }}>
                                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>{ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                      </Select>
                                    ) : (
                                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleFieldKeyDown} autoFocus readOnly onFocus={(e: any) => e.target.removeAttribute('readOnly')} className="h-9 text-sm" autoComplete="off" name={`med-edit-${field}-dt`} />
                                    )
                                  ) : (med[field] || <span className="text-muted-foreground">—</span>)}
                                </TableCell>
                              ))}
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); handleDeactivate(med); }} className="cursor-pointer min-h-[44px] inline-flex items-center">
                                  {med.active === 1 ? <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge> : <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />Inactive</Badge>}
                                </button>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={(e) => { e.stopPropagation(); handleDeactivate(med); }} title={med.active ? 'Deactivate' : 'Reactivate'}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>}
          {errors.medications && <p className="text-sm text-destructive mt-2">{errors.medications}</p>}
          {errors.save && <p className="text-sm text-destructive mt-2">{errors.save}</p>}

          {selectedMedId !== null && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-semibold mb-3">Recent Doses</h4>
                {medLog === null ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                : medLog.length === 0 ? <p className="text-sm text-muted-foreground py-2">No dose history.</p>
                : <div className="overflow-x-auto"><Table>
                    <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Scheduled</TableHead><TableHead>Taken</TableHead></TableRow></TableHeader>
                    <TableBody>{medLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell><Badge variant={STATUS_VARIANT[log.status] ?? 'outline'}>{log.status}</Badge></TableCell>
                        <TableCell className="text-xs">{formatDate(log.scheduled_for)}</TableCell>
                        <TableCell className="text-xs">{log.taken_at ? formatDate(log.taken_at) : '—'}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table></div>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Medication Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Medication</DialogTitle><DialogDescription>Add a new medication to the schedule.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5"><label className="text-sm font-medium">Drug name</label><Input value={newMedForm.drug} onChange={(e) => setNewMedForm((f) => ({ ...f, drug: e.target.value }))} placeholder="e.g. Amlodipine" autoComplete="off" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5"><label className="text-sm font-medium">Dose</label><Input value={newMedForm.dose} onChange={(e) => setNewMedForm((f) => ({ ...f, dose: e.target.value }))} placeholder="e.g. 10mg" autoComplete="off" /></div>
              <div className="grid gap-1.5"><label className="text-sm font-medium">Route</label>
                <Select value={newMedForm.route} onValueChange={(v) => setNewMedForm((f) => ({ ...f, route: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>{ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5"><label className="text-sm font-medium">Schedule</label><Input value={newMedForm.schedule} onChange={(e) => setNewMedForm((f) => ({ ...f, schedule: e.target.value }))} placeholder="e.g. daily, after dinner" autoComplete="off" /></div>
            <div className="grid gap-1.5"><label className="text-sm font-medium">Category</label>
              <Select value={newMedForm.category} onValueChange={handleCategorySelect}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>{CATEGORY_ORDER.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {newMedForm.category === 'Other' && <div className="grid gap-1.5"><label className="text-sm font-medium">Purpose (custom)</label><Input value={newMedForm.purpose} onChange={(e) => setNewMedForm((f) => ({ ...f, purpose: e.target.value }))} placeholder="e.g. supplement" autoComplete="off" /></div>}
            {newMedForm.category && newMedForm.category !== 'Other' && newMedForm.purpose && <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5"><Info className="h-3 w-3 shrink-0" />Purpose: <span className="font-medium text-foreground">{newMedForm.purpose}</span></div>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="min-h-[44px]" onClick={() => setNewMedForm(EMPTY_NEW_MED)}>Cancel</Button></DialogClose>
            <Button className="min-h-[44px]" onClick={handleSaveNewMed} disabled={!newMedForm.drug || !newMedForm.dose || !newMedForm.schedule || !newMedForm.purpose}>Add Medication</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Reactivate Confirmation */}
      <Dialog open={deactivateTarget !== null} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{deactivateTarget?.active === 1 ? 'Deactivate' : 'Reactivate'} Medication</DialogTitle>
            <DialogDescription>{deactivateTarget?.active === 1 ? `Deactivate ${deactivateTarget?.drug}? It will no longer appear in the active schedule.` : `Reactivate ${deactivateTarget?.drug}? It will reappear in the active schedule.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="min-h-[44px]">Cancel</Button></DialogClose>
            <Button variant={deactivateTarget?.active === 1 ? 'destructive' : 'default'} className="min-h-[44px]" onClick={confirmDeactivate}>{deactivateTarget?.active === 1 ? 'Deactivate' : 'Reactivate'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
