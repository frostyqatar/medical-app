import { BRAIN } from '@/pages/family-guide/caseData';

/** Simple interactive MCA stenosis explainer. */
export function BrainVessel() {
  return (
    <div className="fg-model-grid">
      <div className="fg-model-visual">
        <svg viewBox="0 0 280 220" role="img" aria-label="Brain artery narrowing diagram">
          <ellipse cx="140" cy="110" rx="100" ry="85" fill="#f0fdfa" stroke="#134e4a" strokeWidth="1.5" />
          {/* Hemisphere hint */}
          <path d="M140 30 Q140 110 140 190" stroke="#99f6e4" strokeWidth="1" strokeDasharray="4 4" fill="none" />
          {/* MCA path left side */}
          <path
            d="M140 100 C100 95 70 85 48 70"
            stroke="#0f766e"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M48 70 C35 62 28 50 24 40"
            stroke="#0f766e"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Stenosis pinch */}
          <g className="fg-stenosis">
            <path
              d="M78 88 C72 90 68 90 62 86"
              stroke="#b45309"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="70" cy="88" r="14" fill="none" stroke="#b45309" strokeWidth="1.5" className="fg-pulse-ring" />
          </g>
          <text x="70" y="125" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="700">
            M1 narrowing
          </text>
          <text x="200" y="100" fontSize="11" fill="#134e4a" fontWeight="600">
            Blood still flows
          </text>
          <text x="200" y="116" fontSize="10" fill="#64748b">
            — hose is pinched,
          </text>
          <text x="200" y="130" fontSize="10" fill="#64748b">
            not cut
          </text>
        </svg>
      </div>

      <div className="fg-model-copy">
        <p className="fg-kicker">Cerebrovascular</p>
        <h3 className="fg-model-title">A narrowed brain artery — protected, not panicked</h3>
        <p className="fg-plain">{BRAIN.plain}</p>
        <div className="fg-callout" data-tone="watch">
          <strong>Finding</strong>
          <p>{BRAIN.finding}</p>
        </div>
        <ul className="fg-bullet">
          {BRAIN.protections.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
