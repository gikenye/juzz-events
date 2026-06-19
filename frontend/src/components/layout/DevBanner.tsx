// Site-wide "active development" notice — a full-width barricade-tape strip
// pinned above the navbar on every page. Signals frequent updates / imminent
// launch while making clear the app is fully functional. Purely presentational;
// fixed at the very top so the rest of the chrome offsets below it (see the
// matching top offsets in Navbar + page containers).
export function DevBanner() {
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 h-8 flex items-center justify-center px-3 select-none"
      style={{
        // Amber/black hazard tape, on-brand with the app's orange accent.
        background: 'repeating-linear-gradient(45deg, #FFB020 0 16px, #0A0A0A 16px 32px)',
        borderBottom: '1px solid rgba(0,0,0,0.6)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
      }}
      role="status"
      aria-live="polite"
    >
      <span
        className="text-[10.5px] sm:text-xs font-bold tracking-wide truncate max-w-full"
        style={{
          background: 'rgba(8,8,12,0.92)',
          color: '#FFCB6B',
          padding: '3px 12px',
          borderRadius: 6,
          border: '1px solid rgba(255,160,64,0.35)',
          letterSpacing: 0.4,
        }}
      >
        🚧 We are currently building our App and some functionalities might break. Feel free to poke around.
      </span>
    </div>
  );
}
