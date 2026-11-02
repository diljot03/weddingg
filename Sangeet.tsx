'use client';

import { useRef, useState } from 'react';
import { AudioLines, Loader2, Mic, MicVocal, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '@/lib/app';
import { insert, remove, update, uploadFile, useTable } from '@/lib/db';
import { Empty, SectionTitle } from '../ui';

type Performance = {
  id: string; guest_id: string; performer: string; song_title?: string | null;
  audio_url?: string | null; audio_name?: string | null; status: 'upcoming' | 'on stage' | 'done'; created_at: string;
};

const NEXT_STATUS = { upcoming: 'on stage', 'on stage': 'done', done: 'upcoming' } as const;

function StatusBadge({ status }: { status: Performance['status'] }) {
  const styles = {
    upcoming: 'bg-blush text-primary',
    'on stage': 'bg-gold text-on-gold animate-pulse',
    done: 'bg-muted/15 text-muted',
  }[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${styles}`}>{status}</span>;
}

export function Sangeet() {
  const { me, isHost, toast } = useApp();
  const { rows } = useTable<Performance>('performances');
  const [performer, setPerformer] = useState('');
  const [song, setSong] = useState('');
  const [audio, setAudio] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!performer.trim() || !me) return;
    setBusy(true);
    try {
      let audio_url: string | null = null;
      if (audio) audio_url = (await uploadFile('audio', audio, audio.name)).url;
      await insert('performances', {
        guest_id: me.id,
        performer: performer.trim(),
        song_title: song.trim() || null,
        audio_url,
        audio_name: audio?.name ?? null,
      });
      setPerformer('');
      setSong('');
      setAudio(null);
      toast(audio_url ? 'You’re on the lineup. Your track is with the sound console.' : 'You’re on the lineup!');
    } catch (err: any) {
      toast(err?.message || 'Registration failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionTitle sub="The order of the night. Hosts update it live as acts go on stage.">Sangeet lineup</SectionTitle>

      {rows.length === 0 ? (
        <Empty icon={<MicVocal size={28} />} title="The stage is open">Be the first act to sign up below.</Empty>
      ) : (
        <ol className="mb-8 space-y-3">
          {rows.map((p, i) => (
            <li key={p.id} className={`card flex items-start gap-3 p-4 ${p.status === 'on stage' ? 'ring-2 ring-gold' : ''}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-on-primary">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-[18px] text-primary">{p.performer}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-[15px] text-muted">{p.song_title || 'Song to be announced'}</p>
                {p.audio_url && isHost && <audio controls preload="none" src={p.audio_url} className="mt-2 h-9 w-full" />}
                {p.audio_url && !isHost && (
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><AudioLines size={14} /> Track sent to sound console</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {isHost && (
                  <button className="btn-ghost px-3 py-1.5 text-[10px]" onClick={() => update('performances', { id: p.id }, { status: NEXT_STATUS[p.status] })}>
                    Mark {NEXT_STATUS[p.status]}
                  </button>
                )}
                {(isHost || p.guest_id === me?.id) && (
                  <button onClick={() => remove('performances', { id: p.id })} aria-label="Remove from lineup" className="rounded-full p-1.5 text-muted hover:bg-blush/50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={register} className="card space-y-3 p-5">
        <h3 className="flex items-center gap-2 font-heading text-xl text-primary"><Mic size={19} className="text-gold" /> Register a performance</h3>
        <input className="input" placeholder="Your name / group name" value={performer} onChange={(e) => setPerformer(e.target.value)} maxLength={80} aria-label="Your name or group name" />
        <input className="input" placeholder="Song title (optional)" value={song} onChange={(e) => setSong(e.target.value)} maxLength={120} aria-label="Song title (optional)" />
        {audio ? (
          <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-blush/40 px-3 py-2.5 text-[15px]">
            <AudioLines size={16} className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate">{audio.name}</span>
            <button type="button" onClick={() => setAudio(null)} aria-label="Remove track" className="rounded-full p-1 hover:bg-blush"><X size={16} /></button>
          </div>
        ) : (
          <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
            <Plus size={15} /> Add audio track (optional)
          </button>
        )}
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
        <button className="btn-gold w-full" disabled={busy || !performer.trim()}>
          {busy && <Loader2 size={15} className="animate-spin" />} Register performance
        </button>
      </form>
    </div>
  );
}
