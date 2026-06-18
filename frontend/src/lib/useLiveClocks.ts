import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { liveClock } from './liveSync';

// Smooth, server-synced clocks. The store holds the server's clocks_ms anchored at the
// moment each event arrived; here we count the side-to-move down from that anchor in real
// time. Re-anchors on every move_played, so display never drifts from the authority.
export function useLiveClocks(): { white: number; black: number } {
  const clocksMs = useGameStore(s => s.clocksMs);
  const anchor = useGameStore(s => s.clockAnchor);
  const turn = useGameStore(s => s.turn);
  const isFinished = useGameStore(s => s.isFinished);
  const eventLagMs = useGameStore(s => s.eventLagMs);
  const countdown = useCountdownActive();

  // `now` is sampled in the interval (an effect), never during render, so the render
  // stays pure. It shares performance.now()'s timebase with the store's clockAnchor.
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (isFinished || countdown) return;
    const id = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(id);
  }, [isFinished, countdown]);

  return liveClock({ clocksMs, clockAnchor: anchor, turn, eventLagMs, isFinished, countdown, now });
}

// Pre-match countdown: server-time remaining until play begins (0 when live).
export function useStartsIn(): number {
  const startsAtMs = useGameStore(s => s.startsAtMs);
  const offset = useGameStore(s => s.serverOffsetMs);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  if (!startsAtMs) return 0;
  return Math.max(0, startsAtMs - (now - offset));
}

function useCountdownActive(): boolean {
  return useStartsIn() > 0;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
