import type { Agent, AgentIconKey } from '../types';

// The 8 tournament entrants. Maxi & Gotham carry over from the original arena;
// the other six are new chess-themed AI personas.
export const AGENTS: Agent[] = [
  { id: 'maxi',   name: 'Agent Maxi',   color: '#7B4FBF', colorLight: '#9D72E0', elo: 3240, icon: 'maxi'   },
  { id: 'gotham', name: 'Agent Gotham', color: '#00B4A6', colorLight: '#00D4C4', elo: 3190, icon: 'gotham' },
  { id: 'atlas',  name: 'Agent Atlas',  color: '#4A9BD4', colorLight: '#79BCE8', elo: 3160, icon: 'atlas'  },
  { id: 'vega',   name: 'Agent Vega',   color: '#E0566B', colorLight: '#F2899A', elo: 3110, icon: 'vega'   },
  { id: 'talos',  name: 'Agent Talos',  color: '#D98E2B', colorLight: '#F0B45E', elo: 3055, icon: 'talos'  },
  { id: 'orion',  name: 'Agent Orion',  color: '#2FB872', colorLight: '#5FD898', elo: 3020, icon: 'orion'  },
  { id: 'nyx',    name: 'Agent Nyx',    color: '#5B6EE0', colorLight: '#8C9BF0', elo: 2980, icon: 'nyx'    },
  { id: 'cipher', name: 'Agent Cipher', color: '#C44FBF', colorLight: '#E07ADB', elo: 2945, icon: 'cipher' },
];

const AGENT_MAP: Record<string, Agent> = Object.fromEntries(AGENTS.map(a => [a.id, a]));

// Pre-rebrand backend slugs → branded agents (kept until the rename deploys,
// harmless after: the new slugs hit AGENT_MAP directly).
const LEGACY: Record<string, string> = {
  'the-surgeon': 'maxi', 'tals-ghost': 'gotham', 'the-grinder': 'atlas',
  'coin-flip-carl': 'vega', 'the-professor': 'talos', 'iron-wall': 'orion',
  'gambit-queen': 'nyx', 'the-metronome': 'cipher',
};

export function getAgent(id: string | null | undefined): Agent | null {
  if (!id) return null;
  return AGENT_MAP[id] ?? AGENT_MAP[LEGACY[id]] ?? null;
}

/** Degrade gracefully for slugs outside the branded roster (e.g. a backend
 *  that predates the rebrand): deterministic colour, neutral icon. */
export function fallbackAgent(id: string, name?: string): Agent {
  const known = getAgent(id);
  if (known) return known;
  const hue = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 360;
  return {
    id,
    name: name ?? id,
    color: `hsl(${hue}, 55%, 55%)`,
    colorLight: `hsl(${hue}, 65%, 70%)`,
    elo: 3000,
    icon: 'atlas',
  };
}

// Per-icon avatar styling. Maxi & Gotham preserve their original approved look;
// the rest use a consistent light-gradient + dark-icon scheme.
export interface AvatarConfig {
  bgFrom: string;
  bgTo: string;
  iconColor: string;
  lensColor: string;
  glowColor: string;
}

export const AVATAR_CONFIG: Record<AgentIconKey, AvatarConfig> = {
  maxi:   { bgFrom: '#B88EEA', bgTo: '#6a35b0', iconColor: '#1C0F36', lensColor: '#D4B0FF', glowColor: '#9D72E080' },
  gotham: { bgFrom: '#003d3a', bgTo: '#00877e', iconColor: '#C8F5F2', lensColor: '#002926', glowColor: '#00B4A680' },
  atlas:  { bgFrom: '#79BCE8', bgTo: '#2E7AB0', iconColor: '#06243A', lensColor: '#D7ECFB', glowColor: '#4A9BD480' },
  vega:   { bgFrom: '#F2899A', bgTo: '#C03A4F', iconColor: '#3A0710', lensColor: '#FFD7DD', glowColor: '#E0566B80' },
  talos:  { bgFrom: '#F0B45E', bgTo: '#B5701A', iconColor: '#3A2405', lensColor: '#FFE9C7', glowColor: '#D98E2B80' },
  orion:  { bgFrom: '#5FD898', bgTo: '#1E9457', iconColor: '#062A18', lensColor: '#D6FFE9', glowColor: '#2FB87280' },
  nyx:    { bgFrom: '#8C9BF0', bgTo: '#3F4FC0', iconColor: '#0B1240', lensColor: '#DFE4FF', glowColor: '#5B6EE080' },
  cipher: { bgFrom: '#E07ADB', bgTo: '#9E3399', iconColor: '#350533', lensColor: '#FBD7F8', glowColor: '#C44FBF80' },
};

/** Standard Elo expectation for the pre-match preview odds. */
export function eloExpected(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}
