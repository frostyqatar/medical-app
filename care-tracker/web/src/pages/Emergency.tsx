import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Thermometer, Footprints, Brain, Activity, Bandage, Phone } from 'lucide-react';

const SYMPTOMS = [
  {
    icon: Thermometer,
    title: 'Fever',
    detail: 'Temperature ≥ 38°C',
    description: 'Infection risk is elevated given amputation and diabetes history.',
  },
  {
    icon: Footprints,
    title: 'Foot Color / Temperature Change',
    detail: 'Left foot cold, pale, blue, or dark',
    description: 'Sudden changes in color or temperature of the left foot may indicate vascular compromise.',
  },
  {
    icon: Brain,
    title: 'Drowsiness + Cold + Rapid Breathing',
    detail: 'Confusion, feeling cold, breathing fast',
    description: 'This combination may signal a possible sepsis pattern and requires immediate evaluation.',
  },
  {
    icon: Activity,
    title: 'New or Worsening Numbness',
    detail: 'Left-leg numbness',
    description: 'Any new or worsening sensation loss in the left leg should be assessed urgently.',
  },
  {
    icon: Activity,
    title: 'Uncontrolled Pain',
    detail: 'Pain severity ≥ 7 / 10',
    description: 'Severe pain that is not controlled with current management requires urgent attention.',
  },
  {
    icon: Bandage,
    title: 'Wound Changes',
    detail: 'New odor, color change, or discharge',
    description: 'Any new drainage, odor, or discoloration on the left foot or stump wound may signal infection.',
  },
] as const;

export default function Emergency() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-destructive">
            Emergency Signs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Seek Urgent Care
          </p>
        </div>
      </div>

      {/* Red-flag symptoms */}
      <div className="space-y-3">
        {SYMPTOMS.map((symptom, i) => (
          <Card
            key={i}
            className="border-destructive/30 bg-destructive/5"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <symptom.icon className="h-5 w-5 text-destructive shrink-0" />
                <span className="text-destructive">{symptom.title}</span>
                <Badge variant="destructive" className="ml-auto shrink-0 text-[10px]">
                  URGENT
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm font-semibold text-destructive/90">
                {symptom.detail}
              </p>
              <p className="text-sm text-muted-foreground">
                {symptom.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-destructive/30" />

      {/* What to do */}
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Phone className="h-5 w-5" />
            What to Do
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base font-semibold">
            Contact your care team immediately or go to the nearest emergency department.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Do not wait. If you cannot reach your care team, call emergency services or have someone
            take you to the hospital. Bring this tracker and your medication list with you.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          This tracker records data and flags items for human review. It does not provide medical
          advice. Always discuss with your treating physician.
        </p>
      </div>
    </div>
  );
}
