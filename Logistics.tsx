'use client';

import { Bus, Car, Clock, Phone } from 'lucide-react';
import { useApp } from '@/lib/app';
import { telHref } from '@/lib/format';
import { Motif } from '../ui';

export function LogisticsTab() {
  const { logistics } = useApp();
  return (
    <div className="space-y-5">
      <section className="card relative overflow-hidden p-5">
        <Motif className="-right-12 -top-8 w-44" />
        <h2 className="mb-4 flex items-center gap-2.5 font-heading text-xl text-primary">
          <Bus size={20} className="text-gold" /> Shuttle timings
        </h2>
        <ul className="divide-y divide-gold/25">
          {logistics.shuttles.map((s, i) => (
            <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <Clock size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
              <div>
                <p className="text-[16px]">
                  <span className="font-semibold">{s.title}</span>
                  <span className="text-muted"> • </span>
                  <span className="font-semibold text-primary">{s.time}</span>
                </p>
                <p className="text-[15px] text-muted">({s.from} → {s.to})</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 flex items-center gap-2.5 font-heading text-xl text-primary">
          <Car size={20} className="text-gold" /> Drivers &amp; contacts
        </h2>
        <p className="mb-4 text-[15px] text-muted">Tap a name to call your driver directly.</p>
        <div className="flex flex-wrap gap-2">
          {logistics.drivers.map((d, i) => (
            <a key={i} href={telHref(d.phone)} className="pill" aria-label={`Call ${d.name}, ${d.label}`}>
              <Phone size={14} className="text-gold" />
              <span className="font-semibold">{d.name}</span>
              <span className="text-muted">• {d.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
