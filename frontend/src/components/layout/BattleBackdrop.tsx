import { motion } from 'framer-motion';

/**
 * The shared tournament backdrop — Battle Eve (chess pawns in red light,
 * photo by Chris F, Pexels) under a warm-to-dark gradient. Used across the
 * cup bracket and the live arena so every tournament surface reads as one
 * continuous space.
 */
export function BattleBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: '#080000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/8331411/pexels-photo-8331411.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 50%',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(30,2,2,0.55) 0%, rgba(6,0,0,0.80) 60%, rgba(2,0,0,0.92) 100%)',
        }}
      />
      {/* pt-20 clears the floating glass navbar (fixed top-4) */}
      <div className="relative pt-20">{children}</div>
    </motion.div>
  );
}

/** Leakey's glass surface — the card language used for arena panels. */
export function GlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        background: 'rgba(10,4,4,0.55)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
      }}
    >
      {children}
    </div>
  );
}
