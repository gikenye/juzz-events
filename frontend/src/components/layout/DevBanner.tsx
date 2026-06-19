// Site-wide "active development" notice (home only) — a full-width barricade-tape
// strip pinned at the very top, above the navbar. The hazard stripes give way to
// a solid centre plate so the message stays fully legible while the tape still
// frames it on both sides. Purely presentational.
const TAPE = {
  background: 'repeating-linear-gradient(45deg, #FFB020 0 16px, #0A0A0A 16px 32px)',
} as const;

export function DevBanner() {
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 min-h-8 flex items-stretch select-none overflow-hidden"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.6)', boxShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
      role="status"
      aria-live="polite"
    >
      {/* Left hazard tape */}
      <div className="flex-1 min-w-[14px]" style={TAPE} />

      {/* Solid plate — the tape gives way here so the text is clean and readable.
          Wraps to a second line on narrow screens so the full message stays visible. */}
      <div
        className="flex items-center px-3 sm:px-4 py-1 min-w-0"
        style={{
          background: '#0A0A0A',
          borderLeft: '1px solid rgba(255,160,64,0.45)',
          borderRight: '1px solid rgba(255,160,64,0.45)',
        }}
      >
        <span
          className="text-[10.5px] sm:text-xs font-bold tracking-wide text-center leading-tight line-clamp-2"
          style={{ color: '#FFCB6B', letterSpacing: 0.4 }}
        >
          🚧 We are currently building our App and some functionalities might break. Feel free to poke around.
        </span>
      </div>

      {/* Right hazard tape */}
      <div className="flex-1 min-w-[14px]" style={TAPE} />
    </div>
  );
}
