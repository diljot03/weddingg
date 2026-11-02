'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { compressImage, isDemo, readLocal, remove, supabase, update, uploadFile, upsert, useTable } from './db';
import {
  DEFAULT_EVENTS, DEFAULT_GAMES, DEFAULT_LOGISTICS, DEFAULT_THEME, DEFAULT_WEDDING,
  type Games, type Logistics, type Side, type ThemeChoice, type WeddingEvent, type WeddingInfo,
} from './defaults';
import { applyTheme } from './themes';
import { describeFaces } from './face';

export type Guest = {
  id: string;
  name: string;
  phone?: string | null;
  side: Side;
  avatar_url?: string | null;
  face_descriptor?: number[] | null;
  role: 'guest' | 'host';
  created_at?: string;
};

type SignInInput = { name: string; phone?: string; code?: string; side: Side; photo?: File | null };

type AppState = {
  ready: boolean;
  me: Guest | null;
  isHost: boolean;
  guests: Guest[];
  wedding: WeddingInfo;
  events: WeddingEvent[];
  logistics: Logistics;
  games: Games;
  theme: ThemeChoice;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateMe: (patch: Partial<Guest>) => Promise<void>;
  scanSelfie: (file: File) => Promise<boolean>;
  saveSetting: (key: string, value: unknown) => Promise<void>;
  toast: (message: string) => void;
};

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
};

const ME_KEY = 'wedding-demo:me';
const DEMO_HOST_CODE = process.env.NEXT_PUBLIC_DEMO_HOST_CODE || 'HOST2027';

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [authKey, setAuthKey] = useState(0);
  const [localMe, setLocalMe] = useState<Guest | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { rows: guests } = useTable<Guest>('guests', { refreshKey: authKey });
  const { rows: settingRows } = useTable<{ key: string; value: any }>('settings', { order: 'key', refreshKey: authKey });

  // Restore an existing session.
  useEffect(() => {
    (async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user.id;
        if (uid) {
          const { data: row } = await supabase.from('guests').select('*').eq('id', uid).maybeSingle();
          if (row) {
            setMyId(uid);
            setLocalMe(row as Guest);
          }
        }
      } else {
        const id = localStorage.getItem(ME_KEY);
        const row = id && readLocal('guests').find((g) => g.id === id);
        if (row) {
          setMyId(id);
          setLocalMe(row as Guest);
        }
      }
      setReady(true);
    })();
  }, []);

  const me = useMemo(() => guests.find((g) => g.id === myId) ?? (myId ? localMe : null), [guests, myId, localMe]);

  const setting = useCallback(
    <T,>(key: string, fallback: T): T => settingRows.find((r) => r.key === key)?.value ?? fallback,
    [settingRows],
  );
  const wedding = useMemo(() => ({ ...DEFAULT_WEDDING, ...setting('wedding', {}) }), [setting]);
  const events = useMemo(() => setting<WeddingEvent[]>('events', DEFAULT_EVENTS), [setting]);
  const logistics = useMemo(() => ({ ...DEFAULT_LOGISTICS, ...setting('logistics', {}) }), [setting]);
  const games = useMemo(() => ({ ...DEFAULT_GAMES, ...setting('games', {}) }), [setting]);
  const theme = useMemo(() => ({ ...DEFAULT_THEME, ...setting('theme', {}) }), [setting]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg((m) => (m === message ? null : m)), 3200);
  }, []);

  const learnFace = useCallback(async (id: string, canvas: HTMLCanvasElement | null, blob: Blob) => {
    try {
      const faces = await describeFaces(canvas ?? blob);
      if (faces.length) await update('guests', { id }, { face_descriptor: faces[0] });
      return faces.length > 0;
    } catch (e) {
      console.warn('Face scan skipped', e);
      return false;
    }
  }, []);

  const signIn = useCallback(
    async ({ name, phone, code, side, photo }: SignInInput) => {
      let uid: string;
      if (supabase) {
        let { data } = await supabase.auth.getSession();
        if (!data.session) {
          const res = await supabase.auth.signInAnonymously();
          if (res.error) {
            throw new Error(
              /anonymous/i.test(res.error.message)
                ? 'Guest sign-in is switched off. Hosts: enable Anonymous sign-ins in Supabase.'
                : res.error.message,
            );
          }
          data = { session: res.data.session! };
        }
        uid = data.session!.user.id;
      } else {
        uid = localStorage.getItem(ME_KEY) || crypto.randomUUID();
      }

      const row: Record<string, any> = { id: uid, name: name.trim(), phone: phone?.trim() || null, side };
      let shot: Awaited<ReturnType<typeof compressImage>> | null = null;
      if (photo) {
        shot = await compressImage(photo, 640, 0.82);
        row.avatar_url = (await uploadFile('avatars', shot.blob, `${uid}.jpg`)).url;
      }
      await upsert('guests', isDemo ? { role: 'guest', ...row } : row, ['id']);

      const trimmed = code?.trim();
      let host = false;
      if (trimmed) {
        if (supabase) {
          const { data } = await supabase.rpc('claim_host', { code: trimmed });
          host = data === true;
        } else if (trimmed === DEMO_HOST_CODE) {
          await update('guests', { id: uid }, { role: 'host' });
          host = true;
        }
      }

      if (!supabase) localStorage.setItem(ME_KEY, uid);
      const fresh = supabase
        ? (await supabase.from('guests').select('*').eq('id', uid).single()).data
        : readLocal('guests').find((g) => g.id === uid);
      setLocalMe(fresh as Guest);
      setMyId(uid);
      setAuthKey((k) => k + 1);
      toast(host ? `Welcome, ${name.split(' ')[0]}. Host tools are on.` : `Welcome, ${name.split(' ')[0]}!`);

      if (shot) learnFace(uid, shot.canvas, shot.blob); // background; enables "My photos"
    },
    [toast, learnFace],
  );

  const signOut = useCallback(async () => {
    if (myId) await remove('guests', { id: myId }).catch(() => {});
    if (supabase) await supabase.auth.signOut();
    else localStorage.removeItem(ME_KEY);
    setMyId(null);
    setLocalMe(null);
    setAuthKey((k) => k + 1);
  }, [myId]);

  const updateMe = useCallback(
    async (patch: Partial<Guest>) => {
      if (!myId) return;
      await update('guests', { id: myId }, patch);
      setLocalMe((m) => (m ? { ...m, ...patch } : m));
    },
    [myId],
  );

  const scanSelfie = useCallback(
    async (file: File) => {
      if (!myId) return false;
      const shot = await compressImage(file, 640, 0.82);
      const { url } = await uploadFile('avatars', shot.blob, `${myId}.jpg`);
      await update('guests', { id: myId }, { avatar_url: url });
      setLocalMe((m) => (m ? { ...m, avatar_url: url } : m));
      return learnFace(myId, shot.canvas, shot.blob);
    },
    [myId, learnFace],
  );

  const saveSetting = useCallback(async (key: string, value: unknown) => {
    await upsert('settings', { key, value, updated_at: new Date().toISOString() }, ['key']);
  }, []);

  const value: AppState = {
    ready, me, isHost: me?.role === 'host', guests, wedding, events, logistics, games, theme,
    signIn, signOut, updateMe, scanSelfie, saveSetting, toast,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
        {toastMsg && (
          <div className="pointer-events-auto rounded-full bg-ink px-5 py-2.5 text-sm text-page shadow-lg">{toastMsg}</div>
        )}
      </div>
    </Ctx.Provider>
  );
}

