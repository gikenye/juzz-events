// Speaker on/off control for the live board sounds. The click is a user
// gesture, so it also unlocks the audio context (browser autoplay policy).
import { useSoundStore } from '../../store/soundStore';
import { unlockAudio } from '../../lib/sound';

export function SoundToggle({ className = '' }: { className?: string }) {
  const muted = useSoundStore((s) => s.muted);
  const toggle = useSoundStore((s) => s.toggle);

  return (
    <button
      type="button"
      aria-label={muted ? 'Unmute board sounds' : 'Mute board sounds'}
      aria-pressed={!muted}
      onClick={() => { unlockAudio(); toggle(); }}
      className={`grid place-items-center w-9 h-9 rounded-lg border border-white/10 bg-black/30 text-muted hover:text-gold hover:border-gold/40 transition-colors ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {muted ? (
          <>
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 6a9 9 0 0 1 0 12" />
          </>
        )}
      </svg>
    </button>
  );
}
