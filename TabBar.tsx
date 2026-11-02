'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const TABS = ['details', 'guests', 'photos', 'chat', 'songs', 'logistics', 'sangeet', 'games'] as const;
export type Tab = (typeof TABS)[number];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    refs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  return (
    <nav
      className="sticky z-40 border-y border-gold/30 bg-page/90 backdrop-blur-md"
      style={{ top: 0, paddingTop: 'var(--safe-top)' }}
      aria-label="Sections"
    >
      <div role="tablist" className="no-scrollbar mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2">
        {TABS.map((t) => (
          <button
            key={t}
            ref={(el) => {
              refs.current[t] = el;
            }}
            role="tab"
            aria-selected={active === t}
            onClick={() => onChange(t)}
            className={`relative shrink-0 px-3.5 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] transition ${
              active === t ? 'text-primary' : 'text-muted hover:text-ink'
            }`}
          >
            {t}
            {active === t && (
              <motion.span layoutId="tab-underline" className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-gold" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
