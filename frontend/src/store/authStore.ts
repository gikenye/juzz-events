import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  balance: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  deductBalance: (amount: number) => void;
  addBalance: (amount: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      balance: 50,

      async login(email, _password) {
        // Stub: replace with POST /auth/login
        await new Promise(r => setTimeout(r, 600));
        set({ user: { id: crypto.randomUUID(), email } });
      },

      async register(email, _password) {
        // Stub: replace with POST /auth/register
        await new Promise(r => setTimeout(r, 600));
        set({ user: { id: crypto.randomUUID(), email }, balance: 50 });
      },

      logout() {
        set({ user: null });
      },

      deductBalance(amount) {
        set(s => ({ balance: Math.max(0, s.balance - amount) }));
      },

      addBalance(amount) {
        set(s => ({ balance: s.balance + amount }));
      },
    }),
    { name: 'juzzbet-auth', partialize: s => ({ user: s.user, balance: s.balance }) }
  )
);
