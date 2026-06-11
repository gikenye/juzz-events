import { motion } from 'framer-motion';
import { impliedOdds } from '../../lib/odds';
import type { SlotKey } from '../../store/marketStore';

export interface SlotView {
  key: SlotKey;
  label: string;     // short display name ('Maxi' | 'Draw')
  color: string;     // accent hex
  prob: number;      // normalized win probability
}

interface OddsDisplayProps {
  outcomes: SlotView[];
  onSelect?: (key: SlotKey) => void;
  selected?: SlotKey | null;
  readOnly?: boolean;
}

export function OddsDisplay({ outcomes, onSelect, selected = null, readOnly = false }: OddsDisplayProps) {
  const handleSelect = (key: SlotKey) => {
    if (!readOnly) onSelect?.(key);
  };

  return (
    <>
      {/* ── Mobile: win-probability bar + outcome buttons ── */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="flex rounded-full overflow-hidden h-6 w-full">
          {outcomes.map(o => {
            const pct = o.prob * 100;
            return (
              <motion.div
                key={o.key}
                className="flex items-center justify-center overflow-hidden"
                style={{ background: o.color + '99' }}
                animate={{ flexGrow: Math.max(o.prob, 0.001) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {pct >= 12 && (
                  <span className="text-[10px] font-semibold text-white/90 leading-none select-none">
                    {pct.toFixed(0)}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-2">
          {outcomes.map(o => {
            const isSelected = selected === o.key;
            const odd = impliedOdds(o.prob);
            return (
              <motion.button
                key={o.key}
                onClick={() => handleSelect(o.key)}
                className={`flex-1 flex flex-col items-center justify-center rounded-xl py-3 px-1 border transition-all duration-200 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                style={{
                  borderColor: isSelected ? o.color : '#2A2A35',
                  background: isSelected ? o.color + '33' : o.color + '18',
                }}
                whileTap={readOnly ? undefined : { scale: 0.96 }}
              >
                <span className="text-muted text-[11px] leading-tight mb-1">{o.label}</span>
                <motion.span
                  key={odd}
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: o.color }}
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

      {/* ── Desktop: stacked outcome cards ── */}
      <div className="hidden lg:flex flex-col gap-2">
        {outcomes.map(o => {
          const odd = impliedOdds(o.prob);
          const isSelected = selected === o.key;
          return (
            <motion.button
              key={o.key}
              onClick={() => handleSelect(o.key)}
              className={`relative rounded-lg p-3 border text-left transition-all duration-200 overflow-hidden ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              style={{
                borderColor: isSelected ? o.color : '#2A2A35',
                background: isSelected ? o.color + '33' : '#141418',
              }}
              whileTap={readOnly ? undefined : { scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-lg opacity-20"
                style={{ background: o.color }}
                animate={{ width: `${o.prob * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div>
                  <div className="text-ivory text-sm font-medium">{o.label}</div>
                  <div className="text-muted text-xs mt-0.5">{(o.prob * 100).toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <motion.div
                    key={odd}
                    className="font-display font-bold text-xl"
                    style={{ color: o.color }}
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
