'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Heart, ListMusic, Loader2, Music, Search, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/app';
import { insert, remove, update, useTable } from '@/lib/db';
import { Empty } from '../ui';
import { searchSongs, type SongResult } from '@/lib/songSearch';

type Song = { id: string; requester_id: string; requester_name: string; title: string; artist?: string | null; artwork_url?: string | null; played?: boolean; created_at: string };
type Vote = { song_id: string; guest_id: string };
type Result = SongResult;

export function Songs() {
  const { me, isHost, toast } = useApp();
  const { rows: songs } = useTable<Song>('songs');
  const { rows: votes } = useTable<Vote>('song_votes');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [artwork, setArtwork] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [busy, setBusy] = useState(false);
  const picked = useRef(false);

  // Debounced catalogue search; typing your own title still works if nothing matches.
  useEffect(() => {
    if (picked.current) {
      picked.current = false;
      return;
    }
    setArtwork(null);
    const q = title.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const found = await searchSongs(q, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setResults(found);
        setShowResults(true);
      } catch {
        /* offline or aborted: free-text request still works */
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
      setSearching(false);
    };
  }, [title]);

  const voteCount = useMemo(() => {
    const m = new Map<string, number>();
    votes.forEach((v) => m.set(v.song_id, (m.get(v.song_id) ?? 0) + 1));
    return m;
  }, [votes]);
  const mine = useMemo(() => new Set(votes.filter((v) => v.guest_id === me?.id).map((v) => v.song_id)), [votes, me?.id]);

  const queue = useMemo(
    () =>
      [...songs].sort(
        (a, b) => Number(!!a.played) - Number(!!b.played) || (voteCount.get(b.id) ?? 0) - (voteCount.get(a.id) ?? 0) || a.created_at.localeCompare(b.created_at),
      ),
    [songs, voteCount],
  );

  const choose = (r: Result) => {
    picked.current = true;
    setTitle(r.title);
    setArtist(r.artist);
    setArtwork(r.artwork);
    setShowResults(false);
  };

  const vote = async (s: Song) => {
    if (!me) return;
    try {
      if (mine.has(s.id)) await remove('song_votes', { song_id: s.id, guest_id: me.id });
      else await insert('song_votes', { song_id: s.id, guest_id: me.id });
    } catch {
      /* duplicate tap; realtime refresh corrects the count */
    }
  };

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !me) return;
    const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();
    const existing = songs.find((s) => norm(s.title) === norm(title) && norm(s.artist) === norm(artist) && !s.played);
    setBusy(true);
    try {
      if (existing) {
        if (!mine.has(existing.id)) await insert('song_votes', { song_id: existing.id, guest_id: me.id });
        toast('Already in the queue, so we added your vote.');
      } else {
        const row = await insert('songs', {
          requester_id: me.id,
          requester_name: me.name,
          title: title.trim(),
          artist: artist.trim() || null,
          artwork_url: artwork,
        });
        await insert('song_votes', { song_id: row.id, guest_id: me.id });
        toast('Requested. Get others to heart it to move it up.');
      }
      setTitle('');
      setArtist('');
      setArtwork(null);
      setResults([]);
    } catch (err: any) {
      toast(err?.message || 'Request not sent. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form onSubmit={request} className="card relative mb-6 space-y-3 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="input pl-11 pr-10"
            placeholder="Search a song, or type your own"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => results.length && setShowResults(true)}
            aria-label="Song title"
            autoComplete="off"
          />
          {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
          {showResults && results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gold/40 bg-card shadow-xl">
              {results.map((r, i) => (
                <li key={i}>
                  <button type="button" onClick={() => choose(r)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-blush/50">
                    {r.artwork ? <img src={r.artwork} alt="" className="h-10 w-10 rounded-md object-cover" /> : <Music size={20} />}
                    <span className="min-w-0">
                      <span className="block truncate text-[15px]">{r.title}</span>
                      <span className="block truncate text-[13px] text-muted">{r.artist}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input className="input" placeholder="Artist (optional)" value={artist} onChange={(e) => setArtist(e.target.value)} onFocus={() => setShowResults(false)} aria-label="Artist (optional)" />
        <button className="btn-gold w-full" disabled={busy || !title.trim()}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Music size={15} />} Request song
        </button>
      </form>

      <h3 className="mb-3 flex items-center gap-2 font-heading text-lg text-primary">
        <ListMusic size={18} className="text-gold" /> DJ queue
      </h3>
      {queue.length === 0 ? (
        <Empty icon={<Music size={28} />} title="The dance floor needs you">Request the first song of the night.</Empty>
      ) : (
        <ol className="space-y-2.5">
          {queue.map((s, i) => (
            <li key={s.id} className={`card flex items-center gap-3 p-2.5 pr-3 ${s.played ? 'opacity-55' : ''}`}>
              <span className="w-5 text-center font-heading text-[15px] text-muted">{s.played ? '' : i + 1}</span>
              {s.artwork_url ? (
                <img src={s.artwork_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-gold text-on-primary">
                  <Music size={22} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">{s.title}</p>
                <p className="truncate text-[14px] text-muted">{s.artist || 'Artist not given'}</p>
                <div className="flex flex-wrap items-center gap-x-3 text-[12px] text-muted">
                  <span className="truncate">{s.played ? 'Played' : `Requested by ${s.requester_id === me?.id ? 'you' : s.requester_name}`}</span>
                  {isHost && !s.played && (
                    <button onClick={() => update('songs', { id: s.id }, { played: true })} className="flex items-center gap-1 font-semibold text-primary">
                      <Check size={13} /> Played
                    </button>
                  )}
                  {(isHost || s.requester_id === me?.id) && (
                    <button onClick={() => remove('songs', { id: s.id })} className="flex items-center gap-1 font-semibold text-primary">
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => vote(s)}
                aria-pressed={mine.has(s.id)}
                aria-label={mine.has(s.id) ? 'Remove your vote' : 'Vote this song up'}
                className={`flex min-w-[52px] flex-col items-center rounded-xl px-2 py-1.5 transition ${mine.has(s.id) ? 'bg-primary text-on-primary' : 'bg-blush/60 text-primary'}`}
              >
                <Heart size={17} className={mine.has(s.id) ? 'fill-current' : ''} />
                <span className="text-[13px] font-semibold">{voteCount.get(s.id) ?? 0}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
