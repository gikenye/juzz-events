import { useEffect, useState } from 'react';
import { API_URL } from '../../lib/config';

let cache: Record<string, string> | null = null;

export function useAgentNames(): (slug: string) => string {
  const [names, setNames] = useState<Record<string, string>>(cache ?? {});
  useEffect(() => {
    if (cache) return;
    fetch(`${API_URL}/agents`)
      .then(r => r.json())
      .then((agents: { id: string; name: string }[]) => {
        cache = Object.fromEntries(agents.map(a => [a.id, a.name]));
        setNames(cache);
      })
      .catch(() => {});
  }, []);
  return (slug: string) => names[slug] ?? slug;
}
