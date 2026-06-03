import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useMarketStore } from '../store/marketStore';
import { probabilityAtMove, MOVE_INTERVAL_MS } from '../lib/chess';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';
import { Chess } from 'chess.js';

export function GamePage() {
  const { fen, moveIndex, capturedPieces, isFinished, nextMove, resetGame } = useGameStore();
  const { tickTimer, updateProbabilities, timeRemaining } = useMarketStore();

  // Determine whose turn it is from FEN
  const chess = new Chess(fen);
  const turn = chess.turn(); // 'w' = gotham's turn, 'b' = maxi's turn

  // Chess replay interval
  useEffect(() => {
    if (isFinished) {
      const t = setTimeout(() => resetGame(), 5000);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => nextMove(), MOVE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [isFinished, nextMove, resetGame]);

  // Market timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const t = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(t);
  }, [tickTimer, timeRemaining]);

  // Update odds based on game progress
  useEffect(() => {
    const probs = probabilityAtMove(moveIndex);
    updateProbabilities(probs);
  }, [moveIndex, updateProbabilities]);

  return (
    <motion.div
      className="min-h-screen bg-bg-base"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Game over banner */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center py-3 rounded-xl border border-gotham/50 bg-gotham/10 text-gotham font-display font-semibold tracking-wider"
          >
            ♚ Agent Gotham wins! Next game in 5 seconds...
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Chess area */}
          <div className="flex flex-col gap-1.5">
            {/* Agent Maxi (black, top) — shows white pieces captured from Gotham */}
            <AgentCard
              name="Agent Maxi"
              color="maxi"
              isActive={turn === 'b' && !isFinished}
              capturedPieces={capturedPieces.byMaxi}
              capturedPieceColor="white"
            />

            {/* The board */}
            <ChessBoard />

            {/* Agent Gotham (white, bottom) — shows black pieces captured from Maxi */}
            <AgentCard
              name="Agent Gotham"
              color="gotham"
              isActive={turn === 'w' && !isFinished}
              capturedPieces={capturedPieces.byGotham}
              capturedPieceColor="black"
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
