import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HEART_ARTERIES, MIBI } from '@/pages/family-guide/caseData';

const COLORS = {
  severe: '#b45309',
  mild: '#ca8a04',
  none: '#0f766e',
  good: '#0f766e',
};

/** Interactive coronary schematic + MIBI takeaway. */
export function HeartModel() {
  const [selected, setSelected] = useState(HEART_ARTERIES[0].id);
  const artery = HEART_ARTERIES.find((a) => a.id === selected) ?? HEART_ARTERIES[0];

  return (
    <div className="fg-model-grid">
      <div className="fg-model-visual">
        <svg viewBox="0 0 280 240" role="img" aria-label="Simplified heart artery map">
          <defs>
            <radialGradient id="fg-heart-glow" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#fecaca" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fecaca" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="140" cy="120" rx="90" ry="95" fill="url(#fg-heart-glow)" />
          {/* Heart outline */}
          <path
            d="M140 200 C60 150 50 80 90 55 C115 40 140 60 140 60 C140 60 165 40 190 55 C230 80 220 150 140 200 Z"
            fill="#fff5f5"
            stroke="#9f1239"
            strokeWidth="2"
          />
          {/* Left main → LAD / LCx */}
          <path
            d="M140 70 L140 95"
            stroke={selected === 'lma' ? COLORS.mild : '#94a3b8'}
            strokeWidth={selected === 'lma' ? 7 : 5}
            strokeLinecap="round"
            className="fg-vessel-path"
            onClick={() => setSelected('lma')}
            style={{ cursor: 'pointer' }}
          />
          <path
            d="M140 95 L140 175"
            stroke={selected === 'lad' ? COLORS.severe : '#94a3b8'}
            strokeWidth={selected === 'lad' ? 7 : 5}
            strokeLinecap="round"
            strokeDasharray={selected === 'lad' ? '0' : '0'}
            className="fg-vessel-path"
            onClick={() => setSelected('lad')}
            style={{ cursor: 'pointer' }}
          />
          {/* Stenosis marks on LAD */}
          <circle cx="140" cy="155" r="6" fill={COLORS.severe} opacity="0.85" />
          <path
            d="M140 95 Q175 110 185 150"
            stroke={selected === 'lcx' ? COLORS.severe : '#94a3b8'}
            strokeWidth={selected === 'lcx' ? 6 : 4}
            fill="none"
            strokeLinecap="round"
            onClick={() => setSelected('lcx')}
            style={{ cursor: 'pointer' }}
          />
          <circle cx="175" cy="130" r="5" fill={COLORS.severe} opacity="0.85" />
          {/* RCA */}
          <path
            d="M140 70 Q95 90 85 150"
            stroke={selected === 'rca' ? COLORS.severe : '#94a3b8'}
            strokeWidth={selected === 'rca' ? 6 : 4}
            fill="none"
            strokeLinecap="round"
            onClick={() => setSelected('rca')}
            style={{ cursor: 'pointer' }}
          />
          <circle cx="100" cy="100" r="5" fill={COLORS.severe} opacity="0.85" />
          {/* Apex ischaemia marker */}
          <circle cx="140" cy="188" r="8" fill="#0f766e" opacity="0.35" className="fg-apex-pulse" />
          <text x="140" y="220" textAnchor="middle" fontSize="10" fill="#134e4a" fontWeight="600">
            Tiny apical ischaemia (MIBI)
          </text>
        </svg>
      </div>

      <div className="fg-model-copy">
        <p className="fg-kicker">Two different stories</p>
        <h3 className="fg-model-title">Narrow arteries ≠ struggling heart muscle</h3>
        <p className="fg-plain">
          CT pictures show severe plumbing narrowings. The MIBI stress scan asks a different question:
          “Is the heart muscle starving for blood?” — and the answer was mostly no.
        </p>

        <div className="fg-chip-row" role="tablist" aria-label="Heart arteries">
          {HEART_ARTERIES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={selected === a.id}
              className={cn('fg-chip', selected === a.id && 'is-active', a.stenosis)}
              onClick={() => setSelected(a.id)}
            >
              {a.name.split('(')[0].trim()}
            </button>
          ))}
        </div>

        <div className="fg-callout" data-tone={artery.stenosis === 'severe' ? 'watch' : 'info'}>
          <strong>{artery.name}</strong>
          <p>{artery.plain}</p>
        </div>

        <ul className="fg-stat-list">
          {MIBI.points.map((p) => (
            <li key={p.label}>
              <span className="fg-stat-value">{p.value}</span>
              <span className="fg-stat-label">{p.label}</span>
              <span className="fg-stat-plain">{p.plain}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
