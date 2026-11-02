'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useApp } from '@/lib/app';
import { initials } from '@/lib/format';
import type { Side } from '@/lib/defaults';

export function Avatar({ name, url, size = 40, ring = false }: { name: string; url?: string | null; size?: number; ring?: boolean }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  const cls = `shrink-0 rounded-full object-cover ${ring ? 'ring-2 ring-gold ring-offset-2 ring-offset-card' : ''}`;
  return url ? (
    <img src={url} alt="" className={cls} style={style} loading="lazy" />
  ) : (
    <span aria-hidden className={`${cls} inline-flex items-center justify-center bg-blush font-heading font-semibold text-primary`} style={style}>
      {initials(name)}
    </span>
  );
}

export function SideBadge({ side }: { side: Side }) {
  return side === 'bride' ? (
    <span className="whitespace-nowrap rounded-full bg-blush px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">Bride Side</span>
  ) : (
    <span className="whitespace-nowrap rounded-full bg-gold/25 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-on-gold">Groom Side</span>
  );
}

const MOTIFS: Record<string, ReactNode> = {
  floral: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M100 160 C100 120 100 90 100 60" />
      <path d="M100 60 C88 44 88 28 100 16 C112 28 112 44 100 60Z" />
      <path d="M100 62 C80 56 66 42 64 24 C82 26 96 40 100 62Z" />
      <path d="M100 62 C120 56 134 42 136 24 C118 26 104 40 100 62Z" />
      <path d="M100 66 C76 70 56 62 46 46 C66 42 88 50 100 66Z" />
      <path d="M100 66 C124 70 144 62 154 46 C134 42 112 50 100 66Z" />
      <path d="M100 110 C82 100 70 102 60 116 C76 122 90 120 100 110Z" />
      <path d="M100 130 C118 120 130 122 140 136 C124 142 110 140 100 130Z" />
      <path d="M60 116 C52 124 46 136 44 150" /><path d="M140 136 C148 142 152 150 154 160" />
      <circle cx="100" cy="64" r="4" />
    </g>
  ),
  paisley: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M100 150 C50 150 40 90 70 60 C95 35 140 40 145 80 C150 110 120 120 110 100 C102 84 120 76 126 88" />
      <path d="M100 138 C62 136 56 92 78 70 C98 50 132 56 134 82" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={70 + i * 9} cy={118 - Math.sin(i / 1.6) * 30} r="3" />
      ))}
    </g>
  ),
  mandala: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1" transform="translate(100 90)">
      <circle r="18" /><circle r="34" /><circle r="70" strokeDasharray="2 5" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M0 -36 C10 -48 10 -60 0 -68 C-10 -60 -10 -48 0 -36Z" transform={`rotate(${i * 30})`} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={`s${i}`} d="M0 -20 L6 -30 L0 -33 L-6 -30Z" transform={`rotate(${i * 45})`} />
      ))}
    </g>
  ),
};

/** Faint line-art watermark that sits behind a section. */
export function Motif({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  const { theme } = useApp();
  if (theme.motif === 'none') return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 180"
      className={`pointer-events-none absolute text-primary opacity-[0.07] ${flip ? '-scale-x-100' : ''} ${className}`}
    >
      {MOTIFS[theme.motif] ?? MOTIFS.floral}
    </svg>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-script text-4xl text-primary">{children}</h2>
      {sub && <p className="mt-1 text-[15px] text-muted">{sub}</p>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="text-gold">{icon}</div>
      <p className="font-heading text-lg text-primary">{title}</p>
      {children && <p className="max-w-xs text-[15px] text-muted">{children}</p>}
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-page p-5 pb-[calc(var(--safe-bottom)+20px)] sm:max-w-lg sm:rounded-3xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl text-primary">{title}</h2>
              <button aria-label="Close" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-blush/50">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
