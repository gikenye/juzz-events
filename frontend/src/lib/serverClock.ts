// Client↔server time-offset estimator for the live clock.
//
// offset = wall clock − server ts. The true offset is the FLOOR of (wall − ts):
// network transit is always >= 0, so the smallest sample is closest to the real
// skew. This matters at the endgame: the catch-up burst the backend replays
// after a reconnect carries old ts_ms (large samples), and a naive average would
// let it drag the offset and desync the clock by seconds right at flag fall. A
// min-tracking estimator ignores those larger samples; the next live event pulls
// the floor back. A small creep follows genuine slow clock drift without chasing
// latency spikes. `prevOffset` is assumed already seeded by the caller (0 is a
// valid offset, not an "unseeded" sentinel).
const LAG_CAP_MS = 2000;
const OFFSET_CREEP_MS = 25;

export function nextServerSync(
  prevOffset: number,
  tsMs: number | undefined,
  nowWall: number,
): { offset: number; lag: number } {
  if (!tsMs) return { offset: prevOffset, lag: 0 };
  const sample = nowWall - tsMs;
  const offset = Math.min(sample, prevOffset + OFFSET_CREEP_MS);
  const lag = Math.min(LAG_CAP_MS, Math.max(0, sample - offset));
  return { offset, lag };
}
