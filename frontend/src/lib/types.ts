// Backend wire types — mirror docs/frontend-integration.md (juzz repo).
// Money is canonical micro-dollars (µ$, 6dp) everywhere except the on-chain deposit tx.

export type GameType = 'chess' | 'othello';
export type Seat = 'white' | 'black';

export interface Player {
  seat: Seat;
  agent_id: string;
  name: string;
  style: string;
}

// clocks_ms is [white, black].
export interface GameSummary {
  id: string;
  game_type: GameType;
  time_control: string; // "3+0"
  starts_at_ms?: number; // future during the pre-match countdown
  move_number: number;
  clocks_ms: [number, number];
  players: Player[];
  state: string; // chess: FEN
}

export interface GameSnapshot extends GameSummary {
  now_ms?: number; // server time at snapshot — seeds the clock offset
  last_signal?: PositionSignal | null;
}

export interface PositionSignal {
  eval_cp: number;
  win_prob_white: number;
  is_tactical: boolean;
  material_diff: number;
  clock_pressure: boolean;
}

export type GameResult =
  | 'white_wins' | 'black_wins' | 'draw'
  | 'white_timeout' | 'black_timeout' | 'aborted'
  | string;

// GameEvent — serde-tagged by `type`. Shared: seq, game_type, clocks_ms, move_number, state.
export type GameEvent =
  | ({ type: 'started' } & GameEventBase & { players?: Player[]; time_control?: string; starts_at_ms?: number })
  | ({ type: 'move_played' } & GameEventBase & { notation: string; signal?: PositionSignal })
  | { type: 'engine_error'; seq: number; code: string; message: string; ts_ms?: number }
  | ({ type: 'game_over' } & GameEventBase & { result: GameResult; total_moves?: number });

interface GameEventBase {
  seq: number;
  game_type: GameType;
  move_number: number;
  clocks_ms: [number, number];
  state: string;
  ts_ms?: number; // server wall ms — drives the client clock offset
}

export interface MarketSummary {
  market_id: string;
  game_id: string;
  question: string;
  category: string;
  yes_price: number;
  no_price: number;
  resolved: boolean;
  winning_outcome: boolean | null;
  liquidity_b: number;
  created_at_seq: number;
  resolved_at_seq: number | null;
}

export type MarketEvent =
  | { type: 'created'; market_id: string; yes_price: number; no_price: number; resolved: boolean }
  | { type: 'price_changed'; market_id: string; yes_price: number; no_price: number; resolved: boolean }
  | { type: 'resolved'; market_id: string; yes_price: number; no_price: number; resolved: boolean; winning_outcome?: boolean }
  | { type: 'voided'; market_id: string; resolved: boolean };

export type Side = 'yes' | 'no';

export interface TournamentMatch {
  a: string;
  b: string;
  games: string[];
  winner: string | null;
}

export interface TournamentSnapshot {
  id: string;
  name: string;
  game_type: GameType;
  time_control: string;
  status: { state: 'live' } | { state: 'complete'; champion: string };
  rounds: { name: string; matches: TournamentMatch[] }[];
  current: { round: number; match_index: number } | null;
}

export type TournamentEvent =
  | { type: 'tournament_match_started'; round: number; round_name: string; match_index: number;
      game_id: string; white: string; black: string; rematch: boolean; starts_at_ms: number }
  | { type: 'tournament_match_decided'; round: number; match_index: number; winner: string }
  | { type: 'tournament_round_complete'; round: number }
  | { type: 'tournament_complete'; champion: string };

export interface StandingRow {
  agent_id: string;
  name: string;
  points: number;
  tournaments: number;
  titles: number;
}

export interface LeagueOverview {
  season: number;
  now_ms: number;
  next_tournament_at_ms: number | null;
  last_champion: string | null;
  last_final_game: string | null;
  tournament: TournamentSnapshot | null;
  standings: StandingRow[];
}

export interface GameReplay {
  id: string;
  game_type: GameType;
  time_control: string;
  players: Player[];
  result: GameResult;
  total_moves: number;
  ended_ms: number;
  moves: { n: number; notation: string; state: string; clocks_ms: number[] }[];
}

export interface TradeConfirmed {
  type: 'trade_confirmed';
  v: number;
  market_id: string;
  side: Side;
  shares: number;
  cost: number;
  yes_price: number;
  no_price: number;
  resolved: boolean;
}

export type UserEvent =
  | { type: 'fill'; trade_id: string; market_id: string; side: Side; shares: number; price: number; cost: number; ts_ms: number }
  | { type: 'position_update'; market_id: string; yes_shares: number; no_shares: number; avg_yes_price: number; avg_no_price: number }
  | { type: 'settlement'; settlement_id: string; market_id: string; payout: number; winning_side: boolean | null; ts_ms: number };

export interface Settlement {
  settlement_id: string;
  market_id:     string;
  yes_shares:    number;
  no_shares:     number;
  winning_side:  boolean | null; // null = voided → stake refunded
  payout:        number;         // dollars
  ts_ms:         number;
}

export interface Balance {
  available:    string; // µ$ as decimal string
  locked:       string;
  gas_owed:     string; // relayer gas debt, netted at withdrawal
  withdrawable: string; // available − gas_owed
  // The token a withdrawal pays out in. The balance is ONE asset-agnostic number —
  // never render it as a per-token balance.
  primary_asset: 'USDC' | 'USDT' | 'USDM';
}

export interface AssetInfo {
  symbol: 'USDC' | 'USDT' | 'USDM';
  address: string;
  decimals: number;
}

export interface WsError {
  type: 'error';
  v?: number;
  code: string;
  message: string;
}

export interface Position {
  market_id: string;
  yes_shares: number;
  no_shares: number;
  avg_yes_price: number;
  avg_no_price: number;
}
