import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, Navigate, Link } from 'react-router-dom';
import type { EndReason, Match } from '../types';
import { useTournamentStore } from '../store/tournamentStore';
import { useGameStore } from '../store/gameStore';
import { getAgent } from '../lib/agents';
import {
  deriveLiveState, matchStatus, participantsKnown, isMatchRevealed,
  preMatchProb, winProbAtMove, feederLabel, matchLongLabel,
} from '../lib/tournament';
import { chessAtMove, capturesFrom } from '../lib/chess';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';
import { OddsDisplay } from '../components/market/OddsDisplay';
import { Countdown } from '../components/tournament/Countdown';

const REASON_TEXT: Record<EndReason, string> = {
  checkmate: 'by checkmate',
  material: 'on captured material',
  centerControl: 'on board control',
  coinflip: 'on a tiebreak',
};

export function GamePage() {
  const { matchId } = useParams();
  const tournament = useTournamentStore(s => s.tournament);
  const now = useTournamentStore(s => s.now);

  // Live game store (only meaningful when this match is the live one).
  const liveFen = useGameStore(s => s.fen);
  const liveCaptures = useGameStore(s => s.captures);

  const match = tournament.matches.find(m => m.id === matchId);

  // Final position for completed matches (computed locally, independent of the engine).
  const finalView = useMemo(() => {
    if (!match) return null;
    const chess = chessAtMove(match.pgn, match.pgn.length);
    return { fen: chess.fen(), captures: capturesFrom(chess) };
  }, [match]);

  if (!match) return <Navigate to="/games" replace />;

  const live = deriveLiveState(tournament, now);
  const isLiveMatch = live.phase === 'live' && live.match?.id === match.id;
  const status = matchStatus(match, now);
  const known = participantsKnown(tournament, match, now);
  const revealed = isMatchRevealed(tournament, match.index, now);

  // a = white (bottom), b = black (top)
  const agentA = getAgent(match.aId);
  const agentB = getAgent(match.bId);

  // ── Upcoming match whose participants aren't decided yet ──
  if (status === 'upcoming' && !known) {
    return (
      <ArenaShell match={match}>
        <CountdownBanner target={match.startTime} />
        <div className="flex items-center justify-center gap-6 py-10 text-center">
          <TbdSlot label={feederLabel(tournament, match.sourceA)} />
          <span className="text-muted font-display text-xl">vs</span>
          <TbdSlot label={feederLabel(tournament, match.sourceB)} />
        </div>
        <p className="text-center text-muted text-sm">
          The two players are decided once the feeder matches finish.
        </p>
      </ArenaShell>
    );
  }

  if (!agentA || !agentB) return <Navigate to="/games" replace />;

  // Win-probability for non-live views.
  const previewProb = status === 'completed' ? winProbAtMove(match, match.pgn.length) : preMatchProb(match);

  // ── Live match ──
  if (isLiveMatch) {
    const turn = liveFen.split(' ')[1]; // 'w' | 'b'
    const winner = revealed ? getAgent(match.winnerId) : null;
    return (
      <motion.div className="min-h-screen bg-bg-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {winner && (
            <WinnerBanner name={winner.name} reason={match.endReason} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <div className="flex flex-col gap-1.5">
              {/* Top = black = agent B */}
              <AgentCard agent={agentB} isActive={turn === 'b' && !revealed} capturedPieces={liveCaptures.byBlack} capturedIsWhite />
              <ChessBoard />
              {/* Bottom = white = agent A */}
              <AgentCard agent={agentA} isActive={turn === 'w' && !revealed} capturedPieces={liveCaptures.byWhite} />
            </div>
            <div className="lg:sticky lg:top-20 lg:self-start">
              <MarketPanel agentA={agentA} agentB={agentB} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Completed match (result) ──
  if (status === 'completed') {
    const winner = getAgent(match.winnerId);
    const caps = finalView!.captures;
    return (
      <ArenaShell match={match}>
        {winner && <WinnerBanner name={winner.name} reason={match.endReason} />}
        <div className="flex flex-col gap-1.5 max-w-[460px] mx-auto">
          <AgentCard agent={agentB} isActive={false} capturedPieces={caps.byBlack} capturedIsWhite />
          <ChessBoard fen={finalView!.fen} />
          <AgentCard agent={agentA} isActive={false} capturedPieces={caps.byWhite} />
        </div>
        <div className="max-w-[460px] mx-auto mt-4">
          <OddsDisplay agentA={agentA} agentB={agentB} probabilities={previewProb} readOnly />
        </div>
      </ArenaShell>
    );
  }

  // ── Upcoming match with known participants ──
  return (
    <ArenaShell match={match}>
      <CountdownBanner target={match.startTime} />
      <div className="flex flex-col gap-1.5 max-w-[460px] mx-auto">
        <AgentCard agent={agentB} isActive={false} />
        <ChessBoard fen={chessAtMove(match.pgn, 0).fen()} />
        <AgentCard agent={agentA} isActive={false} />
      </div>
      <div className="max-w-[460px] mx-auto mt-4">
        <p className="text-center text-muted text-xs uppercase tracking-widest mb-2">Pre-match win chance</p>
        <OddsDisplay agentA={agentA} agentB={agentB} probabilities={previewProb} readOnly />
      </div>
    </ArenaShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────
function ArenaShell({ match, children }: { match: Match; children: React.ReactNode }) {
  return (
    <motion.div className="min-h-screen bg-bg-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Link to="/games" className="inline-flex items-center gap-1.5 text-muted hover:text-gold text-sm mb-4 transition-colors">
          ← All games
        </Link>
        <h1 className="font-display text-ivory text-xl font-bold mb-4">{matchLongLabel(match)}</h1>
        {children}
      </div>
    </motion.div>
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

function WinnerBanner({ name, reason }: { name: string; reason: EndReason | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 text-center py-3 rounded-xl border border-gold/50 bg-gold/10 text-gold font-display font-semibold tracking-wider"
    >
      🏆 {name} wins {reason ? REASON_TEXT[reason] : ''}
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
