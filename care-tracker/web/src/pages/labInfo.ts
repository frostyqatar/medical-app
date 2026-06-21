interface LabInfo {
  what: string
  high?: string
  low?: string
  treatment?: string
}

const LAB_INFO: Record<string, LabInfo> = {
  'Hemoglobin': {
    what: 'Oxygen-carrying protein in red blood cells. Low levels indicate anemia.',
    low: 'Anemia from iron/B12/folate deficiency, chronic disease, blood loss, or bone marrow issues. Common with diabetes-related kidney disease.',
    high: 'Dehydration, smoking, living at high altitude, or polycythemia.',
    treatment: 'Iron supplements, B12/folate, dietary changes, or treating underlying cause. Discuss transfusion thresholds with your doctor.',
  },
  'WBC': {
    what: 'White blood cell count — immune system cells that fight infection.',
    low: 'Bone marrow suppression, certain medications, autoimmune conditions, or severe infection.',
    high: 'Infection, inflammation, stress, certain medications (e.g., steroids), or rarely leukemia.',
    treatment: 'Treat underlying infection/inflammation. Monitor trends; a single elevation may be temporary.',
  },
  'Glucose (fasting)': {
    what: 'Blood sugar after 8+ hours of fasting. Key diabetes marker.',
    low: 'Hypoglycemia — too much insulin/medication, skipped meals, or excessive exercise. Can cause dizziness, confusion, or fainting.',
    high: 'Diabetes or prediabetes. Indicates insulin resistance or insufficient insulin production.',
    treatment: 'Diet control, exercise, oral medications (e.g., metformin), or insulin. Target fasting < 100 mg/dL; < 126 for diabetics.',
  },
  'HbA1c': {
    what: 'Average blood sugar over the past 2–3 months. The best long-term diabetes control marker.',
    low: 'Rare; may indicate hypoglycemia episodes, certain anemias, or blood loss.',
    high: 'Poor diabetes control. Values > 7% increase risk of kidney, eye, nerve, and cardiovascular complications.',
    treatment: 'Adjust diabetes medication, improve diet, increase exercise. Target generally < 7.0% for most adults. Recheck every 3 months.',
  },
  'Creatinine': {
    what: 'Waste product from muscle breakdown, filtered by kidneys. Key kidney function marker.',
    low: 'Low muscle mass, malnutrition, or very rarely liver disease. Generally not concerning.',
    high: 'Reduced kidney function — may indicate acute kidney injury or chronic kidney disease. Can be affected by dehydration, certain medications (NSAIDs, ACE inhibitors), or high protein intake.',
    treatment: 'Hydration, review nephrotoxic medications, control BP/diabetes, dietary adjustments. If persistent, nephrology referral.',
  },
  'eGFR': {
    what: 'Estimated Glomerular Filtration Rate — how well kidneys filter blood. Calculated from creatinine, age, and sex.',
    low: 'Values < 60 indicate chronic kidney disease (CKD). Values < 15 indicate kidney failure requiring dialysis or transplant.',
    high: 'N/A — higher is better. Values > 90 are normal.',
    treatment: 'Control blood pressure (< 130/80), blood sugar, avoid NSAIDs, limit salt/protein. Regular monitoring; nephrology if < 30.',
  },
  'Total cholesterol': {
    what: 'Total amount of cholesterol in blood — includes LDL ("bad"), HDL ("good"), and triglycerides.',
    low: 'Rare; may indicate malnutrition, liver disease, or hyperthyroidism.',
    high: 'Increases risk of heart disease and stroke. Often driven by diet, genetics, diabetes, or hypothyroidism.',
    treatment: 'Diet (Mediterranean, low saturated fat), exercise, statins (e.g., atorvastatin). Target < 200 mg/dL.',
  },
  'LDL': {
    what: 'Low-Density Lipoprotein — "bad" cholesterol that builds up in artery walls causing plaque.',
    low: 'Generally good; very low may occur with statin therapy or rare genetic conditions.',
    high: 'Major risk factor for heart attack and stroke. Driven by saturated fat intake, genetics, diabetes, and sedentary lifestyle.',
    treatment: 'Statins are first-line. Diet changes, exercise, and sometimes ezetimibe or PCSK9 inhibitors. Target < 100 mg/dL for diabetics.',
  },
  'HDL': {
    what: 'High-Density Lipoprotein — "good" cholesterol that removes excess cholesterol from arteries.',
    low: 'Increases cardiovascular risk. Associated with diabetes, obesity, smoking, and sedentary lifestyle.',
    high: 'Generally protective. Values > 60 are considered heart-protective.',
    treatment: 'Exercise (aerobic, 150+ min/week), quit smoking, lose weight, consume healthy fats (olive oil, nuts, fish).',
  },
  'Triglycerides': {
    what: 'Type of fat in blood used for energy. High levels increase heart disease and pancreatitis risk.',
    low: 'Generally not a concern.',
    high: 'Linked to obesity, uncontrolled diabetes, high-carb diet, alcohol, and certain medications. Levels > 500 risk pancreatitis.',
    treatment: 'Reduce sugar/refined carbs and alcohol, increase omega-3s (fish oil), exercise, weight loss. Fibrates or statins if severe.',
  },
  'CRP (hs)': {
    what: 'High-sensitivity C-Reactive Protein — measures inflammation in the body. Predicts cardiovascular risk.',
    low: 'N/A — lower is better. Values < 1 mg/L indicate low cardiovascular risk.',
    high: 'Indicates systemic inflammation. May signal infection, autoimmune disease, or increased cardiovascular risk. Common in diabetes, obesity, and after surgery/trauma.',
    treatment: 'Treat underlying cause of inflammation. Statins lower CRP. Lifestyle: anti-inflammatory diet, exercise, smoking cessation.',
  },
  'Albumin': {
    what: 'Main protein in blood, made by the liver. Maintains fluid balance and transports substances.',
    low: 'Liver disease, kidney disease (protein loss in urine), malnutrition, inflammation, or severe burns.',
    high: 'Dehydration is the most common cause.',
    treatment: 'Address underlying liver/kidney condition. Adequate protein intake. Monitor for edema if very low.',
  },
  'Vitamin D': {
    what: 'Fat-soluble vitamin essential for calcium absorption, bone health, and immune function.',
    low: 'Insufficient sun exposure, poor dietary intake, malabsorption, obesity, or certain medications. Contributes to bone pain, muscle weakness, and increased infection risk.',
    high: 'Usually from excessive supplementation. Can cause calcium buildup and kidney damage.',
    treatment: 'Supplementation (D3, 1000–5000 IU/day), safe sun exposure, fortified foods. Recheck levels after 3 months.',
  },
}

export function getLabInfo(test: string): LabInfo | undefined {
  return LAB_INFO[test]
}

export default LAB_INFO
