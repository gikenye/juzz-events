import { motion } from 'framer-motion';
import { AGENTS } from '../lib/agents';
import { AgentAvatar } from '../components/chess/AgentAvatar';

const GOLD = '#C9A227';
const IVORY = '#F5F0E8';
const MUTED = '#9A9AAF';
const SURFACE = '#1C1C24';
const BORDER = '#2A2A35';
const BG = '#141418';
const PAGE_BG = '#0B0B0F';

const demoA = AGENTS[0]; // Maxi — purple  #7B4FBF / #9D72E0
const demoB = AGENTS[1]; // Gotham — teal  #00B4A6 / #00D4C4
const PROB_A = 0.61;
const PROB_B = 0.39;
const ODDS_A = 1.75;
const ODDS_B = 2.33;

// ── Card 1 · Split Field ────────────────────────────────────────────────────
// Agent color washes bleed in from each edge. Odds inline, thin prob bar.
function CardSplit() {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.13 }}
      className="w-full text-left rounded-2xl cursor-pointer overflow-hidden relative"
      style={{ background: BG, border: '1px solid ' + BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      {/* color washes */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(108deg, ${demoA.color}22 0%, ${demoA.color}09 42%, transparent 58%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(288deg, ${demoB.color}22 0%, ${demoB.color}09 42%, transparent 58%)` }} />
      </div>

      <div className="relative p-4">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            QF1 · Quarter-Final
          </span>
          <span
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(22,163,74,0.12)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.28)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live
          </span>
        </div>

        {/* agents row */}
        <div className="flex items-center">
          <div className="flex-1 flex items-center gap-3 pr-2">
            <AgentAvatar agent={demoA} className="w-11 h-11 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate leading-tight" style={{ color: IVORY }}>{demoA.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-bold" style={{ color: '#2FB872' }}>3W</span>
                <span className="text-[9px] select-none" style={{ color: BORDER }}>·</span>
                <span className="text-[10px] font-bold" style={{ color: MUTED }}>0L</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] font-black tracking-widest shrink-0 px-1 select-none" style={{ color: '#2F2F3C' }}>VS</span>

          <div className="flex-1 flex items-center gap-3 pl-2 flex-row-reverse">
            <AgentAvatar agent={demoB} className="w-11 h-11 shrink-0" />
            <div className="min-w-0 text-right">
              <div className="text-sm font-bold truncate leading-tight" style={{ color: IVORY }}>{demoB.name}</div>
              <div className="flex items-center gap-1 mt-1 justify-end">
                <span className="text-[10px] font-bold" style={{ color: '#2FB872' }}>2W</span>
                <span className="text-[9px] select-none" style={{ color: BORDER }}>·</span>
                <span className="text-[10px] font-bold" style={{ color: '#E0566B' }}>1L</span>
              </div>
            </div>
          </div>
        </div>

        {/* odds + prob bar */}
        <div className="mt-3.5 pt-3" style={{ borderTop: '1px solid ' + SURFACE }}>
          <div className="flex items-center mb-2">
            <div className="flex-1">
              <span className="text-xl font-black tabular-nums" style={{ color: demoA.colorLight }}>×{ODDS_A.toFixed(2)}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] shrink-0" style={{ color: MUTED }}>Odds</span>
            <div className="flex-1 text-right">
              <span className="text-xl font-black tabular-nums" style={{ color: demoB.colorLight }}>×{ODDS_B.toFixed(2)}</span>
            </div>
          </div>
          <div className="h-1 rounded-full overflow-hidden flex">
            <div style={{ width: `${PROB_A * 100}%`, height: '100%', background: `linear-gradient(90deg, ${demoA.color}, ${demoA.colorLight})` }} />
            <div style={{ flex: 1, height: '100%', background: `linear-gradient(90deg, ${demoB.colorLight}, ${demoB.color})` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: demoA.color + 'bb' }}>{Math.round(PROB_A * 100)}%</span>
            <span className="text-[9px]" style={{ color: demoB.color + 'bb' }}>{Math.round(PROB_B * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid ' + SURFACE }}>
        <span className="text-[10px]" style={{ color: MUTED }}>In progress</span>
        <span className="text-[10px] font-medium" style={{ color: GOLD + '88' }}>Open arena →</span>
      </div>
    </motion.button>
  );
}

// ── Card 2 · Scoreboard ─────────────────────────────────────────────────────
// Two stacked agent rows like a competition table — rank, avatar, stats, odds.
function CardScoreboard() {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.13 }}
      className="w-full text-left rounded-xl cursor-pointer overflow-hidden"
      style={{ background: BG, border: '1px solid ' + BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      {/* header band */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: SURFACE }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>QF2</span>
          <span className="text-[10px] select-none" style={{ color: BORDER }}>·</span>
          <span className="text-[10px]" style={{ color: MUTED }}>Quarter-Final</span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: GOLD, background: GOLD + '16', border: '1px solid ' + GOLD + '44' }}
        >
          in 45m
        </span>
      </div>

      {/* Agent A row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xs font-black w-4 tabular-nums shrink-0" style={{ color: demoA.colorLight }}>1</span>
        <AgentAvatar agent={demoA} className="w-9 h-9 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: IVORY }}>{demoA.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold" style={{ color: '#2FB872' }}>3W</span>
            <span className="text-[9px]" style={{ color: BORDER }}>·</span>
            <span className="text-[10px] font-bold" style={{ color: MUTED }}>0L</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-black text-base tabular-nums" style={{ color: demoA.colorLight }}>×{ODDS_A.toFixed(2)}</div>
          <div className="text-[9px] uppercase tracking-wide" style={{ color: MUTED }}>odds</div>
        </div>
      </div>

      {/* divider + probability fill */}
      <div className="px-4">
        <div className="h-[3px] rounded-full overflow-hidden flex">
          <div style={{ width: `${PROB_A * 100}%`, height: '100%', background: demoA.color, opacity: 0.7 }} />
          <div style={{ flex: 1, height: '100%', background: demoB.color, opacity: 0.35 }} />
        </div>
      </div>

      {/* Agent B row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xs font-black w-4 tabular-nums shrink-0" style={{ color: demoB.colorLight }}>2</span>
        <AgentAvatar agent={demoB} className="w-9 h-9 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: IVORY }}>{demoB.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold" style={{ color: '#2FB872' }}>2W</span>
            <span className="text-[9px]" style={{ color: BORDER }}>·</span>
            <span className="text-[10px] font-bold" style={{ color: '#E0566B' }}>1L</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-black text-base tabular-nums" style={{ color: demoB.colorLight }}>×{ODDS_B.toFixed(2)}</div>
          <div className="text-[9px] uppercase tracking-wide" style={{ color: MUTED }}>odds</div>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid ' + SURFACE }}>
        <span className="text-[10px]" style={{ color: MUTED }}>Starts in 45m</span>
        <span className="text-[10px] font-medium" style={{ color: GOLD + '88' }}>Open arena →</span>
      </div>
    </motion.button>
  );
}

// ── Card 3 · Win Chance Hero ────────────────────────────────────────────────
// Probability is the headline: huge %, thick gradient bar, agents are secondary.
function CardProbHero() {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.13 }}
      className="w-full text-left rounded-2xl cursor-pointer overflow-hidden"
      style={{ background: BG, border: '1px solid ' + BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="p-4">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            SF1 · Semi-Final
          </span>
          <span
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(22,163,74,0.12)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.28)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live · Move 24
          </span>
        </div>

        {/* big percentages */}
        <div className="flex items-end justify-between mb-2">
          <div className="leading-none">
            <span className="text-[2.5rem] font-black tabular-nums leading-none" style={{ color: demoA.colorLight }}>
              {Math.round(PROB_A * 100)}
            </span>
            <span className="text-2xl font-black" style={{ color: demoA.color }}>%</span>
          </div>
          <span className="text-[10px] pb-1.5" style={{ color: MUTED }}>win chance</span>
          <div className="leading-none text-right">
            <span className="text-[2.5rem] font-black tabular-nums leading-none" style={{ color: demoB.colorLight }}>
              {Math.round(PROB_B * 100)}
            </span>
            <span className="text-2xl font-black" style={{ color: demoB.color }}>%</span>
          </div>
        </div>

        {/* thick gradient bar */}
        <div className="h-4 rounded-full overflow-hidden flex">
          <div style={{ width: `${PROB_A * 100}%`, height: '100%', background: `linear-gradient(90deg, ${demoA.color}cc, ${demoA.colorLight})` }} />
          <div style={{ flex: 1, height: '100%', background: `linear-gradient(90deg, ${demoB.colorLight}, ${demoB.color}cc)` }} />
        </div>

        {/* agents below */}
        <div className="flex items-center gap-3 mt-4 pt-3.5" style={{ borderTop: '1px solid ' + SURFACE }}>
          <div className="flex-1 flex items-center gap-2">
            <AgentAvatar agent={demoA} className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: IVORY }}>{demoA.name}</div>
              <div className="text-[10px] font-bold" style={{ color: GOLD }}>×{ODDS_A.toFixed(2)}</div>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-widest shrink-0" style={{ color: BORDER }}>VS</span>
          <div className="flex-1 flex items-center gap-2 flex-row-reverse">
            <AgentAvatar agent={demoB} className="w-8 h-8 shrink-0" />
            <div className="min-w-0 text-right">
              <div className="text-xs font-semibold truncate" style={{ color: IVORY }}>{demoB.name}</div>
              <div className="text-[10px] font-bold" style={{ color: GOLD }}>×{ODDS_B.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid ' + SURFACE }}>
        <span className="text-[10px]" style={{ color: MUTED }}>In progress</span>
        <span className="text-[10px] font-medium" style={{ color: GOLD + '88' }}>Open arena →</span>
      </div>
    </motion.button>
  );
}

// ── Card 4 · Compact Strip ──────────────────────────────────────────────────
// Two agent halves flanking a narrow center column — built for dense grids.
function CardCompact() {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.13 }}
      className="w-full text-left rounded-xl cursor-pointer overflow-hidden"
      style={{ background: BG, border: '1px solid ' + BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-stretch">
        {/* Agent A zone */}
        <div
          className="flex-1 flex items-center gap-2.5 p-3"
          style={{ background: `${demoA.color}0c`, borderRight: '1px solid ' + SURFACE }}
        >
          <AgentAvatar agent={demoA} className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: IVORY }}>{demoA.name}</div>
            <div className="text-base font-black tabular-nums leading-tight mt-0.5" style={{ color: demoA.colorLight }}>
              ×{ODDS_A.toFixed(2)}
            </div>
          </div>
        </div>

        {/* center info */}
        <div className="flex flex-col items-center justify-center px-3 shrink-0 gap-0.5 text-center">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>QF3</span>
          <span className="text-xs font-black leading-none select-none" style={{ color: '#2F2F3C' }}>VS</span>
          <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: '#4ade80' }}>
            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse inline-block" />
            Live
          </span>
        </div>

        {/* Agent B zone */}
        <div
          className="flex-1 flex items-center gap-2.5 p-3 flex-row-reverse"
          style={{ background: `${demoB.color}0c`, borderLeft: '1px solid ' + SURFACE }}
        >
          <AgentAvatar agent={demoB} className="w-10 h-10 shrink-0" />
          <div className="min-w-0 text-right">
            <div className="text-xs font-bold truncate" style={{ color: IVORY }}>{demoB.name}</div>
            <div className="text-base font-black tabular-nums leading-tight mt-0.5" style={{ color: demoB.colorLight }}>
              ×{ODDS_B.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* prob bar + footer */}
      <div style={{ borderTop: '1px solid ' + SURFACE }}>
        <div className="h-[3px] flex overflow-hidden">
          <div style={{ width: `${PROB_A * 100}%`, background: demoA.color, opacity: 0.65 }} />
          <div style={{ flex: 1, background: demoB.color, opacity: 0.4 }} />
        </div>
        <div className="flex items-center justify-between px-3 py-2" style={{ background: SURFACE }}>
          <span className="text-[9px]" style={{ color: MUTED }}>Quarter-Final · In progress</span>
          <span className="text-[9px] font-medium" style={{ color: GOLD + '77' }}>Open →</span>
        </div>
      </div>
    </motion.button>
  );
}

// ── Card 5 · Fight Poster ───────────────────────────────────────────────────
// Centered tournament-poster energy: agent glows, vertical VS rule, big odds.
function CardFightPoster() {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.13 }}
      className="w-full text-left rounded-2xl cursor-pointer overflow-hidden relative"
      style={{ background: '#0E0E12', border: '1px solid ' + BORDER, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
    >
      {/* radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 55% 75% at 18% 55%, ${demoA.color}28 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 55% 75% at 82% 55%, ${demoB.color}28 0%, transparent 70%)` }} />
      </div>

      <div className="relative p-5">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full shrink-0" style={{ background: GOLD }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>Grand Final</span>
          </div>
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: GOLD + '10', color: GOLD, border: '1px solid ' + GOLD + '30' }}
          >
            Tomorrow 18:00
          </span>
        </div>

        {/* agent duel */}
        <div className="flex items-center">
          {/* Agent A */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div
              className="rounded-full shrink-0"
              style={{
                padding: 2,
                border: `2px solid ${demoA.color}88`,
                boxShadow: `0 0 28px ${demoA.color}55, 0 0 56px ${demoA.color}22`,
              }}
            >
              <AgentAvatar agent={demoA} className="w-16 h-16" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: IVORY }}>{demoA.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>3W · 0L · ELO 3240</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[1.6rem] font-black tabular-nums leading-none" style={{ color: demoA.colorLight }}>
                ×{ODDS_A.toFixed(2)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: demoA.color + 'cc' }}>
                Favorite
              </span>
            </div>
          </div>

          {/* VS center */}
          <div className="flex flex-col items-center px-4 gap-2 shrink-0">
            <div className="w-px h-14" style={{ background: `linear-gradient(to bottom, transparent, ${BORDER} 35%, ${BORDER} 65%, transparent)` }} />
            <span className="text-2xl font-black select-none" style={{ color: '#252530', letterSpacing: '0.08em' }}>VS</span>
            <div className="w-px h-14" style={{ background: `linear-gradient(to bottom, transparent, ${BORDER} 35%, ${BORDER} 65%, transparent)` }} />
          </div>

          {/* Agent B */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div
              className="rounded-full shrink-0"
              style={{
                padding: 2,
                border: `2px solid ${demoB.color}88`,
                boxShadow: `0 0 28px ${demoB.color}55, 0 0 56px ${demoB.color}22`,
              }}
            >
              <AgentAvatar agent={demoB} className="w-16 h-16" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: IVORY }}>{demoB.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>2W · 1L · ELO 3190</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[1.6rem] font-black tabular-nums leading-none" style={{ color: demoB.colorLight }}>
                ×{ODDS_B.toFixed(2)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: demoB.color + 'cc' }}>
                Underdog
              </span>
            </div>
          </div>
        </div>

        {/* prob bar */}
        <div className="mt-6">
          <div className="h-1.5 rounded-full overflow-hidden flex">
            <div style={{ width: `${PROB_A * 100}%`, height: '100%', background: `linear-gradient(90deg, ${demoA.color}, ${demoA.colorLight})` }} />
            <div style={{ flex: 1, height: '100%', background: `linear-gradient(90deg, ${demoB.colorLight}, ${demoB.color})` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] font-bold" style={{ color: demoA.color + 'bb' }}>{Math.round(PROB_A * 100)}% win</span>
            <span className="text-[9px]" style={{ color: MUTED }}>probability</span>
            <span className="text-[9px] font-bold" style={{ color: demoB.color + 'bb' }}>{Math.round(PROB_B * 100)}% win</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid ' + SURFACE }}>
        <span className="text-[10px]" style={{ color: MUTED }}>Tomorrow · 18:00 local time</span>
        <span className="text-[10px] font-medium" style={{ color: GOLD + '88' }}>Open arena →</span>
      </div>
    </motion.button>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const CARD_DESIGNS = [
  {
    num: 1,
    name: 'Split Field',
    tag: 'Balanced · Chromatic',
    desc: 'Agent color washes bleed in from each edge. Odds inline, thin prob bar below.',
    Card: CardSplit,
  },
  {
    num: 2,
    name: 'Scoreboard',
    tag: 'Scannable · Sport',
    desc: 'Two stacked rows like a competition table — rank, avatar, stats, odds as column.',
    Card: CardScoreboard,
  },
  {
    num: 3,
    name: 'Win Chance Hero',
    tag: 'Data-forward · Live focus',
    desc: 'Probability is the headline: giant %, thick gradient bar. Agents play support.',
    Card: CardProbHero,
  },
  {
    num: 4,
    name: 'Compact Strip',
    tag: 'Space-efficient · Dense',
    desc: 'Two agent halves flanking a tight center column. Built for grids or list views.',
    Card: CardCompact,
  },
] as const;

// ── Background photo helpers ─────────────────────────────────────────────────

function PhotoBg({ src, position, overlay }: { src: string; position?: string; overlay: string }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: position ?? 'center',
        backgroundRepeat: 'no-repeat',
      }} />
      {/* gradient overlay — darkens for readability, preserves colour temperature */}
      <div className="absolute inset-0" style={{ background: overlay }} />
    </div>
  );
}

// ── Background previews ──────────────────────────────────────────────────────

interface BgDef {
  num: number;
  name: string;
  tag: string;
  story: string;
  Bg: () => React.ReactElement;
}

const BACKGROUNDS: BgDef[] = [
  {
    num: 1,
    name: 'The Fallen King',
    tag: 'Story · Defeat · Dark',
    story: 'The decisive move has been made. A king lies conquered on the board — the weight of a game, a season, a rivalry.',
    Bg: () => (
      <PhotoBg
        src="https://images.pexels.com/photos/31364160/pexels-photo-31364160.jpeg?auto=compress&cs=tinysrgb&w=1920"
        position="center 40%"
        overlay="linear-gradient(to bottom, rgba(10,4,1,0.48) 0%, rgba(3,1,0,0.82) 100%)"
      />
    ),
  },
  {
    num: 2,
    name: 'Battle Eve',
    tag: 'Tension · War · Red',
    story: 'Pawns glow crimson in the heat before the storm. Every soldier holds the line. Someone will not make it to the other side.',
    Bg: () => (
      <PhotoBg
        src="https://images.pexels.com/photos/8331411/pexels-photo-8331411.jpeg?auto=compress&cs=tinysrgb&w=1920"
        position="center 50%"
        overlay="linear-gradient(to bottom, rgba(35,2,2,0.42) 0%, rgba(8,0,0,0.82) 100%)"
      />
    ),
  },
  {
    num: 3,
    name: 'The Golden Court',
    tag: 'Power · Prestige · Gold',
    story: 'Every piece a crown. Every move a decree. The board is a kingdom and only the most calculated rule.',
    Bg: () => (
      <PhotoBg
        src="https://images.pexels.com/photos/6041464/pexels-photo-6041464.jpeg?auto=compress&cs=tinysrgb&w=1920"
        position="center 45%"
        overlay="linear-gradient(to bottom, rgba(10,6,0,0.45) 0%, rgba(3,2,0,0.80) 100%)"
      />
    ),
  },
  {
    num: 4,
    name: 'The Last Knight',
    tag: 'Epic · Lone · Dusk',
    story: 'One piece still standing at the edge of the world. The knight never retreats — it moves in ways no one else can predict.',
    Bg: () => (
      <PhotoBg
        src="https://images.pexels.com/photos/15736860/pexels-photo-15736860.jpeg?auto=compress&cs=tinysrgb&w=1920"
        position="center 35%"
        overlay="linear-gradient(to bottom, rgba(3,5,18,0.42) 0%, rgba(0,0,8,0.85) 100%)"
      />
    ),
  },
  {
    num: 5,
    name: 'Midnight Vigil',
    tag: 'Quiet · Focus · Night',
    story: 'Late. Everyone else has gone to bed. Just you, the lamp, and sixty-four squares. The next move has been forming for hours.',
    Bg: () => (
      <PhotoBg
        src="https://images.unsplash.com/photo-1552421377-402d649b3d9f?fm=jpg&q=80&w=1920&auto=format&fit=crop"
        position="center 50%"
        overlay="linear-gradient(to bottom, rgba(4,4,8,0.50) 0%, rgba(0,0,3,0.84) 100%)"
      />
    ),
  },
];

function MiniDivider() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(42,42,53,0.7))' }} />
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] select-none" style={{ color: GOLD }}>
        ◈ Upcoming ◈
      </span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(42,42,53,0.7), transparent)' }} />
    </div>
  );
}

function BgPreview({ item, delay }: { item: BgDef; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.25, 0, 0.15, 1] }}
      className="flex flex-col gap-2"
    >
      {/* label row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold" style={{ color: IVORY }}>{item.num}. {item.name}</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full border font-medium" style={{ color: MUTED, borderColor: BORDER }}>
          {item.tag}
        </span>
      </div>

      {/* preview window */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
        <div className="relative min-h-[300px] p-5 pb-6">
          <item.Bg />

          {/* story text floats over the photo at the top */}
          <div className="relative mb-4">
            <p className="text-[11px] leading-relaxed max-w-xs italic" style={{ color: 'rgba(245,240,232,0.55)' }}>
              "{item.story}"
            </p>
          </div>

          {/* cards */}
          <div className="relative">
            <MiniDivider />
            <div className="grid grid-cols-2 gap-3">
              <CardSplit />
              <CardSplit />
            </div>
          </div>
        </div>

        {/* caption bar */}
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: 'rgba(5,5,8,0.95)', borderTop: '1px solid ' + SURFACE }}
        >
          <span className="text-[10px] font-bold" style={{ color: IVORY }}>{item.name}</span>
          <span className="text-[9px] font-medium" style={{ color: MUTED }}>Photo · Free to use</span>
        </div>
      </div>
    </motion.div>
  );
}

export function SamplesPage() {
  return (
    <div className="min-h-screen relative" style={{ background: PAGE_BG }}>
      {/* chessboard texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(45deg, #F0D9B5 25%, transparent 25%)',
            'linear-gradient(-45deg, #F0D9B5 25%, transparent 25%)',
            'linear-gradient(45deg, transparent 75%, #F0D9B5 75%)',
            'linear-gradient(-45deg, transparent 75%, #F0D9B5 75%)',
          ].join(', '),
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px',
          opacity: 0.018,
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
        {/* header */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: GOLD }}>
            Design Review
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: IVORY }}>
            Match Card Directions
          </h1>
          <p className="text-sm max-w-xl leading-relaxed" style={{ color: MUTED }}>
            Five complete rethinks — different hierarchy, different layout, different feel.
            Pick the one (or mix of ideas) that clicks.
          </p>
        </div>

        {/* section rule */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, ' + BORDER + ')' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] flex items-center gap-2" style={{ color: GOLD }}>
            <span style={{ opacity: 0.4 }}>◈</span> 4 Directions <span style={{ opacity: 0.4 }}>◈</span>
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, ' + BORDER + ', transparent)' }} />
        </div>

        {/* cards 1–4 in 2-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
          {CARD_DESIGNS.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.38, ease: [0.25, 0, 0.15, 1] }}
              className="flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold" style={{ color: IVORY }}>
                  {d.num}. {d.name}
                </span>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full border font-medium"
                  style={{ color: MUTED, borderColor: BORDER }}
                >
                  {d.tag}
                </span>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: MUTED + 'bb' }}>{d.desc}</p>
              <d.Card />
            </motion.div>
          ))}
        </div>

        {/* card 5 — fight poster */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, ' + BORDER + ')' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
            Featured Direction
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, ' + BORDER + ', transparent)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.38, ease: [0.25, 0, 0.15, 1] }}
          className="flex flex-col gap-2.5 max-w-xs mx-auto w-full"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold" style={{ color: IVORY }}>5. Fight Poster</span>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full border font-medium"
              style={{ color: MUTED, borderColor: BORDER }}
            >
              Dramatic · Feature card
            </span>
          </div>
          <p className="text-[11px] leading-snug" style={{ color: MUTED + 'bb' }}>
            Agent glows, centered VS, tournament-poster energy. Best as a featured or hero match.
          </p>
          <CardFightPoster />
        </motion.div>

        {/* ── Background styles ── */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, ' + BORDER + ')' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] flex items-center gap-2" style={{ color: GOLD }}>
            <span style={{ opacity: 0.4 }}>◈</span> Background Styles <span style={{ opacity: 0.4 }}>◈</span>
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, ' + BORDER + ', transparent)' }} />
        </div>

        <p className="text-sm -mt-4" style={{ color: MUTED }}>
          Same cards, five different page backgrounds. Cards shown at 2-up grid as they'd appear in All Games.
        </p>

        <div className="flex flex-col gap-8">
          {BACKGROUNDS.map((bg, i) => (
            <BgPreview key={bg.num} item={bg} delay={0.05 * i} />
          ))}
        </div>

        <p className="text-center text-[10px] pb-8" style={{ color: MUTED + '55' }}>
          All cards · same mock match · Maxi vs Gotham · QF1
        </p>
      </div>
    </div>
  );
}
