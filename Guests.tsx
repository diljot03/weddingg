'use client';

import { useMemo, useRef, useState } from 'react';
import { Loader2, ScanFace, Search, Users } from 'lucide-react';
import { useApp } from '@/lib/app';
import type { Side } from '@/lib/defaults';
import { Avatar, Empty, SideBadge } from '../ui';

export function Guests() {
  const { me, guests, scanSelfie, toast } = useApp();
  const [q, setQ] = useState('');
  const [side, setSide] = useState<'all' | Side>('all');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guests
      .filter((g) => (side === 'all' || g.side === side) && (!needle || g.name.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [guests, q, side]);

  const counts = { bride: guests.filter((g) => g.side === 'bride').length, groom: guests.filter((g) => g.side === 'groom').length };

  const onSelfie = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const found = await scanSelfie(file);
      toast(found ? 'Photo updated. “My photos” will now find you.' : 'Photo updated. No clear face found, so photo matching is off.');
    } catch (e: any) {
      toast(e?.message || 'Couldn’t update your photo. Try again.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!me) return null;

  return (
    <div>
      <div className="card mb-5 flex items-center gap-4 p-4">
        <Avatar name={me.name} url={me.avatar_url} size={64} ring />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg text-primary">{me.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <SideBadge side={me.side} />
            {me.face_descriptor && <span className="text-[12px] text-muted">Face matching on</span>}
          </div>
        </div>
        <button className="btn-gold shrink-0 px-3.5 text-[11px]" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ScanFace size={15} />}
          {me.avatar_url ? 'Change photo' : 'Scan selfie'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => onSelfie(e.target.files?.[0])} />
      </div>

      <label className="relative mb-3 block">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input className="input pl-11" placeholder="Search guests by name..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search guests by name" />
      </label>

      <div className="segmented mb-5">
        <button aria-pressed={side === 'all'} onClick={() => setSide('all')}>All {guests.length}</button>
        <button aria-pressed={side === 'bride'} onClick={() => setSide('bride')}>Bride {counts.bride}</button>
        <button aria-pressed={side === 'groom'} onClick={() => setSide('groom')}>Groom {counts.groom}</button>
      </div>

      {list.length === 0 ? (
        <Empty icon={<Users size={28} />} title="No one by that name yet">Guests appear here as soon as they sign in.</Empty>
      ) : (
        <ul className="card divide-y divide-gold/20">
          {list.map((g) => (
            <li key={g.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={g.name} url={g.avatar_url} size={44} />
              <span className="min-w-0 flex-1 truncate text-[16px]">
                {g.name}
                {g.id === me.id && <span className="ml-2 text-[13px] text-muted">(you)</span>}
                {g.role === 'host' && <span className="ml-2 text-[13px] text-gold">Host</span>}
              </span>
              <SideBadge side={g.side} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
