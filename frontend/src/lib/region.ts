// Best-effort ISO 3166 alpha-2 country code, offline and privacy-friendly (no IP lookup):
// derived from the browser locale's region subtag (e.g. "en-KE" → "KE"). The Buy Widget
// uses it only to pick region-appropriate onramp providers; undefined = let thirdweb decide.
export function detectCountry(): string | undefined {
  const langs: string[] = [navigator.language, ...(navigator.languages || [])].filter(Boolean) as string[];
  for (const l of langs) {
    const m = /-([A-Za-z]{2})\b/.exec(l);
    if (m) return m[1].toUpperCase();
  }
  return undefined;
}
