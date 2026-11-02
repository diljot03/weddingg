'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from '@/lib/app';
import { Onboarding } from '@/components/Onboarding';
import { Hero, InvitationCard, QuickTimings } from '@/components/Cover';
import { TABS, TabBar, type Tab } from '@/components/TabBar';
import { InstallBanner } from '@/components/InstallBanner';
import { HostStudio } from '@/components/HostStudio';
import { Details } from '@/components/tabs/Details';
import { Guests } from '@/components/tabs/Guests';
import { Photos } from '@/components/tabs/Photos';
import { Chat } from '@/components/tabs/Chat';
import { Songs } from '@/components/tabs/Songs';
import { LogisticsTab } from '@/components/tabs/Logistics';
import { Sangeet } from '@/components/tabs/Sangeet';
import { GamesTab } from '@/components/tabs/Games';

export default function Page() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const { ready, me } = useApp();
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span className="animate-pulse font-script text-5xl text-primary">Welcome</span>
      </div>
    );
  }
  return me ? <Home /> : <Onboarding />;
}

function Home() {
  const [tab, setTab] = useState<Tab>('details');
  const [focusEvent, setFocusEvent] = useState<string | null>(null);
  const [studio, setStudio] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Keep the open tab in the address bar so a link like /#photos opens it.
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1) as Tab;
      if (TABS.includes(h)) setTab(h);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const go = useCallback((t: Tab) => {
    setTab(t);
    history.replaceState(null, '', `#${t}`);
    const top = navRef.current?.getBoundingClientRect().top ?? 0;
    if (top > 0 || top < -1) navRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const panels: Record<Tab, React.ReactNode> = {
    details: <Details focusId={focusEvent} />,
    guests: <Guests />,
    photos: <Photos />,
    chat: <Chat />,
    songs: <Songs />,
    logistics: <LogisticsTab />,
    sangeet: <Sangeet />,
    games: <GamesTab />,
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl">
      <Hero onOpenStudio={() => setStudio(true)} />
      <QuickTimings
        onSelect={(id) => {
          setFocusEvent(id);
          go('details');
        }}
      />
      <InvitationCard />

      <div ref={navRef} className="mt-8" />
      <TabBar active={tab} onChange={go} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={tab}
          role="tabpanel"
          className="min-h-[70dvh] px-4 pb-10 pt-6"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {panels[tab]}
        </motion.main>
      </AnimatePresence>

      <InstallBanner />
      <HostStudio open={studio} onClose={() => setStudio(false)} />
    </div>
  );
}
