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

export function addNoise(probs: Probabilities): Probabilities {
  const noise = () => (Math.random() - 0.5) * 0.04;
  const maxi = Math.max(0.05, Math.min(0.88, probs.maxi + noise()));
  const draw = Math.max(0.04, Math.min(0.3, probs.draw + noise()));
  const gotham = Math.max(0.05, Math.min(0.88, 1 - maxi - draw));
  const sum = maxi + draw + gotham;
  return { maxi: maxi / sum, draw: draw / sum, gotham: gotham / sum };
}
