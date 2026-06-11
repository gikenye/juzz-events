/** Decimal odds implied by a win probability. */
export function impliedOdds(prob: number): number {
  return +(1 / Math.max(prob, 0.01)).toFixed(2);
}

export function potentialPayout(stake: number, odds: number): number {
  return +(stake * odds).toFixed(2);
}
