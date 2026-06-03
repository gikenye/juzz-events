import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../store/gameStore';

const PIECE_TYPES = ['wP','wN','wB','wR','wQ','wK','bP','bN','bB','bR','bQ','bK'];

const customPieces = Object.fromEntries(
  PIECE_TYPES.map(pt => [
    pt,
    () => (
      <img
        src={`/pieces/${pt}.svg`}
        alt={pt}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        draggable={false}
      />
    ),
  ])
);

export function ChessBoard() {
  const { fen, lastMove } = useGameStore();

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'rgba(201, 162, 39, 0.3)' };
    squareStyles[lastMove.to]   = { background: 'rgba(201, 162, 39, 0.45)' };
  }

  return (
    <div className="w-full aspect-square max-w-[420px] mx-auto rounded-lg overflow-hidden shadow-2xl">
      <Chessboard
        options={{
          position: fen,
          allowDragging: false,
          darkSquareStyle:  { backgroundColor: '#B58863' },
          lightSquareStyle: { backgroundColor: '#F0D9B5' },
          pieces: customPieces,
          squareStyles,
          boardOrientation: 'white',
          boardStyle: {
            borderRadius: '6px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          },
        }}
      />
    </div>
  );
}
