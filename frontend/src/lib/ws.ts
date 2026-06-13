// Resilient multiplexed WebSocket to the juzz backend.
//
// One socket carries: game stream (subscribe + since_seq replay), market stream,
// trades, and the private user channel. It auto-reconnects with backoff and re-applies
// the desired subscription state on every (re)open, so a dropped connection re-syncs
// instead of going stale. A heartbeat ping keeps it under the ~5min idle timeout.
import { WS_URL } from './config';
import type {
  TournamentSnapshot, TournamentEvent,
  GameSummary, GameSnapshot, GameEvent, MarketSummary, MarketEvent,
  TradeConfirmed, UserEvent, Side, WsError,
} from './types';

type Inbound =
  | { type: 'game_list'; games: GameSummary[] }
  | { type: 'subscribed'; game_id: string; snapshot: GameSnapshot }
  | { type: 'event'; event: GameEvent }
  | { type: 'market_list'; markets: MarketSummary[] }
  | { type: 'market_subscribed'; market_id: string; snapshot: MarketSummary }
  | { type: 'market_event'; event: MarketEvent }
  | TradeConfirmed
  | { type: 'user_event'; event: UserEvent }
  | { type: 'tournament_subscribed'; snapshot: TournamentSnapshot }
  | { type: 'tournament_event'; event: TournamentEvent }
  | { type: 'agent_taunt'; game_id: string; seat: string; agent_id: string; text: string }
  | WsError
  | { type: 'pong' }
  | { type: string; [k: string]: unknown };

export type SocketStatus = 'connecting' | 'open' | 'closed';

interface Events {
  status: SocketStatus;
  game_list: GameSummary[];
  subscribed: { game_id: string; snapshot: GameSnapshot };
  event: GameEvent;
  market_list: MarketSummary[];
  market_subscribed: { market_id: string; snapshot: MarketSummary };
  market_event: MarketEvent;
  trade_confirmed: TradeConfirmed;
  user_event: UserEvent;
  tournament_subscribed: TournamentSnapshot;
  tournament_event: TournamentEvent;
  agent_taunt: { gameId: string; seat: string; agentId: string; text: string };
  error: WsError;
}

type Handler<T> = (payload: T) => void;

const HEARTBEAT_MS = 25_000;
const BACKOFF_MIN = 500;
const BACKOFF_MAX = 8_000;

export class JuzzSocket {
  private ws: WebSocket | null = null;
  private session: string | null = null;
  private status: SocketStatus = 'closed';
  private backoff = BACKOFF_MIN;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByUser = false;

  // Desired subscription state — re-applied on every (re)open for seamless resync.
  private gameSub: { game_id: string; since_seq: number } | null = null;
  private marketSub: string | null = null;
  private userSub = false;
  private tournamentSub = false;

  private handlers = new Map<keyof Events, Set<(p: unknown) => void>>();

  on<K extends keyof Events>(type: K, fn: Handler<Events[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) { set = new Set(); this.handlers.set(type, set); }
    set.add(fn as (p: unknown) => void);
    return () => { this.handlers.get(type)?.delete(fn as (p: unknown) => void); };
  }

  private emit<K extends keyof Events>(type: K, payload: Events[K]) {
    this.handlers.get(type)?.forEach(fn => fn(payload));
  }

  getStatus(): SocketStatus { return this.status; }

  /** Connect (or reconnect with a trading session if `session` is given). */
  connect(session?: string | null) {
    if (session !== undefined) this.session = session;
    this.closedByUser = false;
    this.open();
  }

  private open() {
    this.cleanupSocket();
    this.setStatus('connecting');
    const url = this.session ? `${WS_URL}?session=${encodeURIComponent(this.session)}` : WS_URL;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.backoff = BACKOFF_MIN;
      this.setStatus('open');
      // Re-apply desired subscriptions so a reconnect resumes exactly where we were.
      if (this.gameSub) this.raw({ type: 'subscribe', game_id: this.gameSub.game_id, since_seq: this.gameSub.since_seq });
      if (this.marketSub) this.raw({ type: 'subscribe_market', market_id: this.marketSub });
      if (this.userSub) this.raw({ type: 'subscribe_user' });
      if (this.tournamentSub) this.raw({ type: 'subscribe_tournament' });
      this.startHeartbeat();
    };

    ws.onmessage = (e) => {
      if (typeof e.data !== 'string') return; // server sends text frames only
      let msg: Inbound;
      try { msg = JSON.parse(e.data); } catch { return; }
      this.route(msg);
    };

    ws.onclose = () => { this.stopHeartbeat(); if (!this.closedByUser) this.scheduleReconnect(); else this.setStatus('closed'); };
    ws.onerror = () => { /* close handler drives reconnect */ };
  }

  private route(msg: Inbound) {
    switch (msg.type) {
      case 'game_list': return this.emit('game_list', (msg as { games: GameSummary[] }).games);
      case 'subscribed': {
        const m = msg as { game_id: string; snapshot: GameSnapshot };
        if (this.gameSub) this.gameSub.since_seq = m.snapshot.move_number; // snapshot baseline
        return this.emit('subscribed', m);
      }
      case 'event': {
        const ev = (msg as { event: GameEvent }).event;
        if (this.gameSub && typeof ev.seq === 'number') this.gameSub.since_seq = ev.seq;
        return this.emit('event', ev);
      }
      case 'market_list': return this.emit('market_list', (msg as { markets: MarketSummary[] }).markets);
      case 'market_subscribed': return this.emit('market_subscribed', msg as { market_id: string; snapshot: MarketSummary });
      case 'market_event': return this.emit('market_event', (msg as { event: MarketEvent }).event);
      case 'trade_confirmed': return this.emit('trade_confirmed', msg as TradeConfirmed);
      case 'user_event': return this.emit('user_event', (msg as { event: UserEvent }).event);
      case 'tournament_subscribed': return this.emit('tournament_subscribed', (msg as { snapshot: TournamentSnapshot }).snapshot);
      case 'tournament_event': return this.emit('tournament_event', (msg as { event: TournamentEvent }).event);
      case 'agent_taunt': {
        const t = msg as { game_id: string; seat: string; agent_id: string; text: string };
        return this.emit('agent_taunt', { gameId: t.game_id, seat: t.seat, agentId: t.agent_id, text: t.text });
      }
      case 'pong': return;
      case 'error': {
        const err = msg as WsError;
        // Lag → the desired-state reconnect path will re-snapshot; nudge a resubscribe.
        if (err.code?.endsWith('STREAM_LAGGED')) this.resubscribe();
        return this.emit('error', err);
      }
    }
  }

  // ── public commands ─────────────────────────────────────────────────────────
  listGames() { this.raw({ type: 'list_games' }); }

  subscribeGame(gameId: string, sinceSeq = 0) {
    this.gameSub = { game_id: gameId, since_seq: sinceSeq };
    this.raw({ type: 'subscribe', game_id: gameId, since_seq: sinceSeq });
  }

  unsubscribeGame() { this.gameSub = null; this.raw({ type: 'unsubscribe' }); }

  listMarkets(gameId: string) { this.raw({ type: 'list_markets', game_id: gameId }); }

  subscribeMarket(marketId: string) { this.marketSub = marketId; this.raw({ type: 'subscribe_market', market_id: marketId }); }
  unsubscribeMarket() { this.marketSub = null; this.raw({ type: 'unsubscribe_market' }); }

  subscribeUser() { this.userSub = true; this.raw({ type: 'subscribe_user' }); }

  subscribeTournament() { this.tournamentSub = true; this.raw({ type: 'subscribe_tournament' }); }
  unsubscribeTournament() { this.tournamentSub = false; this.raw({ type: 'unsubscribe_tournament' }); }

  trade(kind: 'buy' | 'sell', marketId: string, shares: number, side: Side) {
    this.raw({ type: kind, market_id: marketId, shares, side });
  }

  close() { this.closedByUser = true; this.cleanupSocket(); this.setStatus('closed'); }

  // ── internals ───────────────────────────────────────────────────────────────
  private resubscribe() {
    if (this.gameSub) this.raw({ type: 'subscribe', game_id: this.gameSub.game_id, since_seq: this.gameSub.since_seq });
    if (this.marketSub) this.raw({ type: 'subscribe_market', market_id: this.marketSub });
  }

  private raw(obj: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  private setStatus(s: SocketStatus) { if (s !== this.status) { this.status = s; this.emit('status', s); } }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => this.raw({ type: 'ping' }), HEARTBEAT_MS);
  }
  private stopHeartbeat() { if (this.heartbeat) { clearInterval(this.heartbeat); this.heartbeat = null; } }

  private scheduleReconnect() {
    this.setStatus('connecting');
    const delay = this.backoff;
    this.backoff = Math.min(this.backoff * 2, BACKOFF_MAX);
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private cleanupSocket() {
    this.stopHeartbeat();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) {
      this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }
  }
}

// One shared socket for the app.
export const socket = new JuzzSocket();
