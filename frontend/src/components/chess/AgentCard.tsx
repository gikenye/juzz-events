import { motion } from 'framer-motion';

const PIECE_UNICODE: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

const PIECE_VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

interface AgentCardProps {
  name: string;
  color: 'maxi' | 'gotham';
  isActive: boolean;
  capturedPieces?: string[];
  capturedPieceColor?: 'white' | 'black';
}

const configs = {
  maxi: {
    accent: '#7B4FBF',
    accentLight: '#C4A3F5',
    bgFrom: '#B88EEA',
    bgTo: '#6a35b0',
    iconColor: '#1C0F36',
    lensColor: '#D4B0FF',
    glowColor: '#9D72E080',
  },
  gotham: {
    accent: '#00B4A6',
    accentLight: '#00D4C4',
    bgFrom: '#003d3a',
    bgTo: '#00877e',
    iconColor: '#C8F5F2',
    lensColor: '#002926',
    glowColor: '#00B4A680',
  },
};

// Maxi — robot queen: rectangular head, crown, glowing square eyes, speaker mouth
function MaxiIcon({ fill, lensColor }: { fill: string; lensColor: string }) {
  return (
    <g>
      {/* Crown — 3 peaks */}
      <polygon points="6,7 7.5,4.5 9.5,6.5 11,3.5 12.5,6.5 14.5,4.5 16,7" fill={fill} />
      {/* Robot head */}
      <rect x="4.5" y="7" width="13" height="11" rx="2.5" fill={fill} />
      {/* Glowing square eyes */}
      <rect x="6.5" y="9.5" width="3.5" height="2.5" rx="0.8" fill={lensColor} />
      <rect x="12"   y="9.5" width="3.5" height="2.5" rx="0.8" fill={lensColor} />
      {/* Speaker grille */}
      <rect x="7.5" y="14" width="7" height="1.5" rx="0.75" fill={lensColor} />
    </g>
  );
}

// Gotham — aviator pilot: rounded helmet, goggle band, circular goggle lenses
function GothamIcon({ fill, lensColor }: { fill: string; lensColor: string }) {
  return (
    <g>
      {/* Helmet/head oval */}
      <ellipse cx="11" cy="11" rx="7" ry="8.5" fill={fill} />
      {/* Goggle frame band across middle */}
      <rect x="3.5" y="9" width="15" height="5.5" rx="0.5" fill={fill} />
      {/* Left goggle lens */}
      <circle cx="8"  cy="11.75" r="2.8" fill={lensColor} />
      {/* Right goggle lens */}
      <circle cx="14" cy="11.75" r="2.8" fill={lensColor} />
      {/* Bridge between lenses */}
      <rect x="9.6" y="10.75" width="2.8" height="2" fill={fill} />
      {/* Chin strap / mouth detail */}
      <rect x="8.5" y="16.5" width="5" height="1.3" rx="0.65" fill={lensColor} />
    </g>
  );
}

function AgentAvatar({ color, isActive }: { color: 'maxi' | 'gotham'; isActive: boolean }) {
  const cfg = configs[color];

  return (
    <div className="relative w-11 h-11 shrink-0">
      {/* Outer glow pulse when active */}
      {isActive && (
        <motion.div
          className="absolute inset-[-3px] rounded-full"
          style={{ background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Avatar circle */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(145deg, ${cfg.bgFrom} 0%, ${cfg.bgTo} 100%)`,
          border: `2px solid ${isActive ? cfg.accentLight : cfg.accent + 'aa'}`,
          boxShadow: isActive
            ? `0 0 14px ${cfg.accent}90, inset 0 1px 0 ${cfg.accentLight}50`
            : `inset 0 1px 0 ${cfg.accentLight}25`,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}
      >
        <svg width="38" height="38" viewBox="0 0 22 22" fill="none">
          {color === 'maxi'
            ? <MaxiIcon fill={cfg.iconColor} lensColor={cfg.lensColor} />
            : <GothamIcon fill={cfg.iconColor} lensColor={cfg.lensColor} />
          }
        </svg>
      </div>
    </div>
  );
}

export function AgentCard({ name, color, isActive, capturedPieces = [], capturedPieceColor }: AgentCardProps) {
  const cfg = configs[color];

  const advantage = capturedPieces.reduce((sum, p) => sum + (PIECE_VALUE[p] ?? 0), 0);
  const sorted = [...capturedPieces].sort((a, b) => (PIECE_VALUE[b] ?? 0) - (PIECE_VALUE[a] ?? 0));
  const pieceColor = capturedPieceColor === 'white' ? '#F5F0E8' : '#888888';

  return (
    <div className="flex items-center gap-2.5">
      <AgentAvatar color={color} isActive={isActive} />

      {/* Name + active pulse */}
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="font-display text-ivory text-sm font-semibold">{name}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.accent }} />
        )}
      </div>

      {/* Captured pieces */}
      {sorted.length > 0 ? (
        <div className="flex items-center gap-0.5 flex-wrap flex-1 min-w-0">
          {sorted.map((piece, i) => (
            <span key={i} className="text-sm leading-none" style={{ color: pieceColor }}>
              {PIECE_UNICODE[piece] ?? piece}
            </span>
          ))}
          {advantage > 0 && (
            <span className="text-xs text-muted ml-0.5">+{advantage}</span>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

    </div>
  );
}
