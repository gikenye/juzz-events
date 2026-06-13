// Bare /game during exhibition mode (no cup live): the rolling feed — current
// game auto-rolls to the next when it ends. Same arena layout as a match page.
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMarketStore } from '../store/marketStore';
import { usePositionsStore } from '../store/positionsStore';
import { fallbackAgent } from '../lib/agents';
import { useLiveClocks } from '../lib/useLiveClocks';
import { useBotBanter } from '../hooks/useBotBanter';
import { ChessBoard } from '../components/chess/ChessBoard';
import { AgentCard } from '../components/chess/AgentCard';
import { MarketPanel } from '../components/market/MarketPanel';
import { SettlementBanner } from '../components/market/SettlementBanner';
import { BattleBackdrop, GlassPanel } from '../components/layout/BattleBackdrop';

export function ExhibitionPage() {
  const gameId = useGameStore(s => s.gameId);
  const fen = useGameStore(s => s.fen);
  const moveNumber = useGameStore(s => s.moveNumber);
  const captured = useGameStore(s => s.capturedPieces);
  const isFinished = useGameStore(s => s.isFinished);
  const result = useGameStore(s => s.result);
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

  // Winning seat from the result (a = white seat, b = black seat).
  const winnerSeat = result === 'white_wins' || result === 'black_timeout' ? 'a'
    : result === 'black_wins' || result === 'white_timeout' ? 'b' : null;

  const banter = useBotBanter({
    gameId, moveNumber, fen, turn, finished: isFinished, winnerSeat,
    whiteAgentId: white?.id ?? '', blackAgentId: black?.id ?? '',
  });

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
                           capturedPieces={captured.byBlack} capturedIsWhite clockMs={clocks.black}
                           taunt={banter?.speaker === 'b' ? banter.text : null} />
                <ChessBoard />
                <AgentCard agent={white} isActive={turn === 'w' && !isFinished}
                           capturedPieces={captured.byWhite} clockMs={clocks.white}
                           taunt={banter?.speaker === 'a' ? banter.text : null} />
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
