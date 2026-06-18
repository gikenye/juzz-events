// Board sound on/off, persisted so a viewer's choice survives reloads.
// Default ON; the audio engine still waits for a user gesture to unlock
// (browser autoplay policy) — see lib/sound.ts.
import { create } from 'zustand';

const KEY = 'juzz.sound.muted';

function readMuted(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

interface SoundState {
  muted: boolean;
  toggle: () => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  muted: readMuted(),
  toggle: () => set((s) => {
    const muted = !s.muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* private mode */ }
    return { muted };
  }),
}));
