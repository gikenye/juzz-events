// Server-truth cup view-model. Maps the backend bracket + league overview to
// the display shapes the tournament UI renders. Match phase comes from the
// bracket, never the wall clock — the only time used is the two countdown
// targets (match starts_at, next cup), both server-offset corrected.
import type { LeagueOverview, TournamentSnapshot } from './types';

export type Stage = 'quarter' | 'semi' | 'final';
export type MatchPhase = 'upcoming' | 'countdown' | 'live' | 'completed';
export type CupPhase = 'live' | 'champion' | 'gap' | 'exhibition';

export interface MatchVM {
  id: string;                 // route slug: c<cup8>-r<round>m<index>
  round: number;
  matchIndex: number;
  stage: Stage;
  code: string;               // 'QF1' | 'SF2' | 'Final'
  aId: string | null;         // agent slug; null = TBD
  bId: string | null;
  sourceA?: string;           // feeder code for TBD labels ('Winner of QF1')
  sourceB?: string;
  phase: MatchPhase;
  gameId: string | null;      // latest game (live/countdown) or last game (completed)
  winnerId: string | null;
  isCurrent: boolean;
}

export interface CupVM {
  cupId: string;
  name: string;
  phase: CupPhase;
  matches: MatchVM[];          // always 7 (TBD placeholders pad unplayed rounds)
  champion: string | null;
  nextCupAtMs: number | null;  // gap countdown target
  startsAtMs: number;          // current-match countdown target (0 = running)
}

const STAGES: { stage: Stage; count: number; prefix: string }[] = [
  { stage: 'quarter', count: 4, prefix: 'QF' },
  { stage: 'semi',    count: 2, prefix: 'SF' },
  { stage: 'final',   count: 1, prefix: 'Final' },
];

function code(round: number, idx: number): string {
  const s = STAGES[round] ?? STAGES[2];
  return s.count === 1 ? s.prefix : `${s.prefix}${idx + 1}`;
}

export function matchSlug(cupId: string, round: number, idx: number): string {
  return `c${cupId.replace(/-/g, '').slice(0, 8)}-r${round}m${idx}`;
}

export function parseMatchSlug(slug: string): { cup8: string; round: number; idx: number } | null {
  const m = /^c([0-9a-f]{8})-r(\d+)m(\d+)$/.exec(slug);
  return m ? { cup8: m[1], round: +m[2], idx: +m[3] } : null;
}

export function buildCupVM(
  snapshot: TournamentSnapshot | null,
  league: LeagueOverview | null,
  currentStartsAtMs: number,
  nowMs: number,
): CupVM {
  if (!snapshot) {
    return {
      cupId: '', name: league?.upcoming?.name ?? '',
      phase: league ? 'gap' : 'exhibition',
      matches: [], champion: null,
      nextCupAtMs: league?.next_tournament_at_ms ?? null,
      startsAtMs: 0,
    };
  }

  const champion = snapshot.status.state === 'complete' ? snapshot.status.champion : null;
  const matches: MatchVM[] = [];
  let scheduleIndex = 0;

  STAGES.forEach(({ stage, count }, round) => {
    const real = snapshot.rounds[round]?.matches;
    for (let i = 0; i < count; i++) {
      const m = real?.[i];
      const isCurrent = !!snapshot.current &&
        snapshot.current.round === round && snapshot.current.match_index === i;
      let phase: MatchPhase = 'upcoming';
      if (m?.winner) phase = 'completed';
      else if (isCurrent && (m?.games.length ?? 0) > 0) {
        phase = currentStartsAtMs > nowMs ? 'countdown' : 'live';
      }
      matches.push({
        id: matchSlug(snapshot.id, round, i),
        round, matchIndex: i, stage, code: code(round, i),
        aId: m?.a ?? null,
        bId: m?.b ?? null,
        // bracket geometry: feeders of match i in round r are matches 2i, 2i+1 of r-1
        sourceA: round > 0 ? code(round - 1, i * 2) : undefined,
        sourceB: round > 0 ? code(round - 1, i * 2 + 1) : undefined,
        phase,
        gameId: m?.games.length ? m.games[m.games.length - 1] : null,
        winnerId: m?.winner ?? null,
        isCurrent,
      });
      scheduleIndex++;
    }
  });
  void scheduleIndex;

  return {
    cupId: snapshot.id,
    name: snapshot.name,
    phase: champion ? 'champion' : 'live',
    matches,
    champion,
    nextCupAtMs: league?.next_tournament_at_ms ?? null,
    startsAtMs: currentStartsAtMs,
  };
}

/** W-L record across this cup's completed matches, for the match-card mini stat. */
export function cupRecord(matches: MatchVM[], agentId: string): { w: number; l: number } {
  let w = 0, l = 0;
  for (const m of matches) {
    if (m.phase !== 'completed' || !m.winnerId) continue;
    if (m.winnerId === agentId) w++;
    else if (m.aId === agentId || m.bId === agentId) l++;
  }
  return { w, l };
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
