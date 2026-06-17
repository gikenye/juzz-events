import { motion } from 'framer-motion';
import { impliedOdds } from '../../lib/odds';
import type { Agent } from '../../types';
import type { SlotKey } from '../../store/marketStore';
import { AgentAvatar } from '../chess/AgentAvatar';

export interface SlotView {
  key: SlotKey;
  label: string;          // short display name ('Maxi' | 'Draw')
  color: string;          // accent hex
  prob: number;           // normalized win probability
  agent?: Agent | null;   // for the avatar (null = no avatar, e.g. draw)
}

interface OddsDisplayProps {
  outcomes: SlotView[];   // 2 or 3 outcomes (a, draw?, b)
  onSelect?: (key: SlotKey) => void;
  selected?: SlotKey | null;
  readOnly?: boolean;
}

export function OddsDisplay({ outcomes, onSelect, selected = null, readOnly = false }: OddsDisplayProps) {
  const handleSelect = (key: SlotKey) => {
    if (!readOnly) onSelect?.(key);
  };
  const first = outcomes[0];
  const last  = outcomes[outcomes.length - 1];

  return (
    <>
      {/* ── Mobile: win-probability bar + side buttons ── */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Inter', sans-serif", color: '#FF7A00', fontSize: 11, fontWeight: 600, minWidth: 32 }}>
            {((first?.prob ?? 0) * 100).toFixed(0)}%
          </span>
          <div className="flex flex-1 rounded-full overflow-hidden h-2" style={{ background: 'rgba(255,60,0,0.12)' }}>
            {outcomes.map(o => (
              <motion.div
                key={o.key}
                style={{ background: o.key === first?.key ? 'linear-gradient(90deg,#FF3300,#FF7A00)' : 'rgba(255,80,0,0.35)' }}
                animate={{ flexGrow: Math.max(o.prob, 0.001) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", color: '#C07840', fontSize: 11, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
            {((last?.prob ?? 0) * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex gap-2">
          {outcomes.map(o => {
            const isSelected = selected === o.key;
            const odd = impliedOdds(o.prob);
            return (
              <motion.button
                key={o.key}
                onClick={() => handleSelect(o.key)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                style={{
                  border: `1px solid ${isSelected ? 'rgba(255,122,0,0.80)' : 'rgba(255,60,0,0.22)'}`,
                  background: isSelected ? 'rgba(255,100,0,0.18)' : 'rgba(0,0,0,0.25)',
                  borderRadius: 2,
                  boxShadow: isSelected ? '0 0 18px rgba(255,80,0,0.28)' : 'none',
                }}
                whileTap={readOnly ? undefined : { scale: 0.96 }}
              >
                <div className="flex items-center gap-1">
                  {o.agent
                    ? <AgentAvatar agent={o.agent} className="w-5 h-5" />
                    : <span className="w-2 h-2 rounded-full" style={{ background: o.color }} />}
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFD0A0', fontSize: 14, fontWeight: 600, letterSpacing: 0.5, lineHeight: 1.2 }}>{o.label}</span>
                </div>
                <motion.span
                  key={odd}
                  style={{ fontFamily: "'Cinzel', serif", color: '#FFBE00', fontSize: 18, fontWeight: 700, textShadow: isSelected ? '0 0 12px rgba(255,122,0,0.8)' : 'none' }}
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
              className={`relative text-left transition-all duration-200 overflow-hidden px-4 py-3 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              style={{
                border: `1px solid ${isSelected ? 'rgba(255,122,0,0.80)' : 'rgba(255,60,0,0.22)'}`,
                background: isSelected ? 'rgba(255,100,0,0.14)' : 'rgba(0,0,0,0.28)',
                borderRadius: 2,
                boxShadow: isSelected ? '0 0 20px rgba(255,80,0,0.25), inset 0 0 20px rgba(255,60,0,0.06)' : 'none',
              }}
              whileTap={readOnly ? undefined : { scale: 0.98 }}
            >
              {/* probability fill bar */}
              <motion.div
                className="absolute inset-y-0 left-0 opacity-10"
                style={{ background: 'linear-gradient(90deg,#FF3300,#FF7A00)', borderRadius: 2 }}
                animate={{ width: `${o.prob * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {o.agent
                    ? <AgentAvatar agent={o.agent} className="w-9 h-9 shrink-0" />
                    : <span className="w-7 h-7 rounded-full shrink-0" style={{ background: o.color }} />}
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFD0A0', fontSize: 15, fontWeight: 600, letterSpacing: 0.5 }}>{o.label}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", color: '#C07840', fontSize: 11, marginTop: 2 }}>{(o.prob * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <motion.div
                    key={odd}
                    style={{ fontFamily: "'Cinzel', serif", color: '#FFBE00', fontSize: 22, fontWeight: 700, textShadow: isSelected ? '0 0 12px rgba(255,122,0,0.8)' : '0 0 8px rgba(255,120,0,0.4)' }}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    ×{odd.toFixed(2)}
                  </motion.div>
                  <div style={{ color: '#C07840', fontSize: 11 }}>odds</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
