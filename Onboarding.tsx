'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/app';
import { isDemo } from '@/lib/db';
import type { Side } from '@/lib/defaults';
import { fmtLongDay } from '@/lib/format';
import { Motif } from './ui';

export function Onboarding() {
  const { wedding, signIn } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [side, setSide] = useState<Side | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (f?: File | null) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name so other guests can find you.');
    if (!side) return setError('Choose whether you’re on the bride’s side or the groom’s side.');
    setBusy(true);
    setError(null);
    try {
      await signIn({ name, phone, code, side, photo });
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="relative h-[38dvh] min-h-[260px] w-full">
        <img src={wedding.heroUrl} alt={`${wedding.bride} and ${wedding.groom}`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-page" />
      </div>
      <div className="relative -mt-6 px-5 text-center">
        <p className="font-script text-[clamp(2.8rem,13vw,4.5rem)] leading-none text-primary">
          {wedding.bride} <span className="text-gold">&amp;</span> {wedding.groom}
        </p>
        <p className="mt-2 text-[15px] text-muted">{fmtLongDay(wedding.date)}</p>
      </div>

      <form onSubmit={submit} className="relative mx-auto w-full max-w-md px-5 pb-12">
        <Motif className="-right-16 top-20 w-72" />
        <h1 className="mt-6 text-center font-heading text-2xl text-primary">Join the celebration</h1>
        <p className="mb-6 text-center text-[15px] text-muted">Sign in once to see the itinerary, share photos and chat with everyone.</p>

        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-gold bg-blush/50 text-primary"
            aria-label="Take a profile photo"
          >
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Camera size={26} />}
          </button>
          <div className="flex flex-col gap-2">
            <p className="text-[15px] text-ink">Profile photo <span className="text-muted">(optional)</span></p>
            <div className="flex gap-2">
              <button type="button" className="pill py-1.5 text-[13px]" onClick={() => cameraRef.current?.click()}>
                <Camera size={15} /> Take selfie
              </button>
              <button type="button" className="pill py-1.5 text-[13px]" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={15} /> Upload
              </button>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <label className="mb-4 block">
          <span className="label mb-1.5 block">Your name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} placeholder="e.g. Simran Kaur" />
        </label>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label mb-1.5 block">Phone</span>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="Optional" />
          </label>
          <label className="block">
            <span className="label mb-1.5 block">Invite code</span>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" placeholder="Optional" />
          </label>
        </div>

        <fieldset className="mb-6">
          <legend className="label mb-2">I’m here from the</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['bride', 'groom'] as Side[]).map((s) => (
              <button
                type="button"
                key={s}
                aria-pressed={side === s}
                onClick={() => setSide(s)}
                className={`rounded-2xl border-2 px-3 py-4 text-center transition ${
                  side === s ? 'border-primary bg-primary text-on-primary' : 'border-gold/40 bg-card text-ink hover:border-gold'
                }`}
              >
                <span className="block font-script text-3xl">{s === 'bride' ? wedding.bride : wedding.groom}</span>
                <span className="mt-1 block text-[12px] font-semibold uppercase tracking-[0.16em] opacity-80">
                  {s === 'bride' ? 'Bride’s side' : 'Groom’s side'}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="mb-4 rounded-xl bg-blush/70 px-4 py-3 text-[15px] text-primary">{error}</p>}

        <button type="submit" disabled={busy} className="btn-gold w-full py-3.5">
          {busy && <Loader2 size={16} className="animate-spin" />} Enter the celebration
        </button>

        {isDemo && (
          <p className="mt-4 text-center text-[13px] text-muted">
            Demo mode: data stays in this browser. Use invite code <b>{process.env.NEXT_PUBLIC_DEMO_HOST_CODE || 'HOST2027'}</b> to try host tools.
          </p>
        )}
      </form>
    </main>
  );
}
