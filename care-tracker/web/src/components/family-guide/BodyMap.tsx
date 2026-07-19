import { cn } from '@/lib/utils';
import type { SystemId } from '@/pages/family-guide/caseData';

const HOTSPOTS: {
  id: SystemId;
  cx: number;
  cy: number;
  label: string;
}[] = [
  { id: 'brain', cx: 100, cy: 28, label: 'Brain' },
  { id: 'heart', cx: 88, cy: 78, label: 'Heart' },
  { id: 'sugar', cx: 100, cy: 118, label: 'Body' },
  { id: 'legs', cx: 118, cy: 210, label: 'Left foot' },
];

type Props = {
  active: SystemId;
  onSelect: (id: SystemId) => void;
};

/** Interactive body silhouette — tap a hotspot to open that system model. */
export function BodyMap({ active, onSelect }: Props) {
  return (
    <div className="fg-body-map">
      <svg viewBox="0 0 200 280" role="img" aria-label="Interactive body map of key systems">
        <defs>
          <linearGradient id="fg-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4e8e4" />
            <stop offset="100%" stopColor="#9fc4bc" />
          </linearGradient>
          <filter id="fg-soft">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Soft ground glow */}
        <ellipse cx="100" cy="268" rx="54" ry="8" fill="rgba(26, 95, 84, 0.12)" />

        {/* Body silhouette */}
        <g fill="url(#fg-skin)" stroke="#1a5f54" strokeWidth="1.4" strokeLinejoin="round">
          <ellipse cx="100" cy="28" rx="22" ry="26" />
          <path d="M78 52 Q100 48 122 52 L132 108 Q100 118 68 108 Z" />
          <path d="M68 100 L52 168 L68 172 L78 118 Z" />
          <path d="M132 100 L148 168 L132 172 L122 118 Z" />
          {/* Right leg — amputated below knee */}
          <path d="M78 118 L72 175 L88 178 L92 120 Z" />
          <path d="M70 178 Q80 188 90 178" fill="#1a5f54" opacity="0.35" stroke="none" />
          {/* Left leg intact */}
          <path d="M108 120 L112 210 L128 208 L122 118 Z" />
          <path d="M112 210 L108 248 L124 250 L128 208 Z" />
          <ellipse cx="118" cy="252" rx="14" ry="6" />
        </g>

        {/* Pulse rings on hotspots */}
        {HOTSPOTS.map((h) => {
          const isActive = active === h.id;
          return (
            <g
              key={h.id}
              className={cn('fg-hotspot-group', isActive && 'is-active')}
              role="button"
              tabIndex={0}
              aria-label={`Explore ${h.label}`}
              aria-pressed={isActive}
              onClick={() => onSelect(h.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(h.id);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {isActive && (
                <circle
                  cx={h.cx}
                  cy={h.cy}
                  r="18"
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="1.5"
                  className="fg-pulse-ring"
                />
              )}
              <circle cx={h.cx} cy={h.cy} r="16" fill="transparent" />
              <circle
                cx={h.cx}
                cy={h.cy}
                r="11"
                fill={isActive ? '#0f766e' : '#fff'}
                stroke="#0f766e"
                strokeWidth="2"
              />
              <text
                x={h.cx}
                y={h.cy + 30}
                textAnchor="middle"
                fill="#134e4a"
                fontSize="9"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {h.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="fg-body-hint">Tap a glowing point to explore that part of the case.</p>
    </div>
  );
}
