// One match's arena: live board + market when it plays, replayed final
// position when done, feeder view while TBD. Everything is server truth —
// the match identity is a bracket position (stable across draw rematches).
// Shares the leakey backdrop + card language with /games.
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useTournamentStore } from '../store/tournamentStore';
import { useGameStore } from '../store/gameStore';
import { useMarketStore } from '../store/marketStore';
import { usePositionsStore } from '../store/positionsStore';
import { api } from '../lib/api';
import { getAgent, fallbackAgent, eloExpected } from '../lib/agents';
import type { Agent } from '../types';
import { buildCupVM, type MatchVM } from '../lib/tournamentView';
import { capturedFromFen } from '../lib/chessFen';
import { useLiveClocks } from '../lib/useLiveClocks';
import { useServerTaunt } from '../hooks/useServerTaunt';
import type { GameResult } from '../lib/types';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';
import { OddsDisplay, type SlotView } from '../components/market/OddsDisplay';
import { Countdown } from '../components/tournament/Countdown';
import { moveLogEventsUrl, moveLogGameId } from '../lib/config';
import { LastKnightBg } from '../components/layout/LastKnightBg';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const RESULT_TEXT: Partial<Record<GameResult, string>> = {
  white_wins: 'by checkmate',
  black_wins: 'by checkmate',
  white_timeout: 'on time',
  black_timeout: 'on time',
};

export function GamePage() {
  const { matchId } = useParams();
  const snapshot = useTournamentStore(s => s.snapshot);
  const league = useTournamentStore(s => s.league);
  const startsAt = useTournamentStore(s => s.nextMatchStartsAtMs);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const now = useTournamentStore(s => s.now);

  useEffect(() => {
    useTournamentStore.getState().bind();
    useMarketStore.getState().bind();
    usePositionsStore.getState().bind();
  }, []);

  const vm = buildCupVM(snapshot, league, startsAt, now - offset);
  const match = vm.matches.find(m => m.id === matchId) ?? null;

  // Pin the live game stream to this match's latest game (rematches re-pin).
  const gameId = match && (match.phase === 'live' || match.phase === 'countdown') ? match.gameId : null;
  useEffect(() => {
    if (gameId) useGameStore.getState().watch(gameId);
  }, [gameId]);

  if (!snapshot || !match) return <Navigate to="/game" replace />;

  const players = useGameStore.getState().players;
  const agentOf = (id: string | null): Agent | null => {
    if (!id) return null;
    const name = [players.white, players.black].find(p => p?.agent_id === id)?.name;
    return getAgent(id) ?? fallbackAgent(id, name);
  };
  const agentA = agentOf(match.aId);
  const agentB = agentOf(match.bId);

  // ── TBD: feeders not decided yet ──
  if (!agentA || !agentB) {
    return (
      <ArenaShell match={match}>
        <div className="flex items-center justify-center gap-6 py-10 text-center">
          <TbdSlot label={`Winner of ${match.sourceA ?? '—'}`} />
          <span className="text-muted font-display text-xl">vs</span>
          <TbdSlot label={`Winner of ${match.sourceB ?? '—'}`} />
        </div>
        <p className="text-center text-muted text-sm">
          The two players are decided once the feeder matches finish.
        </p>
      </ArenaShell>
    );
  }

  if (match.phase === 'live' || match.phase === 'countdown') {
    return <LiveArena match={match} agentA={agentA} agentB={agentB}
                      countdownTarget={match.phase === 'countdown' ? vm.startsAtMs + offset : 0} />;
  }
  if (match.phase === 'completed') {
    return <CompletedArena match={match} agentA={agentA} agentB={agentB} />;
  }

  // ── Upcoming with known participants ──
  const pa = eloExpected(agentA.elo, agentB.elo);
  const preview: SlotView[] = [
    { key: 'a', label: agentA.name.replace(/^Agent\s+/, ''), color: agentA.color, prob: pa, agent: agentA },
    { key: 'b', label: agentB.name.replace(/^Agent\s+/, ''), color: agentB.color, prob: 1 - pa, agent: agentB },
  ];
  return (
    <ArenaShell match={match}>
      <div className="flex flex-col gap-3 max-w-[460px] mx-auto">
        <AgentCard agent={agentB} isActive={false} />
        <ChessBoard fen={START_FEN} />
        <AgentCard agent={agentA} isActive={false} />
      </div>
      <div className="max-w-[460px] mx-auto mt-4">
        <p className="text-center text-muted text-xs uppercase tracking-widest mb-2">Pre-match win chance</p>
        <OddsDisplay outcomes={preview} readOnly />
        {/* Upcoming matches aren't bettable yet — point users to the open market. */}
        <Link to="/game"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          style={{ background: 'rgba(255,60,0,0.10)', border: '1px solid rgba(255,60,0,0.35)', color: '#FFBE00' }}>
          Betting opens when this match goes live · Watch the live match →
        </Link>
      </div>
    </ArenaShell>
  );
}

// ── Live (or pre-game countdown) ──────────────────────────────────────────
function LiveArena({ match, agentA, agentB, countdownTarget }: {
  match: MatchVM; agentA: Agent; agentB: Agent; countdownTarget: number;
}) {
  const gameId = useGameStore(s => s.gameId);
  const fen = useGameStore(s => s.fen);
  const captured = useGameStore(s => s.capturedPieces);
  const isFinished = useGameStore(s => s.isFinished);
  const result = useGameStore(s => s.result);
  const players = useGameStore(s => s.players);
  const clocks = useLiveClocks(); // real server clocks { white, black } in ms

  // Seats can swap on rematches — colour by seat, not bracket side.
  const whiteAgent = players.white?.agent_id === agentB.id ? agentB : agentA;
  const blackAgent = whiteAgent === agentA ? agentB : agentA;
  const turn = fen.split(' ')[1];
  const winner = isFinished && match.winnerId
    ? (match.winnerId === agentA.id ? agentA : agentB) : null;

  // Live trash talk — server-authored, broadcast to every viewer.
  const taunt = useServerTaunt(gameId);

  // Live match goes straight to the board (no title) like leakey — the board is
  // the hero, full size on the inferno, not tucked under a header.
  return (
    <motion.div className="min-h-screen relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <LastKnightBg />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 pt-20">
        {winner && <WinnerBanner name={winner.name} detail={result ? RESULT_TEXT[result] : undefined} />}
        {countdownTarget > 0 && <CountdownBanner target={countdownTarget} />}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="flex flex-col gap-3">
            <AgentCard agent={blackAgent} isActive={turn === 'b' && !isFinished}
                       capturedPieces={captured.byBlack} capturedIsWhite clockMs={clocks.black}
                       taunt={taunt?.seat === 'black' ? taunt.text : null} />
            <ChessBoard />
            <AgentCard agent={whiteAgent} isActive={turn === 'w' && !isFinished}
                       capturedPieces={captured.byWhite} clockMs={clocks.white}
                       taunt={taunt?.seat === 'white' ? taunt.text : null} />
            <OnChainBadge gameId={gameId} />
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MarketPanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Completed: replayed final position ────────────────────────────────────
function CompletedArena({ match, agentA, agentB }: {
  match: MatchVM; agentA: Agent; agentB: Agent;
}) {
  const [finalFen, setFinalFen] = useState<string | null>(null);
  useEffect(() => {
    if (!match.gameId) return;
    api.gameReplay(match.gameId)
      .then(r => setFinalFen(r.moves.length ? r.moves[r.moves.length - 1].state : START_FEN))
      .catch(() => setFinalFen(START_FEN));
  }, [match.gameId]);

  const winner = match.winnerId === agentA.id ? agentA : agentB;
  const caps = useMemo(() => capturedFromFen(finalFen ?? START_FEN), [finalFen]);

  return (
    <ArenaShell match={match}>
      <WinnerBanner name={winner.name} />
      <div className="flex flex-col gap-3 max-w-[460px] mx-auto">
        <AgentCard agent={agentB} isActive={false} capturedPieces={caps.byBlack} capturedIsWhite />
        <ChessBoard fen={finalFen ?? START_FEN} />
        <AgentCard agent={agentA} isActive={false} capturedPieces={caps.byWhite} />
        <OnChainBadge gameId={match.gameId} />
      </div>
    </ArenaShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────
const STAGE_LONG: Record<MatchVM['stage'], string> = {
  quarter: 'Quarterfinal', semi: 'Semifinal', final: 'Final',
};
/** Stage name only — no match index ("Quarterfinal", not "Quarterfinal 3"). */
function matchLabel(m: MatchVM): string {
  return m.code === 'LIVE' ? 'Exhibition match' : STAGE_LONG[m.stage];
}

function ArenaShell({ match, children }: { match: MatchVM; children: React.ReactNode }) {
  return (
    <motion.div className="min-h-screen relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <LastKnightBg />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 pt-20">
        <h1 className="font-display text-ivory text-xl font-bold mb-4">{matchLabel(match)}</h1>
        {children}
      </div>
    </motion.div>
  );
}

/** Quiet line under the board: every move is committed on-chain (MoveLog), so
 *  anyone can verify the outcome wasn't faked. Links the live contract log. */
function OnChainBadge({ gameId }: { gameId?: string | null }) {
  return (
    <a
      href={moveLogEventsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={gameId ? `On-chain game id: ${moveLogGameId(gameId)}` : 'Moves attested on Celo'}
      className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted hover:text-gold transition-colors"
    >
      <span aria-hidden>⛓</span>
      Every move verified on-chain
      <span aria-hidden style={{ opacity: 0.6 }}>↗</span>
    </a>
  );
}

function CountdownBanner({ target }: { target: number }) {
  return (
    <div className="mb-4 text-center py-4 rounded-xl border border-gold/40 bg-gold/5">
      <div className="text-muted text-xs uppercase tracking-widest mb-1">Game starts in</div>
      <Countdown target={target} className="font-display text-gold text-3xl font-bold tabular-nums" />
    </div>
  );
}

function WinnerBanner({ name, detail }: { name: string; detail?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 text-center py-3 rounded-xl border border-gold/50 bg-gold/10 text-gold font-display font-semibold tracking-wider"
    >
      🏆 {name} wins {detail ?? ''}
    </motion.div>
  );
}

function TbdSlot({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center text-muted text-2xl">?</div>
      <span className="text-muted text-sm italic max-w-[120px] text-center">{label}</span>
    </div>
  );
}
