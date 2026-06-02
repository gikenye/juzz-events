import { motion, AnimatePresence } from 'framer-motion';

interface AgentCardProps {
  name: string;
  color: 'maxi' | 'gotham';
  elo: number;
  points: number;
  isActive: boolean; // true when it's this agent's turn
}

const configs = {
  maxi: {
    accent: '#7B4FBF',
    accentLight: '#9D72E0',
    label: 'Black',
    icon: '♟',
  },
  gotham: {
    accent: '#00B4A6',
    accentLight: '#00D4C4',
    label: 'White',
    icon: '♙',
  },
};

export function AgentCard({ name, color, elo, points, isActive }: AgentCardProps) {
  const cfg = configs[color];

  return (
    <div
      className="flex items-center gap-3 bg-bg-card rounded-xl p-3 border transition-all duration-300"
      style={{ borderColor: isActive ? cfg.accent : '#2A2A35' }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-2xl shrink-0"
        style={{
          background: `radial-gradient(circle, ${cfg.accentLight}22 0%, ${cfg.accent}44 100%)`,
          boxShadow: isActive ? `0 0 16px ${cfg.accent}60` : 'none',
          border: `2px solid ${cfg.accent}`,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {cfg.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-ivory text-sm font-semibold truncate">{name}</span>
          {isActive && (
            <span className="shrink-0 w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.accent }} />
          )}
        </div>
        <div className="text-muted text-xs mt-0.5">ELO {elo.toLocaleString()} · {cfg.label}</div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={points}
            initial={{ scale: 1.3, color: cfg.accentLight }}
            animate={{ scale: 1, color: '#F5F0E8' }}
            className="font-display font-bold text-lg"
          >
            {points}
          </motion.div>
        </AnimatePresence>
        <div className="text-muted text-xs">pts</div>
      </div>
    </div>
  );
}
