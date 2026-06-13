import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Agent } from '../../types';
const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
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
  /** Live trash-talk line to show next to the name (null = nothing). */
  taunt?: string | null;
  /** Remaining clock time in milliseconds. Omit to hide the clock. */
  clockMs?: number;
}

export function AgentCard({ agent, isActive, capturedPieces = [], capturedIsWhite, taunt = null, clockMs }: AgentCardProps) {
  const advantage = capturedPieces.reduce((sum, p) => sum + (PIECE_VALUE[p] ?? 0), 0);
  const sorted = [...capturedPieces].sort((a, b) => (PIECE_VALUE[b] ?? 0) - (PIECE_VALUE[a] ?? 0));
  const pieceColor = capturedIsWhite ? '#F5F0E8' : '#888888';

  return (
    <div className="flex items-center gap-2.5">
      <AgentAvatar agent={agent} isActive={isActive} />

      {/* Name block is the anchor for the trash-talk bubble (floats to its right). */}
      <div className="relative shrink-0 flex items-center gap-1.5">
        <span style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFD0A0', fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>{agent.name.replace(/^Agent\s+/i, '')}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: agent.color }} />
        )}
        <TauntBubble agent={agent} taunt={taunt} />
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

      {clockMs !== undefined && (
        <ClockDisplay ms={clockMs} isActive={isActive} />
      )}
    </div>
  );
}

function ClockDisplay({ ms, isActive }: { ms: number; isActive: boolean }) {
  const totalSecs = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  const isCritical = totalSecs < 10;
  const isLow = totalSecs < 30;

  return (
    <div
      className="shrink-0 tabular-nums"
      style={{
        fontFamily: "'Inter', monospace",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 1,
        color: isCritical ? '#FF2200' : isLow ? '#FF8800' : isActive ? '#F5F0E8' : '#6A6A7A',
        background: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.35)',
        border: `1px solid ${isCritical ? 'rgba(255,34,0,0.45)' : isLow ? 'rgba(255,136,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 4,
        padding: '2px 8px',
        minWidth: 52,
        textAlign: 'center',
        transition: 'color 0.3s, border-color 0.3s',
      }}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

// Frosted glass chip floating just to the right of the agent's name, vertically
// centered on the row. Single line, no wrap. Shows a brief typing-dots animation
// before revealing the line.
function TauntBubble({ agent, taunt }: { agent: Agent; taunt: string | null }) {
  // Keyed inner component so `typing` initializes fresh per taunt — no
  // reset-in-effect, and AnimatePresence still plays enter + exit.
  return (
    <AnimatePresence>
      {taunt && <Bubble key={taunt} colorLight={agent.colorLight} taunt={taunt} />}
    </AnimatePresence>
  );
}

function Bubble({ colorLight, taunt }: { colorLight: string; taunt: string }) {
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setTyping(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: -6 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30 w-max whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium text-ivory pointer-events-none"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {typing ? <TypingDots color={colorLight} /> : taunt}
    </motion.div>
  );
}

function TypingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1 py-0.5 px-0.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-1 h-1 rounded-full"
          style={{ background: color }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
