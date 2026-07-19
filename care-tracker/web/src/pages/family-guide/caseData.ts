/** Anonymized family-friendly case content — PT-ANON. Not medical advice. */

export type SystemId = 'story' | 'heart' | 'legs' | 'brain' | 'sugar' | 'meds' | 'labs' | 'next';

export const GUIDE_META = {
  title: 'Family Care Guide',
  updated: '18 July 2026',
  tagline: 'A plain-language walkthrough of what is going on — and what the numbers really mean.',
  disclaimer:
    'This guide explains the clinical picture in everyday language. It is for family understanding only — not medical advice. Always confirm decisions with the treating physicians.',
};

export const AT_A_GLANCE = [
  {
    id: 'legs',
    label: 'Left foot',
    status: 'Healing',
    tone: 'good' as const,
    plain: 'The remaining foot ulcer is growing new skin. Blood flow is enough for healing.',
  },
  {
    id: 'heart',
    label: 'Heart',
    status: 'Stable on medicines',
    tone: 'good' as const,
    plain: 'Arteries are narrowed, but a stress scan showed only a tiny area of reduced flow. Pumping strength is good.',
  },
  {
    id: 'brain',
    label: 'Brain vessel',
    status: 'Watched closely',
    tone: 'watch' as const,
    plain: 'One brain artery is narrowed. Blood thinners and blood-pressure control protect it.',
  },
  {
    id: 'sugar',
    label: 'Diabetes',
    status: 'Improving',
    tone: 'good' as const,
    plain: 'Sugar control has improved a lot since March (HbA1c 11.4% → 7.5%).',
  },
];

export const STORY_STEPS = [
  {
    when: 'March 2026',
    title: 'How this began',
    plain:
      'A cut on the right foot went unnoticed (nerve damage from diabetes). It became infected, reached the bone, then turned into wet gangrene. Doctors had to do an emergency below-knee amputation to save her life.',
    detail:
      'After the infection: inflammation was very high (CRP 277), white cells were high (WBC 23), nutrition was critically low (albumin 1.5), and sugar control was poor (HbA1c 11.4%).',
  },
  {
    when: 'April–June',
    title: 'Stabilising',
    plain:
      'Infection settled. Nutrition and sugar improved. The left foot had a dry ulcer that needed careful wound care and a procedure to open a small artery.',
    detail:
      'Albumin rose toward normal. Cholesterol medicines brought LDL down dramatically. Physiotherapy began with a long-term goal of walking with a prosthesis.',
  },
  {
    when: 'Early July',
    title: 'Heart & brain checks',
    plain:
      'A CT scan showed severe narrowing in three heart arteries and a narrowed brain artery. A brief “unstable angina” episode was linked to dehydration and low potassium — heart muscle enzymes stayed normal.',
    detail:
      'Coronary calcium score was very high (3,753). Doctors ordered a special heart stress scan (MIBI) before any procedures.',
  },
  {
    when: '16–18 July',
    title: 'Reassuring heart scan',
    plain:
      'The MIBI scan showed only minimal ischaemia (1 of 17 heart segments). Pumping strength is 60%. Doctors chose to continue medicines rather than open the heart arteries right now.',
    detail:
      'Dental extraction of one tooth is cleared. Endometrial biopsy is deferred until after dental work and continued cardiac stability. Hyperbaric oxygen is being stopped because of ear injury and good wound healing.',
  },
];

export type VesselStatus = 'patent' | 'occluded' | 'collateral' | 'treated';

export const LEG_VESSELS: {
  id: string;
  name: string;
  short: string;
  status: VesselStatus;
  plain: string;
}[] = [
  {
    id: 'inflow',
    name: 'Main thigh & knee arteries',
    short: 'Inflow',
    status: 'patent',
    plain: 'Open and carrying blood — the “highway” into the leg is working.',
  },
  {
    id: 'peroneal',
    name: 'Peroneal artery',
    short: 'Peroneal',
    status: 'treated',
    plain: 'Opened with a balloon (no stent). This is the main working path to the foot.',
  },
  {
    id: 'ata',
    name: 'Anterior tibial artery',
    short: 'Front shin',
    status: 'occluded',
    plain: 'Blocked. Blood finds other routes instead.',
  },
  {
    id: 'pta',
    name: 'Posterior tibial artery',
    short: 'Back shin',
    status: 'occluded',
    plain: 'Blocked. Collaterals help make up for this.',
  },
  {
    id: 'dpa',
    name: 'Dorsalis pedis (top of foot)',
    short: 'Foot arch',
    status: 'collateral',
    plain: 'Refilled by side branches (collaterals). Enough for the ulcer to heal.',
  },
];

export const LEG_NUMBERS = [
  { label: 'ABI (left)', value: '0.69', plain: 'Ankle–arm pressure ratio. Below 0.9 means PAD; healing can still occur.' },
  { label: 'Tissue oxygen', value: 'Adequate', plain: 'Earlier readings showed enough oxygen at the skin for healing.' },
  { label: 'Surgery choice', value: 'No bypass', plain: 'Because the wound is healing, a big bypass operation is not needed now.' },
];

export const HEART_ARTERIES: {
  id: string;
  name: string;
  stenosis: 'severe' | 'mild' | 'none';
  plain: string;
}[] = [
  { id: 'rca', name: 'Right coronary (RCA)', stenosis: 'severe', plain: 'Severe narrowing near the start of this artery.' },
  { id: 'lad', name: 'Left anterior descending (LAD)', stenosis: 'severe', plain: 'Severe narrowing farther along; supplies the front of the heart.' },
  { id: 'lcx', name: 'Circumflex (LCx)', stenosis: 'severe', plain: 'Severe mid-artery and side-branch narrowing.' },
  { id: 'lma', name: 'Left main', stenosis: 'mild', plain: 'Only mild change — the shared starting pipe looks better.' },
];

export const MIBI = {
  headline: 'Scan result: mostly reassuring',
  points: [
    { label: 'Ischaemia', value: 'Tiny', plain: 'Only 1 of 17 segments showed mild reduced flow at the tip of the heart.' },
    { label: 'Pumping (EF)', value: '60%', plain: 'Normal strength. The heart muscle squeezes well.' },
    { label: 'Symptoms on scan', value: 'None', plain: 'No chest pain and no worrying ECG changes during the test.' },
    { label: 'Surgery risk', value: 'Low–moderate', plain: 'For non-heart procedures (like dental work), cardiac risk is acceptable on medicines.' },
  ],
};

export const BRAIN = {
  finding: 'Moderate–severe narrowing of the left middle cerebral artery (M1 segment)',
  plain:
    'Think of a garden hose that is partly pinched. Blood still gets through, but the vessel needs protection: blood thinners, steady blood pressure (about 120–140 systolic), and avoiding sudden drops or spikes.',
  protections: [
    'Cilostazol (Pletaal) — helps blood flow in narrowed brain arteries',
    'Aspirin + apixaban as prescribed for vessels and clots elsewhere',
    'Blood-pressure monitoring — labile readings are being optimised',
  ],
};

export const CONDITIONS_FAMILY = [
  {
    group: 'Circulation & limbs',
    items: [
      { name: 'Type 2 diabetes', plain: 'High blood sugar over years damaged nerves and vessels. Control is improving.' },
      { name: 'Peripheral artery disease (both legs)', plain: 'Hardened, narrowed leg arteries. Right leg required amputation; left is managed medically.' },
      { name: 'Right below-knee amputation', plain: 'About 4 months ago. Focus now is stump care and rehab toward a prosthesis.' },
      { name: 'Left 2nd-toe dry ulcer', plain: 'Healing with new skin. Bone tip had worn away earlier; perfusion is adequate for healing.' },
    ],
  },
  {
    group: 'Heart',
    items: [
      { name: 'Triple-vessel coronary disease', plain: 'Three main heart arteries are severely narrowed on CT — but the stress scan shows only tiny ischaemia.' },
      { name: 'Brief unstable angina (9–10 Jul)', plain: 'Demand ischaemia from dehydration/low potassium. Troponin stayed normal. Now stable.' },
      { name: 'Hypertensive heart', plain: 'Thickened heart muscle from long-standing BP; pumping fraction 60%.' },
    ],
  },
  {
    group: 'Brain & nerves',
    items: [
      { name: 'Left MCA M1 stenosis', plain: 'Narrowed brain artery — protected with medicines and BP control.' },
      { name: 'Diabetic neuropathy', plain: 'Nerve damage explains unfelt injuries and nerve pain medicines.' },
      { name: 'Diabetic retinopathy + cataracts', plain: 'Eye changes from diabetes; ophthalmology follows.' },
    ],
  },
  {
    group: 'Other active issues',
    items: [
      { name: 'Endometrial thickening', plain: 'Lining of the womb is thick — biopsy planned after dental/cardiac priorities.' },
      { name: 'Iron-deficiency anaemia', plain: 'Being treated with IV iron; hemoglobin has risen.' },
      { name: 'Dental disease', plain: 'One tooth (#16) cleared for extraction after the heart scan.' },
      { name: 'Ear barotrauma from HBOT', plain: 'Hyperbaric oxygen caused ear injury — HBOT is being stopped.' },
    ],
  },
];

export type MedGroup = 'heart' | 'sugar' | 'nerves' | 'gut' | 'vessels' | 'other';

export const MED_GROUPS: {
  id: MedGroup;
  title: string;
  plain: string;
  meds: { name: string; dose: string; why: string }[];
}[] = [
  {
    id: 'vessels',
    title: 'Blood thinners & vessel protection',
    plain: 'These reduce clotting risk in arteries, the aorta, and the brain vessel.',
    meds: [
      { name: 'Aspirin (Cardiprin)', dose: '100 mg noon', why: 'Keeps platelets from sticking — basic artery protection.' },
      { name: 'Apixaban (Eliquis)', dose: '2.5 mg twice daily', why: 'Anticoagulant for aortic clots and PAD risk.' },
      { name: 'Cilostazol (Pletaal)', dose: '50 mg twice daily', why: 'Helps flow in the narrowed brain artery (dose was reduced).' },
      { name: 'Sulodexide (Vessel)', dose: '250 LSU twice daily', why: 'Mild vessel support — not a strong blood thinner.' },
    ],
  },
  {
    id: 'heart',
    title: 'Heart rate & cholesterol',
    plain: 'Slow the heart gently and keep “bad” cholesterol very low.',
    meds: [
      { name: 'Atorvastatin/Ezetimibe (Atozet)', dose: '10/20 mg evening', why: 'Cholesterol — LDL is excellent at ~40.' },
      { name: 'Bisoprolol (Concor)', dose: '5 mg AM + 2.5 mg PM', why: 'Beta-blocker for rate control and heart protection.' },
      { name: 'Ivabradine (Coralan)', dose: '5 mg twice daily', why: 'Slows heart rate without dropping blood pressure much.' },
      { name: 'Potassium (Enpott)', dose: '500 mg morning', why: 'Added after the July cardiac episode.' },
    ],
  },
  {
    id: 'sugar',
    title: 'Diabetes',
    plain: 'Three complementary tools: metformin, SGLT2, and weekly injection.',
    meds: [
      { name: 'Metformin XR (Glucophage)', dose: '1500 mg evening', why: 'Foundation diabetes medicine.' },
      { name: 'Empagliflozin (Jardiance)', dose: '10 mg morning', why: 'Sugar + heart/kidney benefits; discuss amputation-risk questions with the team.' },
      { name: 'Tirzepatide (Mounjaro)', dose: '2.5 mg weekly', why: 'Weekly injection for sugar and appetite.' },
    ],
  },
  {
    id: 'nerves',
    title: 'Nerve comfort',
    plain: 'Ease burning/tingling from diabetic neuropathy.',
    meds: [
      { name: 'Duloxetine', dose: '60 mg evening', why: 'Nerve pain modulator.' },
      { name: 'Alpha-lipoic acid (Thiogamma)', dose: '600 mg bedtime', why: 'Nerve support supplement used in neuropathy protocols.' },
      { name: 'Neurobion (B vitamins)', dose: '1 tab twice daily', why: 'B1/B6/B12 nerve support.' },
    ],
  },
  {
    id: 'gut',
    title: 'Stomach & bowel',
    plain: 'Protect the stomach and keep bowels moving comfortably.',
    meds: [
      { name: 'Rabeprazole (Pariet)', dose: '20 mg twice daily', why: 'Reduces acid / protects stomach.' },
      { name: 'Prucalopride + Elobixibat', dose: 'evening / morning', why: 'Prescription constipation support.' },
      { name: 'Mosapride (GasMotin)', dose: '5 mg', why: 'Helps gut motility.' },
    ],
  },
  {
    id: 'other',
    title: 'Ears, vitamins & comfort',
    plain: 'Short-term ear sprays after HBOT, plus vitamins for wound/hair support.',
    meds: [
      { name: 'Ofloxacin ear drops', dose: '3×/day', why: 'Left ear infection after barotrauma.' },
      { name: 'Budesonide nasal spray', dose: 'twice daily', why: 'Eustachian tube support (OK longer-term).' },
      { name: 'Iliadin nasal spray', dose: 'twice daily', why: 'Short-term only (3–5 days) — rebound risk.' },
      { name: 'Vitamin D3', dose: '50,000 U every 14 days', why: 'Levels now corrected (~43 ng/mL).' },
    ],
  },
];

export const PRN_MEDS = [
  { name: 'Hydralazine 25 mg', trigger: 'If systolic BP > 160' },
  { name: 'Isosorbide (Hartsorb) 5 mg under tongue', trigger: 'Chest pain — as taught by the team' },
  { name: 'Milk of Magnesia', trigger: 'Constipation at bedtime' },
  { name: 'Paracetamol 500 mg', trigger: 'Fever or pain' },
];

export const LAB_TRENDS = [
  {
    test: 'HbA1c',
    unit: '%',
    values: [
      { month: 'Mar', value: 11.4 },
      { month: 'Jun', value: 8.2 },
      { month: 'Jul', value: 7.5 },
    ],
    direction: 'better' as const,
    plain: 'Average sugar over ~3 months. Down a lot — still not at goal, but a big win.',
  },
  {
    test: 'Albumin',
    unit: 'g/dL',
    values: [
      { month: 'Mar', value: 1.5 },
      { month: 'Jun', value: 3.6 },
      { month: 'Jul', value: 3.99 },
    ],
    direction: 'better' as const,
    plain: 'A nutrition/inflammation marker. Critically low in March; now near normal.',
  },
  {
    test: 'LDL cholesterol',
    unit: 'mg/dL',
    values: [
      { month: 'Mar', value: 177 },
      { month: 'Jun', value: 41 },
      { month: 'Jul', value: 40 },
    ],
    direction: 'better' as const,
    plain: '“Bad” cholesterol. Excellent response to medicines.',
  },
  {
    test: 'CRP',
    unit: 'mg/L',
    values: [
      { month: 'Mar', value: 277 },
      { month: 'Jun', value: 8.38 },
    ],
    direction: 'better' as const,
    plain: 'Inflammation. Sky-high with sepsis; much lower now.',
  },
  {
    test: 'Hemoglobin',
    unit: 'g/dL',
    values: [
      { month: 'Jun', value: 12.1 },
      { month: 'Jul', value: 12.9 },
    ],
    direction: 'better' as const,
    plain: 'Rising with iron treatment.',
  },
];

export const PLANS = [
  {
    item: 'Dental extraction (tooth 16)',
    urgency: 'moderate' as const,
    plain: 'Cleared by the heart scan. One tooth; apixaban held briefly; local bleeding control.',
  },
  {
    item: 'Endometrial biopsy',
    urgency: 'high' as const,
    plain: 'Important, but sequenced after dental work and ongoing cardiac stability.',
  },
  {
    item: 'Stop HBOT',
    urgency: 'deescalate' as const,
    plain: 'Ear injury + wound already healing — hyperbaric sessions can stop.',
  },
  {
    item: 'Blood pressure fine-tuning',
    urgency: 'ongoing' as const,
    plain: 'May add another BP medicine (e.g. ARB/CCB). Target roughly 120–140 systolic for the brain vessel.',
  },
  {
    item: 'Thyroid ultrasound',
    urgency: 'low' as const,
    plain: 'Calcified nodules — outpatient check.',
  },
  {
    item: 'Knee replacement',
    urgency: 'low' as const,
    plain: 'Not a candidate now. Needs months of rehab and medical stability first.',
  },
];

export const KEY_DECISIONS = [
  {
    title: 'No leg bypass',
    why: 'The left foot is healing — that proves blood flow is good enough without a major operation.',
  },
  {
    title: 'No heart stent/bypass for now',
    why: 'The stress scan showed only tiny ischaemia and good pumping. Medicines are the chosen path.',
  },
  {
    title: 'Stop hyperbaric oxygen',
    why: 'It hurt the ear, and the wound is already improving.',
  },
  {
    title: 'Dental work can proceed',
    why: 'MIBI clearance means one carefully planned extraction is acceptable.',
  },
];

export const REHAB = {
  goal: 'Walk with a prosthesis and a walker.',
  nutrition: 'About 1300–1500 kcal/day with 100–120 g protein. Sip liquid protein supplements slowly.',
  weight: 'Stable around 77.6 kg (down from ~83 kg).',
  physio: 'Protected physiotherapy twice daily.',
  communication: [
    'Offer limited choices rather than open-ended questions.',
    'Validate feelings, then gently redirect to the next small step.',
    'Keep routines and boundaries consistent across family caregivers.',
  ],
};

export const SYSTEMS: { id: SystemId; label: string; blurb: string }[] = [
  { id: 'story', label: 'The story', blurb: 'What happened, month by month' },
  { id: 'legs', label: 'Legs & foot', blurb: 'Blood flow model' },
  { id: 'heart', label: 'Heart', blurb: 'Arteries vs stress scan' },
  { id: 'brain', label: 'Brain vessel', blurb: 'What “stenosis” means' },
  { id: 'sugar', label: 'Diabetes & body', blurb: 'Conditions in plain English' },
  { id: 'labs', label: 'Lab trends', blurb: 'Numbers getting better' },
  { id: 'meds', label: 'Medicines', blurb: 'Why each group exists' },
  { id: 'next', label: "What's next", blurb: 'Plans & decisions' },
];
