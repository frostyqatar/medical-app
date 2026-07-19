import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LAB_TRENDS } from '@/pages/family-guide/caseData';

function MiniChart({
  values,
}: {
  values: { month: string; value: number }[];
}) {
  const nums = values.map((v) => v.value);
  const min = Math.min(...nums) * 0.85;
  const max = Math.max(...nums) * 1.05;
  const w = 200;
  const h = 72;
  const pad = 8;
  const points = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1);
    const y = h - pad - ((v.value - min) / (max - min || 1)) * (h - pad * 2);
    return { x, y, ...v };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="fg-mini-chart" aria-hidden>
      <path d={path} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
      {points.map((p) => (
        <g key={p.month}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0f766e" />
          <text x={p.x} y={h - 1} textAnchor="middle" fontSize="9" fill="#64748b">
            {p.month}
          </text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#134e4a" fontWeight="700">
            {p.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function LabTrends() {
  const [selected, setSelected] = useState(0);
  const lab = LAB_TRENDS[selected];

  return (
    <div className="fg-labs">
      <div className="fg-chip-row">
        {LAB_TRENDS.map((l, i) => (
          <button
            key={l.test}
            type="button"
            className={cn('fg-chip', selected === i && 'is-active')}
            onClick={() => setSelected(i)}
          >
            {l.test}
          </button>
        ))}
      </div>
      <div className="fg-lab-card">
        <div className="fg-lab-head">
          <h3>
            {lab.test}{' '}
            <span className="fg-unit">({lab.unit})</span>
          </h3>
          <span className="fg-trend-pill">Getting better</span>
        </div>
        <MiniChart values={lab.values} />
        <p className="fg-plain">{lab.plain}</p>
      </div>
    </div>
  );
}
