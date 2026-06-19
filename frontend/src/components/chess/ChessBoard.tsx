import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../store/gameStore';
import { kingInCheckSquare } from '../../lib/chessCheck';

const PIECE_TYPES = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

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
  ]),
);

interface ChessBoardProps {
  /** Provide a fen to render a specific position (non-live views); omit to follow the live game store. */
  fen?: string;
  lastMove?: { from: string; to: string } | null;
}

export function ChessBoard({ fen: fenProp, lastMove: lastMoveProp }: ChessBoardProps) {
  const storeFen = useGameStore(s => s.fen);
  const storeLastMove = useGameStore(s => s.lastMove);

  const fen = fenProp ?? storeFen;
  const lastMove = fenProp !== undefined ? lastMoveProp ?? null : storeLastMove;
  const checkSquare = useMemo(() => kingInCheckSquare(fen), [fen]);

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'rgba(201, 162, 39, 0.3)' };
    squareStyles[lastMove.to] = { background: 'rgba(201, 162, 39, 0.45)' };
  }
  // King-in-check warning — a red glow on the threatened king (applied last so
  // it wins over a last-move highlight on the same square).
  if (checkSquare) {
    squareStyles[checkSquare] = {
      background: 'radial-gradient(circle, rgba(220,38,38,0.85) 0%, rgba(220,38,38,0.4) 45%, rgba(220,38,38,0) 72%)',
    };
  }

  return (
    <div className="chess-board-frame w-full aspect-square mx-auto overflow-hidden" style={{
      maxWidth: 'min(420px, calc(100dvh - 220px))',
    }}>
      <Chessboard
        options={{
          position: fen,
          allowDragging: false,
          darkSquareStyle: { backgroundColor: '#B58863' },
          lightSquareStyle: { backgroundColor: '#F0D9B5' },
          pieces: customPieces,
          squareStyles,
          boardOrientation: 'white',
          boardStyle: { borderRadius: '0px' },
        }}
      />
    </div>
  );
}
