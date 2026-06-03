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
    <>
      {/* ── Mobile: prob bar + horizontal buttons ── */}
      <div className="flex flex-col gap-2 lg:hidden">
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

        {/* Horizontal buttons */}
        <div className="flex gap-2">
          {OUTCOMES.map(({ key, shortLabel, color, bg, selectedBg }) => {
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
                  key={odds[key]}
                  className="font-display font-bold text-lg leading-none"
                  style={{ color }}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                >
                  ×{odds[key].toFixed(2)}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: vertical stacked cards ── */}
      <div className="hidden lg:flex flex-col gap-2">
        {OUTCOMES.map(({ key, label, color, bg, selectedBg }) => {
          const prob = probabilities[key];
          const odd = odds[key];
          const isSelected = selected === key;

          return (
            <motion.button
              key={key}
              onClick={() => onSelect(key)}
              className="relative rounded-lg p-3 border text-left transition-all duration-200 cursor-pointer overflow-hidden"
              style={{
                borderColor: isSelected ? color : '#2A2A35',
                background: isSelected ? selectedBg : '#141418',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Probability fill bar */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-lg opacity-20"
                style={{ background: color }}
                animate={{ width: `${prob * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div>
                  <div className="text-ivory text-sm font-medium">{label}</div>
                  <div className="text-muted text-xs mt-0.5">{(prob * 100).toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <motion.div
                    key={odd}
                    className="font-display font-bold text-xl"
                    style={{ color }}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    ×{odd.toFixed(2)}
                  </motion.div>
                  <div className="text-muted text-xs">odds</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
