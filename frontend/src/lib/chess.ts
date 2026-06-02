// The Immortal Game (Anderssen vs Kieseritzky, 1851) — used for AI replay
export const IMMORTAL_GAME_MOVES = [
  'e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5',
  'Bxb5', 'Nf6', 'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5',
  'Nf5', 'c6', 'g4', 'Nf6', 'Rg1', 'cxb5', 'h4', 'Qg6',
  'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6', 'Nc3', 'Bc5',
  'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6',
  'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#',
];

export const MOVE_INTERVAL_MS = 2800;

export function probabilityAtMove(moveIndex: number): { maxi: number; draw: number; gotham: number } {
  const total = IMMORTAL_GAME_MOVES.length;
  const progress = moveIndex / total;

  // White (Gotham) wins the Immortal Game, so odds trend toward Gotham
  const gotham = 0.45 + progress * 0.4;
  const draw = Math.max(0.05, 0.2 - progress * 0.18);
  const maxi = Math.max(0.05, 1 - gotham - draw);

  const sum = maxi + draw + gotham;
  return {
    maxi: maxi / sum,
    draw: draw / sum,
    gotham: gotham / sum,
  };
}
