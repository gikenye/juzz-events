import { useEffect, useState } from 'react';
import { socket } from '../lib/ws';

export interface ServerTaunt { gameId: string; seat: string; text: string }

const VISIBLE_MS = 5000; // how long a line stays up before it fades

/**
 * Latest server-authored trash-talk line for `gameId`. The Taunter broadcasts
 * `agent_taunt` to every viewer, so the banter is consistent across devices.
 * Tagged with its gameId and filtered on read, so switching matches never shows
 * a stale line and we avoid resetting state inside an effect.
 */
export function useServerTaunt(gameId: string | null): ServerTaunt | null {
  const [taunt, setTaunt] = useState<ServerTaunt | null>(null);

  useEffect(() => {
    return socket.on('agent_taunt', (t) =>
      setTaunt({ gameId: t.gameId, seat: t.seat, text: t.text }));
  }, []);

  useEffect(() => {
    if (!taunt) return;
    const id = window.setTimeout(() => setTaunt(null), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [taunt]);

  return taunt && taunt.gameId === gameId ? taunt : null;
}
