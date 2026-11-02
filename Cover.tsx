'use client';

import { useEffect, useState } from 'react';
import { Crown, LogOut } from 'lucide-react';
import { useApp } from '@/lib/app';
import { fmtLongDay, fmtShortDay, fmtTime } from '@/lib/format';
import { Motif } from './ui';

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const s = Math.floor(diff / 1000);
  return { done: diff === 0, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

function Countdown({ target }: { target: string }) {
  const c = useCountdown(target);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="glass flex items-center gap-1 rounded-2xl px-3 py-2 text-white shadow-lg" role="timer" aria-label="Time until the wedding">
      {!c ? (
        <span className="px-4 py-2 text-sm">&nbsp;</span>
      ) : c.done ? (
        <span className="px-3 py-1 font-script text-2xl">Just married</span>
      ) : (
        [
          [pad(c.d), 'Days'],
          [pad(c.h), 'Hrs'],
          [pad(c.m), 'Min'],
          [pad(c.s), 'Sec'],
        ].map(([v, l], i) => (
          <div key={l} className="flex items-center">
            {i > 0 && <span className="mx-0.5 pb-3 font-heading text-xl opacity-70">:</span>}
            <div className="min-w-[2.75rem] text-center">
              <div className="font-heading text-2xl font-semibold tabular-nums leading-none">{v}</div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] opacity-80">{l}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function Hero({ onOpenStudio }: { onOpenStudio: () => void }) {
  const { wedding, signOut, isHost } = useApp();
  const [confirm, setConfirm] = useState(false);

  return (
    <header className="relative h-[86dvh] max-h-[820px] min-h-[520px] w-full overflow-hidden bg-primary">
      <img src={wedding.heroUrl} alt={`${wedding.bride} and ${wedding.groom}`} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />

      <div className="absolute inset-x-0 flex justify-center" style={{ top: 'calc(var(--safe-top) + 62px)' }}>
        <Countdown target={wedding.date} />
      </div>

      {isHost && (
        <button
          onClick={onOpenStudio}
          className="glass absolute left-3 flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-wider text-white"
          style={{ top: 'calc(var(--safe-top) + 14px)' }}
        >
          <Crown size={15} /> Host
        </button>
      )}

      <button
        onClick={() => (confirm ? signOut() : setConfirm(true))}
        onBlur={() => setConfirm(false)}
        className="glass absolute right-3 flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-wider text-white"
        style={{ top: 'calc(var(--safe-top) + 14px)' }}
      >
        <LogOut size={15} /> {confirm ? 'Tap to confirm' : 'Sign out'}
      </button>

      <div className="absolute inset-x-0 bottom-0 px-6 pb-10 text-center text-white">
        <h1 className="font-script text-[clamp(3.4rem,15vw,6.5rem)] leading-[0.95] drop-shadow-lg">
          {wedding.bride}
          <span className="mx-3 text-gold">&amp;</span>
          {wedding.groom}
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-heading text-lg italic opacity-95">{wedding.tagline}</p>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.3em] text-gold">{fmtLongDay(wedding.date)}</p>
      </div>
    </header>
  );
}

export function QuickTimings({ onSelect }: { onSelect: (id: string) => void }) {
  const { events } = useApp();
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  const nextId = sorted.find((e) => new Date(e.start).getTime() + 3 * 3600_000 > now)?.id;

  return (
    <section aria-label="Upcoming functions" className="-mt-6 relative z-10">
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {sorted.map((e) => {
          const next = now > 0 && e.id === nextId;
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={`card min-w-[132px] shrink-0 snap-start whitespace-nowrap px-4 py-3 text-left transition active:scale-[0.98] ${next ? '!border-primary !bg-primary text-on-primary' : ''}`}
            >
              <span className={`block font-script text-[28px] ${next ? 'text-gold' : 'text-primary'}`}>{e.name}</span>
              <span className="mt-1 block text-[13px] font-semibold uppercase tracking-wider">{fmtShortDay(e.start)}</span>
              <span className={`block text-[15px] ${next ? 'opacity-90' : 'text-muted'}`}>{fmtTime(e.start)}</span>
              {next && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Up next</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function InvitationCard() {
  const { wedding } = useApp();
  return (
    <section className="px-4 pt-8" aria-label="Invitation">
      <div className="rounded-[28px] bg-primary p-2.5 shadow-xl">
        <div className="relative overflow-hidden rounded-[22px] border border-gold/70 bg-page px-5 pb-6 pt-10 text-center outline outline-1 outline-offset-[-8px] outline-gold/50">
          <Motif className="-left-10 -top-6 w-48" />
          <Motif className="-bottom-8 -right-10 w-48" flip />

          <Emblem className="mx-auto mb-5 h-16 w-16 text-gold" />

          <div className="relative mx-auto mb-6 w-[68%] max-w-[260px] -rotate-[4deg] bg-white p-2.5 pb-10 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.45)]">
            <img src={wedding.polaroidUrl} alt="" className="aspect-[4/5] w-full object-cover" />
            <span className="absolute inset-x-0 bottom-2 font-script text-2xl text-[#4a2a2f]">
              {wedding.bride[0]} &amp; {wedding.groom[0]}
            </span>
          </div>

          <p className="font-heading text-[15px] italic text-muted">With the blessings of our elders</p>
          <p className="mt-2 font-script text-5xl text-primary">
            {wedding.bride} <span className="text-gold">&amp;</span> {wedding.groom}
          </p>
          <p className="mx-auto mt-2 max-w-xs font-heading text-[17px] italic text-ink/80">{wedding.tagline}</p>

          <div className="mt-6 rounded-2xl bg-blush/70 px-4 py-5">
            <p className="font-heading text-[15px] italic text-primary">Together with their families</p>
            <div className="mt-4 grid grid-cols-2 divide-x divide-gold/50">
              <div className="pr-3">
                <p className="label !text-primary">Bride’s parents</p>
                <p className="mt-1.5 text-[15px] leading-snug text-ink">{wedding.brideParents}</p>
              </div>
              <div className="pl-3">
                <p className="label !text-primary">Groom’s parents</p>
                <p className="mt-1.5 text-[15px] leading-snug text-ink">{wedding.groomParents}</p>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-xs text-[15px] leading-snug text-muted">{wedding.inviteLine}</p>
          </div>

          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">
            {fmtLongDay(wedding.date)} · {fmtTime(wedding.date)}
          </p>
        </div>
      </div>
    </section>
  );
}

function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="32" cy="32" r="30" />
        <circle cx="32" cy="32" r="25" strokeDasharray="1.5 3" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M32 12 C37 18 37 24 32 28 C27 24 27 18 32 12Z" transform={`rotate(${i * 45} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="4" fill="currentColor" />
      </g>
    </svg>
  );
}
