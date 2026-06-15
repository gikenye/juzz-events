import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './app/HomePage';
import { GamePage } from './app/GamePage';
import { ExhibitionPage } from './app/ExhibitionPage';
import { AllGamesPage } from './app/AllGamesPage';
import { LoginPage } from './app/LoginPage';
import { WalletPage } from './app/WalletPage';
import { useAuthStore } from './store/authStore';
import { useTournamentStore } from './store/tournamentStore';
import { usePositionsStore } from './store/positionsStore';
import { buildCupVM } from './lib/tournamentView';
import { SettlementBanner } from './components/market/SettlementBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** `/game` with no id → the current live match (cup) or the rolling feed. */
function LiveGame() {
  const snapshot = useTournamentStore(s => s.snapshot);
  const league = useTournamentStore(s => s.league);
  const startsAt = useTournamentStore(s => s.nextMatchStartsAtMs);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const now = useTournamentStore(s => s.now);
  useEffect(() => { useTournamentStore.getState().bind(); }, []);

  if (snapshot) {
    const vm = buildCupVM(snapshot, league, startsAt, now - offset);
    const current = vm.matches.find(m => m.isCurrent) ?? vm.matches.find(m => m.phase !== 'completed');
    if (current) return <Navigate to={`/game/${current.id}`} replace />;
  }
  return <ExhibitionPage />;
}

export default function App() {
  useEffect(() => {
    const auth = useAuthStore.getState();
    auth.detectMiniPay();
    auth.bindSocket();
    // MiniPay auto-connects silently (no button, no onboarding) and we read the
    // user's on-chain stablecoins up front — they land straight in the app.
    if (useAuthStore.getState().isMiniPay) void auth.connectInjected(true);
    useTournamentStore.getState().bind();
    // Positions/settlements bound once, globally — the payout banner must reach the
    // user wherever they are (Home, /games, wallet), not only inside the arena.
    usePositionsStore.getState().bind();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <>
              <Navbar />
              {/* Global payout banner — floats below the navbar on every page so a
                  win/refund is unmissable, even after the arena auto-rolls. */}
              <div className="fixed top-20 inset-x-0 z-30 px-4 pointer-events-none">
                <div className="max-w-2xl mx-auto pointer-events-auto">
                  <SettlementBanner />
                </div>
              </div>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/games" element={<AllGamesPage />} />
                <Route path="/game" element={<LiveGame />} />
                <Route path="/game/:matchId" element={<GamePage />} />
                <Route path="/wallet" element={<WalletPage />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
