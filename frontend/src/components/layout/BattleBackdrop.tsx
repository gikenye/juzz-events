import { motion } from 'framer-motion';

/**
 * The /games tournament backdrop — leakey's "Battle Eve" (chess pawns in red
 * light, photo by Chris F, Pexels) under a warm-to-dark gradient. Used on the
 * cup bracket page only; the live arena and wallet sit on the flat bg-bg-base.
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
