import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useMarketStore } from '../store/marketStore';
import { useLiveClocks } from '../lib/useLiveClocks';
import type { GameResult } from '../lib/types';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';

function resultBanner(result: GameResult | null, whiteName: string, blackName: string): string {
  switch (result) {
    case 'white_wins':    return `${whiteName} wins`;
    case 'black_wins':    return `${blackName} wins`;
    case 'white_timeout': return `${blackName} wins on time`;
    case 'black_timeout': return `${whiteName} wins on time`;
    case 'draw':          return 'Draw';
    case 'aborted':       return 'Game aborted';
    default:              return 'Game over';
  }
}

export function GamePage() {
  const { players, turn, capturedPieces, isFinished, result, waiting, connected, start, stop } = useGameStore();
  const bindMarket = useMarketStore(s => s.bind);
  const unbindMarket = useMarketStore(s => s.unbind);
  const clocks = useLiveClocks();

  // Live game + market streams: one socket, auto-rolls to the next game on the same screen.
  useEffect(() => {
    start();
    bindMarket();
    return () => { stop(); unbindMarket(); };
  }, [start, stop, bindMarket, unbindMarket]);

  const whiteName = players.white?.name ?? 'White';
  const blackName = players.black?.name ?? 'Black';

  return (
    <motion.div className="min-h-screen bg-bg-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <AnimatePresence>
          {isFinished && (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 text-center py-3 rounded-xl border border-gold/50 bg-gold/10 text-gold font-display font-semibold tracking-wider"
            >
              ♚ {resultBanner(result, whiteName, blackName)} · next game shortly…
            </motion.div>
          )}
        </AnimatePresence>

        {waiting && !isFinished && (
          <div className="mb-4 text-center py-3 rounded-xl border border-border bg-bg-card text-muted text-sm">
            {connected ? 'Waiting for the next live game…' : 'Connecting…'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Chess area */}
          <div className="flex flex-col gap-1.5">
            {/* Black player (top) — shows white pieces it has captured */}
            <AgentCard
              name={blackName}
              color="maxi"
              isActive={turn === 'b' && !isFinished}
              capturedPieces={capturedPieces.byMaxi}
              capturedPieceColor="white"
              clockMs={clocks.black}
            />

            <ChessBoard />

            {/* White player (bottom) — shows black pieces it has captured */}
            <AgentCard
              name={whiteName}
              color="gotham"
              isActive={turn === 'w' && !isFinished}
              capturedPieces={capturedPieces.byGotham}
              capturedPieceColor="black"
              clockMs={clocks.white}
            />
          </div>

          {/* Market panel */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MarketPanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
