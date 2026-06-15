// "Last Knight" inferno — the live arena background: a deep-dark floor
// with animated flame tongues + rising embers + fire glow. Pure CSS so the
// arena surfaces stay consistent across pages.

const INFERNO_FLAMES = Array.from({ length: 8 }, (_, i) => ({
  left: `${(i * 12.5 + 2) % 100}%`,
  width: 44 + (i % 5) * 22,
  height: 90 + (i % 7) * 45,
  delay: `${((i * 0.4) % 2).toFixed(2)}s`,
  duration: `${(1.4 + (i % 4) * 0.45).toFixed(2)}s`,
  color: i % 3 === 0 ? '#FF2200' : i % 3 === 1 ? '#FF6600' : '#FFAA00',
}));

const INFERNO_EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 23 + 5) % 98}%`,
  size: 2 + (i % 4),
  delay: `${((i * 0.5) % 4).toFixed(2)}s`,
  duration: `${(2.5 + (i % 5) * 0.6).toFixed(2)}s`,
  dx: `${((i % 9) - 4) * 20}px`,
  color: i % 3 === 0 ? '#FFBE00' : i % 3 === 1 ? '#FF7A00' : '#FF4400',
}));

export function LastKnightBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ contain: 'layout style paint' }}>
      <style>{`
        @keyframes inferno-flame {
          0%   { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.88; }
          40%  { transform: translateY(-55%) scaleX(0.72) scaleY(1.1); opacity: 0.65; }
          80%  { transform: translateY(-100%) scaleX(0.42) scaleY(0.75); opacity: 0.25; }
          100% { transform: translateY(-130%) scaleX(0.18) scaleY(0.4); opacity: 0; }
        }
        @keyframes inferno-ember {
          0%   { transform: translateY(0) translateX(0); opacity: 0.85; }
          60%  { opacity: 0.7; }
          100% { transform: translateY(-260px) translateX(var(--ember-dx)); opacity: 0; }
        }
        @keyframes inferno-glow {
          0%, 100% { opacity: 0.50; }
          50%       { opacity: 0.75; }
        }
      `}</style>

      {/* base deep dark */}
      <div className="absolute inset-0" style={{ background: '#0A0500' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 55% at 50% 100%, #2A0800 0%, #0A0500 60%)' }} />

      {/* fire floor glow */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 100% 70% at 50% 100%, rgba(255,80,0,0.28) 0%, rgba(255,40,0,0.10) 45%, transparent 65%)',
        animation: 'inferno-glow 2.8s ease-in-out infinite',
      }} />

      {/* flame tongues */}
      {INFERNO_FLAMES.map((f, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          bottom: -24, left: f.left,
          width: f.width, height: f.height,
          background: `radial-gradient(ellipse 55% 100% at 50% 100%, ${f.color}cc 0%, ${f.color}77 30%, transparent 72%)`,
          borderRadius: '50% 50% 20% 20% / 80% 80% 20% 20%',
          filter: 'blur(4px)',
          transformOrigin: 'bottom center',
          animation: `inferno-flame ${f.duration} ease-in ${f.delay} infinite`,
          willChange: 'transform, opacity',
        }} />
      ))}

      {/* ember particles */}
      {INFERNO_EMBERS.map((e, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          bottom: '4%', left: e.left,
          width: e.size, height: e.size,
          background: e.color,
          boxShadow: `0 0 ${e.size * 2}px ${e.color}`,
          ['--ember-dx' as string]: e.dx,
          animation: `inferno-ember ${e.duration} ease-out ${e.delay} infinite`,
          willChange: 'transform, opacity',
        }} />
      ))}

      {/* centre glow behind board */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 55% 40% at 50% 50%, rgba(255,80,0,0.10) 0%, transparent 60%)',
        animation: 'inferno-glow 3.5s ease-in-out infinite 0.6s',
      }} />

      {/* dark readability gradient — top stays dark, content legible */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(4,2,0,0.72) 0%, rgba(8,3,0,0.35) 40%, rgba(8,3,0,0.55) 70%, rgba(4,2,0,0.88) 100%)',
      }} />
    </div>
  );
}
