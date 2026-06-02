import { motion } from 'framer-motion';
import { useMarketStore } from '../../store/marketStore';
import { probabilitiesToOdds } from '../../lib/odds';
import type { Outcome } from '../../types';

interface OddsDisplayProps {
  onSelect: (outcome: Outcome) => void;
  selected: Outcome | null;
}

const OUTCOMES: { key: Outcome; label: string; color: string; bg: string }[] = [
  { key: 'maxi',   label: 'Agent Maxi',   color: '#7B4FBF', bg: '#7B4FBF22' },
  { key: 'draw',   label: 'Draw',          color: '#C9A227', bg: '#C9A22722' },
  { key: 'gotham', label: 'Agent Gotham', color: '#00B4A6', bg: '#00B4A622' },
];

export function OddsDisplay({ onSelect, selected }: OddsDisplayProps) {
  const { probabilities } = useMarketStore();
  const odds = probabilitiesToOdds(probabilities);

  return (
    <div className="flex flex-col gap-2">
      {OUTCOMES.map(({ key, label, color, bg }) => {
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
              background: isSelected ? bg : '#141418',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Probability bar */}
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
  );
}
