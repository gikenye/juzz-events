import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../store/gameStore';

const PIECE_TYPES = ['wP','wN','wB','wR','wQ','wK','bP','bN','bB','bR','bQ','bK'];

const customPieces = Object.fromEntries(
  PIECE_TYPES.map(pt => [
    pt,
    ({ squareWidth }: { squareWidth: number }) => (
      <img
        src={`/pieces/${pt}.svg`}
        alt={pt}
        style={{ width: squareWidth, height: squareWidth, pointerEvents: 'none' }}
        draggable={false}
      />
    ),
  ])
);

export function ChessBoard() {
  const { fen, lastMove } = useGameStore();

  const highlightSquares: Record<string, { background: string }> = {};
  if (lastMove) {
    highlightSquares[lastMove.from] = { background: 'rgba(201, 162, 39, 0.3)' };
    highlightSquares[lastMove.to] = { background: 'rgba(201, 162, 39, 0.45)' };
  }

  return (
    <div className="w-full aspect-square max-w-[520px] mx-auto rounded-lg overflow-hidden shadow-2xl">
      <Chessboard
        position={fen}
        arePiecesDraggable={false}
        customDarkSquareStyle={{ backgroundColor: '#B58863' }}
        customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
        customPieces={customPieces}
        customSquareStyles={highlightSquares}
        boardOrientation="white"
        customBoardStyle={{
          borderRadius: '6px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  );
}
