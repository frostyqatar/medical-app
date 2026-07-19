import {
  CONDITIONS_FAMILY,
  KEY_DECISIONS,
  PLANS,
  REHAB,
} from '@/pages/family-guide/caseData';

export function ConditionsPlain() {
  return (
    <div className="fg-conditions">
      {CONDITIONS_FAMILY.map((g) => (
        <details key={g.group} className="fg-details" open={g.group === 'Circulation & limbs'}>
          <summary>{g.group}</summary>
          <ul className="fg-condition-list">
            {g.items.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.plain}</p>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

export function WhatsNext() {
  return (
    <div className="fg-next">
      <h3 className="fg-model-title">Plans in priority order</h3>
      <ul className="fg-plan-list">
        {PLANS.map((p) => (
          <li key={p.item} data-urgency={p.urgency}>
            <div className="fg-plan-head">
              <strong>{p.item}</strong>
              <span className="fg-urgency">{p.urgency}</span>
            </div>
            <p>{p.plain}</p>
          </li>
        ))}
      </ul>

      <h3 className="fg-model-title" style={{ marginTop: '1.75rem' }}>
        Why the team chose this path
      </h3>
      <ul className="fg-decision-list">
        {KEY_DECISIONS.map((d) => (
          <li key={d.title}>
            <strong>{d.title}</strong>
            <p>{d.why}</p>
          </li>
        ))}
      </ul>

      <h3 className="fg-model-title" style={{ marginTop: '1.75rem' }}>
        Rehab & everyday care
      </h3>
      <ul className="fg-bullet">
        <li>
          <strong>Goal:</strong> {REHAB.goal}
        </li>
        <li>
          <strong>Physio:</strong> {REHAB.physio}
        </li>
        <li>
          <strong>Nutrition:</strong> {REHAB.nutrition}
        </li>
        <li>
          <strong>Weight:</strong> {REHAB.weight}
        </li>
      </ul>
      <div className="fg-callout" data-tone="info">
        <strong>Communication tips for family</strong>
        <ul className="fg-bullet" style={{ marginTop: '0.5rem' }}>
          {REHAB.communication.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
