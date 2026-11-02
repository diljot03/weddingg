'use client';
import { useEffect } from 'react';
import { BASE } from '@/lib/base';

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch((e) => console.warn('Service worker not registered', e));
  }, []);
  return null;
}
