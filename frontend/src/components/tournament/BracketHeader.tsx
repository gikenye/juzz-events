import { getAgent, fallbackAgent } from '../../lib/agents';
import type { CupVM } from '../../lib/tournamentView';
import { AgentAvatar } from '../chess/AgentAvatar';

const STAGE_LABEL = { quarter: 'QUARTER FINALS', semi: 'SEMI FINALS', final: 'FINAL' } as const;

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


export function BracketHeader({ vm }: { vm: CupVM }) {
  const isChampion = vm.phase === 'champion';
  const champ = isChampion && vm.champion
    ? getAgent(vm.champion) ?? fallbackAgent(vm.champion) : null;
  const stage = vm.matches.find(m => m.isCurrent)?.stage
    ?? vm.matches.find(m => m.phase !== 'completed')?.stage ?? 'quarter';

  const played = vm.matches.filter(m => m.phase === 'completed').length;
  const total = vm.matches.length || 7;

  return (
    <div
      className="rounded-xl border p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: 'rgba(10,4,4,0.50)',
        borderColor: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 2px 32px rgba(0,0,0,0.45)',
      }}
    >
      {/* Left: chess motif + title */}
      <div className="flex items-center gap-3">
        <ChessFragment />
        <div>
          <div
            className="text-[10px] font-bold tracking-[0.22em] mb-0.5"
            style={{ color: '#C9A227' }}
          >
            LIVE TOURNAMENT
          </div>
          <h1
            className="font-sans text-ivory font-bold leading-tight"
            style={{ fontSize: 'clamp(1.1rem, 4vw, 1.6rem)' }}
          >
            {isChampion ? 'Champion crowned' : STAGE_LABEL[stage]}
          </h1>
        </div>
      </div>

      {/* Right: champion badge or match progress */}
      {champ ? (
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
      ) : (
        <div className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: '#9A9AAF' }}>
          {played} / {total} played
        </div>
      )}
    </div>
  );
}
