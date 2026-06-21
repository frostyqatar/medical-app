import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pill, Plus, CheckCircle2, XCircle, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { fetchMedications, createMedication, updateMedication } from '@/api'
import type { Medication } from '@/api'
import { useChatContext } from '@/context/ChatContext'

const CATEGORIES: Record<string, string> = {
  'BP': 'Blood Pressure', 'heart/BP': 'Blood Pressure', 'antiplatelet': 'Cardiovascular',
  'cholesterol': 'Cholesterol', 'diabetes/weight': 'Diabetes', 'diabetes': 'Diabetes',
  'nerve/phantom pain': 'Neuropathy & Pain', 'nerve pain': 'Neuropathy & Pain',
  'neuropathy': 'Neuropathy & Pain', 'pain/fever': 'Pain', 'pain': 'Pain',
  'stomach': 'GI & Stomach', 'constipation': 'GI & Stomach',
  'fungal skin': 'Skin', 'itch/rash': 'Skin', 'antihistamine': 'Allergy',
  'deficiency': 'Vitamins & Supplements', 'joint': 'Vitamins & Supplements', 'wound': 'Wound Care',
}
const CATEGORY_ORDER = ['Blood Pressure', 'Cardiovascular', 'Cholesterol', 'Diabetes', 'Neuropathy & Pain', 'Pain', 'GI & Stomach', 'Skin', 'Allergy', 'Vitamins & Supplements', 'Wound Care', 'Other']
function categorize(p: string | null) { return CATEGORIES[p || ''] || 'Other' }

export default function MedicationsMobile() {
  const [meds, setMeds] = useState<Medication[] | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ drug: '', dose: '', schedule: '', purpose: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const { sendMessage } = useChatContext()

  useEffect(() => {
    fetchMedications(undefined).then(setMeds).catch(() => setMeds([]))
  }, [])

  function load() { fetchMedications(undefined).then(setMeds).catch(() => setMeds([])) }

  async function toggleActive(med: Medication) {
    await updateMedication(med.id, { active: med.active === 1 ? 0 : 1 })
    load()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.drug || !form.dose || !form.schedule || !form.purpose) return
    setSubmitting(true)
    await createMedication({ drug: form.drug, dose: form.dose, route: null, schedule: form.schedule, purpose: form.purpose, description: form.description || undefined, active: 1 })
    setForm({ drug: '', dose: '', schedule: '', purpose: '', description: '' })
    setAddOpen(false)
    setSubmitting(false)
    load()
  }

  const grouped: Record<string, Medication[]> = {}
  for (const m of meds || []) {
    const cat = categorize(m.purpose)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(m)
  }

  // Separate active from inactive
  const activeByCat: Record<string, Medication[]> = {}
  const inactiveMeds: Medication[] = []
  for (const cat of CATEGORY_ORDER) {
    const group = grouped[cat] || []
    activeByCat[cat] = group.filter(m => m.active === 1)
    group.filter(m => m.active === 0).forEach(m => inactiveMeds.push(m))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Medications</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setAddOpen(true)}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {meds === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : (
        <>
          {CATEGORY_ORDER.map(cat => {
            const items = activeByCat[cat]
            if (!items || items.length === 0) return null
            return (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{cat}</h3>
                {items.map(med => {
                  const isExpanded = expanded.has(med.id)
                  return (
                    <Card key={med.id} className="border rounded-xl">
                      <CardContent className="p-0">
                        <button
                          className="w-full p-4 text-left flex items-start justify-between gap-3"
                          onClick={() => {
                            setExpanded(prev => {
                              const next = new Set(prev)
                              isExpanded ? next.delete(med.id) : next.add(med.id)
                              return next
                            })
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{med.drug}</span>
                              {med.active === 1 ? (
                                <Badge variant="default" className="text-[10px] h-5">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] h-5">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {med.dose} &middot; {med.schedule || '—'}
                            </p>
                            {med.purpose && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 italic">{med.purpose}</p>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t pt-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-xs text-muted-foreground">Route</span><p>{med.route || '—'}</p></div>
                              <div><span className="text-xs text-muted-foreground">Purpose</span><p className="truncate">{med.purpose || '—'}</p></div>
                            </div>
                            {med.description && (
                              <div className="bg-muted/50 rounded-lg p-2.5 flex items-start gap-2">
                                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">{med.description}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="outline" size="sm" className="flex-1 min-h-[44px]"
                                onClick={() => sendMessage(`what is ${med.drug}? what does it treat and what are its side effects?`)}
                              >
                                <Sparkles className="h-4 w-4 mr-1" />Ask AI
                              </Button>
                              <Button
                                variant={med.active === 1 ? 'destructive' : 'default'}
                                size="sm" className="flex-1 min-h-[44px]"
                                onClick={() => toggleActive(med)}
                              >
                                {med.active === 1 ? (
                                  <><XCircle className="h-4 w-4 mr-1" />Deactivate</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4 mr-1" />Reactivate</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          })}

          {inactiveMeds.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Inactive</h3>
              {inactiveMeds.map(med => (
                <Card key={med.id} className="border rounded-xl opacity-60">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-through">{med.drug}</p>
                        <p className="text-xs text-muted-foreground">{med.dose} &middot; {med.schedule || '—'}</p>
                        {med.purpose && <p className="text-[11px] text-muted-foreground italic">{med.purpose}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="min-h-[44px] flex-1" onClick={() => toggleActive(med)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Reactivate
                      </Button>
                      <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={() => sendMessage(`what is ${med.drug}?`)}>
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {meds.length === 0 && (
            <Card className="rounded-xl"><CardContent className="p-8 text-center"><Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No medications yet.</p></CardContent></Card>
          )}
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Drug name</Label>
              <Input autoCapitalize="off" autoCorrect="off" placeholder="e.g. Amlodipine" value={form.drug} onChange={e => setForm(f => ({ ...f, drug: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Dose</Label>
              <Input autoCapitalize="off" autoCorrect="off" placeholder="e.g. 10mg" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Schedule</Label>
              <Input autoCapitalize="off" autoCorrect="off" placeholder="e.g. daily, after dinner" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input autoCapitalize="off" autoCorrect="off" placeholder="e.g. BP, diabetes" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="Notes about this medication, side effects, instructions..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="resize-none" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="min-h-[44px]" disabled={submitting || !form.drug || !form.dose || !form.schedule || !form.purpose}>
                {submitting ? 'Adding...' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
