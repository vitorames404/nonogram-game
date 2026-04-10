import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Grid from "./components/Grid.tsx";
import Buttons from "./components/Buttons.tsx";
import Timer from "./components/Timer.tsx";
import Login from "./pages/Login.tsx";
import DailyChallenge from "./pages/DailyChallenge.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Logout from "pixelarticons/svg/logout.svg";
import HowToPlayPopup from "./components/HowtoPlayPopup.tsx";
import WinPopup from "./components/WinPopup.tsx";

import {Canvas} from "@react-three/fiber";
import {Stars} from "@react-three/drei";

const App: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [rowHints, setRowHints] = useState<number[][]>([]);
  const [colHints, setColHints] = useState<number[][]>([]);
  const [resetTimer, setResetTimer] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [isNewHighscore, setIsNewHighscore] = useState(false);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [highscorePrint, setHighscorePrint] = useState<string>("--");
  const [username, setUsername] = useState<string>("Loading...")
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentScorePrint, setCurrentScorePrint] = useState<string>("0:00:00");
  const [gridSize, setGridSize] = useState<5 | 10 | 15>(5);
  const [isAdmin, setIsAdmin] = useState(false);
  const [solveSignal, setSolveSignal] = useState(0);
  const [highScore10, setHighScore10] = useState<number | null>(null);
  const [highscorePrint10, setHighscorePrint10] = useState<string>("--");

  const SIZES: (5 | 10 | 15)[] = [5, 10, 15];

  useEffect(() => {
    generateGame(5);
    getHighscore();
  }, []);

  useEffect(() => { highScore !== null ? formatTime(highScore, setHighscorePrint) : setHighscorePrint("--"); }, [highScore]);
  useEffect(() => { highScore10 !== null ? formatTime(highScore10, setHighscorePrint10) : setHighscorePrint10("--"); }, [highScore10]);

  const generateGame = (size: 5 | 10 | 15 = gridSize) => {
    const newGrid = createGrid(size);
    setGrid(newGrid);
    const { rowHints, colHints } = calculateHints(newGrid);
    setRowHints(rowHints);
    setColHints(colHints);
    setResetTimer(true);
  };

  const handleSizeChange = (size: 5 | 10 | 15) => {
    setGridSize(size);
    setShowWinPopup(false);
    generateGame(size);
  };

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';

  const formatTime = (centiseconds: number, setter: (s: string) => void = setHighscorePrint): void => {
    const minutes = Math.floor((centiseconds / 100) / 60);
    const seconds = Math.floor((centiseconds / 100) % 60);
    const cs = centiseconds % 100;
    setter(`${minutes}:${String(seconds).padStart(2, '0')}:${String(cs).padStart(2, '0')}`);
  };

  const createGrid = (size: number): number[][] => {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => (Math.random() < 0.5 ? 0 : 1))
    );
  };

  const calculateHints = (grid: number[][]) => {
    const calculateLineHints = (line: number[]) => {
      const hints: number[] = [];
      let count = 0;

      for (const cell of line) {
        if (cell === 1) {
          count += 1;
        } else if (count > 0) {
          hints.push(count);
          count = 0;
        }
      }

      if (count > 0) {
        hints.push(count);
      }

      return hints.length > 0 ? hints : [0];
    };

    const rowHints = grid.map((row) => calculateLineHints(row));
    const colHints = grid[0].map((_, colIndex) =>
      calculateLineHints(grid.map((row) => row[colIndex]))
    );

    return { rowHints, colHints };
  };

  const getHighscore = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-userinfo`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      setUsername(data.username);
      setHighScore(data.highscore ?? null);
      setHighScore10(data.highscore10 ?? null);
      setIsAdmin(data.isAdmin ?? false);
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const updateHS = async (size: 5 | 10 | 15, score: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/update-highscore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highscore: score, size }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        if (size === 10) setHighScore10(data.highscore);
        else setHighScore(data.highscore);
      } else {
        console.error('Failed to update high score:', data.message);
      }
    } catch (err) {
      console.error('Error updating high score:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',  // Ensure cookies are included in the request
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
  
      if (response.ok) {
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/home";  
      } else {
        console.error('Failed to logout');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const handleWin = async () => {
    const activeHS = gridSize === 10 ? highScore10 : highScore;
    const newHS = activeHS == null || currentScore < activeHS;
    formatTime(currentScore, setCurrentScorePrint);
    setIsNewHighscore(newHS);
    setShowWinPopup(true);
    getHighscore();
    if (newHS) updateHS(gridSize, currentScore);
  };

  const handlePlayAgain = () => {
    setShowWinPopup(false);
    setIsNewHighscore(false);
    generateGame();
  };

  const handleTimerComplete = (timeTaken: number) => {
    setCurrentScore(timeTaken);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/home" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                <div className="flex flex-col min-h-screen relative z-10 text-white scanlines">

                  {/* ── Navbar ── */}
                  <nav className="font-vt323 w-full flex items-center justify-between px-4 py-2 border-b-2 border-[#c9a227] bg-[#0f0f1c] bg-opacity-90 backdrop-blur-sm sticky top-0 z-20 relative">

                    {/* Left — title */}
                    <motion.span
                      className="title-glow text-3xl md:text-4xl tracking-widest select-none"
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      NONOGRAM
                    </motion.span>

                    {/* Center — size tabs (truly centered regardless of side widths) */}
                    <div className="flex gap-1 absolute left-1/2 -translate-x-1/2">
                      {SIZES.map(size => {
                        const locked = size === 15;
                        const active = gridSize === size;
                        return (
                          <div key={size} className="relative group">
                            <button
                              disabled={locked}
                              onClick={() => !locked && handleSizeChange(size)}
                              className={`text-2xl tracking-widest px-3 py-1 border-2 transition-colors duration-100
                                ${locked
                                  ? "border-gray-700 text-gray-600 cursor-not-allowed"
                                  : active
                                    ? "bg-[#c9a227] text-[#0b0b14] border-[#e8b430]"
                                    : "bg-transparent text-[#c9a227] border-[#c9a227] hover:bg-[#c9a227] hover:text-[#0b0b14]"
                                }`}
                            >
                              {size}×{size}
                            </button>
                            {locked && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0f0f1c] border border-[#c9a227] text-[#c9a227] text-lg px-2 py-1 whitespace-nowrap">
                                COMING SOON
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right — logout only */}
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="border-2 border-[#c9a227] p-1 hover:bg-[#c9a227] transition-colors"
                    >
                      <img
                        src={Logout}
                        alt="Logout"
                        className="w-5 h-5"
                        style={{ filter: 'invert(70%) sepia(80%) saturate(400%) hue-rotate(5deg)' }}
                      />
                    </button>
                  </nav>

                  {/* ── Scores card — fixed to right side ── */}
                  <div className="font-vt323 retro-card fixed right-4 top-1/2 -translate-y-1/2 z-10 p-5 flex-col gap-3 min-w-[170px] hidden md:flex">
                    <div className="border-b border-[#c9a227] pb-2">
                      <p className="text-base text-gray-400 tracking-widest uppercase">playing as</p>
                      <h3 className="text-2xl text-[#e8b430] tracking-widest">{username}</h3>
                    </div>
                    <div>
                      <p className="text-base text-gray-400 tracking-widest uppercase mb-2">highscores</p>
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-[#c9a227] tracking-wider">5×5</p>
                          <p className="text-white text-xl">{highscorePrint}</p>
                        </div>
                        <div>
                          <p className="text-[#c9a227] tracking-wider">10×10</p>
                          <p className="text-white text-xl">{highscorePrint10}</p>
                        </div>
                        <div>
                          <p className="text-[#c9a227] tracking-wider">15×15</p>
                          <p className="text-gray-600 text-lg">COMING SOON</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Main game area ── */}
                  <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center gap-4">
                      <Grid
                        grid={grid}
                        rowHints={rowHints}
                        colHints={colHints}
                        calculateHints={calculateHints}
                        winCallBack={handleWin}
                        solveSignal={solveSignal}
                      />
                      <Buttons
                        onClick={() => generateGame()}
                        onHowToPlayClick={() => setShowHowToPlay(true)}
                      />
                      {isAdmin && (
                        <button
                          onClick={() => setSolveSignal(s => s + 1)}
                          className="font-vt323 text-xl tracking-widest px-4 py-2 border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-[#0b0b14] transition-colors"
                          title="Admin: Autocomplete"
                        >
                          SOLVE
                        </button>
                      )}
                      <Timer
                        resetTimer={resetTimer}
                        onResetComplete={() => setResetTimer(false)}
                        onComplete={handleTimerComplete}
                      />
                    </div>
                  </main>
                </div>

                {/* How to Play Popup */}
                <HowToPlayPopup isVisible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
                {/* Win Popup */}
                <WinPopup
                  isVisible={showWinPopup}
                  isNewHighscore={isNewHighscore}
                  time={currentScorePrint}
                  onPlayAgain={handlePlayAgain}
                />
                {/* Canvas for Stars */}
                <div className="fixed inset-0 z-0 pointer-events-none bg-[#0f0f1c]">
                  <Canvas>
                    <Stars
                      radius={100}
                      depth={50}
                      count={5000}
                      factor={4}
                      saturation={0}
                      fade
                      speed={1}
                    />
                  </Canvas>
                </div>
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-challenge"
            element={
              <ProtectedRoute>
                <DailyChallenge calculateHints={calculateHints} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;