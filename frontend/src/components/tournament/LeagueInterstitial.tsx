// Between cups the board becomes a recap show: the last final auto-replays
// (badged REPLAY), with the champion, standings, and the countdown to the
// next cup — never a dead waiting screen.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { GameReplay } from '../../lib/types';
import { useTournamentStore } from '../../store/tournamentStore';
import { ChessBoard } from '../chess/ChessBoard';
import { useAgentNames } from './useAgentNames';

const REPLAY_PLY_MS = 1800;

function fmt(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${s.toString().padStart(2, '0')}`;
}

export function LeagueInterstitial() {
  const league = useTournamentStore(s => s.league);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const nameOf = useAgentNames();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [replay, setReplay] = useState<GameReplay | null>(null);
  const [ply, setPly] = useState(0);
  const finalId = league?.last_final_game ?? null;
  const loaded = useRef<string | null>(null);
  useEffect(() => {
    if (!finalId || loaded.current === finalId) return;
    loaded.current = finalId;
    api.gameReplay(finalId).then(r => { setReplay(r); setPly(0); }).catch(() => {});
  }, [finalId]);
  useEffect(() => {
    if (!replay || replay.moves.length === 0) return;
    const id = setInterval(() => setPly(p => (p + 1) % replay.moves.length), REPLAY_PLY_MS);
    return () => clearInterval(id);
  }, [replay]);

  if (!league) {
    return <p className="text-center text-muted py-16">Connecting…</p>;
  }

  const startsIn = league.next_tournament_at_ms
    ? Math.max(0, league.next_tournament_at_ms - (now - offset))
    : null;

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-muted text-xs uppercase tracking-widest mb-1">Season {league.season}</p>
        {league.last_champion && (
          <p className="font-display text-gold text-xl font-bold">🏆 {nameOf(league.last_champion)}</p>
        )}
        {startsIn !== null && (
          <p className="text-ivory text-sm mt-2">
            Next cup in <span className="font-display font-bold text-gold tabular-nums">{fmt(startsIn)}</span>
          </p>
        )}
      </div>

      {replay && replay.moves.length > 0 && (
        <div className="relative">
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 text-gold text-[10px] font-semibold tracking-widest">
            REPLAY · THE FINAL
          </span>
          <ChessBoard fen={replay.moves[ply].state} lastMove={null} />
          <p className="text-center text-muted text-xs mt-2">
            {replay.players.map(p => p.name).join(' vs ')} · move {replay.moves[ply].n}
          </p>
        </div>
      )}

      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="font-display text-ivory text-sm font-semibold mb-2">Standings</h3>
        <div className="flex flex-col">
          {league.standings.map((r, i) => (
            <div key={r.agent_id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
              <span className="text-ivory">
                <span className="text-muted tabular-nums mr-2">{i + 1}</span>{r.name}
                {r.titles > 0 && <span className="text-gold ml-1.5 text-xs">{'🏆'.repeat(Math.min(r.titles, 3))}</span>}
              </span>
              <span className="text-gold font-semibold tabular-nums">{r.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
