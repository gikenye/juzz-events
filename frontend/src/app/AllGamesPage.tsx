import { useEffect } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { useMarketStore } from '../store/marketStore';
import { useGameStore } from '../store/gameStore';
import {
  buildCupVM, upcomingCupVM, exhibitionMatchVM, type CupVM, type MatchVM,
} from '../lib/tournamentView';
import { BracketHeader } from '../components/tournament/BracketHeader';
import { MatchCard } from '../components/tournament/MatchCard';
import { BattleBackdrop } from '../components/layout/BattleBackdrop';

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #2A2A35)' }} />
      <span
        className="text-[10px] font-bold tracking-[0.22em] flex items-center gap-2 select-none"
        style={{ color: '#C9A227' }}
      >
        <span style={{ opacity: 0.45 }}>◈</span>
        {label}
        <span style={{ opacity: 0.45 }}>◈</span>
      </span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #2A2A35, transparent)' }} />
    </div>
  );
}

export function AllGamesPage() {
  const snapshot = useTournamentStore(s => s.snapshot);
  const league = useTournamentStore(s => s.league);
  const startsAt = useTournamentStore(s => s.nextMatchStartsAtMs);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const now = useTournamentStore(s => s.now);
  const slots = useMarketStore(s => s.slots);
  const players = useGameStore(s => s.players);
  const liveGameId = useGameStore(s => s.gameId);
  const liveFinished = useGameStore(s => s.isFinished);

  useEffect(() => {
    useTournamentStore.getState().bind();
    useMarketStore.getState().bind();
    useGameStore.getState().start(); // the rolling feed backs the featured card pre-league
  }, []);

  // Cup live → the real bracket; otherwise the next cup's seeded bracket with
  // the live exhibition game as the featured match — the page always renders
  // the full tournament layout.
  let vm: CupVM;
  let featured: MatchVM;
  if (snapshot) {
    vm = buildCupVM(snapshot, league, startsAt, now - offset);
    featured = vm.matches.find(m => m.isCurrent)
      ?? vm.matches.find(m => m.phase !== 'completed')
      ?? vm.matches[vm.matches.length - 1];
  } else {
    const exhibition = exhibitionMatchVM(players.white, players.black, liveGameId, liveFinished);
    vm = upcomingCupVM(league) ?? {
      cupId: '', name: '', phase: 'exhibition', matches: [],
      champion: null, nextCupAtMs: league?.next_tournament_at_ms ?? null, startsAtMs: 0,
    };
    featured = exhibition;
  }

  // Two-sided probability for the featured card from the live market slots.
  const a = slots.find(s => s.key === 'a');
  const b = slots.find(s => s.key === 'b');
  const liveProb = featured.phase === 'live' && a && b && a.prob + b.prob > 0
    ? { a: a.prob / (a.prob + b.prob), b: b.prob / (a.prob + b.prob) }
    : null;
  // Ticking countdown on the featured card for the current match before it goes
  // live — same target the arena's "Game starts in" banner uses, so /games and
  // /game stay in sync — a live clock here, never a static "Queued".
  const countdownTarget = featured.isCurrent && vm.startsAtMs > 0 ? vm.startsAtMs + offset : 0;

  // Hide all-TBD "Winner of … vs Winner of …" cards: while a feeder match is
  // still being played its dependent match has no known players and would sit in
  // Upcoming indefinitely. Only show upcoming matches with at least one decided side.
  const upcoming = vm.matches.filter(m => m.phase === 'upcoming' && m.id !== featured.id && (m.aId || m.bId));
  const completed = vm.matches.filter(m => m.phase === 'completed' && m.id !== featured.id);

  return (
    <BattleBackdrop>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        <BracketHeader vm={vm} />

        {/* Featured / current game */}
        <div className="flex flex-col gap-4">
          <SectionDivider label={featured.phase === 'live' ? 'Now playing' : 'Up next'} />
          <MatchCard match={featured} matches={vm.matches} featured liveProb={liveProb} countdownTarget={countdownTarget} />
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionDivider label="Upcoming" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcoming.map(m => <MatchCard key={m.id} match={m} matches={vm.matches} />)}
            </div>
          </div>
        )}

        {/* Results */}
        {completed.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionDivider label="Results" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completed.map(m => <MatchCard key={m.id} match={m} matches={vm.matches} />)}
            </div>
          </div>
        )}
      </div>
    </BattleBackdrop>
  );
}
