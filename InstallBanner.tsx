'use client';

import { useEffect, useState } from 'react';
import { Download, Share, Smartphone, SquarePlus } from 'lucide-react';
import { useApp } from '@/lib/app';
import { Sheet } from './ui';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export function InstallBanner() {
  const { toast } = useApp();
  const [deferred, setDeferred] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState<'ios' | 'other' | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setInstalled(standalone);
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's mini-bar away; our button triggers it
      setDeferred(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === 'accepted') toast('Installed. Find it on your home screen.');
      return;
    }
    setHelp(/iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'other');
  };

  return (
    <footer className="px-4 pb-10">
      <div className="card flex flex-wrap items-center gap-4 bg-blush/40 p-4 sm:flex-nowrap">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-gold">
          <Smartphone size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[18px] text-primary">Get the app</p>
          <p className="text-[15px] leading-snug text-muted">Open it straight from your home screen</p>
        </div>
        <button className="btn-gold w-full shrink-0 sm:w-auto" onClick={install}>
          <Download size={15} /> Download guest app
        </button>
      </div>

      <Sheet open={!!help} onClose={() => setHelp(null)} title="Add to your home screen">
        {help === 'ios' ? (
          <ol className="space-y-3 text-[16px]">
            <li className="flex gap-3"><Share className="shrink-0 text-gold" size={20} /> Tap the Share button in Safari’s toolbar.</li>
            <li className="flex gap-3"><SquarePlus className="shrink-0 text-gold" size={20} /> Choose “Add to Home Screen”, then tap Add.</li>
          </ol>
        ) : (
          <p className="text-[16px]">
            Open your browser menu (⋮ or ⋯) and choose <b>Install app</b> or <b>Add to Home screen</b>. On iPhone, open this page in Safari first.
          </p>
        )}
      </Sheet>
    </footer>
  );
}
