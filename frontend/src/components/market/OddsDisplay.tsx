import { motion } from 'framer-motion';
import { impliedOdds } from '../../lib/odds';
import type { Agent, Side, WinProb } from '../../types';

interface OddsDisplayProps {
  agentA: Agent;
  agentB: Agent;
  probabilities: WinProb;
  onSelect?: (side: Side) => void;
  selected?: Side | null;
  readOnly?: boolean;
}

const shortName = (a: Agent) => a.name.replace(/^Agent\s+/, '');

export function OddsDisplay({ agentA, agentB, probabilities, onSelect, selected = null, readOnly = false }: OddsDisplayProps) {
  const handleSelect = (side: Side) => {
    if (!readOnly) onSelect?.(side);
  };
  const sides: { key: Side; agent: Agent }[] = [
    { key: 'a', agent: agentA },
    { key: 'b', agent: agentB },
  ];

  return (
    <>
      {/* ── Mobile: win-probability bar + side buttons ── */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="flex rounded-full overflow-hidden h-6 w-full">
          {sides.map(({ key, agent }) => {
            const pct = probabilities[key] * 100;
            return (
              <motion.div
                key={key}
                className="flex items-center justify-center overflow-hidden"
                style={{ background: agent.color + '99' }}
                animate={{ flexGrow: probabilities[key] }}
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
          {sides.map(({ key, agent }) => {
            const isSelected = selected === key;
            const odd = impliedOdds(probabilities[key]);
            return (
              <motion.button
                key={key}
                onClick={() => handleSelect(key)}
                className={`flex-1 flex flex-col items-center justify-center rounded-xl py-3 px-1 border transition-all duration-200 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                style={{
                  borderColor: isSelected ? agent.color : '#2A2A35',
                  background: isSelected ? agent.color + '33' : agent.color + '18',
                }}
                whileTap={readOnly ? undefined : { scale: 0.96 }}
              >
                <span className="text-muted text-[11px] leading-tight mb-1">{shortName(agent)}</span>
                <motion.span
                  key={odd}
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: agent.color }}
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
        {sides.map(({ key, agent }) => {
          const prob = probabilities[key];
          const odd = impliedOdds(prob);
          const isSelected = selected === key;
          return (
            <motion.button
              key={key}
              onClick={() => handleSelect(key)}
              className={`relative rounded-lg p-3 border text-left transition-all duration-200 overflow-hidden ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              style={{
                borderColor: isSelected ? agent.color : '#2A2A35',
                background: isSelected ? agent.color + '33' : '#141418',
              }}
              whileTap={readOnly ? undefined : { scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-lg opacity-20"
                style={{ background: agent.color }}
                animate={{ width: `${prob * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div>
                  <div className="text-ivory text-sm font-medium">{agent.name}</div>
                  <div className="text-muted text-xs mt-0.5">{(prob * 100).toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <motion.div
                    key={odd}
                    className="font-display font-bold text-xl"
                    style={{ color: agent.color }}
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
