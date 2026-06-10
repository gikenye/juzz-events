import { useState } from 'react';

// Official Celo-stablecoin marks (bundled in /public/tokens). Falls back to a brand-coloured
// badge if an asset's SVG is missing, so a new token never renders blank.
const FALLBACK: Record<string, { bg: string; fg: string; glyph: string }> = {
  USDC: { bg: '#2775CA', fg: '#fff', glyph: '$' },
  USDT: { bg: '#26A17B', fg: '#fff', glyph: '₮' },
  USDm: { bg: '#FCFF52', fg: '#000', glyph: 'm' },
};

export function TokenIcon({ symbol, size = 18 }: { symbol: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!broken) {
    return (
      <img src={`/tokens/${symbol.toLowerCase()}.svg`} width={size} height={size} alt=""
        onError={() => setBroken(true)} className="rounded-full shrink-0" />
    );
  }
  const m = FALLBACK[symbol] ?? { bg: '#5b5b6b', fg: '#fff', glyph: symbol[0] };
  return (
    <span style={{ width: size, height: size, background: m.bg, color: m.fg, fontSize: size * 0.6 }}
      className="inline-flex items-center justify-center rounded-full font-bold leading-none shrink-0">
      {m.glyph}
    </span>
  );
}
