import { motion } from 'framer-motion';
import { useTournamentStore } from '../store/tournamentStore';
import { deriveLiveState, matchStatus, participantsKnown, NUM_MATCHES } from '../lib/tournament';
import { BracketHeader } from '../components/tournament/BracketHeader';
import { MatchCard } from '../components/tournament/MatchCard';

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

export function AllGamesPage() {
  const tournament = useTournamentStore(s => s.tournament);
  const now = useTournamentStore(s => s.now);
  const live = deriveLiveState(tournament, now);

  let featuredIndex = live.currentIndex;
  if (live.phase === 'break' && live.currentIndex < NUM_MATCHES - 1) {
    featuredIndex = live.currentIndex + 1;
  }
  const featured = tournament.matches[featuredIndex];

  const upcoming = tournament.matches.filter(
    m => matchStatus(m, now) === 'upcoming' && m.index !== featuredIndex && participantsKnown(tournament, m, now),
  );
  const completed = tournament.matches.filter(m => matchStatus(m, now) === 'completed');

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
        <BracketHeader />

        {/* Featured / current game */}
        <div className="flex flex-col gap-4">
          <SectionDivider label={matchStatus(featured, now) === 'live' ? 'Now Playing' : 'Up Next'} />
          <MatchCard match={featured} featured />
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionDivider label="Upcoming" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcoming.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {/* Results */}
        {completed.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionDivider label="Results" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completed.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
