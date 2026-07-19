import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MED_GROUPS, PRN_MEDS } from '@/pages/family-guide/caseData';

export function MedExplainer() {
  const [groupId, setGroupId] = useState(MED_GROUPS[0].id);
  const group = MED_GROUPS.find((g) => g.id === groupId) ?? MED_GROUPS[0];

  return (
    <div className="fg-meds">
      <p className="fg-plain" style={{ marginBottom: '1rem' }}>
        Twenty-seven standing medicines sound overwhelming. Group them by job — each group has one
        clear purpose.
      </p>
      <div className="fg-chip-row">
        {MED_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={cn('fg-chip', groupId === g.id && 'is-active')}
            onClick={() => setGroupId(g.id)}
          >
            {g.title.split('&')[0].trim()}
          </button>
        ))}
      </div>

      <div className="fg-med-panel">
        <h3 className="fg-model-title">{group.title}</h3>
        <p className="fg-plain">{group.plain}</p>
        <ul className="fg-med-list">
          {group.meds.map((m) => (
            <li key={m.name}>
              <div className="fg-med-name">
                {m.name}
                <span>{m.dose}</span>
              </div>
              <p>{m.why}</p>
            </li>
          ))}
        </ul>
      </div>

      <details className="fg-details">
        <summary>As-needed (PRN) medicines</summary>
        <ul className="fg-med-list">
          {PRN_MEDS.map((m) => (
            <li key={m.name}>
              <div className="fg-med-name">{m.name}</div>
              <p>{m.trigger}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
