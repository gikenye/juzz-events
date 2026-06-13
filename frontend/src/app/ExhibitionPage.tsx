// Bare /game during exhibition mode (no cup live): the rolling feed — current
// game auto-rolls to the next when it ends. Same arena layout as a match page.
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMarketStore } from '../store/marketStore';
import { usePositionsStore } from '../store/positionsStore';
import { fallbackAgent } from '../lib/agents';
import { useLiveClocks } from '../lib/useLiveClocks';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';
import { SettlementBanner } from '../components/market/SettlementBanner';
import { BattleBackdrop, GlassPanel } from '../components/layout/BattleBackdrop';

export function ExhibitionPage() {
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
  }, []);

  const white = players.white ? fallbackAgent(players.white.agent_id, players.white.name) : null;
  const black = players.black ? fallbackAgent(players.black.agent_id, players.black.name) : null;
  const turn = fen.split(' ')[1];

  return (
    <BattleBackdrop>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <SettlementBanner />
        {waiting || !white || !black ? (
          <p className="text-center text-muted py-24">Waiting for the next live game…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <GlassPanel>
              <div className="flex flex-col gap-1.5">
                <AgentCard agent={black} isActive={turn === 'b' && !isFinished}
                           capturedPieces={captured.byBlack} capturedIsWhite clockMs={clocks.black} />
                <ChessBoard />
                <AgentCard agent={white} isActive={turn === 'w' && !isFinished}
                           capturedPieces={captured.byWhite} clockMs={clocks.white} />
              </div>
            </GlassPanel>
            <div className="lg:sticky lg:top-20 lg:self-start">
              <GlassPanel>
                <MarketPanel />
              </GlassPanel>
            </div>
          </div>
        )}
      </div>
    </BattleBackdrop>
  );
}
