'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { seedDemo } from './seed';

/**
 * One tiny data API used by every screen:
 *   useTable(table)              live rows (re-fetched on any realtime change)
 *   insert / upsert / update / remove
 *   uploadFile(folder, blob)     returns a public URL
 *
 * With Supabase env vars set, it talks to Supabase (Postgres + Realtime +
 * Storage). Without them it runs in DEMO MODE: rows live in localStorage and
 * sync across tabs of the same browser via BroadcastChannel, so the whole app
 * can be clicked through before any backend exists.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isDemo = !URL || !KEY;
export const supabase: SupabaseClient | null = isDemo ? null : createClient(URL!, KEY!);

export type Row = Record<string, any>;
type Match = Record<string, any>;

// ── demo storage ─────────────────────────────────────────────────────────────
const LS = 'wedding-demo:';
const listeners = new Map<string, Set<() => void>>();
let channel: BroadcastChannel | null = null;

function getChannel() {
  if (channel || typeof window === 'undefined' || !('BroadcastChannel' in window)) return channel;
  channel = new BroadcastChannel('wedding-demo');
  channel.onmessage = (e) => listeners.get(e.data)?.forEach((fn) => fn());
  return channel;
}

export function readLocal(table: string): Row[] {
  if (typeof window === 'undefined') return [];
  seedDemo(writeRaw);
  try {
    return JSON.parse(localStorage.getItem(LS + table) || '[]');
  } catch {
    return [];
  }
}

function writeRaw(table: string, rows: Row[]) {
  localStorage.setItem(LS + table, JSON.stringify(rows));
}

function writeLocal(table: string, rows: Row[]) {
  try {
    writeRaw(table, rows);
  } catch {
    throw new Error('This browser’s demo storage is full. Connect Supabase to store real photos and audio.');
  }
  listeners.get(table)?.forEach((fn) => fn());
  getChannel()?.postMessage(table);
}

const matches = (row: Row, m: Match) => Object.entries(m).every(([k, v]) => row[k] === v);

// ── reads ────────────────────────────────────────────────────────────────────
type Opts = { order?: string; ascending?: boolean; limit?: number; refreshKey?: unknown };

export function useTable<T = Row>(table: string, opts: Opts = {}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { order = 'created_at', ascending = true, limit, refreshKey } = opts;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      let data: Row[] = [];
      if (supabase) {
        // Newest-first + limit keeps long chats light; we flip back afterwards.
        let q = supabase.from(table).select('*');
        if (order) q = q.order(order, { ascending: limit ? false : ascending });
        if (limit) q = q.limit(limit);
        const res = await q;
        if (res.error) {
          console.warn(`[${table}]`, res.error.message);
          if (alive) setLoading(false);
          return;
        }
        data = res.data ?? [];
        if (limit && ascending) data = data.reverse();
      } else {
        data = [...readLocal(table)];
        if (order) data.sort((a, b) => (a[order] > b[order] ? 1 : a[order] < b[order] ? -1 : 0) * (ascending ? 1 : -1));
        if (limit) data = ascending ? data.slice(-limit) : data.slice(0, limit);
      }
      if (alive) {
        setRows(data as T[]);
        setLoading(false);
      }
    };

    // Bursts of realtime events (e.g. ten likes at once) collapse into one fetch.
    const schedule = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 120);
    };

    load();

    if (supabase) {
      const ch = supabase
        .channel(`rt:${table}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
        .subscribe();
      return () => {
        alive = false;
        clearTimeout(timer.current);
        supabase.removeChannel(ch);
      };
    }

    getChannel();
    const set = listeners.get(table) ?? new Set();
    set.add(schedule);
    listeners.set(table, set);
    return () => {
      alive = false;
      clearTimeout(timer.current);
      set.delete(schedule);
    };
  }, [table, order, ascending, limit, refreshKey]);

  return { rows, loading };
}

// ── writes ───────────────────────────────────────────────────────────────────
const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function insert(table: string, row: Row): Promise<Row> {
  if (supabase) {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    fail(error);
    return data;
  }
  const full = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
  writeLocal(table, [...readLocal(table), full]);
  return full;
}

export async function upsert(table: string, row: Row, keys: string[]) {
  if (supabase) {
    const { error } = await supabase.from(table).upsert(row, { onConflict: keys.join(',') });
    fail(error);
    return;
  }
  const key = Object.fromEntries(keys.map((k) => [k, row[k]]));
  const rows = readLocal(table);
  const i = rows.findIndex((r) => matches(r, key));
  if (i >= 0) rows[i] = { ...rows[i], ...row };
  else rows.push({ created_at: new Date().toISOString(), ...row });
  writeLocal(table, rows);
}

export async function update(table: string, match: Match, patch: Row) {
  if (supabase) {
    const { error } = await supabase.from(table).update(patch).match(match);
    fail(error);
    return;
  }
  writeLocal(
    table,
    readLocal(table).map((r) => (matches(r, match) ? { ...r, ...patch } : r)),
  );
}

export async function remove(table: string, match: Match) {
  if (supabase) {
    const { error } = await supabase.from(table).delete().match(match);
    fail(error);
    return;
  }
  writeLocal(
    table,
    readLocal(table).filter((r) => !matches(r, match)),
  );
}

// ── files ────────────────────────────────────────────────────────────────────
const DEMO_FILE_LIMIT = 2.5 * 1024 * 1024;

export const blobToDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(blob);
  });

export async function uploadFile(folder: string, blob: Blob, filename: string) {
  const safe = filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60) || 'file';
  if (supabase) {
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage
      .from('media')
      .upload(path, blob, { contentType: blob.type || undefined, cacheControl: '31536000' });
    fail(error);
    return { url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl, path };
  }
  if (blob.size > DEMO_FILE_LIMIT) {
    throw new Error('Demo mode keeps files under 2.5 MB. Connect Supabase to upload larger files.');
  }
  return { url: await blobToDataURL(blob), path: safe };
}

/** A link that downloads instead of opening the image in a new tab. */
export function downloadHref(url: string, filename: string) {
  if (url.startsWith('data:') || !supabase) return url;
  return `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(filename)}`;
}

/** Downscale a camera photo before upload: faster on wedding-venue Wi-Fi. */
export async function compressImage(file: File, maxSide = isDemo ? 900 : 1800, quality = isDemo ? 0.72 : 0.86) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    return { blob: blob ?? file, canvas };
  } catch {
    return { blob: file as Blob, canvas: null };
  }
}
