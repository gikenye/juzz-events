import { motion } from 'framer-motion';
import { useMarketStore } from '../../store/marketStore';
import { probabilitiesToOdds } from '../../lib/odds';
import type { Outcome } from '../../types';

interface OddsDisplayProps {
  onSelect: (outcome: Outcome) => void;
  selected: Outcome | null;
}

const OUTCOMES: { key: Outcome; label: string; shortLabel: string; color: string; bg: string; selectedBg: string }[] = [
  { key: 'maxi',   label: 'Agent Maxi',   shortLabel: 'Maxi',   color: '#7B4FBF', bg: '#7B4FBF18', selectedBg: '#7B4FBF33' },
  { key: 'draw',   label: 'Draw',          shortLabel: 'Draw',   color: '#C9A227', bg: '#C9A22718', selectedBg: '#C9A22733' },
  { key: 'gotham', label: 'Agent Gotham', shortLabel: 'Gotham', color: '#00B4A6', bg: '#00B4A618', selectedBg: '#00B4A633' },
];

export function OddsDisplay({ onSelect, selected }: OddsDisplayProps) {
  const { probabilities } = useMarketStore();
  const odds = probabilitiesToOdds(probabilities);

  return (
    <div className="flex flex-col gap-2">
      {/* Probability bar */}
      <div className="flex rounded-full overflow-hidden h-6 w-full">
        {OUTCOMES.map(({ key, color }) => {
          const pct = probabilities[key] * 100;
          return (
            <motion.div
              key={key}
              className="flex items-center justify-center overflow-hidden"
              style={{ background: color + '99' }}
              animate={{ flexGrow: probabilities[key] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {pct >= 10 && (
                <span className="text-[10px] font-semibold text-white/90 leading-none select-none">
                  {pct.toFixed(0)}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Horizontal outcome buttons */}
      <div className="flex gap-2">
        {OUTCOMES.map(({ key, label, shortLabel, color, bg, selectedBg }) => {
          const odd = odds[key];
          const isSelected = selected === key;

          return (
            <motion.button
              key={key}
              onClick={() => onSelect(key)}
              className="flex-1 flex flex-col items-center justify-center rounded-xl py-3 px-1 border transition-all duration-200 cursor-pointer"
              style={{
                borderColor: isSelected ? color : '#2A2A35',
                background: isSelected ? selectedBg : bg,
              }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="text-muted text-[11px] leading-tight mb-1">{shortLabel}</span>
              <motion.span
                key={odd}
                className="font-display font-bold text-lg leading-none"
                style={{ color }}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
              >
                ×{odd.toFixed(2)}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
