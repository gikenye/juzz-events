import { describe, it, expect } from 'vitest';
import { nextServerSync } from './serverClock';

describe('nextServerSync (transit-floor offset)', () => {
  it('holds steady when a sample matches the current offset', () => {
    expect(nextServerSync(300, 1_000_000, 1_000_300)).toEqual({ offset: 300, lag: 0 });
  });

  it('does not inflate the offset for a higher-latency event; extra shows as lag', () => {
    const { offset, lag } = nextServerSync(300, 1_000_000, 1_000_500);
    expect(offset).toBeGreaterThanOrEqual(300);
    expect(offset).toBeLessThanOrEqual(325); // creeps at most OFFSET_CREEP_MS
    expect(lag).toBeGreaterThan(0);
    expect(lag).toBeLessThanOrEqual(2000);
  });

  it('caps lag at 2000ms for a very stale anchor', () => {
    expect(nextServerSync(300, 1_000_000, 1_000_000 + 300 + 9999).lag).toBe(2000);
  });

  it('does not let a stale/replayed event drag the steady offset (reconnect catch-up)', () => {
    const steady = 300;
    const replay = nextServerSync(steady, 1_000_000, 1_000_000 + steady + 10_000);
    expect(replay.offset).toBeGreaterThanOrEqual(steady);
    expect(replay.offset).toBeLessThanOrEqual(steady + 25);
  });

  it('a burst of stale replays only creeps the offset, and one live event resets it', () => {
    let offset = nextServerSync(0, 1_000_000, 1_000_290).offset; // seed-ish ~290
    const before = offset;
    for (let age = 8000; age >= 2000; age -= 1000) {
      ({ offset } = nextServerSync(offset, 2_000_000 - age, 2_000_000)); // stale replays
    }
    expect(Math.abs(offset - before)).toBeLessThan(200);
    ({ offset } = nextServerSync(offset, 2_100_000, 2_100_000 + before)); // fresh live event
    expect(offset).toBeCloseTo(before, 5);
  });

  it('is a no-op without a server timestamp', () => {
    expect(nextServerSync(300, undefined, 1_000_500)).toEqual({ offset: 300, lag: 0 });
  });
});
