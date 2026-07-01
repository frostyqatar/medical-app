import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FlaskConical, Plus, Info, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { fetchLabs, fetchLabTests, fetchLabTrend, createLab, deleteLab, updateLab } from '@/api';
import type { Lab } from '@/api';

const LAB_DESCRIPTIONS: Record<string, string> = {
  // ── Diabetes / Glucose
  "HbA1c":
    "Average blood sugar over 2–3 months. Key diabetes control marker — measures glycated hemoglobin. Target for diabetics: <7.0%.",
  "eAG (estimated avg glucose)":
    "Estimated average glucose derived from HbA1c (28.7 x HbA1c - 46.7). Reflects average daily blood sugar in familiar mg/dL units.",
  "Glucose (fasting)":
    "Fasting blood glucose level (8+ hours without food). Indicates baseline blood sugar control; used to screen for and monitor diabetes.",
  "Glucose (pre_meal)":
    "Blood glucose before a meal. Used to guide insulin or medication dosing and assess basal control.",
  "Glucose (post_meal)":
    "Blood glucose 1–2 hours after eating. Reflects how the body handles carbohydrate intake; postprandial spikes flag poor glucose tolerance.",
  "Glucose (random)":
    "Blood glucose at any time of day regardless of meals. High random values suggest poor overall glycemic control.",
  "Glucose (bedtime)":
    "Blood glucose before sleep. Helps prevent nocturnal hypo- or hyperglycemia.",
  "Glucose (unknown)":
    "Blood glucose reading. Used to monitor diabetes control across different times of day.",

  // ── Inflammation / Infection
  "CRP":
    "C-reactive protein. Acute-phase reactant; rises rapidly with infection, tissue injury, or inflammation. >100 suggests severe bacterial infection or major tissue damage.",
  "CRP (hs)":
    "High-sensitivity C-reactive protein. Measures low-grade chronic inflammation; used for cardiovascular risk assessment (the lower the better).",
  "WBC":
    "White blood cell count. Key immune marker — elevated in infection, inflammation, stress, or leukemia; low in bone marrow suppression or severe sepsis.",

  // ── Nutrition / Liver
  "Albumin":
    "Major protein made by the liver. Reflects nutritional status and liver synthetic function. Low in malnutrition, chronic illness, liver disease, or severe inflammation.",

  // ── Hematology — CBC
  "Hemoglobin":
    "Oxygen-carrying protein in red blood cells. Low = anemia (bleeding, iron/B12/folate deficiency, chronic disease); high = dehydration, smoking, polycythemia.",
  "Hematocrit":
    "Percentage of blood volume that is red blood cells. Tracks with hemoglobin — low in anemia, high in dehydration.",
  "RBC":
    "Red blood cell count. Low suggests anemia; high may indicate dehydration, smoking, or bone marrow disorder.",
  "MCV":
    "Mean corpuscular volume — average RBC size. Low (<80 fL): iron deficiency, thalassemia. High (>95 fL): B12 or folate deficiency, alcohol.",
  "RBC Morphology":
    "Microscopic examination of RBC shape and size. Microcytes = small cells (often iron deficiency). Macrocytes = large cells (often B12/folate). Poikilocytosis = abnormal shapes.",
  "RDW":
    "Red cell distribution width — variation in RBC size. Elevated in early iron deficiency (before anemia develops), mixed anemias, or recent transfusion.",
  "Platelet count":
    "Number of platelets (thrombocytes). Essential for blood clotting. Low = bleeding risk; high = thrombosis risk or reactive to inflammation/iron deficiency.",
  "Neutrophil %":
    "Percentage of WBCs that are neutrophils — the first-responder immune cells. Elevated in acute bacterial infection, stress, inflammation, or corticosteroid use.",
  "Lymphocyte %":
    "Percentage of WBCs that are lymphocytes — key to viral defense and immune memory. Elevated in viral infections; low in stress, steroids, or immunodeficiency.",
  "Monocyte %":
    "Percentage of WBCs that are monocytes — clean-up cells. Elevated in chronic infections, inflammatory conditions, or recovery from acute infection.",

  // ── Kidney Function
  "Creatinine":
    "Waste product from muscle metabolism. Filtered by kidneys — rising creatinine signals worsening kidney function.",
  "eGFR":
    "Estimated glomerular filtration rate — calculated from creatinine, age, and sex. The best single number for kidney function. >90 is normal; <60 for 3+ months = CKD.",
  "BUN":
    "Blood urea nitrogen — waste product from protein breakdown. Elevated in dehydration, high protein intake, kidney impairment, or GI bleeding.",

  // ── Electrolytes & Minerals
  "Sodium":
    "Major blood electrolyte. Controls fluid balance. Abnormal levels cause neurological symptoms — confusion, seizures, coma.",
  "Potassium":
    "Critical intracellular electrolyte. Affects heart rhythm and muscle function. Both high and low can be life-threatening.",
  "Chloride":
    "Major anion in blood. Moves with sodium; helps maintain acid-base balance. Abnormal levels often reflect fluid or acid-base disorders.",
  "CO2":
    "Serum bicarbonate — reflects the body's acid-base buffer system. Low in metabolic acidosis (DKA, kidney disease); high in metabolic alkalosis (vomiting, diuretics).",
  "Phosphorus":
    "Mineral essential for bones, teeth, and energy (ATP). Elevated in kidney disease; low in malnutrition, refeeding syndrome, or certain medications.",
  "Magnesium":
    "Mineral critical for nerve and muscle function, heart rhythm, and bone health. Low causes muscle cramps, arrhythmias; common in diabetes and malnutrition.",

  // ── Lipids (Cholesterol Panel)
  "Total Cholesterol":
    "Sum of LDL + HDL + 20% of triglycerides. Overall measure of blood cholesterol; goal <200 mg/dL for general population.",
  "Total cholesterol":
    "Sum of LDL + HDL + 20% of triglycerides. Overall measure of blood cholesterol; goal <200 mg/dL for general population.",
  "LDL":
    "Low-density lipoprotein ('bad' cholesterol). Delivers cholesterol to tissues and arteries — main driver of atherosclerosis. Goal <130, ideally <100.",
  "HDL":
    "High-density lipoprotein ('good' cholesterol). Reverse cholesterol transport — removes excess cholesterol from arteries. Higher is protective; target >50 for women, >40 for men.",
  "Triglycerides":
    "Main form of stored fat in the body. Elevated in diabetes, obesity, metabolic syndrome, high-carb diet. Goal <150 mg/dL.",

  // ── Vitamins
  "Vitamin D":
    "25-hydroxyvitamin D — best measure of vitamin D status. Essential for bone health, calcium absorption, and immune function. Deficiency (<30 ng/mL) is common and correctable.",
  "Vitamin D (25-OH)":
    "25-hydroxyvitamin D — best measure of vitamin D status. Essential for bone health, calcium absorption, and immune function. Deficiency (<30 ng/mL) is common and correctable.",

  // ── Urinalysis
  "Urine Appearance":
    "Visual clarity of urine. Cloudy suggests infection (pyuria), crystals, or mucus. Normal is clear to slightly hazy.",
  "Urine Specific Gravity":
    "Urine concentration. Low (dilute) = excess fluid intake, diabetes insipidus, kidney disease. High (concentrated) = dehydration, SIADH, glucose/protein in urine.",
  "Urine pH":
    "Acidity of urine (4.5–8.5 normal). Low pH in high-protein diet or metabolic acidosis; high pH in UTI with urea-splitting bacteria or vegetarian diet.",
  "Urine Protein":
    "Protein in urine — should be negative or trace. Persistent protein suggests kidney damage (diabetic nephropathy, glomerular disease).",
  "Urine Sugar":
    "Glucose in urine — should be negative. Positive when blood glucose exceeds renal threshold (~180 mg/dL), indicating poor glycemic control.",
  "Urine Blood":
    "Blood in urine (hematuria). Can indicate UTI, kidney stones, trauma, glomerular disease, or menstruation. Always investigate unexplained hematuria.",
  "Urine Nitrite":
    "Screening test for bacteria that convert nitrate to nitrite (mostly gram-negative rods like E. coli). Positive strongly suggests UTI.",
  "Urine Leucocytes":
    "Leukocyte esterase — enzyme from white blood cells in urine. Positive suggests pyuria (WBCs) typically from UTI or inflammation.",
  "Urine WBC":
    "White blood cells seen under microscope (per high-power field). >5 WBC/HPF indicates urinary tract inflammation or infection.",
  "Urine RBC":
    "Red blood cells seen under microscope (per high-power field). >3 RBC/HPF suggests bleeding — UTI, stones, glomerular disease, or trauma.",
  "Urine Epithelial cells":
    "Squamous epithelial cells from the urethra/vagina. 0–5 is normal; elevated suggests contamination of specimen or urethral inflammation.",

  // ── Informational / Tracking entries
  "Albumin (NOT RETESTED)":
    "Albumin was not retested on this date. Last known: 3.6 g/dL on 10 June (normal). Likely still within normal range. Recommend recheck at next visit.",
  "CRP (NOT RETESTED)":
    "CRP was not retested on this date. Last known: 8.38 mg/L on 10 June (near normal, down from 277 at admission). Would be useful to recheck to confirm inflammation fully resolved.",
  "Vitamin D (NOT RETESTED)":
    "Vitamin D was not retested on this date. Last known: 40 ng/mL on 10 June (normal, corrected from deficiency of 18). Routine recheck in a few months is advised.",
  "Iron Studies / Ferritin (NEVER DONE)":
    "*** IMPORTANT: These tests have never been performed. *** MCV dropped to 78 fL with microcytosis on 27 June — strongly suggests iron deficiency. Recommend: serum iron, ferritin, TIBC, and transferrin saturation at next visit.",
};

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFlagClass(flag: string | null) {
  if (flag === 'H') return { variant: 'destructive' as const, label: 'H' };
  if (flag === 'L')
    return {
      variant: 'default' as const,
      className: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
      label: 'L',
    };
  return { variant: 'secondary' as const, label: 'N' };
}

function getRefRange(lab: Lab): string {
  const low = lab.ref_low;
  const high = lab.ref_high;
  if (low != null && high != null) return `${low} – ${high}`;
  if (low != null) return `≥ ${low}`;
  if (high != null) return `≤ ${high}`;
  return 'N/A';
}

function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center w-20 h-6">
        <div className="w-4 h-4 rounded-full bg-muted" />
      </div>
    );
  }
  return (
    <ResponsiveContainer width={90} height={24}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[] | null>(null);
  const [tests, setTests] = useState<string[] | null>(null);
  const [selectedTest, setSelectedTest] = useState<string>('__all__');
  const [trend, setTrend] = useState<Lab[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newTest, setNewTest] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [newUnit, setNewUnit] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lab | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTest, setEditTest] = useState<string | null>(null);
  const [editTrend, setEditTrend] = useState<Lab[] | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState(false);

  const loadLabs = useCallback(async (test?: string, silent = false) => {
    if (!silent) setLabs(null);
    try {
      const data = await fetchLabs(test);
      setLabs(data);
      if (!silent) setError(null);
    } catch {
      if (!silent) setError('Failed to load lab results');
    }
  }, []);

  useEffect(() => {
    fetchLabTests()
      .then(setTests)
      .catch(() => setTests([]));
  }, []);

  useEffect(() => {
    const test = selectedTest === '__all__' ? undefined : selectedTest;
    loadLabs(test);
  }, [selectedTest, loadLabs]);

  useEffect(() => {
    if (selectedTest === '__all__') {
      setTrend(null);
      return;
    }
    fetchLabTrend(selectedTest)
      .then(setTrend)
      .catch(() => setTrend(null));
  }, [selectedTest]);

  const labsByTest: Record<string, Lab[]> = {};
  if (labs) {
    for (const lab of labs) {
      if (!labsByTest[lab.test]) labsByTest[lab.test] = [];
      labsByTest[lab.test].push(lab);
    }
  }
  for (const key of Object.keys(labsByTest)) {
    labsByTest[key].sort(
      (a, b) =>
        new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
    );
  }

  function latestPerTest(): Lab[] {
    return Object.values(labsByTest).map((group) => group[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTest || !newValue.trim()) return;
    setSaving(true);
    try {
      await createLab({
        measured_at: new Date(newDate || Date.now()).toISOString(),
        test: newTest,
        value: parseFloat(newValue),
        unit: newUnit || null,
        flag: (newFlag as Lab['flag']) || null,
        notes: newNotes || null,
      });
      setShowForm(false);
      setNewTest('');
      setNewValue('');
      setNewUnit('');
      setNewFlag('');
      setNewNotes('');
      setNewDate(new Date().toISOString().slice(0, 16));
      loadLabs(selectedTest === '__all__' ? undefined : selectedTest);
    } catch {
      setError('Failed to save lab result');
    } finally {
      setSaving(false);
    }
  }

  function autoFill(e: string) {
    setNewTest(e);
    setNewUnit('');
    setNewValue('');
    setNewFlag('');
    const known = labsByTest[e];
    if (known && known.length > 0) {
      const latest = known[0];
      if (latest.unit) setNewUnit(latest.unit);
    }
  }

  async function handleDeleteLab() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLab(deleteTarget.id);
      setDeleteTarget(null);
      loadLabs(selectedTest === '__all__' ? undefined : selectedTest, true);
      if (selectedTest !== '__all__') {
        fetchLabTrend(selectedTest)
          .then(setTrend)
          .catch(() => setTrend(null));
      }
    } catch {
      setError('Failed to delete lab result');
    } finally {
      setDeleting(false);
    }
  }

  function openEditModal(testName: string) {
    setEditTest(testName);
    fetchLabTrend(testName).then(setEditTrend).catch(() => setEditTrend(null));
  }

  function closeEditModal() {
    setEditTest(null);
    setEditTrend(null);
    setEditingCell(null);
    loadLabs(selectedTest === '__all__' ? undefined : selectedTest, true);
    if (selectedTest !== '__all__') fetchLabTrend(selectedTest).then(setTrend).catch(() => setTrend(null));
  }

  async function handleDeleteInModal(lab: Lab) {
    try {
      await deleteLab(lab.id);
      if (editTest) fetchLabTrend(editTest).then(setEditTrend).catch(() => setEditTrend(null));
      if (selectedTest === editTest) fetchLabTrend(selectedTest).then(setTrend).catch(() => setTrend(null));
    } catch {
      setError('Failed to delete reading');
    }
  }

  function startEditing(id: number, field: string, current: string | number | null) {
    setEditingCell({ id, field });
    setEditValue(current != null ? String(current) : '');
  }

  function cancelEditing() {
    setEditingCell(null);
    setEditValue('');
  }

  async function saveCell() {
    if (!editingCell) return;
    setSavingCell(true);
    const { id, field } = editingCell;
    const payload: Record<string, unknown> = {};
    if (field === 'value' || field === 'ref_low' || field === 'ref_high') {
      payload[field] = editValue.trim() ? parseFloat(editValue) : null;
    } else {
      payload[field] = editValue.trim() || null;
    }
    try {
      await updateLab(id, payload);
      setEditingCell(null);
      setEditValue('');
      if (editTest) fetchLabTrend(editTest).then(setEditTrend).catch(() => setEditTrend(null));
    } catch {
      setError('Failed to update reading');
    } finally {
      setSavingCell(false);
    }
  }

  const chartData = trend
    ? [...trend]
        .sort(
          (a, b) =>
            new Date(a.measured_at).getTime() -
            new Date(b.measured_at).getTime()
        )
        .map((v) => ({
          date: formatDate(v.measured_at),
          value: v.value,
          flag: v.flag,
        }))
    : [];

  const isAll = selectedTest === '__all__';
  const displayLabs = isAll ? latestPerTest() : labs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Labs</h1>
        <Button
          variant="outline"
          size="default"
          className="min-h-[44px]"
          onClick={() => setShowForm((s) => !s)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Result
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Record New Lab Result</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lab-test">Test</Label>
                  <Select value={newTest} onValueChange={autoFill}>
                    <SelectTrigger id="lab-test">
                      <SelectValue placeholder="Select test..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tests?.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      )) ?? (
                        <SelectItem value="__loading__" disabled>
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lab-value">Value</Label>
                  <Input
                    id="lab-value"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="e.g. 8.2"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lab-unit">Unit</Label>
                  <Input
                    id="lab-unit"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="e.g. mg/dL"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lab-date">Date &amp; Time</Label>
                  <Input
                    id="lab-date"
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lab-flag">Flag</Label>
                  <Select value={newFlag} onValueChange={setNewFlag}>
                    <SelectTrigger id="lab-flag">
                      <SelectValue placeholder="Auto / None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">— None —</SelectItem>
                      <SelectItem value="H">H — High</SelectItem>
                      <SelectItem value="L">L — Low</SelectItem>
                      <SelectItem value="N">N — Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lab-notes">Notes</Label>
                  <Input
                    id="lab-notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="col-span-2 flex items-end gap-2">
                  <Button type="submit" disabled={saving} size="default" className="min-h-[44px]">
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    className="min-h-[44px]"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            {isAll ? 'All Lab Results' : selectedTest}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full sm:max-w-xs mb-4">
            {tests === null ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by test..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Tests</SelectItem>
                  {tests.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {labs === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : labs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No lab results found. Add one using the button above.
            </p>
          ) : (
            <TooltipProvider>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead className="hidden lg:table-cell">Description</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden sm:table-cell">Trend</TableHead>
                      <TableHead className="w-10"><span className="sr-only">Delete</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(displayLabs ?? [])
                      .sort((a, b) => {
                        if (isAll) return a.test.localeCompare(b.test);
                        return (
                          new Date(b.measured_at).getTime() -
                          new Date(a.measured_at).getTime()
                        );
                      })
                      .map((lab) => {
                        const flagInfo = getFlagClass(lab.flag);
                        const refRange = getRefRange(lab);
                        const displayValue =
                          lab.value != null ? String(lab.value) : '—';
                        const desc =
                          LAB_DESCRIPTIONS[lab.test] ?? 'No description available.';

                        const testTrend =
                          labsByTest[lab.test]
                            ?.slice()
                            .sort(
                              (x, y) =>
                                new Date(x.measured_at).getTime() -
                                new Date(y.measured_at).getTime()
                            )
                            .map((v) => ({
                              date: formatDate(v.measured_at),
                              value: v.value ?? 0,
                            })) ?? [];

                        return (
                          <TableRow key={lab.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {isAll ? (
                                <button
                                  className="text-left hover:text-primary transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                                  onClick={() => openEditModal(lab.test)}
                                >
                                  {lab.test}
                                </button>
                              ) : (
                                <button
                                  className="text-left hover:text-primary transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                                  onClick={() => openEditModal(lab.test)}
                                >
                                  {lab.test}
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-muted-foreground max-w-56">
                              {desc}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {displayValue}
                            </TableCell>
                            <TableCell className="text-xs">
                              {lab.unit ?? '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {refRange}
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Badge
                                      variant={flagInfo.variant}
                                      className={
                                        'className' in flagInfo
                                          ? flagInfo.className
                                          : undefined
                                      }
                                    >
                                      {flagInfo.label}
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {lab.flag === 'H' || lab.flag === 'L'
                                    ? `Abnormal — Reference range: ${refRange}`
                                    : `Within normal range (${refRange})`}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {isAll
                                ? formatDate(lab.measured_at)
                                : formatDateTime(lab.measured_at)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {isAll ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-default">
                                      <Sparkline data={testTrend} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="p-2">
                                    <div className="text-xs">
                                      {testTrend.length} readings over{' '}
                                      {testTrend.length >= 2
                                        ? `${testTrend[0]?.date} – ${testTrend[testTrend.length - 1]?.date}`
                                        : '1 day'}
                                      <br />
                                      Range:{' '}
                                      {Math.min(
                                        ...testTrend.map((d) => d.value)
                                      )}
                                      {' – '}
                                      {Math.max(
                                        ...testTrend.map((d) => d.value)
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[40px] min-w-[40px] text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(lab)} title="Delete this reading" aria-label={`Delete ${lab.test} reading`}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          )}
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {!isAll && trend && trend.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              Trend — {selectedTest}
            </CardTitle>
            {LAB_DESCRIPTIONS[selectedTest] && (
              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {LAB_DESCRIPTIONS[selectedTest]}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No trend data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    width={50}
                  />
                  <RechartsTooltip />
                  {trend[0]?.ref_low != null && (
                    <ReferenceLine
                      y={trend[0].ref_low}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="4 4"
                      label={{
                        value: `Low: ${trend[0].ref_low}`,
                        position: 'left',
                        fontSize: 10,
                      }}
                    />
                  )}
                  {trend[0]?.ref_high != null && (
                    <ReferenceLine
                      y={trend[0].ref_high}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="4 4"
                      label={{
                        value: `High: ${trend[0].ref_high}`,
                        position: 'left',
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot
                    name={selectedTest}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {trend[0]?.unit && (
              <p className="text-xs text-muted-foreground mt-2">
                Unit: {trend[0].unit}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={editTest !== null} onOpenChange={(open) => { if (!open) closeEditModal(); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-muted-foreground" />
              Edit Readings — {editTest}
            </DialogTitle>
            {editTest && LAB_DESCRIPTIONS[editTest] && (
              <DialogDescription className="flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {LAB_DESCRIPTIONS[editTest]}
              </DialogDescription>
            )}
          </DialogHeader>
          {editTest && editTrend && editTrend.length > 0 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...editTrend].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()).map(v => ({ date: formatDate(v.measured_at), value: v.value }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={45} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {editTest && editTrend && (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Ref Low</TableHead>
                    <TableHead>Ref High</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(editTrend || [])].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()).map((lab) => {
                    const isEditing = editingCell?.id === lab.id;
                    const field = editingCell?.field;
                    const flagInfo = getFlagClass(lab.flag);
                    return (
                      <TableRow key={lab.id} className="group">
                        <TableCell className="text-xs whitespace-nowrap">{formatDateTime(lab.measured_at)}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-accent/50 min-w-[60px]"
                          onClick={() => startEditing(lab.id, 'value', lab.value)}
                        >
                          {isEditing && field === 'value' ? (
                            <input className="w-20 h-8 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : lab.value != null ? String(lab.value) : <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-accent/50 min-w-[60px]"
                          onClick={() => startEditing(lab.id, 'unit', lab.unit)}
                        >
                          {isEditing && field === 'unit' ? (
                            <input className="w-20 h-8 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : lab.unit || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-accent/50 min-w-[60px]"
                          onClick={() => startEditing(lab.id, 'ref_low', lab.ref_low)}
                        >
                          {isEditing && field === 'ref_low' ? (
                            <input className="w-20 h-8 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : lab.ref_low != null ? String(lab.ref_low) : <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-accent/50 min-w-[60px]"
                          onClick={() => startEditing(lab.id, 'ref_high', lab.ref_high)}
                        >
                          {isEditing && field === 'ref_high' ? (
                            <input className="w-20 h-8 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : lab.ref_high != null ? String(lab.ref_high) : <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => startEditing(lab.id, 'flag', lab.flag)}
                        >
                          {isEditing && field === 'flag' ? (
                            <select className="h-8 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus>
                              <option value="">—</option>
                              <option value="H">H — High</option>
                              <option value="L">L — Low</option>
                              <option value="N">N — Normal</option>
                            </select>
                          ) : (
                            <Badge variant={flagInfo.variant} className={'className' in flagInfo ? flagInfo.className : undefined}>
                              {flagInfo.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-accent/50 min-w-[80px] max-w-[150px] truncate"
                          onClick={() => startEditing(lab.id, 'notes', lab.notes)}
                        >
                          {isEditing && field === 'notes' ? (
                            <input className="w-32 h-8 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : lab.notes || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteInModal(lab); }} title="Delete reading" aria-label={`Delete ${lab.test} reading`}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden space-y-2">
                {[...(editTrend || [])].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()).map((lab) => {
                  const isEditing = editingCell?.id === lab.id;
                  const field = editingCell?.field;
                  const flagInfo = getFlagClass(lab.flag);
                  return (
                    <div key={lab.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDateTime(lab.measured_at)}</span>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteInModal(lab); }} title="Delete reading" aria-label={`Delete ${lab.test} reading`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div onClick={() => startEditing(lab.id, 'value', lab.value)} className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5">
                          <span className="text-xs text-muted-foreground">Value</span>
                          {isEditing && field === 'value' ? (
                            <input className="w-full h-10 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : <p className="font-medium">{lab.value != null ? String(lab.value) : '—'}</p>}
                        </div>
                        <div onClick={() => startEditing(lab.id, 'unit', lab.unit)} className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5">
                          <span className="text-xs text-muted-foreground">Unit</span>
                          {isEditing && field === 'unit' ? (
                            <input className="w-full h-10 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : <p className="font-medium">{lab.unit || '—'}</p>}
                        </div>
                        <div onClick={() => startEditing(lab.id, 'ref_low', lab.ref_low)} className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5">
                          <span className="text-xs text-muted-foreground">Ref Low</span>
                          {isEditing && field === 'ref_low' ? (
                            <input className="w-full h-10 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : <p className="font-medium">{lab.ref_low != null ? String(lab.ref_low) : '—'}</p>}
                        </div>
                        <div onClick={() => startEditing(lab.id, 'ref_high', lab.ref_high)} className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5">
                          <span className="text-xs text-muted-foreground">Ref High</span>
                          {isEditing && field === 'ref_high' ? (
                            <input className="w-full h-10 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : <p className="font-medium">{lab.ref_high != null ? String(lab.ref_high) : '—'}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div onClick={() => startEditing(lab.id, 'flag', lab.flag)} className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5">
                          <span className="text-xs text-muted-foreground">Flag</span>
                          {isEditing && field === 'flag' ? (
                            <select className="h-10 border rounded px-1 text-sm w-full" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus>
                              <option value="">—</option>
                              <option value="H">H — High</option>
                              <option value="L">L — Low</option>
                              <option value="N">N — Normal</option>
                            </select>
                          ) : (
                            <Badge variant={flagInfo.variant} className={'className' in flagInfo ? flagInfo.className : undefined}>
                              {flagInfo.label}
                            </Badge>
                          )}
                        </div>
                        <div onClick={() => startEditing(lab.id, 'notes', lab.notes)} className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Notes</span>
                          {isEditing && field === 'notes' ? (
                            <input className="w-full h-10 border rounded px-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') cancelEditing(); }} autoFocus />
                          ) : <p className="text-sm truncate">{lab.notes || '—'}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Lab Result</DialogTitle>
            <DialogDescription>
              This will permanently remove this reading and destroy the trend for this test.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-2 py-2">
              <p className="text-sm font-medium">{deleteTarget.test}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Value</span>
                  <p className="font-mono">{deleteTarget.value}{deleteTarget.unit ? ` ${deleteTarget.unit}` : ''}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Date</span>
                  <p>{formatDateTime(deleteTarget.measured_at)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Flag</span>
                  <p>{deleteTarget.flag ?? 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Ref Range</span>
                  <p>{getRefRange(deleteTarget)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLab}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
