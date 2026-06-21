import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Bandage, AlertTriangle, Image, Calendar, X } from 'lucide-react';
import { fetchWounds, fetchWoundSites, createWound, deleteWound } from '@/api';
import type { Wound } from '@/api';

type WoundFormData = {
  site: string;
  assessed_at: string;
  size_note: string;
  appearance: string;
  discharge: string;
  odor: boolean;
  color_change: boolean;
  photo_ref: string;
  notes: string;
};

const EMPTY_FORM: WoundFormData = {
  site: '',
  assessed_at: new Date().toISOString().slice(0, 10),
  size_note: '',
  appearance: '',
  discharge: '',
  odor: false,
  color_change: false,
  photo_ref: '',
  notes: '',
};

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isUrgent(w: Wound): boolean {
  return !!w.odor || !!w.color_change || (!!w.discharge && w.discharge !== 'none');
}

export default function WoundsPage() {
  const [sites, setSites] = useState<string[] | null>(null);
  const [wounds, setWounds] = useState<Wound[] | null>(null);
  const [activeSite, setActiveSite] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<WoundFormData>({ ...EMPTY_FORM });

  const loadData = useCallback(async () => {
    try {
      const [sitesData, woundsData] = await Promise.all([
        fetchWoundSites(),
        fetchWounds(),
      ]);
      setSites(sitesData);
      setWounds(woundsData);
      if (sitesData.length > 0 && !activeSite) {
        setActiveSite(sitesData[0]);
      }
      setError(null);
    } catch {
      setError('Failed to load wound data');
    }
  }, [activeSite]);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const woundsBySite: Record<string, Wound[]> = {};
  if (wounds) {
    for (const w of wounds) {
      if (!woundsBySite[w.site]) woundsBySite[w.site] = [];
      woundsBySite[w.site].push(w);
    }
    for (const key of Object.keys(woundsBySite)) {
      woundsBySite[key].sort(
        (a, b) =>
          new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
      );
    }
  }

  const LEFT_FOOT_KEY = 'left_foot_2nd_toe';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.site || !form.assessed_at) {
      setFormError('Site and date are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createWound({
        site: form.site,
        assessed_at: new Date(form.assessed_at).toISOString(),
        size_note: form.size_note || undefined,
        appearance: form.appearance || undefined,
        discharge: form.discharge || undefined,
        odor: form.odor ? 1 : 0,
        color_change: form.color_change ? 1 : 0,
        photo_ref: form.photo_ref || undefined,
        notes: form.notes || undefined,
      });
      setForm({ ...EMPTY_FORM, assessed_at: new Date().toISOString().slice(0, 10) });
      loadData();
    } catch {
      setFormError('Failed to save wound assessment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Wounds</h1>

      {sites === null ? (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              No wound sites recorded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeSite} onValueChange={setActiveSite}>
          <TabsList className="flex-wrap h-auto gap-1">
            {sites.map((site) => (
              <TabsTrigger
                key={site}
                value={site}
                className={
                  site === LEFT_FOOT_KEY
                    ? 'data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-950 dark:data-[state=active]:text-amber-100 border-amber-500 text-amber-700 dark:text-amber-400'
                    : ''
                }
              >
                {site === LEFT_FOOT_KEY && (
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                )}
                {site.replace(/_/g, ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          {sites.map((site) => (
            <TabsContent key={site} value={site} className="space-y-4">
              {woundsBySite[site]?.length > 0 ? (
                woundsBySite[site].map((w) => {
                  const urgent = isUrgent(w);
                  return (
                    <Card key={w.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(w.assessed_at)}
                          </CardTitle>
                          <div className="flex items-center gap-1.5">
                            {urgent && (
                              <Badge variant="urgent" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                URGENT
                              </Badge>
                            )}
                            <button
                              onClick={async () => {
                                if (!window.confirm('Delete this wound entry?')) return;
                                await deleteWound(w.id);
                                loadData();
                              }}
                              className="p-0.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          {w.size_note && (
                            <div>
                              <span className="text-xs text-muted-foreground">Size Note</span>
                              <p>{w.size_note}</p>
                            </div>
                          )}
                          {w.appearance && (
                            <div>
                              <span className="text-xs text-muted-foreground">Appearance</span>
                              <p>{w.appearance}</p>
                            </div>
                          )}
                          {w.discharge && (
                            <div>
                              <span className="text-xs text-muted-foreground">Discharge</span>
                              <p>{w.discharge}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-muted-foreground">Odor</span>
                            <p>
                              <Badge variant="outline">
                                {!!w.odor ? 'Yes' : 'No'}
                              </Badge>
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Color Change</span>
                            <p>
                              <Badge variant="outline">
                                {!!w.color_change ? 'Yes' : 'No'}
                              </Badge>
                            </p>
                          </div>
                        </div>

                        {w.photo_ref && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                            <Image className="h-3.5 w-3.5" />
                            <span>{w.photo_ref}</span>
                          </div>
                        )}

                        {w.notes && (
                          <div>
                            <span className="text-xs text-muted-foreground">Notes</span>
                            <p>{w.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No assessments for this site.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bandage className="h-4 w-4 text-muted-foreground" />
            New Wound Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wound-site">Site</Label>
                {sites === null ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={form.site}
                    onValueChange={(v) => setForm({ ...form, site: v })}
                  >
                    <SelectTrigger id="wound-site">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wound-date">Date Assessed</Label>
                <Input
                  id="wound-date"
                  type="date"
                  value={form.assessed_at}
                  onChange={(e) =>
                    setForm({ ...form, assessed_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wound-size">Size Note</Label>
              <Input
                id="wound-size"
                placeholder="e.g. 2cm x 3cm, moderate depth"
                value={form.size_note}
                onChange={(e) =>
                  setForm({ ...form, size_note: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wound-appearance">Appearance</Label>
              <Input
                id="wound-appearance"
                placeholder="e.g. Granulation tissue, slough present"
                value={form.appearance}
                onChange={(e) =>
                  setForm({ ...form, appearance: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wound-discharge">Discharge</Label>
              <Input
                id="wound-discharge"
                placeholder="e.g. Serous, purulent, none"
                value={form.discharge}
                onChange={(e) =>
                  setForm({ ...form, discharge: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wound-odor"
                  checked={form.odor}
                  onCheckedChange={(v) =>
                    setForm({ ...form, odor: v === true })
                  }
                />
                <Label htmlFor="wound-odor" className="cursor-pointer">
                  Odor present
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wound-color"
                  checked={form.color_change}
                  onCheckedChange={(v) =>
                    setForm({ ...form, color_change: v === true })
                  }
                />
                <Label htmlFor="wound-color" className="cursor-pointer">
                  Color change
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wound-photo">Photo Reference</Label>
              <Input
                id="wound-photo"
                placeholder="Filename or reference ID"
                value={form.photo_ref}
                onChange={(e) =>
                  setForm({ ...form, photo_ref: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wound-notes">Notes</Label>
              <Textarea
                id="wound-notes"
                placeholder="Additional notes..."
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Record Assessment'}
            </Button>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
