import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './app/HomePage';
import { GamePage } from './app/GamePage';
import { AllGamesPage } from './app/AllGamesPage';
import { SamplesPage } from './app/SamplesPage';
import { LoginPage } from './app/LoginPage';
import { WalletPage } from './app/WalletPage';
import { useTournamentEngine } from './hooks/useTournamentEngine';
import { useTournamentStore } from './store/tournamentStore';
import { deriveLiveState } from './lib/tournament';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function TournamentEngine() {
  useTournamentEngine();
  return null;
}

/** `/game` with no id → the current live match. */
function RedirectToLiveGame() {
  const tournament = useTournamentStore(s => s.tournament);
  const now = useTournamentStore(s => s.now);
  const live = deriveLiveState(tournament, now);
  const id = live.match?.id ?? tournament.matches[0].id;
  return <Navigate to={`/game/${id}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <TournamentEngine />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/games" element={<AllGamesPage />} />
                <Route path="/samples" element={<SamplesPage />} />
                <Route path="/game" element={<RedirectToLiveGame />} />
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
