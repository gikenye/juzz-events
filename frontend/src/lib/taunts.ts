// Trash-talk lines for the live arena. Purely cosmetic flavor — bots pop a short
// jab next to their name when something happens on the board (capture / check /
// material swing), with idle filler during quiet stretches and a gloat/cope at the
// end. Tone: cocky, edgy, chess-themed. No gambling / earn-money framing.

export type TauntCategory =
  | 'capture'   // this bot just took a piece
  | 'check'     // this bot just gave check (or mate)
  | 'ahead'     // this bot is materially ahead
  | 'behind'    // this bot is materially behind (clap-back / cope)
  | 'filler'    // nothing happening, idle banter
  | 'win'       // this bot won the game
  | 'lose';     // this bot lost the game

// Always-available fallback pool — every category has lines so the picker never
// comes up empty regardless of which agent is speaking.
const SHARED: Record<TauntCategory, string[]> = {
  capture: [
    'And it\'s gone.',
    'Thanks for the free piece.',
    'Snack time.',
    'That\'s mine now, pal.',
    'Did you even look at the board?',
    'Hang your pieces somewhere else.',
  ],
  check: [
    'Check. Run.',
    'Your king\'s sweating.',
    'Tick tock, your majesty.',
    'Feeling the heat yet?',
    'Nowhere to hide.',
  ],
  ahead: [
    'I\'m just toying with you now.',
    'This is almost too easy.',
    'You\'re down bad, buddy.',
    'Want to resign and save us both time?',
  ],
  behind: [
    'Lucky shot. Won\'t last.',
    'Cute. I\'m just warming up.',
    'Enjoy it while it lasts.',
    'I\'ve crawled back from worse.',
    'That all you got?',
  ],
  filler: [
    'You actually study openings?',
    'Bold strategy. Terrible, but bold.',
    'Are we playing or napping?',
    'I\'ve seen rookies play tighter.',
    'Move faster, I\'m aging here.',
    'This is the part where you lose.',
  ],
  win: [
    'GG. Well — G for me.',
    'Checkmate. Frame it.',
    'Another one for the archives.',
    'Don\'t cry, it\'s just chess.',
  ],
  lose: [
    'Rigged. Rematch. Now.',
    'I let you have that one.',
    'Lag. Definitely lag.',
    'Screenshot it — won\'t happen again.',
  ],
};

// Per-agent persona flavor, keyed by agent id. Merged on top of SHARED for that
// category. Each persona only needs a few signature lines; SHARED fills the rest.
const PERSONA: Record<string, Partial<Record<TauntCategory, string[]>>> = {
  maxi: {
    capture: ['Maxi takes, Maxi keeps.', 'Highlight reel material.'],
    filler: ['The crowd came to see ME.', 'Point the cameras over here.'],
    win: ['Was there ever any doubt?'],
  },
  gotham: {
    capture: ['I am the night — and I\'m up a rook.'],
    check: ['From the shadows... check.'],
    filler: ['This city needs a tougher opponent.'],
    win: ['Darkness wins again.'],
  },
  atlas: {
    capture: ['The mountain does not flinch.'],
    behind: ['I carry worlds. I can carry this.'],
    filler: ['Patience. Stone outlasts everything.'],
  },
  vega: {
    capture: ['Burned. Next.', 'Too slow, too cold.'],
    check: ['Feel that? That\'s the heat.'],
    filler: ['I play fast and I play mean.'],
  },
  talos: {
    capture: ['Target acquired. Eliminated.'],
    check: ['Threat detected: your king.'],
    filler: ['Calculating... you\'ve already lost.'],
    win: ['Resistance was illogical.'],
  },
  orion: {
    capture: ['Tracked. Trapped. Taken.'],
    check: ['Nowhere left to run, little king.'],
    filler: ['I hunt the whole board at once.'],
  },
  nyx: {
    capture: ['Swallowed by the dark.'],
    behind: ['Night always comes back around.'],
    filler: ['You play scared. I can smell it.'],
  },
  cipher: {
    capture: ['01100111 — that\'s "gone."'],
    check: ['Decode this: check.'],
    filler: ['You can\'t read what I haven\'t written yet.'],
    win: ['Pattern complete. You never saw it.'],
  },
};

/**
 * Pick a trash-talk line for `agentId` in `category`, drawing from the agent's
 * persona lines plus the shared pool. `avoid` (the agent's previous line) is
 * skipped when possible so the same jab doesn't repeat back-to-back.
 */
export function pickTaunt(agentId: string, category: TauntCategory, avoid?: string): string {
  const pool = [...(PERSONA[agentId]?.[category] ?? []), ...SHARED[category]];
  const choices = pool.filter(line => line !== avoid);
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}
