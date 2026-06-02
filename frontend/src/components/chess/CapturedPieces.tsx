const PIECE_UNICODE: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

const PIECE_VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

interface CapturedPiecesProps {
  pieces: string[];
  color: 'maxi' | 'gotham';
}

export function CapturedPieces({ pieces, color }: CapturedPiecesProps) {
  if (pieces.length === 0) return null;

  const advantage = pieces.reduce((sum, p) => sum + (PIECE_VALUE[p] ?? 0), 0);
  const accent = color === 'maxi' ? '#7B4FBF' : '#00B4A6';

  const sorted = [...pieces].sort((a, b) => (PIECE_VALUE[b] ?? 0) - (PIECE_VALUE[a] ?? 0));

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sorted.map((piece, i) => (
        <span key={i} className="text-sm" style={{ color: accent }} title={piece}>
          {PIECE_UNICODE[piece] ?? piece}
        </span>
      ))}
      {advantage > 0 && (
        <span className="text-xs text-muted ml-1">+{advantage}</span>
      )}
    </div>
  );
}
