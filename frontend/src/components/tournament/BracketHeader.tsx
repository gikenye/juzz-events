import { useTournamentStore } from '../../store/tournamentStore';
import { getAgent } from '../../lib/agents';
import { deriveLiveState, stageLabel } from '../../lib/tournament';
import { AgentAvatar } from '../chess/AgentAvatar';

/** Four tiny chess squares — like a corner fragment of a board. */
function ChessFragment() {
  const sq = [
    { x: 0, y: 0, light: true },
    { x: 1, y: 0, light: false },
    { x: 0, y: 1, light: false },
    { x: 1, y: 1, light: true },
  ];
  return (
    <div className="grid shrink-0 opacity-40" style={{ gridTemplateColumns: 'repeat(2, 10px)', gap: 1 }}>
      {sq.map((s, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: s.light ? '#F0D9B5' : '#B58863',
          }}
        />
      ))}
    </div>
  );
}


export function BracketHeader() {
  const tournament = useTournamentStore(s => s.tournament);
  const now = useTournamentStore(s => s.now);
  const live = deriveLiveState(tournament, now);

  const isChampion = live.phase === 'champion';
  const champ = isChampion ? getAgent(tournament.champion) : null;
  const stage = live.match?.stage ?? 'quarter';

  return (
    <div
      className="rounded-xl border p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: 'rgba(10,4,4,0.45)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Left: chess motif + title */}
      <div className="flex items-center gap-3">
        <ChessFragment />
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.22em] mb-0.5"
            style={{ color: '#C9A227' }}
          >
            Live Tournament
          </div>
          <h1
            className="font-display text-ivory font-bold leading-tight"
            style={{ fontSize: 'clamp(1.1rem, 4vw, 1.6rem)' }}
          >
            {isChampion ? 'Champion Crowned' : stageLabel(stage)}
          </h1>
        </div>
      </div>

      {/* Right: champion badge only */}
      {champ && (
        <div
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgba(201,162,39,0.35)', background: 'rgba(201,162,39,0.07)' }}
        >
          <AgentAvatar agent={champ} className="w-8 h-8" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C9A227' }}>
              ♛ Champion
            </div>
            <div className="font-display text-ivory font-semibold text-sm leading-tight">
              {champ.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
