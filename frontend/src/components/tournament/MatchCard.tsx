import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Agent } from '../../types';
import { getAgent, fallbackAgent, eloExpected } from '../../lib/agents';
import { impliedOdds } from '../../lib/odds';
import { cupRecord, type MatchVM } from '../../lib/tournamentView';
import { AgentAvatar } from '../chess/AgentAvatar';
import { Countdown } from './Countdown';

const STAGE_LONG: Record<MatchVM['stage'], string> = {
  quarter: 'Quarterfinal', semi: 'Semifinal', final: 'Championship Final',
};

function longLabel(m: MatchVM): string {
  return m.stage === 'final' ? STAGE_LONG.final : `${STAGE_LONG[m.stage]} ${m.matchIndex + 1}`;
}

interface AgentSideProps {
  agent: Agent;
  wins: number;
  losses: number;
  isWinner: boolean;
  dim: boolean;
  align: 'left' | 'right';
}

function AgentSide({ agent, wins, losses, isWinner, dim, align }: AgentSideProps) {
  const right = align === 'right';
  return (
    <div
      className={`flex-1 min-w-0 flex items-center gap-3 transition-opacity duration-500 ${right ? 'flex-row-reverse pr-0 pl-2' : 'pl-0 pr-2'}`}
      style={{ opacity: dim ? 0.3 : 1 }}
    >
      <AgentAvatar agent={agent} className="w-11 h-11 shrink-0" />
      <div className={`min-w-0 ${right ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-1.5 ${right ? 'justify-end' : ''}`}>
          {isWinner && right && <span className="shrink-0 text-sm leading-none" style={{ color: '#C9A227' }}>♛</span>}
          <span className="text-sm font-bold truncate leading-tight" style={{ color: '#F5F0E8' }}>
            {(() => {
              const m = agent.name.match(/^(Agent\s+)(.*)$/i);
              if (!m) return agent.name;
              return (
                <>
                  <span className="hidden sm:inline">{m[1]}</span>
                  {m[2]}
                </>
              );
            })()}
          </span>
          {isWinner && !right && <span className="shrink-0 text-sm leading-none" style={{ color: '#C9A227' }}>♛</span>}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${right ? 'justify-end' : ''}`}>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: '#2FB872' }}>{wins}W</span>
          <span className="text-[10px] select-none" style={{ color: '#2A2A35' }}>·</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: losses > 0 ? '#E0566B' : '#9A9AAF' }}>{losses}L</span>
        </div>
      </div>
    </div>
  );
}

function TbdSide({ label, align }: { label: string; align: 'left' | 'right' }) {
  const right = align === 'right';
  return (
    <div className={`flex-1 min-w-0 flex items-center gap-3 ${right ? 'flex-row-reverse pl-2' : 'pr-2'}`}>
      <div
        className="w-11 h-11 rounded-full border border-dashed flex items-center justify-center shrink-0"
        style={{ borderColor: '#2A2A35' }}
      >
        <span className="text-xs select-none" style={{ color: '#9A9AAF' }}>?</span>
      </div>
      <span className={`text-sm italic truncate ${right ? 'text-right' : ''}`} style={{ color: '#9A9AAF' }}>
        {label}
      </span>
    </div>
  );
}

interface MatchCardProps {
  match: MatchVM;
  /** All matches in the cup — for the per-agent W/L mini stat. */
  matches: MatchVM[];
  featured?: boolean;
  /** Live market probability for the playing match (else Elo preview). */
  liveProb?: { a: number; b: number } | null;
  /** Pre-game countdown target (current match only), local epoch ms. */
  countdownTarget?: number;
}

export function MatchCard({ match, matches, featured = false, liveProb = null, countdownTarget = 0 }: MatchCardProps) {
  const navigate = useNavigate();

  const a = match.aId ? getAgent(match.aId) ?? fallbackAgent(match.aId) : null;
  const b = match.bId ? getAgent(match.bId) ?? fallbackAgent(match.bId) : null;

  const pa = a && b ? eloExpected(a.elo, b.elo) : 0.5;
  const prob = liveProb ?? { a: pa, b: 1 - pa };
  const revealed = match.phase === 'completed';
  const winnerIsA = match.winnerId !== null && match.winnerId === match.aId;
  const oddsA = impliedOdds(prob.a);
  const oddsB = impliedOdds(prob.b);

  const recA = a ? cupRecord(matches, a.id) : { w: 0, l: 0 };
  const recB = b ? cupRecord(matches, b.id) : { w: 0, l: 0 };

  const dimA = revealed && !winnerIsA;
  const dimB = revealed && winnerIsA;

  const statusChip = (() => {
    if (match.phase === 'live') {
      return (
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: 'rgba(22,163,74,0.12)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.28)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          Live
        </span>
      );
    }
    if (match.phase === 'completed') {
      return (
        <span
          className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border"
          style={{ borderColor: '#2A2A35', color: '#9A9AAF' }}
        >
          Final
        </span>
      );
    }
    return (
      <span
        className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border"
        style={{ borderColor: 'rgba(201,162,39,0.3)', color: '#C9A227', background: 'rgba(201,162,39,0.06)' }}
      >
        {match.phase === 'countdown' && countdownTarget > 0
          ? <Countdown target={countdownTarget} />
          : 'Queued'}
      </span>
    );
  })();

  return (
    <motion.button
      onClick={() => navigate(`/game/${match.id}`)}
      whileHover={{ y: -2, transition: { duration: 0.12, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      className="text-left w-full rounded-2xl border cursor-pointer overflow-hidden relative group"
      style={{
        background: '#141418',
        borderColor: featured ? 'rgba(201,162,39,0.4)' : '#2A2A35',
        boxShadow: featured
          ? '0 0 0 1px rgba(201,162,39,0.08), 0 12px 48px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Gold top line — featured only */}
      {featured && (
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #C9A227 35%, #E2C547 50%, #C9A227 65%, transparent 100%)' }}
        />
      )}

      {/* Agent color washes */}
      {a && b && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(108deg, ${a.color}22 0%, ${a.color}09 42%, transparent 58%)` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(288deg, ${b.color}22 0%, ${b.color}09 42%, transparent 58%)` }}
          />
        </div>
      )}

      <div className="relative p-4">
        {/* Card header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] shrink-0" style={{ color: '#C9A227' }}>
              {match.code}
            </span>
            <span className="shrink-0 text-[10px] select-none" style={{ color: '#2A2A35' }}>·</span>
            <span className="text-[10px] truncate" style={{ color: '#9A9AAF' }}>{longLabel(match)}</span>
          </div>
          {statusChip}
        </div>

        {a && b ? (
          <>
            {/* Agent A  VS  Agent B */}
            <div className="flex items-center">
              <AgentSide agent={a} wins={recA.w} losses={recA.l} isWinner={revealed && winnerIsA} dim={dimA} align="left" />
              <span className="shrink-0 text-[10px] font-black tracking-widest select-none px-1" style={{ color: '#2F2F3C' }}>
                VS
              </span>
              <AgentSide agent={b} wins={recB.w} losses={recB.l} isWinner={revealed && !winnerIsA} dim={dimB} align="right" />
            </div>

            {/* Odds */}
            <div className="flex items-center mt-3.5 pt-3" style={{ borderTop: '1px solid #1C1C24' }}>
              <div className="flex-1 transition-opacity duration-500" style={{ opacity: dimA ? 0.3 : 1 }}>
                <span className="font-display text-xl font-black tabular-nums leading-none" style={{ color: a.colorLight }}>
                  ×{oddsA.toFixed(2)}
                </span>
              </div>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] select-none" style={{ color: '#9A9AAF' }}>
                Odds
              </span>
              <div className="flex-1 text-right transition-opacity duration-500" style={{ opacity: dimB ? 0.3 : 1 }}>
                <span className="font-display text-xl font-black tabular-nums leading-none" style={{ color: b.colorLight }}>
                  ×{oddsB.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Probability bar */}
            <div className="mt-2.5">
              <div className="h-1 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${prob.a * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${a.color}, ${a.colorLight})`,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    background: `linear-gradient(90deg, ${b.colorLight}, ${b.color})`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px]" style={{ color: a.color + 'bb' }}>{Math.round(prob.a * 100)}%</span>
                <span className="text-[9px]" style={{ color: b.color + 'bb' }}>{Math.round(prob.b * 100)}%</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center">
            <TbdSide label={`Winner of ${match.sourceA ?? '—'}`} align="left" />
            <span className="shrink-0 text-[10px] font-black tracking-widest select-none px-1" style={{ color: '#2F2F3C' }}>
              VS
            </span>
            <TbdSide label={`Winner of ${match.sourceB ?? '—'}`} align="right" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid #1C1C24' }}>
        <span className="text-[10px]" style={{ color: '#9A9AAF' }}>
          {match.phase === 'completed' ? 'Played' : match.phase === 'live' ? 'In progress' : 'Plays next in bracket order'}
        </span>
        <span className="text-[10px] font-medium" style={{ color: 'rgba(201,162,39,0.55)' }}>
          {match.phase === 'completed' ? 'View result →' : 'Open arena →'}
        </span>
      </div>
    </motion.button>
  );
}
