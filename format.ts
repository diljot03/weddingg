export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts }).format(new Date(iso));

export const fmtTime = (iso: string) => fmtDate(iso, { hour: 'numeric', minute: '2-digit', hour12: true });
export const fmtLongDay = (iso: string) => fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShortDay = (iso: string) => fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' });

/** "2:14 pm" for today, "12 Feb, 2:14 pm" otherwise (viewer's own clock). */
export const fmtStamp = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString('en-IN', sameDay ? { hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const mapsHref = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';

export const parseTags = (s: string) =>
  Array.from(new Set(s.toLowerCase().split(/[\s,]+/).map((t) => t.replace(/^#+/, '').replace(/[^\p{L}\p{N}_-]/gu, '')).filter(Boolean))).slice(0, 12);
