// Auth state, backed by the real juzz sign-in.
//
// Two tokens, never conflated (see docs §2):
//  - loginToken: identifies the account (email-OTP or passkey). No balance, no trading.
//  - tradingToken: minted by deposit-as-auth (wallet PR). Authorizes WS trades.
// MiniPay users skip OTP entirely and go straight to deposit-as-auth.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { socket } from '../lib/ws';
import { createPasskey, getPasskey, passkeySupported } from '../lib/webauthn';

interface Account { id: string; email: string }

interface AuthState {
  user: Account | null;       // login session (account)
  loginToken: string | null;
  tradingToken: string | null; // set by the wallet flow once a deposit lands
  wallet: string | null;       // trading wallet address
  isMiniPay: boolean;
  balance: number;             // dollars; real once a trading session + wallet exist

  detectMiniPay: () => void;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  loginPasskey: (email: string) => Promise<void>;
  registerPasskey: () => Promise<void>;
  passkeyAvailable: () => boolean;
  setTradingSession: (token: string, wallet: string) => void;
  refreshBalance: () => Promise<void>;
  logout: () => void;

  // Optimistic local money — placeholder until trading/wallet PRs replace it.
  deductBalance: (amount: number) => void;
  addBalance: (amount: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loginToken: null,
      tradingToken: null,
      wallet: null,
      isMiniPay: false,
      balance: 0,

      detectMiniPay() {
        const eth = (window as { ethereum?: { isMiniPay?: boolean } }).ethereum;
        set({ isMiniPay: !!eth?.isMiniPay });
      },

      async requestOtp(email) {
        await api.emailRequest(email.trim().toLowerCase());
      },

      async verifyOtp(email, code) {
        const { login_token, account_id } = await api.emailVerify(email.trim().toLowerCase(), code);
        set({ loginToken: login_token, user: { id: account_id, email: email.trim().toLowerCase() } });
      },

      async loginPasskey(email) {
        const e = email.trim().toLowerCase();
        const begin = await api.passkeyLoginBegin(e);
        const credential = await getPasskey(begin.challenge);
        const { login_token, account_id } = await api.passkeyLoginFinish(begin.ceremony_id, credential);
        set({ loginToken: login_token, user: { id: account_id, email: e } });
      },

      async registerPasskey() {
        const token = get().loginToken;
        if (!token) throw new Error('Sign in first to add a passkey.');
        const begin = await api.passkeyRegisterBegin(token);
        const credential = await createPasskey(begin.challenge);
        await api.passkeyRegisterFinish(token, begin.ceremony_id, credential);
      },

      passkeyAvailable: () => passkeySupported(),

      setTradingSession(token, wallet) {
        set({ tradingToken: token, wallet });
        socket.connect(token); // upgrade the live socket to an authenticated (trading) connection
        void get().refreshBalance();
      },

      async refreshBalance() {
        const wallet = get().wallet;
        if (!wallet) return;
        const b = await api.balance(wallet);
        // Trading balance = full available amount. Gas debt is shown only at send time.
        set({ balance: Number(b.available) / 1e6 });
      },

      logout() {
        set({ user: null, loginToken: null, tradingToken: null, wallet: null, balance: 0 });
        socket.connect(null); // drop back to a spectator connection
      },

      deductBalance(amount) { set(s => ({ balance: Math.max(0, s.balance - amount) })); },
      addBalance(amount) { set(s => ({ balance: s.balance + amount })); },
    }),
    {
      name: 'juzzbet-auth',
      partialize: s => ({
        user: s.user, loginToken: s.loginToken, tradingToken: s.tradingToken, wallet: s.wallet,
      }),
    }
  )
);
