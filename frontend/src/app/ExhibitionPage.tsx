// Bare /game with no live cup match: show the rolling exhibition game if one is
// playing, otherwise a useful tournament intermission (next-cup countdown + a
// route to the bracket and cup futures) — never a dead "waiting" screen.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useMarketStore } from '../store/marketStore';
import { usePositionsStore } from '../store/positionsStore';
import { useTournamentStore } from '../store/tournamentStore';
import { fallbackAgent, getAgent } from '../lib/agents';
import { useLiveClocks } from '../lib/useLiveClocks';
import { useServerTaunt } from '../hooks/useServerTaunt';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';
import { SettlementBanner } from '../components/market/SettlementBanner';
import { Countdown } from '../components/tournament/Countdown';
import { LastKnightBg } from '../components/layout/LastKnightBg';

export function ExhibitionPage() {
  const gameId = useGameStore(s => s.gameId);
  const fen = useGameStore(s => s.fen);
  const captured = useGameStore(s => s.capturedPieces);
  const isFinished = useGameStore(s => s.isFinished);
  const players = useGameStore(s => s.players);
  const waiting = useGameStore(s => s.waiting);
  const clocks = useLiveClocks();

  useEffect(() => {
    useGameStore.getState().start();
    useMarketStore.getState().bind();
    usePositionsStore.getState().bind();
    useTournamentStore.getState().bind();
  }, []);

  const white = players.white ? fallbackAgent(players.white.agent_id, players.white.name) : null;
  const black = players.black ? fallbackAgent(players.black.agent_id, players.black.name) : null;
  const turn = fen.split(' ')[1];
  const taunt = useServerTaunt(gameId);

  const idle = waiting || !white || !black;

  return (
    <motion.div className="min-h-screen relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <LastKnightBg />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
        <SettlementBanner />
        {idle ? (
          <Intermission />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <div className="flex flex-col gap-1.5">
              <AgentCard agent={black!} isActive={turn === 'b' && !isFinished}
                         capturedPieces={captured.byBlack} capturedIsWhite clockMs={clocks.black}
                         taunt={taunt?.seat === 'black' ? taunt.text : null} />
              <ChessBoard />
              <AgentCard agent={white!} isActive={turn === 'w' && !isFinished}
                         capturedPieces={captured.byWhite} clockMs={clocks.white}
                         taunt={taunt?.seat === 'white' ? taunt.text : null} />
            </div>
            <div className="lg:sticky lg:top-20 lg:self-start">
              <MarketPanel />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Between cups (or before the first game): a live, useful holding page. */
function Intermission() {
  const league = useTournamentStore(s => s.league);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const champ = league?.last_champion ? (getAgent(league.last_champion) ?? fallbackAgent(league.last_champion)) : null;
  const next = league?.upcoming;
  const startMs = (next?.starts_at_ms ?? league?.next_tournament_at_ms ?? 0) + offset;

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold mb-3">Tournament intermission</div>
      {champ && (
        <p className="text-muted text-sm mb-6">
          Last cup won by <span className="text-ivory font-semibold">{champ.name}</span> 🏆
        </p>
      )}
      <h1 className="font-display text-ivory text-2xl font-bold mb-2">
        {next?.name ?? 'Next cup starting soon'}
      </h1>
      {startMs > 0 && (
        <div className="mt-4 inline-block rounded-xl border border-gold/40 bg-gold/5 px-6 py-4">
          <div className="text-muted text-xs uppercase tracking-widest mb-1">First game in</div>
          <Countdown target={startMs} className="font-display text-gold text-3xl font-bold tabular-nums" />
        </div>
      )}
      <div className="mt-8">
        <Link to="/games"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.4)', color: '#C9A227' }}>
          See the bracket & cup futures →
        </Link>
      </div>
    </div>
  );
}
