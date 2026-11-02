'use client';

import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/app';
import { compressImage, uploadFile } from '@/lib/db';
import type { Contact, Games, Logistics, ThemeChoice, WeddingEvent, WeddingInfo } from '@/lib/defaults';
import { BODY_FONTS, HEADING_FONTS, PALETTES, SCRIPT_FONTS } from '@/lib/themes';
import { Sheet } from './ui';

// Times are entered and shown in India Standard Time.
const OFFSET_MIN = 330;
const toInput = (iso: string) => new Date(new Date(iso).getTime() + OFFSET_MIN * 60_000).toISOString().slice(0, 16);
const fromInput = (v: string) => `${v}:00+05:30`;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || Math.random().toString(36).slice(2, 8);
const splitLine = (l: string) => l.split('|').map((s) => s.trim());
const contactsToText = (cs: Contact[]) => cs.map((c) => `${c.label} | ${c.name} | ${c.phone}`).join('\n');
const textToContacts = (t: string): Contact[] =>
  t.split('\n').map(splitLine).filter((p) => p[0] && p[2]).map(([label, name, phone]) => ({ label, name: name || '', phone }));

const SECTIONS = ['Theme', 'Invitation', 'Events', 'Logistics', 'Games'] as const;

export function HostStudio({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('Theme');
  return (
    <Sheet open={open} onClose={onClose} title="Host Studio">
      <div className="no-scrollbar -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider ${section === s ? 'bg-primary text-on-primary' : 'bg-blush/50 text-primary'}`}
          >
            {s}
          </button>
        ))}
      </div>
      {section === 'Theme' && <ThemeEditor />}
      {section === 'Invitation' && <InvitationEditor />}
      {section === 'Events' && <EventsEditor />}
      {section === 'Logistics' && <LogisticsEditor />}
      {section === 'Games' && <GamesEditor />}
    </Sheet>
  );
}

function useSaver() {
  const { saveSetting, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const save = async (key: string, value: unknown, msg = 'Saved. Every guest sees the change now.') => {
    setBusy(true);
    try {
      await saveSetting(key, value);
      toast(msg);
    } catch (e: any) {
      toast(e?.message || 'Couldn’t save. Check that you’re signed in as a host.');
    } finally {
      setBusy(false);
    }
  };
  return { busy, save };
}

function SaveButton({ busy, onClick, label = 'Save changes' }: { busy: boolean; onClick: () => void; label?: string }) {
  return (
    <button className="btn-primary mt-5 w-full" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {label}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="mb-3 block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

function ThemeEditor() {
  const { theme } = useApp();
  const { save } = useSaver();
  const set = (patch: Partial<ThemeChoice>) => save('theme', { ...theme, ...patch }, 'Theme updated for everyone.');
  return (
    <div>
      <p className="label mb-2">Colour palette</p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {Object.entries(PALETTES).map(([id, p]) => (
          <button
            key={id}
            onClick={() => set({ palette: id })}
            aria-pressed={theme.palette === id}
            className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left text-[14px] ${theme.palette === id ? 'border-primary' : 'border-gold/30'}`}
            style={{ background: p.page, color: p.ink }}
          >
            <span className="flex -space-x-1.5">
              {[p.primary, p.gold, p.blush].map((c) => (
                <span key={c} className="h-6 w-6 rounded-full border-2" style={{ background: c, borderColor: p.page }} />
              ))}
            </span>
            {p.name}
          </button>
        ))}
      </div>
      <Field label="Script font (names, event titles)">
        <select className="input" value={theme.script} onChange={(e) => set({ script: e.target.value })}>
          {SCRIPT_FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Heading font">
        <select className="input" value={theme.heading} onChange={(e) => set({ heading: e.target.value })}>
          {HEADING_FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Body font">
        <select className="input" value={theme.body} onChange={(e) => set({ body: e.target.value })}>
          {BODY_FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Background motif">
        <select className="input" value={theme.motif} onChange={(e) => set({ motif: e.target.value as ThemeChoice['motif'] })}>
          <option value="floral">Floral line art</option>
          <option value="paisley">Paisley</option>
          <option value="mandala">Mandala</option>
          <option value="none">None</option>
        </select>
      </Field>
    </div>
  );
}

function InvitationEditor() {
  const { wedding, toast } = useApp();
  const { busy, save } = useSaver();
  const [w, setW] = useState<WeddingInfo>(wedding);
  const [uploading, setUploading] = useState<string | null>(null);
  useEffect(() => {
    setW(wedding);
  }, [wedding]);

  const text = (k: keyof WeddingInfo, label: string, area = false) => (
    <Field label={label}>
      {area ? (
        <textarea className="input min-h-[70px]" value={w[k]} onChange={(e) => setW({ ...w, [k]: e.target.value })} />
      ) : (
        <input className="input" value={w[k]} onChange={(e) => setW({ ...w, [k]: e.target.value })} />
      )}
    </Field>
  );

  const uploadImage = async (k: 'heroUrl' | 'polaroidUrl', file?: File) => {
    if (!file) return;
    setUploading(k);
    try {
      const { blob } = await compressImage(file, 2000, 0.88);
      const { url } = await uploadFile('site', blob, `${k}.jpg`);
      setW((cur) => ({ ...cur, [k]: url }));
      toast('Photo ready. Save changes to publish it.');
    } catch (e: any) {
      toast(e?.message || 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {(['heroUrl', 'polaroidUrl'] as const).map((k) => (
          <label key={k} className="block cursor-pointer">
            <span className="label mb-1.5 block">{k === 'heroUrl' ? 'Cover photo' : 'Polaroid photo'}</span>
            <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-gold/40">
              <img src={w[k]} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-black/55 py-1.5 text-[12px] text-white">
                {uploading === k ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Replace
              </span>
            </span>
            <input type="file" accept="image/*" hidden onChange={(e) => uploadImage(k, e.target.files?.[0])} />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {text('bride', 'Bride')}
        {text('groom', 'Groom')}
      </div>
      {text('tagline', 'Tagline')}
      <Field label="Wedding date and time (IST)" hint="The countdown on the cover counts down to this.">
        <input type="datetime-local" className="input" value={toInput(w.date)} onChange={(e) => e.target.value && setW({ ...w, date: fromInput(e.target.value) })} />
      </Field>
      {text('brideParents', 'Bride’s parents')}
      {text('groomParents', 'Groom’s parents')}
      {text('inviteLine', 'Invitation line', true)}
      <SaveButton busy={busy} onClick={() => save('wedding', w)} />
    </div>
  );
}

type EventDraft = Omit<WeddingEvent, 'contacts'> & { contactsText: string };

function EventsEditor() {
  const { events } = useApp();
  const { busy, save } = useSaver();
  const toDraft = (e: WeddingEvent): EventDraft => ({ ...e, contactsText: contactsToText(e.contacts) });
  const [list, setList] = useState<EventDraft[]>(events.map(toDraft));
  useEffect(() => {
    setList(events.map(toDraft));
  }, [events]);

  const patch = (i: number, p: Partial<EventDraft>) => setList((l) => l.map((e, j) => (j === i ? { ...e, ...p } : e)));

  const publish = () => {
    const out: WeddingEvent[] = list
      .filter((e) => e.name.trim())
      .map(({ contactsText, ...e }) => ({ ...e, id: e.id || slug(e.name), contacts: textToContacts(contactsText) }));
    save('events', out);
  };

  return (
    <div>
      {list.map((e, i) => (
        <details key={e.id || i} className="card mb-3 p-4" open={!e.id}>
          <summary className="flex cursor-pointer items-center justify-between font-heading text-lg text-primary">
            {e.name || 'New event'}
            <button
              onClick={(ev) => {
                ev.preventDefault();
                setList((l) => l.filter((_, j) => j !== i));
              }}
              aria-label={`Delete ${e.name}`}
              className="rounded-full p-1.5 text-muted hover:bg-blush/50"
            >
              <Trash2 size={16} />
            </button>
          </summary>
          <div className="mt-3">
            <Field label="Name"><input className="input" value={e.name} onChange={(x) => patch(i, { name: x.target.value })} /></Field>
            <Field label="Date and time (IST)">
              <input type="datetime-local" className="input" value={toInput(e.start)} onChange={(x) => x.target.value && patch(i, { start: fromInput(x.target.value) })} />
            </Field>
            <Field label="Venue"><input className="input" value={e.venue} onChange={(x) => patch(i, { venue: x.target.value })} /></Field>
            <Field label="Full address"><input className="input" value={e.address} onChange={(x) => patch(i, { address: x.target.value })} /></Field>
            <Field label="Map pin (optional)" hint="Coordinates like 30.9010,75.8573 or a place name. Blank uses venue + address.">
              <input className="input" value={e.mapsQuery ?? ''} onChange={(x) => patch(i, { mapsQuery: x.target.value })} />
            </Field>
            <Field label="Note (optional)"><input className="input" value={e.note ?? ''} onChange={(x) => patch(i, { note: x.target.value })} placeholder="Dress code, parking…" /></Field>
            <Field label="Contacts" hint="One per line: Role | Name | Phone">
              <textarea className="input min-h-[90px] font-mono text-[14px]" value={e.contactsText} onChange={(x) => patch(i, { contactsText: x.target.value })} />
            </Field>
          </div>
        </details>
      ))}
      <button
        className="btn-ghost w-full"
        onClick={() =>
          setList((l) => [...l, { id: '', name: '', start: new Date().toISOString(), venue: '', address: '', note: '', mapsQuery: '', contactsText: '' }])
        }
      >
        <Plus size={15} /> Add event
      </button>
      <SaveButton busy={busy} onClick={publish} label="Publish schedule" />
    </div>
  );
}

function LogisticsEditor() {
  const { logistics } = useApp();
  const { busy, save } = useSaver();
  const toShuttles = (l: Logistics) => l.shuttles.map((s) => `${s.title} | ${s.time} | ${s.from} | ${s.to}`).join('\n');
  const toDrivers = (l: Logistics) => l.drivers.map((d) => `${d.name} | ${d.label} | ${d.phone}`).join('\n');
  const [shuttles, setShuttles] = useState(toShuttles(logistics));
  const [drivers, setDrivers] = useState(toDrivers(logistics));
  useEffect(() => {
    setShuttles(toShuttles(logistics));
    setDrivers(toDrivers(logistics));
  }, [logistics]);

  const publish = () =>
    save('logistics', {
      shuttles: shuttles.split('\n').map(splitLine).filter((p) => p[0]).map(([title, time = '', from = '', to = '']) => ({ title, time, from, to })),
      drivers: drivers.split('\n').map(splitLine).filter((p) => p[0] && p[2]).map(([name, label = '', phone]) => ({ name, label, phone })),
    } satisfies Logistics);

  return (
    <div>
      <Field label="Shuttles" hint="One per line: Route | Time | From | To">
        <textarea className="input min-h-[120px] font-mono text-[14px]" value={shuttles} onChange={(e) => setShuttles(e.target.value)} />
      </Field>
      <Field label="Drivers and transport contacts" hint="One per line: Name | Duty | Phone">
        <textarea className="input min-h-[120px] font-mono text-[14px]" value={drivers} onChange={(e) => setDrivers(e.target.value)} />
      </Field>
      <SaveButton busy={busy} onClick={publish} label="Publish logistics" />
    </div>
  );
}

function GamesEditor() {
  const { games } = useApp();
  const { busy, save } = useSaver();
  const toTrivia = (g: Games) => g.trivia.map((t) => `${t.q} | ${t.options.join('; ')} | ${t.answer + 1}`).join('\n');
  const toPolls = (g: Games) => g.polls.map((p) => `${p.q} | ${p.options.join('; ')}`).join('\n');
  const [trivia, setTrivia] = useState(toTrivia(games));
  const [polls, setPolls] = useState(toPolls(games));
  useEffect(() => {
    setTrivia(toTrivia(games));
    setPolls(toPolls(games));
  }, [games]);

  // Ids come from the question text, so answers survive edits elsewhere in the list.
  const publish = () =>
    save('games', {
      trivia: trivia
        .split('\n')
        .map(splitLine)
        .filter((p) => p[0] && p[1])
        .map(([q, opts, ans]) => {
          const options = opts.split(';').map((o) => o.trim()).filter(Boolean);
          const answer = Math.min(Math.max(parseInt(ans || '1', 10) - 1, 0), options.length - 1);
          return { id: games.trivia.find((t) => t.q === q)?.id ?? `t-${slug(q)}`, q, options, answer };
        }),
      polls: polls
        .split('\n')
        .map(splitLine)
        .filter((p) => p[0] && p[1])
        .map(([q, opts]) => ({ id: games.polls.find((p) => p.q === q)?.id ?? `p-${slug(q)}`, q, options: opts.split(';').map((o) => o.trim()).filter(Boolean) })),
    } satisfies Games);

  return (
    <div>
      <Field label="Trivia about the couple" hint="One per line: Question | option; option; option; option | number of the right option">
        <textarea className="input min-h-[150px] font-mono text-[14px]" value={trivia} onChange={(e) => setTrivia(e.target.value)} />
      </Field>
      <Field label="Icebreaker polls" hint="One per line: Question | option; option; …">
        <textarea className="input min-h-[120px] font-mono text-[14px]" value={polls} onChange={(e) => setPolls(e.target.value)} />
      </Field>
      <SaveButton busy={busy} onClick={publish} label="Publish games" />
    </div>
  );
}
