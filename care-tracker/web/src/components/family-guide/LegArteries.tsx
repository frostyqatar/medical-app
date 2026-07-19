import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LEG_NUMBERS, LEG_VESSELS, type VesselStatus } from '@/pages/family-guide/caseData';

const STATUS_COLOR: Record<VesselStatus, string> = {
  patent: '#0f766e',
  treated: '#0369a1',
  collateral: '#ca8a04',
  occluded: '#b91c1c',
};

const STATUS_LABEL: Record<VesselStatus, string> = {
  patent: 'Open',
  treated: 'Opened with balloon',
  collateral: 'Refilled by side branches',
  occluded: 'Blocked',
};

/** Interactive left-leg arterial tree. */
export function LegArteries() {
  const [selected, setSelected] = useState(LEG_VESSELS[1].id);
  const vessel = LEG_VESSELS.find((v) => v.id === selected) ?? LEG_VESSELS[0];

  return (
    <div className="fg-model-grid">
      <div className="fg-model-visual">
        <svg viewBox="0 0 200 320" role="img" aria-label="Left leg artery map">
          {/* Leg outline */}
          <path
            d="M70 10 L90 10 L105 140 L115 250 L130 300 L95 305 L85 250 L75 140 Z"
            fill="#ecfdf5"
            stroke="#134e4a"
            strokeWidth="1.5"
          />
          {/* Ulcer marker on toe area */}
          <ellipse cx="112" cy="298" rx="10" ry="5" fill="#fbbf24" opacity="0.7" className="fg-ulcer-glow" />
          <text x="148" y="302" fontSize="9" fill="#92400e" fontWeight="600">
            Healing ulcer
          </text>

          {/* Inflow trunk */}
          <path
            d="M85 20 L88 120"
            stroke={selected === 'inflow' ? STATUS_COLOR.patent : '#5eead4'}
            strokeWidth={selected === 'inflow' ? 8 : 6}
            strokeLinecap="round"
            onClick={() => setSelected('inflow')}
            style={{ cursor: 'pointer' }}
          />
          {/* Peroneal (treated) */}
          <path
            d="M88 120 L100 240"
            stroke={selected === 'peroneal' ? STATUS_COLOR.treated : '#7dd3fc'}
            strokeWidth={selected === 'peroneal' ? 7 : 5}
            strokeLinecap="round"
            onClick={() => setSelected('peroneal')}
            style={{ cursor: 'pointer' }}
          />
          {/* ATA occluded */}
          <path
            d="M88 120 L70 220"
            stroke={STATUS_COLOR.occluded}
            strokeWidth={selected === 'ata' ? 5 : 3.5}
            strokeLinecap="round"
            strokeDasharray="6 5"
            opacity={selected === 'ata' ? 1 : 0.55}
            onClick={() => setSelected('ata')}
            style={{ cursor: 'pointer' }}
          />
          {/* PTA occluded */}
          <path
            d="M88 120 L110 200"
            stroke={STATUS_COLOR.occluded}
            strokeWidth={selected === 'pta' ? 5 : 3.5}
            strokeLinecap="round"
            strokeDasharray="6 5"
            opacity={selected === 'pta' ? 1 : 0.55}
            onClick={() => setSelected('pta')}
            style={{ cursor: 'pointer' }}
          />
          {/* DPA collateral */}
          <path
            d="M100 240 Q108 270 112 295"
            stroke={selected === 'dpa' ? STATUS_COLOR.collateral : '#fbbf24'}
            strokeWidth={selected === 'dpa' ? 5 : 3.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="3 3"
            onClick={() => setSelected('dpa')}
            style={{ cursor: 'pointer' }}
          />

          {/* Legend dots */}
          <g fontSize="8" fill="#334155">
            <circle cx="155" cy="40" r="4" fill={STATUS_COLOR.patent} />
            <text x="164" y="43">Open</text>
            <circle cx="155" cy="58" r="4" fill={STATUS_COLOR.treated} />
            <text x="164" y="61">Balloon-opened</text>
            <circle cx="155" cy="76" r="4" fill={STATUS_COLOR.occluded} />
            <text x="164" y="79">Blocked</text>
            <circle cx="155" cy="94" r="4" fill={STATUS_COLOR.collateral} />
            <text x="164" y="97">Collateral</text>
          </g>
        </svg>
      </div>

      <div className="fg-model-copy">
        <p className="fg-kicker">Left leg blood flow</p>
        <h3 className="fg-model-title">Blocked pipes, but enough detours</h3>
        <p className="fg-plain">
          Two shin arteries are blocked. The peroneal artery was opened with a balloon and, together
          with side branches, feeds the foot well enough for new skin to grow.
        </p>

        <div className="fg-chip-row">
          {LEG_VESSELS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={cn('fg-chip', selected === v.id && 'is-active')}
              onClick={() => setSelected(v.id)}
            >
              {v.short}
            </button>
          ))}
        </div>

        <div className="fg-callout" data-tone={vessel.status === 'occluded' ? 'alert' : 'good'}>
          <strong>
            {vessel.name} — {STATUS_LABEL[vessel.status]}
          </strong>
          <p>{vessel.plain}</p>
        </div>

        <ul className="fg-stat-list">
          {LEG_NUMBERS.map((n) => (
            <li key={n.label}>
              <span className="fg-stat-value">{n.value}</span>
              <span className="fg-stat-label">{n.label}</span>
              <span className="fg-stat-plain">{n.plain}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
