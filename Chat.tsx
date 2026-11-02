'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Megaphone, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/app';
import { insert, remove, useTable } from '@/lib/db';
import { fmtStamp } from '@/lib/format';
import { Avatar, Empty } from '../ui';

type Announcement = { id: string; title: string; body: string; author_name?: string; created_at: string };
type Message = { id: string; sender_id: string; sender_name: string; sender_avatar?: string | null; side?: string; body: string; created_at: string };

export function Chat() {
  const [view, setView] = useState<'announcements' | 'chat'>('announcements');
  return (
    <div>
      <div className="segmented mb-5">
        <button aria-pressed={view === 'announcements'} onClick={() => setView('announcements')}>Announcements</button>
        <button aria-pressed={view === 'chat'} onClick={() => setView('chat')}>Group chat</button>
      </div>
      {view === 'announcements' ? <Announcements /> : <GroupChat />}
    </div>
  );
}

function Announcements() {
  const { isHost, me, toast } = useApp();
  const { rows } = useTable<Announcement>('announcements', { ascending: false });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await insert('announcements', { title: title.trim(), body: body.trim(), author_name: me?.name });
      setTitle('');
      setBody('');
      toast('Announcement posted to every guest.');
    } catch (err: any) {
      toast(err?.message || 'Couldn’t post. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {isHost && (
        <form onSubmit={post} className="card mb-5 space-y-3 border-dashed p-4">
          <p className="label !text-primary">Post as host</p>
          <input className="input" placeholder="Headline, e.g. Venue room change" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} />
          <textarea className="input min-h-[90px]" placeholder="What should every guest know?" value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} />
          <button className="btn-primary w-full" disabled={busy || !title.trim() || !body.trim()}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />} Post announcement
          </button>
        </form>
      )}

      {rows.length === 0 ? (
        <Empty icon={<Megaphone size={28} />} title="No announcements yet">Menu updates, room changes and timing alerts from the hosts will appear here.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card relative overflow-hidden p-4 pl-5">
              <span className="absolute inset-y-0 left-0 w-1 bg-gold" aria-hidden />
              <div className="flex items-start gap-3">
                <Megaphone size={18} className="mt-1 shrink-0 text-gold" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-[17px] font-semibold text-primary">{a.title}</p>
                  <p className="mt-1 whitespace-pre-line text-[16px]">{a.body}</p>
                  <p className="mt-2 text-[13px] text-muted">{a.author_name ? `${a.author_name} · ` : ''}{fmtStamp(a.created_at)}</p>
                </div>
                {isHost && (
                  <button onClick={() => remove('announcements', { id: a.id })} aria-label="Delete announcement" className="rounded-full p-1.5 text-muted hover:bg-blush/50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GroupChat() {
  const { me, toast } = useApp();
  const { rows, loading } = useTable<Message>('messages', { limit: 300 });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: loading ? 'auto' : 'smooth' });
  }, [rows.length, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !me) return;
    setSending(true);
    try {
      await insert('messages', { sender_id: me.id, sender_name: me.name, sender_avatar: me.avatar_url ?? null, side: me.side, body });
      setText('');
    } catch (err: any) {
      toast(err?.message || 'Message not sent. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex h-[68dvh] flex-col overflow-hidden">
      <div ref={feedRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {rows.length === 0 && !loading && (
          <div className="grid h-full place-items-center text-center text-muted">
            <div>
              <MessageCircle className="mx-auto mb-2 text-gold" />
              Say hello to everyone at the wedding.
            </div>
          </div>
        )}
        {rows.map((m) => {
          const mine = m.sender_id === me?.id;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && <Avatar name={m.sender_name} url={m.sender_avatar} size={30} />}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-blush/60'}`}>
                <p className={`text-[12px] font-semibold uppercase tracking-wider ${mine ? 'text-gold' : 'text-primary'}`}>
                  {mine ? 'You' : m.sender_name}
                  {!mine && m.side && <span className="ml-1.5 font-normal normal-case tracking-normal opacity-70">· {m.side === 'bride' ? 'Bride side' : 'Groom side'}</span>}
                </p>
                <p className="whitespace-pre-line break-words text-[16px] leading-snug">{m.body}</p>
                <p className={`mt-0.5 text-right text-[11px] ${mine ? 'opacity-70' : 'text-muted'}`}>{fmtStamp(m.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-gold/30 bg-page/60 p-3">
        <input className="input flex-1 py-2.5" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} aria-label="Type a message" />
        <button className="btn-gold px-4" disabled={sending || !text.trim()}>
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
        </button>
      </form>
    </div>
  );
}
