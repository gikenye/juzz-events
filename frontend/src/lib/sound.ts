// Low-latency board sounds via the Web Audio API.
//
// Browsers block audio until a user gesture, so nothing loads or plays until
// `unlockAudio()` runs (wired to the first pointer/key event). Each cue is a
// fresh BufferSource, so rapid moves overlap cleanly instead of cutting off.
import { useSoundStore } from '../store/soundStore';

export type SoundKind = 'move' | 'capture' | 'castle' | 'check' | 'promote' | 'end';

const FILES: Record<SoundKind, string> = {
  move: '/sounds/move.wav',
  capture: '/sounds/capture.wav',
  castle: '/sounds/castle.wav',
  check: '/sounds/check.wav',
  promote: '/sounds/promote.wav',
  end: '/sounds/end.wav',
};

// Per-cue gain so the alert/end cues sit a touch louder than a quiet move.
const GAIN: Record<SoundKind, number> = {
  move: 0.5, capture: 0.6, castle: 0.5, check: 0.7, promote: 0.6, end: 0.7,
};

type Ctx = AudioContext;
let ctx: Ctx | null = null;
const buffers: Partial<Record<SoundKind, AudioBuffer>> = {};
let loading: Promise<void> | null = null;

function load(c: Ctx): Promise<void> {
  if (!loading) {
    loading = Promise.all(
      (Object.keys(FILES) as SoundKind[]).map(async (k) => {
        try {
          const res = await fetch(FILES[k]);
          buffers[k] = await c.decodeAudioData(await res.arrayBuffer());
        } catch { /* leave this cue silent rather than break playback */ }
      }),
    ).then(() => undefined);
  }
  return loading;
}

/** Create + resume the audio context and preload the cues. Call from a user gesture. */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  void load(ctx);
}

let unlockWired = false;
/** Unlock on the first user interaction anywhere — once. */
export function wireAudioUnlock(): void {
  if (unlockWired) return;
  unlockWired = true;
  const fn = () => { unlockAudio(); };
  window.addEventListener('pointerdown', fn, { once: true, passive: true });
  window.addEventListener('keydown', fn, { once: true });
}

export function playSound(kind: SoundKind): void {
  if (useSoundStore.getState().muted) return;
  const c = ctx;
  const buf = buffers[kind];
  if (!c || !buf) return; // not unlocked/loaded yet
  if (c.state === 'suspended') void c.resume();
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = GAIN[kind];
  src.connect(g).connect(c.destination);
  src.start();
}
