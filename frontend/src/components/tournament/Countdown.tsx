import { useTournamentStore } from '../../store/tournamentStore';
import { formatCountdown } from '../../lib/tournament';

interface CountdownProps {
  target: number;       // absolute epoch ms to count down to
  className?: string;
}

/** Live HH:MM:SS / MM:SS countdown. Reads the engine's ticking `now`. */
export function Countdown({ target, className }: CountdownProps) {
  const now = useTournamentStore(s => s.now);
  return <span className={className}>{formatCountdown(target - now)}</span>;
}
