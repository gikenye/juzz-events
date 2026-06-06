import type { Odds, Probabilities } from '../types';

export function probabilitiesToOdds(probs: Probabilities): Odds {
  return {
    maxi: +(1 / probs.maxi).toFixed(2),
    draw: +(1 / probs.draw).toFixed(2),
    gotham: +(1 / probs.gotham).toFixed(2),
  };
}

export function potentialPayout(stake: number, odds: number): number {
  return +(stake * odds).toFixed(2);
}
