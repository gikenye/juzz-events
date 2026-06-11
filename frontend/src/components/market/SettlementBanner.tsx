// The payout moment. Industry pattern: settlement feedback must persist until
// the user acknowledges it (never a vanishing toast) — the game auto-rolls
// underneath, the banner stays. One banner aggregates a batch settling together.
import { motion, AnimatePresence } from 'framer-motion';
import { usePositionsStore } from '../../store/positionsStore';

const COPY = {
  won:      (p: number) => `You called it · +$${p.toFixed(2)}`,
  refunded: (p: number) => `Draw — stake refunded · +$${p.toFixed(2)}`,
  lost:     ()          => 'Not this time',
} as const;

const TONE = {
  won:      'border-gold bg-gold/15 text-gold shadow-[0_0_24px_rgba(201,162,39,0.25)]',
  refunded: 'border-gotham/60 bg-gotham/10 text-gotham',
  lost:     'border-border bg-bg-card text-muted',
} as const;

export function SettlementBanner() {
  const banner  = usePositionsStore(s => s.banner);
  const dismiss = usePositionsStore(s => s.dismissBanner);

  return (
    <AnimatePresence>
      {banner && (
        <motion.button
          key="settlement"
          onClick={dismiss}
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className={`w-full mb-4 py-3 px-4 rounded-xl border font-display font-semibold tracking-wide text-center ${TONE[banner.state]}`}
        >
          {banner.state === 'lost' ? COPY.lost() : COPY[banner.state](banner.payout)}
          <span className="block text-xs font-sans font-normal opacity-70 mt-0.5">
            {banner.count > 1 ? `${banner.count} predictions settled · ` : ''}tap to dismiss
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
