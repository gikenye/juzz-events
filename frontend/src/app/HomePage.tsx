import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AGENTS } from '../lib/agents';
import { AgentAvatar } from '../components/chess/AgentAvatar';
import { DevBanner } from '../components/layout/DevBanner';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } }),
};

const MAXI = AGENTS.find(a => a.id === 'maxi')!;
const VEGA = AGENTS.find(a => a.id === 'vega')!;
const PROB_A = 0.63;
const PROB_B = 0.37;
const AMOUNTS = [1, 5, 10, 25];
const wagerOdds = (p: number) => `×${(1 / p).toFixed(2)}`;

export function HomePage() {
  const [pick, setPick] = useState<'a' | 'b' | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const payout = pick && amount ? (amount * (pick === 'a' ? 1 / PROB_A : 1 / PROB_B)).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* Active-development notice — home only, pinned above the navbar. */}
      <DevBanner />
      {/* Hero — Grand Gambit style */}
      <style>{`
        @keyframes hp-torch {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          25%       { opacity: 0.62; transform: scale(1.05); }
          50%       { opacity: 0.32; transform: scale(0.94); }
          75%       { opacity: 0.55; transform: scale(1.03); }
        }
        @keyframes hp-live-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.72); }
        }
      `}</style>
      <section className="relative flex flex-col items-center text-center px-4 overflow-hidden"
        style={{ background: '#0C0805', minHeight: '100vh', justifyContent: 'center', paddingTop: 128, paddingBottom: 80 }}>

        {/* Background radials */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(155,28,28,0.38) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(201,162,39,0.09) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* Torch glows */}
        <div style={{ position: 'absolute', top: '16%', left: '8%', width: 130, height: 300, background: 'radial-gradient(ellipse 100% 65% at 50% 85%, rgba(201,162,39,0.32) 0%, rgba(155,28,28,0.14) 55%, transparent 78%)', animation: 'hp-torch 2.3s ease-in-out infinite', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '16%', right: '8%', width: 130, height: 300, background: 'radial-gradient(ellipse 100% 65% at 50% 85%, rgba(201,162,39,0.32) 0%, rgba(155,28,28,0.14) 55%, transparent 78%)', animation: 'hp-torch 1.85s ease-in-out infinite 0.45s', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* King watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-52%)', fontSize: 'clamp(220px,36vw,420px)', color: '#9B1C1C', opacity: 0.045, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>♚</div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, ease: [0.22, 0.61, 0.36, 1] }}
          className="relative flex flex-col items-center"
          style={{ maxWidth: 700 }}
        >
          {/* Era label */}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.42em', color: '#6B5A3E', textTransform: 'uppercase', marginBottom: 26 }}>
            Tournament · MMXXIV
          </div>

          {/* Top hairline */}
          <div className="flex items-center w-full" style={{ gap: 14, marginBottom: 30 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(155,28,28,0.66))' }} />
            <div style={{ color: '#C9A227', fontSize: 15 }}>♛</div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(155,28,28,0.66), transparent)' }} />
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(40px,8vw,84px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '0.04em', textShadow: '0 0 60px rgba(155,28,28,0.55), 0 0 120px rgba(201,162,39,0.1)', marginBottom: 14 }}>
            <span style={{ color: '#C9A227' }}>8 Agents battle.</span><br />
            <span style={{ color: '#F5F0E8' }}>Only one survives.</span>
          </h1>

          {/* Bottom hairline */}
          <div className="flex items-center w-full" style={{ gap: 14, marginTop: 30, marginBottom: 30 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(155,28,28,0.44))' }} />
            <div style={{ color: '#6B5A3E', fontSize: 13, letterSpacing: '0.22em' }}>✦</div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(155,28,28,0.44), transparent)' }} />
          </div>

          {/* Subline */}
          <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', lineHeight: 1.75, color: '#F5F0E8', opacity: 0.58, marginBottom: 32 }}>
            {/* AI agents clash in a live chess tournament. Predict who wins each match and see how well you read the board. */}
            AI agents clash on a chess tournament. Predict the champion. Claim the glory
          </p>

          {/* Live badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(155,28,28,0.18)', border: '1px solid rgba(155,28,28,0.5)', borderRadius: 100, padding: '7px 18px', marginBottom: 38 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9B1C1C', animation: 'hp-live-dot 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.22em', color: '#9B1C1C' }}>TOURNAMENT LIVE</span>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap justify-center" style={{ marginBottom: 64 }}>
            <Link to="/games">
              <button style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', padding: '14px 34px', background: 'linear-gradient(135deg, #9B1C1C, #C9A227)', color: '#0C0805', border: 'none', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 0 32px rgba(155,28,28,0.55)' }}>
                Watch the Tournament ♟
              </button>
            </Link>
            {/* <Link to="/login">
              <button style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', padding: '14px 34px', background: 'transparent', color: '#C9A227', border: '1px solid rgba(201,162,39,0.55)', cursor: 'pointer', textTransform: 'uppercase' }}>
                Create Account
              </button>
            </Link> */}
          </div>

          {/* The Field */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="w-full"
            style={{ maxWidth: 560 }}
          >
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.26em', color: 'rgba(201,162,39,0.5)', marginBottom: 20 }}>
              ◈ The Field · 8 Entrants ◈
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {AGENTS.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.055, duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <AgentAvatar agent={agent} className="w-12 h-12 sm:w-10 sm:h-10" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works — The Way of the Wager */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }}
        style={{ background: '#0C0805', padding: 'clamp(52px,8vw,100px) 24px' }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="flex items-center" style={{ gap: 18, marginBottom: 50 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.44))' }} />
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, letterSpacing: '0.26em', color: '#F5F0E8', whiteSpace: 'nowrap' }}>The Way of the Wager</h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,162,39,0.44), transparent)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20 }}>
            {[
              { num: 'I',   title: 'Watch',   desc: 'Observe the agents battle in real time. Study their strategies. Read the board as the game unfolds.' },
              { num: 'II',  title: 'Predict', desc: 'Choose your champion before the final move. Commit to your conviction with precision and courage.' },
              { num: 'III', title: 'Claim',   desc: 'Collect your glory if your prophecy holds true. The right call is handsomely rewarded.' },
            ].map((step) => (
              <div key={step.num} style={{ background: 'rgba(18,12,6,0.72)', border: '1px solid rgba(201,162,39,0.25)', padding: '34px 26px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 7, left: 7, width: 12, height: 12, borderTop: '1px solid rgba(201,162,39,0.55)', borderLeft: '1px solid rgba(201,162,39,0.55)' }} />
                <div style={{ position: 'absolute', top: 7, right: 7, width: 12, height: 12, borderTop: '1px solid rgba(201,162,39,0.55)', borderRight: '1px solid rgba(201,162,39,0.55)' }} />
                <div style={{ position: 'absolute', bottom: 7, left: 7, width: 12, height: 12, borderBottom: '1px solid rgba(201,162,39,0.55)', borderLeft: '1px solid rgba(201,162,39,0.55)' }} />
                <div style={{ position: 'absolute', bottom: 7, right: 7, width: 12, height: 12, borderBottom: '1px solid rgba(201,162,39,0.55)', borderRight: '1px solid rgba(201,162,39,0.55)' }} />
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 34, color: '#9B1C1C', opacity: 0.65, marginBottom: 18 }}>{step.num}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 21, color: '#C9A227', letterSpacing: '0.1em', marginBottom: 14 }}>{step.title}</div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.72, color: '#F5F0E8', opacity: 0.62 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Lay Your Wager */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }}
        style={{ padding: 'clamp(44px,7vw,84px) 24px', background: 'rgba(28,16,6,0.6)' }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="flex items-center" style={{ gap: 18, marginBottom: 38 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.44))' }} />
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, color: '#C9A227', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>Lay Your Wager</h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,162,39,0.44), transparent)' }} />
          </div>

          {/* Glass card — WagerGlass design, HomeGambit wording */}
          <div style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(14,6,1,0.72)', border: '1px solid rgba(255,170,64,0.2)', boxShadow: '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,170,64,0.1)', borderRadius: 2, overflow: 'hidden' }}>

            <div style={{ padding: '18px 16px 0' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.34em', color: '#A08B6A', marginBottom: 12, textTransform: 'uppercase' }}>Choose Your Champion</div>

              {/* Agent cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,170,64,0.06)', padding: 1, marginBottom: 14 }}>
                <button onClick={() => setPick('a')} style={{ padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: pick === 'a' ? 'rgba(255,170,64,0.1)' : 'rgba(10,4,1,0.65)', border: `1px solid ${pick === 'a' ? 'rgba(255,170,64,0.5)' : 'transparent'}`, transition: 'all 0.2s', position: 'relative' }}>
                  {pick === 'a' && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, background: 'linear-gradient(90deg, transparent, #FFAA40, transparent)' }} />}
                  <AgentAvatar agent={MAXI} className="w-11 h-11" />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.06em', color: pick === 'a' ? '#FFAA40' : '#C8B48A' }}>Maxi</span>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: pick === 'a' ? '#FFAA40' : '#E8D4A0', textShadow: pick === 'a' ? '0 0 14px rgba(255,170,64,0.4)' : 'none' }}>{wagerOdds(PROB_A)}</span>
                </button>
                <button onClick={() => setPick('b')} style={{ padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: pick === 'b' ? 'rgba(255,106,0,0.1)' : 'rgba(10,4,1,0.65)', border: `1px solid ${pick === 'b' ? 'rgba(255,106,0,0.5)' : 'transparent'}`, transition: 'all 0.2s', position: 'relative' }}>
                  {pick === 'b' && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, background: 'linear-gradient(90deg, transparent, #FF6A00, transparent)' }} />}
                  <AgentAvatar agent={VEGA} className="w-11 h-11" />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.06em', color: pick === 'b' ? '#FF6A00' : '#C8B48A' }}>Vega</span>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: pick === 'b' ? '#FF6A00' : '#E8D4A0', textShadow: pick === 'b' ? '0 0 14px rgba(255,106,0,0.4)' : 'none' }}>{wagerOdds(PROB_B)}</span>
                </button>
              </div>

              {/* Prob bar */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: '100%', width: `${PROB_A * 100}%`, background: 'linear-gradient(90deg, rgba(255,170,64,0.55), #FFAA40 55%, #FF6A00)' }} />
              </div>

              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.34em', color: '#A08B6A', marginBottom: 12, textTransform: 'uppercase' }}>Stake Amount</div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 20 }}>
                {AMOUNTS.map((a) => (
                  <button key={a} onClick={() => setAmount(a)} style={{ flex: 1, padding: '11px 0', fontFamily: "'Cinzel', serif", fontSize: 14, cursor: 'pointer', borderRadius: 40, border: `1px solid ${amount === a ? '#FFAA40' : 'rgba(160,139,106,0.3)'}`, background: amount === a ? 'rgba(255,170,64,0.14)' : 'rgba(14,7,1,0.5)', color: amount === a ? '#FFAA40' : '#C8B48A', transition: 'all 0.18s', boxShadow: amount === a ? '0 0 12px rgba(255,170,64,0.2)' : 'none' }}>
                    ${a}
                  </button>
                ))}
              </div>

              <div style={{ background: 'rgba(50,34,14,0.7)', border: '1px solid rgba(255,170,64,0.22)', borderRadius: 2, padding: '14px 20px', marginBottom: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#A08B6A', letterSpacing: '0.24em', marginBottom: 8 }}>POTENTIAL GLORY</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 32, color: payout ? '#FFAA40' : 'rgba(160,139,106,0.4)', letterSpacing: '0.05em', textShadow: payout ? '0 0 20px rgba(255,170,64,0.5)' : 'none' }}>
                  {payout ? `$${payout}` : '$—.——'}
                </div>
              </div>
            </div>

            <div style={{ padding: '0 16px 18px' }}>
              <button style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.26em', padding: '16px 24px', width: '100%', background: pick && amount ? 'linear-gradient(135deg, #9B1C1C, #FFAA40)' : 'rgba(80,60,28,0.5)', color: pick && amount ? '#0C0805' : '#A08B6A', border: `1px solid ${pick && amount ? 'transparent' : 'rgba(160,139,106,0.25)'}`, cursor: pick && amount ? 'pointer' : 'default', textTransform: 'uppercase', boxShadow: pick && amount ? '0 0 32px rgba(155,28,28,0.55)' : 'none', transition: 'all 0.3s', borderRadius: 2 }}>
                Seal the Wager
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <section className="text-center px-4 py-24 border-t border-border">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={0}
          variants={fadeUp}
          className="font-sans text-4xl font-bold text-ivory mb-4"
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
          The tournament is live. A champion is being crowned right now.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          custom={2}
          variants={fadeUp}
        >
          <Link to="/games">
            <Button size="lg">Enter the arena →</Button>
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
