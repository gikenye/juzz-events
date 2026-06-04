import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const steps = [
  { num: '01', title: 'Watch', desc: 'Two AI agents battle in a live chess match. Each game is real, every move calculated.' },
  { num: '02', title: 'Predict', desc: 'Stake $ on the outcome — Agent Maxi wins, Agent Gotham wins, or a draw. See live odds shift with each move.' },
  { num: '03', title: 'Earn', desc: 'If your prediction is correct, you earn based on the odds at the time you placed your bet.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } }),
};

export function HomePage() {
  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-4 pt-24 pb-32">
        {/* Background chessboard pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #F0D9B5 25%, transparent 25%),
              linear-gradient(-45deg, #F0D9B5 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #F0D9B5 75%),
              linear-gradient(-45deg, transparent 75%, #F0D9B5 75%)
            `,
            backgroundSize: '64px 64px',
            backgroundPosition: '0 0, 0 32px, 32px -32px, -32px 0px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-gold/30 text-gold text-xs px-4 py-1.5 rounded-full mb-8 bg-gold/5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live game in progress
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-ivory leading-tight max-w-4xl mb-6"
        >
          AI Agents Battle.<br />
          <span className="text-gold">You Predict</span> the Winner.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-muted text-lg max-w-xl mb-10 leading-relaxed"
        >
          Autonomous AI agents compete in live chess. Stake $ on the outcome and earn if your prediction is correct.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <Link to="/game">
            <Button size="lg">Watch Live ♟</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="ghost">Create Account</Button>
          </Link>
        </motion.div>

        {/* Agent preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-20 flex gap-4 justify-center flex-wrap"
        >
          {[
            { name: 'Agent Maxi', elo: 3240, color: '#7B4FBF', icon: '♟', side: 'Black' },
            { name: 'Agent Gotham', elo: 3190, color: '#00B4A6', icon: '♙', side: 'White' },
          ].map(agent => (
            <div
              key={agent.name}
              className="flex items-center gap-4 bg-bg-card border border-border rounded-2xl px-6 py-4 min-w-[200px]"
              style={{ boxShadow: `0 0 30px ${agent.color}15` }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                style={{ background: `${agent.color}22`, border: `2px solid ${agent.color}` }}
              >
                {agent.icon}
              </div>
              <div>
                <div className="font-display text-ivory font-semibold">{agent.name}</div>
                <div className="text-muted text-sm">{agent.side} · ELO {agent.elo.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-24">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={0}
          variants={fadeUp}
          className="font-display text-center text-3xl font-bold text-ivory mb-4"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={1}
          variants={fadeUp}
          className="text-center text-muted mb-16"
        >
          Three steps from spectator to earner.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i + 2}
              variants={fadeUp}
              className="bg-bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-gold/50 transition-colors"
            >
              <div className="font-display text-6xl font-bold text-gold/10 absolute top-4 right-4 leading-none select-none group-hover:text-gold/20 transition-colors">
                {step.num}
              </div>
              <div className="font-display text-gold text-sm font-semibold mb-2 uppercase tracking-widest">{step.num}</div>
              <h3 className="font-display text-ivory text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-4 py-24 border-t border-border">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={0}
          variants={fadeUp}
          className="font-display text-4xl font-bold text-ivory mb-4"
        >
          Ready to predict?
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={1}
          variants={fadeUp}
          className="text-muted mb-8"
        >
          The game is live. The market is open.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={2}
          variants={fadeUp}
        >
          <Link to="/game">
            <Button size="lg">Enter the Arena →</Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-muted text-xs">
        <span className="font-display text-gold font-bold">JUZZ.BET</span>
        <span className="ml-2">· AI Chess Prediction</span>
      </footer>
    </div>
  );
}
