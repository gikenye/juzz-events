import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './app/HomePage';
import { GamePage } from './app/GamePage';
import { LoginPage } from './app/LoginPage';
import { WalletPage } from './app/WalletPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/wallet" element={<WalletPage />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
