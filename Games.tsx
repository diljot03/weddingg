'use client';

import { useMemo, useState } from 'react';
import { Check, Trophy, X } from 'lucide-react';
import { useApp } from '@/lib/app';
import { insert, useTable } from '@/lib/db';
import type { Side } from '@/lib/defaults';
import { SideBadge } from '../ui';

type Answer = { guest_id: string; question_id: string; choice: number; correct: boolean; side: Side; guest_name: string };
type PollVote = { guest_id: string; poll_id: string; option: number };

export function GamesTab() {
  const [view, setView] = useState<'trivia' | 'board' | 'polls'>('trivia');
  const { rows: answers } = useTable<Answer>('trivia_answers');
  return (
    <div>
      <div className="segmented mb-5">
        <button aria-pressed={view === 'trivia'} onClick={() => setView('trivia')}>Trivia</button>
        <button aria-pressed={view === 'board'} onClick={() => setView('board')}>Leaderboard</button>
        <button aria-pressed={view === 'polls'} onClick={() => setView('polls')}>Polls</button>
      </div>
      {view === 'trivia' && <Trivia answers={answers} />}
      {view === 'board' && <Leaderboard answers={answers} />}
      {view === 'polls' && <Polls />}
    </div>
  );
}

function Trivia({ answers }: { answers: Answer[] }) {
  const { me, games, wedding, toast } = useApp();
  const mine = useMemo(() => new Map(answers.filter((a) => a.guest_id === me?.id).map((a) => [a.question_id, a])), [answers, me?.id]);
  const score = [...mine.values()].filter((a) => a.correct).length;

  const answer = async (qid: string, choice: number, correctIdx: number) => {
    if (!me || mine.has(qid)) return;
    const correct = choice === correctIdx;
    try {
      await insert('trivia_answers', { guest_id: me.id, question_id: qid, choice, correct, side: me.side, guest_name: me.name });
      toast(correct ? `Correct! +1 for the ${me.side === 'bride' ? 'bride’s' : 'groom’s'} side.` : 'Not quite. Better luck on the next one.');
    } catch {
      /* already answered on another device */
    }
  };

  return (
    <div>
      <div className="card mb-5 flex items-center justify-between p-4">
        <div>
          <p className="font-heading text-lg text-primary">How well do you know {wedding.bride} &amp; {wedding.groom}?</p>
          <p className="text-[15px] text-muted">Each right answer scores a point for your side.</p>
        </div>
        <div className="text-center">
          <p className="font-heading text-3xl text-primary">{score}</p>
          <p className="text-[12px] text-muted">of {games.trivia.length}</p>
        </div>
      </div>
      <ol className="space-y-4">
        {games.trivia.map((q, n) => {
          const a = mine.get(q.id);
          return (
            <li key={q.id} className="card p-4">
              <p className="mb-3 text-[17px]"><span className="mr-2 font-heading text-gold">{n + 1}.</span>{q.q}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                  const isAnswer = i === q.answer;
                  const chosen = a?.choice === i;
                  const cls = !a
                    ? 'border-gold/40 bg-card hover:border-gold hover:bg-blush/40'
                    : isAnswer
                      ? 'border-gold bg-gold/25 text-ink'
                      : chosen
                        ? 'border-primary/50 bg-blush/60 text-muted line-through'
                        : 'border-gold/20 text-muted';
                  return (
                    <button key={i} disabled={!!a} onClick={() => answer(q.id, i, q.answer)} className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[16px] transition ${cls}`}>
                      {opt}
                      {a && isAnswer && <Check size={16} className="text-primary" />}
                      {a && chosen && !isAnswer && <X size={16} />}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Leaderboard({ answers }: { answers: Answer[] }) {
  const { wedding, me } = useApp();
  const pts = { bride: 0, groom: 0 };
  answers.forEach((a) => a.correct && (pts[a.side] += 1));
  const total = pts.bride + pts.groom;
  const bridePct = total ? Math.round((pts.bride / total) * 100) : 50;

  const players = useMemo(() => {
    const m = new Map<string, { name: string; side: Side; score: number }>();
    answers.forEach((a) => {
      const p = m.get(a.guest_id) ?? { name: a.guest_name, side: a.side, score: 0 };
      if (a.correct) p.score++;
      m.set(a.guest_id, p);
    });
    return [...m.entries()].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score).slice(0, 8);
  }, [answers]);

  const leader = pts.bride === pts.groom ? null : pts.bride > pts.groom ? 'bride' : 'groom';

  return (
    <div className="space-y-5">
      <section className="card p-5 text-center">
        <Trophy className="mx-auto mb-2 text-gold" />
        <p className="font-heading text-lg text-primary">
          {leader ? `${leader === 'bride' ? wedding.bride : wedding.groom}’s side is ahead` : total ? 'Neck and neck' : 'No points yet'}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div className="text-left">
            <p className="font-script text-3xl text-primary">{wedding.bride}</p>
            <p className="font-heading text-3xl">{pts.bride}</p>
          </div>
          <div className="text-right">
            <p className="font-script text-3xl text-primary">{wedding.groom}</p>
            <p className="font-heading text-3xl">{pts.groom}</p>
          </div>
        </div>
        <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-gold/30" role="img" aria-label={`Bride side ${pts.bride} points, groom side ${pts.groom} points`}>
          <div className="bg-primary transition-[width] duration-700" style={{ width: `${bridePct}%` }} />
          <div className="flex-1 bg-gold" />
        </div>
        <p className="mt-3 text-[14px] text-muted">Points come from correct trivia answers. Rally your side!</p>
      </section>

      <section className="card p-4">
        <h3 className="mb-2 font-heading text-lg text-primary">Top players</h3>
        {players.length === 0 ? (
          <p className="py-4 text-center text-muted">Answer a trivia question to get on the board.</p>
        ) : (
          <ol className="divide-y divide-gold/20">
            {players.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 text-center font-heading text-gold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{p.id === me?.id ? `${p.name} (you)` : p.name}</span>
                <SideBadge side={p.side} />
                <span className="w-8 text-right font-heading text-lg">{p.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Polls() {
  const { me, games } = useApp();
  const { rows: votes } = useTable<PollVote>('poll_votes');

  const vote = async (poll_id: string, option: number) => {
    if (!me) return;
    try {
      await insert('poll_votes', { guest_id: me.id, poll_id, option });
    } catch {
      /* already voted */
    }
  };

  return (
    <ul className="space-y-4">
      {games.polls.map((p) => {
        const pv = votes.filter((v) => v.poll_id === p.id);
        const myVote = pv.find((v) => v.guest_id === me?.id);
        return (
          <li key={p.id} className="card p-4">
            <p className="mb-3 font-heading text-[18px] text-primary">{p.q}</p>
            <div className="space-y-2">
              {p.options.map((opt, i) => {
                const count = pv.filter((v) => v.option === i).length;
                const pct = pv.length ? Math.round((count / pv.length) * 100) : 0;
                return myVote ? (
                  <div key={i} className="relative overflow-hidden rounded-xl border border-gold/30 px-3.5 py-2.5">
                    <div className="absolute inset-y-0 left-0 bg-blush transition-[width] duration-700" style={{ width: `${pct}%` }} aria-hidden />
                    <div className="relative flex justify-between text-[16px]">
                      <span className={myVote.option === i ? 'font-semibold text-primary' : ''}>
                        {opt}
                        {myVote.option === i && ' ✓'}
                      </span>
                      <span className="text-muted">{pct}%</span>
                    </div>
                  </div>
                ) : (
                  <button key={i} onClick={() => vote(p.id, i)} className="w-full rounded-xl border border-gold/40 px-3.5 py-2.5 text-left text-[16px] transition hover:border-gold hover:bg-blush/40">
                    {opt}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[13px] text-muted">{pv.length} vote{pv.length === 1 ? '' : 's'}{!myVote && ' · vote to see results'}</p>
          </li>
        );
      })}
    </ul>
  );
}
