'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Hash, Heart, Images, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useApp } from '@/lib/app';
import { compressImage, downloadHref, insert, remove, update, uploadFile, useTable } from '@/lib/db';
import { describeFaces, photoMatches } from '@/lib/face';
import { fmtStamp, parseTags } from '@/lib/format';
import { Empty } from '../ui';

type Photo = {
  id: string; uploader_id: string; uploader_name: string; url: string; path?: string;
  event_id?: string | null; hashtags: string[]; faces?: number[][] | null; created_at: string;
};
type Like = { photo_id: string; guest_id: string };

export function Photos() {
  const { me, events, isHost, toast } = useApp();
  const { rows: photos } = useTable<Photo>('photos', { ascending: false });
  const { rows: likes } = useTable<Like>('photo_likes');

  const [eventForUpload, setEventForUpload] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [view, setView] = useState<'all' | 'mine'>('all');
  const [open, setOpen] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const eventName = (id?: string | null) => events.find((e) => e.id === id)?.name;

  const likeCount = useMemo(() => {
    const m = new Map<string, number>();
    likes.forEach((l) => m.set(l.photo_id, (m.get(l.photo_id) ?? 0) + 1));
    return m;
  }, [likes]);
  const liked = useMemo(() => new Set(likes.filter((l) => l.guest_id === me?.id).map((l) => l.photo_id)), [likes, me?.id]);

  const visible = useMemo(() => {
    const needle = tagQuery.trim().toLowerCase().replace(/^#+/, '');
    return photos.filter((p) => {
      if (eventFilter !== 'all' && p.event_id !== eventFilter) return false;
      if (needle && !p.hashtags?.some((t) => t.includes(needle))) return false;
      if (view === 'mine' && p.uploader_id !== me?.id && !photoMatches(p.faces, me?.face_descriptor)) return false;
      return true;
    });
  }, [photos, tagQuery, eventFilter, view, me]);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !me) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 20);
    setUploading({ done: 0, total: list.length });
    let ok = 0;
    for (const file of list) {
      try {
        const { blob, canvas } = await compressImage(file);
        const { url, path } = await uploadFile('photos', blob, file.name.replace(/\.\w+$/, '') + '.jpg');
        const row = await insert('photos', {
          uploader_id: me.id,
          uploader_name: me.name,
          url,
          path,
          event_id: eventForUpload || null,
          hashtags: parseTags(tags),
        });
        ok++;
        // Find faces in the background so "My photos" can match guests later.
        describeFaces(canvas ?? blob)
          .then((faces) => faces.length && update('photos', { id: row.id }, { faces }))
          .catch(() => {});
      } catch (e: any) {
        toast(e?.message || `Couldn’t upload ${file.name}.`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (ok) toast(ok === 1 ? 'Photo added to the gallery.' : `${ok} photos added to the gallery.`);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleLike = async (p: Photo) => {
    if (!me) return;
    try {
      if (liked.has(p.id)) await remove('photo_likes', { photo_id: p.id, guest_id: me.id });
      else await insert('photo_likes', { photo_id: p.id, guest_id: me.id });
    } catch {
      /* a double-tap race; the realtime refresh fixes the count */
    }
  };

  const deletePhoto = async (p: Photo) => {
    await remove('photos', { id: p.id });
    setOpen(null);
    toast('Photo deleted.');
  };

  return (
    <div>
      <section className="card mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="label mb-1.5 block">Which event is this from?</span>
            <select className="input" value={eventForUpload} onChange={(e) => setEventForUpload(e.target.value)}>
              <option value="">Not sure / skip</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label mb-1.5 block">Add hashtags, space separated</span>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. reception dance" />
          </label>
        </div>
        <button className="btn-gold mt-4 w-full" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Uploading {uploading.done + 1} of {uploading.total}
            </>
          ) : (
            <>
              <Plus size={16} /> Add photo
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </section>

      <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
        <label className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-11" placeholder="Search by hashtag..." value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} aria-label="Search by hashtag" />
        </label>
        <select className="input w-auto" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} aria-label="Filter by event">
          <option value="all">All photos</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      <div className="segmented mb-2">
        <button aria-pressed={view === 'all'} onClick={() => setView('all')}>All photos</button>
        <button aria-pressed={view === 'mine'} onClick={() => setView('mine')}>My photos</button>
      </div>
      <p className="mb-5 text-center text-[13px] text-muted">
        {view === 'mine'
          ? me?.face_descriptor
            ? 'Photos you uploaded plus photos your face appears in.'
            : 'Photos you uploaded. Scan a selfie in Guests to also find photos you appear in.'
          : `${visible.length} photo${visible.length === 1 ? '' : 's'}`}
      </p>

      {visible.length === 0 ? (
        <Empty icon={<Images size={28} />} title={photos.length ? 'No photos match' : 'The gallery is waiting'}>
          {photos.length ? 'Try another hashtag or event.' : 'Be the first to add a photo from the celebrations.'}
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              <button className="block w-full" onClick={() => setOpen(p)} aria-label={`Open photo by ${p.uploader_name}`}>
                <img src={p.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              </button>
              <div className="flex items-center justify-between px-2.5 py-2">
                <button
                  onClick={() => toggleLike(p)}
                  aria-pressed={liked.has(p.id)}
                  aria-label={liked.has(p.id) ? 'Unlike' : 'Like'}
                  className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[14px] text-primary hover:bg-blush/50"
                >
                  <Heart size={17} className={liked.has(p.id) ? 'fill-primary' : ''} />
                  {likeCount.get(p.id) ?? 0}
                </button>
                <a
                  href={downloadHref(p.url, `wedding-${p.id.slice(0, 8)}.jpg`)}
                  download={`wedding-${p.id.slice(0, 8)}.jpg`}
                  className="rounded-full p-1.5 text-muted hover:bg-blush/50 hover:text-primary"
                  aria-label="Download photo"
                >
                  <Download size={17} />
                </a>
              </div>
              {(p.hashtags?.length > 0 || p.event_id) && (
                <p className="truncate px-3 pb-2.5 text-[12px] text-muted">
                  {eventName(p.event_id) && <span className="font-semibold text-gold">{eventName(p.event_id)} </span>}
                  {p.hashtags?.map((t) => `#${t}`).join(' ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-4 text-white" style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}>
              <div className="text-[14px]">
                <p className="font-semibold">{open.uploader_name}</p>
                <p className="opacity-70">{fmtStamp(open.created_at)}{eventName(open.event_id) ? ` · ${eventName(open.event_id)}` : ''}</p>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close photo" className="rounded-full p-2 hover:bg-white/10">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center p-3" onClick={() => setOpen(null)}>
              <img src={open.url} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-6 text-white">
              {open.hashtags?.map((t) => (
                <span key={t} className="flex items-center text-[14px] opacity-80"><Hash size={13} />{t}</span>
              ))}
              {(open.uploader_id === me?.id || isHost) && (
                <button className="btn border border-white/40 text-white" onClick={() => deletePhoto(open)}>
                  <Trash2 size={15} /> Delete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
