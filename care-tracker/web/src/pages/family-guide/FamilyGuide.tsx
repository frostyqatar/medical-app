import { useEffect, useRef, useState } from 'react';
import { BodyMap } from '@/components/family-guide/BodyMap';
import { BrainVessel } from '@/components/family-guide/BrainVessel';
import { HeartModel } from '@/components/family-guide/HeartModel';
import { LabTrends } from '@/components/family-guide/LabTrends';
import { LegArteries } from '@/components/family-guide/LegArteries';
import { MedExplainer } from '@/components/family-guide/MedExplainer';
import { StoryTimeline } from '@/components/family-guide/StoryTimeline';
import { ConditionsPlain, WhatsNext } from '@/components/family-guide/WhatsNext';
import {
  AT_A_GLANCE,
  GUIDE_META,
  SYSTEMS,
  type SystemId,
} from '@/pages/family-guide/caseData';
import '@/pages/family-guide/familyGuide.css';

function SystemPanel({ id }: { id: SystemId }) {
  switch (id) {
    case 'story':
      return <StoryTimeline />;
    case 'legs':
      return <LegArteries />;
    case 'heart':
      return <HeartModel />;
    case 'brain':
      return <BrainVessel />;
    case 'sugar':
      return <ConditionsPlain />;
    case 'labs':
      return <LabTrends />;
    case 'meds':
      return <MedExplainer />;
    case 'next':
      return <WhatsNext />;
    default:
      return null;
  }
}

export default function FamilyGuide() {
  const [active, setActive] = useState<SystemId>('story');
  const panelRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function selectSystem(id: SystemId) {
    setActive(id);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const activeMeta = SYSTEMS.find((s) => s.id === active);

  return (
    <div className="fg-page">
      <section className={`fg-hero ${heroVisible ? 'is-visible' : ''}`}>
        <div className="fg-hero-copy">
          <p className="fg-brand">Family Care Guide</p>
          <h1>Understanding her case — clearly</h1>
          <p className="fg-hero-lead">{GUIDE_META.tagline}</p>
          <div className="fg-hero-actions">
            <button type="button" className="fg-btn-primary" onClick={() => selectSystem('story')}>
              Start with the story
            </button>
            <button type="button" className="fg-btn-ghost" onClick={() => selectSystem('legs')}>
              See the leg model
            </button>
          </div>
          <p className="fg-updated">Updated {GUIDE_META.updated} · PT-ANON</p>
        </div>
        <div className="fg-hero-visual">
          <BodyMap active={active} onSelect={selectSystem} />
        </div>
      </section>

      <section className="fg-glance" aria-label="At a glance">
        <h2 className="fg-section-title">At a glance</h2>
        <p className="fg-section-lead">Four headlines the whole family can remember.</p>
        <div className="fg-glance-grid">
          {AT_A_GLANCE.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="fg-glance-card"
              data-tone={item.tone}
              style={{ animationDelay: `${0.08 * i}s` }}
              onClick={() => selectSystem(item.id as SystemId)}
            >
              <span className="fg-glance-status">{item.status}</span>
              <strong>{item.label}</strong>
              <p>{item.plain}</p>
            </button>
          ))}
        </div>
      </section>

      <nav className="fg-sys-nav" aria-label="Explore systems">
        {SYSTEMS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={active === s.id ? 'is-active' : undefined}
            onClick={() => selectSystem(s.id)}
          >
            <span>{s.label}</span>
            <small>{s.blurb}</small>
          </button>
        ))}
      </nav>

      <section className="fg-panel" ref={panelRef} aria-live="polite">
        <header className="fg-panel-head">
          <h2>{activeMeta?.label}</h2>
          <p>{activeMeta?.blurb}</p>
        </header>
        <SystemPanel id={active} />
      </section>

      <footer className="fg-footer">
        <p>{GUIDE_META.disclaimer}</p>
      </footer>
    </div>
  );
}
