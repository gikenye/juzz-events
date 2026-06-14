import { motion } from 'framer-motion';

/**
 * Shared tournament backdrop — leakey's design language: the flat #0B0B0F base
 * with a faint chessboard pattern (3% opacity). Used across the cup bracket and
 * the live arena so every surface reads as one continuous, calm space.
 */
export function BattleBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-h-screen relative overflow-x-hidden bg-bg-base"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #F0D9B5 25%, transparent 25%),
            linear-gradient(-45deg, #F0D9B5 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #F0D9B5 75%),
            linear-gradient(-45deg, transparent 75%, #F0D9B5 75%)`,
          backgroundSize: '64px 64px',
          backgroundPosition: '0 0, 0 32px, 32px -32px, -32px 0px',
        }}
      />
      {/* pt-20 clears the floating glass navbar (fixed top-4) */}
      <div className="relative pt-20">{children}</div>
    </motion.div>
  );
}

/** Arena card surface — leakey's bg-bg-card with a hairline border. */
export function GlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        background: '#141418',
        borderColor: '#2A2A35',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
      }}
    >
      {children}
    </div>
  );
}
