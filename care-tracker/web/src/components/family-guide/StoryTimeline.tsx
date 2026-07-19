import { useState } from 'react';
import { cn } from '@/lib/utils';
import { STORY_STEPS } from '@/pages/family-guide/caseData';

export function StoryTimeline() {
  const [open, setOpen] = useState(0);

  return (
    <ol className="fg-timeline">
      {STORY_STEPS.map((step, i) => {
        const isOpen = open === i;
        return (
          <li key={step.when} className={cn('fg-timeline-item', isOpen && 'is-open')}>
            <button
              type="button"
              className="fg-timeline-btn"
              aria-expanded={isOpen}
              onClick={() => setOpen(i)}
            >
              <span className="fg-timeline-dot" aria-hidden />
              <span className="fg-timeline-when">{step.when}</span>
              <span className="fg-timeline-title">{step.title}</span>
            </button>
            <div className={cn('fg-timeline-panel', isOpen && 'is-open')}>
              <p className="fg-plain">{step.plain}</p>
              <p className="fg-detail">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
