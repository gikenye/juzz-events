import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTournamentStore } from '../store/tournamentStore';
import { useMarketStore } from '../store/marketStore';
import { buildCupVM, formatCountdown } from '../lib/tournamentView';
import { getAgent, fallbackAgent } from '../lib/agents';
import { BracketHeader } from '../components/tournament/BracketHeader';
import { MatchCard } from '../components/tournament/MatchCard';
import { AgentAvatar } from '../components/chess/AgentAvatar';

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #2A2A35)' }} />
      <span
        className="text-[10px] font-bold uppercase tracking-[0.22em] flex items-center gap-2 select-none"
        style={{ color: '#C9A227' }}
      >
        <span style={{ opacity: 0.45 }}>◈</span>
        {label}
        <span style={{ opacity: 0.45 }}>◈</span>
      </span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #2A2A35, transparent)' }} />
    </div>
  );
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: '#080000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Battle Eve — chess pawns in red light (photo by Chris F, Pexels) */}
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
      {/* Gradient overlay — preserves the red warmth, darkens for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(30,2,2,0.55) 0%, rgba(6,0,0,0.80) 60%, rgba(2,0,0,0.92) 100%)',
        }}
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {children}
      </div>
    </motion.div>
  );
}

export function AllGamesPage() {
  const snapshot = useTournamentStore(s => s.snapshot);
  const league = useTournamentStore(s => s.league);
  const startsAt = useTournamentStore(s => s.nextMatchStartsAtMs);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const now = useTournamentStore(s => s.now);
  const slots = useMarketStore(s => s.slots);
  const mode = useMarketStore(s => s.mode);

  useEffect(() => {
    useTournamentStore.getState().bind();
    useMarketStore.getState().bind();
  }, []);

  const vm = buildCupVM(snapshot, league, startsAt, now - offset);

  // ── Between cups: countdown + standings (futures land here next) ──
  if (vm.phase === 'gap' || vm.phase === 'exhibition') {
    const standings = league?.standings ?? [];
    return (
      <Backdrop>
        <div className="text-center pt-8">
          <p className="text-muted text-xs uppercase tracking-[0.22em] mb-2">
            {vm.phase === 'gap' ? 'Next Cup' : 'Exhibition'}
          </p>
          {vm.phase === 'gap' && vm.nextCupAtMs ? (
            <h1 className="font-display text-gold text-4xl font-bold tabular-nums">
              {formatCountdown(vm.nextCupAtMs + offset - now)}
            </h1>
          ) : (
            <Link to="/game" className="font-display text-gold text-2xl font-bold hover:text-gold-light transition-colors">
              Live now — watch the board →
            </Link>
          )}
          {league?.last_champion && (
            <p className="text-ivory text-sm mt-3">
              🏆 Reigning champion: <span className="text-gold font-semibold">
                {(getAgent(league.last_champion) ?? fallbackAgent(league.last_champion)).name}
              </span>
            </p>
          )}
        </div>

        {standings.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionDivider label="Season Standings" />
            <div className="rounded-2xl border p-4" style={{ background: '#141418', borderColor: '#2A2A35' }}>
              {standings.map((r, i) => {
                const agent = getAgent(r.agent_id) ?? fallbackAgent(r.agent_id, r.name);
                return (
                  <div key={r.agent_id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#1C1C24' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-muted text-xs tabular-nums w-5">{i + 1}</span>
                      <AgentAvatar agent={agent} className="w-8 h-8 shrink-0" />
                      <span className="text-ivory text-sm font-semibold truncate">{agent.name}</span>
                      {r.titles > 0 && <span className="text-gold text-xs">{'🏆'.repeat(Math.min(r.titles, 3))}</span>}
                    </div>
                    <span className="text-gold font-display font-bold tabular-nums">{r.points}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Backdrop>
    );
  }

  // ── Cup live ──
  const featured = vm.matches.find(m => m.isCurrent)
    ?? vm.matches.find(m => m.phase !== 'completed')
    ?? vm.matches[vm.matches.length - 1];
  const liveProb = mode === 'match' && featured.phase !== 'completed' && slots.length === 2
    ? { a: slots[0].prob, b: slots[1].prob } : null;
  const countdownTarget = featured.phase === 'countdown' ? vm.startsAtMs + offset : 0;

  const upcoming = vm.matches.filter(m => m.phase === 'upcoming' && m.id !== featured.id && m.aId && m.bId);
  const tbd = vm.matches.filter(m => m.phase === 'upcoming' && m.id !== featured.id && (!m.aId || !m.bId));
  const completed = vm.matches.filter(m => m.phase === 'completed');

  return (
    <Backdrop>
      <BracketHeader vm={vm} />

      {/* Featured / current game */}
      <div className="flex flex-col gap-4">
        <SectionDivider label={featured.phase === 'live' ? 'Now Playing' : 'Up Next'} />
        <MatchCard match={featured} matches={vm.matches} featured liveProb={liveProb} countdownTarget={countdownTarget} />
      </div>

      {/* Upcoming */}
      {(upcoming.length > 0 || tbd.length > 0) && (
        <div className="flex flex-col gap-4">
          <SectionDivider label="Upcoming" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...upcoming, ...tbd].map(m => <MatchCard key={m.id} match={m} matches={vm.matches} />)}
          </div>
        </div>
      )}

      {/* Results */}
      {completed.length > 0 && (
        <div className="flex flex-col gap-4">
          <SectionDivider label="Results" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completed.map(m => <MatchCard key={m.id} match={m} matches={vm.matches} />)}
          </div>
        </div>
      )}
    </Backdrop>
  );
}
