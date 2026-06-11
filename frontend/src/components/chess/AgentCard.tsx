import type { Agent } from '../../types';
import { PIECE_VALUE } from '../../lib/chess';
import { AgentAvatar } from './AgentAvatar';

const PIECE_UNICODE: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  capturedPieces?: string[];
  /** Whether the captured pieces are white pieces (affects glyph color). */
  capturedIsWhite?: boolean;
}

export function AgentCard({ agent, isActive, capturedPieces = [], capturedIsWhite }: AgentCardProps) {
  const advantage = capturedPieces.reduce((sum, p) => sum + (PIECE_VALUE[p] ?? 0), 0);
  const sorted = [...capturedPieces].sort((a, b) => (PIECE_VALUE[b] ?? 0) - (PIECE_VALUE[a] ?? 0));
  const pieceColor = capturedIsWhite ? '#F5F0E8' : '#888888';

  return (
    <div className="flex items-center gap-2.5">
      <AgentAvatar agent={agent} isActive={isActive} />

      <div className="shrink-0 flex items-center gap-1.5">
        <span className="font-display text-ivory text-sm font-semibold">{agent.name}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: agent.color }} />
        )}
      </div>

      {sorted.length > 0 ? (
        <div className="flex items-center gap-0.5 flex-wrap flex-1 min-w-0">
          {sorted.map((piece, i) => (
            <span key={i} className="text-sm leading-none" style={{ color: pieceColor }}>
              {PIECE_UNICODE[piece] ?? piece}
            </span>
          ))}
          {advantage > 0 && <span className="text-xs text-muted ml-0.5">+{advantage}</span>}
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
