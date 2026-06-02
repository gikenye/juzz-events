export type Outcome = 'maxi' | 'draw' | 'gotham';

export interface Bet {
  id: string;
  outcome: Outcome;
  stake: number;
  odds: number;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
}

export interface Probabilities {
  maxi: number;
  draw: number;
  gotham: number;
}

export interface Odds {
  maxi: number;
  draw: number;
  gotham: number;
}
