import { useTournamentStore } from '../../store/tournamentStore';
import { useAgentNames } from './useAgentNames';

export function TournamentRail() {
  const snapshot = useTournamentStore(s => s.snapshot);
  const nameOf = useAgentNames();
  if (!snapshot) return null;

  const champion = snapshot.status.state === 'complete' ? snapshot.status.champion : null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-ivory text-sm font-semibold">{snapshot.name}</h3>
        {champion && <span className="text-gold text-xs font-semibold">🏆 {nameOf(champion)}</span>}
      </div>
      <div className="flex flex-col gap-3">
        {snapshot.rounds.map((round, ri) => (
          <div key={round.name + ri}>
            <p className="text-muted text-[10px] uppercase tracking-widest mb-1">{round.name}</p>
            <div className="flex flex-col gap-1">
              {round.matches.map((m, mi) => {
                const live = snapshot.current?.round === ri && snapshot.current?.match_index === mi;
                return (
                  <div key={mi}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs border ${
                      live ? 'border-gold/60 bg-gold/5' : 'border-transparent'}`}>
                    <span className={m.winner === m.a ? 'text-gold font-semibold' : m.winner ? 'text-muted line-through' : 'text-ivory'}>
                      {nameOf(m.a)}
                    </span>
                    <span className="text-muted px-2">{live ? '•' : 'vs'}</span>
                    <span className={m.winner === m.b ? 'text-gold font-semibold' : m.winner ? 'text-muted line-through' : 'text-ivory'}>
                      {nameOf(m.b)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
