'use client';

import { useEffect } from 'react';
import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { useApp } from '@/lib/app';
import { fmtLongDay, fmtTime, mapsHref, telHref } from '@/lib/format';
import { Motif, SectionTitle } from '../ui';

export function Details({ focusId }: { focusId: string | null }) {
  const { events } = useApp();
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));

  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => document.getElementById(`event-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280);
    return () => clearTimeout(t);
  }, [focusId]);

  return (
    <div>
      <SectionTitle sub="Every function, where it is, and who to call.">The festivities</SectionTitle>
      <ol className="space-y-5">
        {sorted.map((e) => (
          <li
            key={e.id}
            id={`event-${e.id}`}
            className={`card relative scroll-mt-24 overflow-hidden p-5 ${focusId === e.id ? 'ring-2 ring-gold' : ''}`}
          >
            <Motif className="-right-10 -top-6 w-40" />
            <h3 className="font-script text-[42px] leading-none text-primary">{e.name}</h3>

            <p className="mt-4 flex gap-3 text-[16px]">
              <Clock size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
              <span>
                {fmtLongDay(e.start)}
                <span className="block text-muted">{fmtTime(e.start)}</span>
              </span>
            </p>
            <p className="mt-3 flex gap-3 text-[16px]">
              <MapPin size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
              <span>
                <span className="font-semibold">{e.venue}</span>
                <span className="block text-muted">{e.address}</span>
              </span>
            </p>
            {e.note && <p className="mt-3 rounded-xl bg-blush/50 px-3.5 py-2.5 text-[15px] italic text-primary">{e.note}</p>}

            <a
              href={mapsHref(e.mapsQuery || `${e.venue}, ${e.address}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-4"
            >
              <Navigation size={15} /> Open in maps
            </a>

            {e.contacts.length > 0 && (
              <div className="mt-5 border-t border-gold/30 pt-4">
                <p className="label mb-2.5">Key contacts</p>
                <div className="flex flex-wrap gap-2">
                  {e.contacts.map((c, i) => (
                    <a key={i} href={telHref(c.phone)} className="pill" aria-label={`Call ${c.name}, ${c.label}`}>
                      <Phone size={14} className="text-gold" />
                      <span className="font-semibold">{c.label}</span>
                      <span className="text-muted">{c.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
