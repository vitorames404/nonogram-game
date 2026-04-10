import React, { useState, useEffect } from "react";
import Grid from "../components/Grid";
import Timer from "../components/Timer";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import DailyChallengeButtons from "../components/DailyChallengeButtons";
import DailyWinPopup from "../components/DailyWinPopup";
import { useNavigate } from "react-router-dom";

interface DailyChallengeProps {
  calculateHints: (grid: number[][]) => {
    rowHints: number[][];
    colHints: number[][];
  };
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ calculateHints }) => {
  const navigate = useNavigate();
  const [grid, setGrid] = useState<number[][]>([]);
  const [rowHints, setRowHints] = useState<number[][]>([]);
  const [colHints, setColHints] = useState<number[][]>([]);
  const [resetTimer, setResetTimer] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<{ username: string; time: number }[]>([]);
  const [alreadyPlayed, setAlreadyPlayed] = useState<boolean>(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winTime, setWinTime] = useState<string>("0:00");
  const [streak, setStreak] = useState<number>(0);

  // Helper function to format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60); // Convert seconds to minutes
    const seconds = timeInSeconds % 60; // Get the remaining seconds
    return `${minutes}m${String(seconds).padStart(2, "0")}s`; // Format as MM:SS
  };

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';

  // Start the daily challenge: server atomically checks alreadyPlayed,
  // marks the user as played, records start time, and returns the puzzle.
  const startDailyChallenge = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/start-daily`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.guest) {
          setError("You can't see this as a guest, create an account :|");
        } else {
          setAlreadyPlayed(true);
          setError("You can only play once a day >:(");
        }
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to start the daily challenge.");
      }

      const { puzzle } = await response.json();
      setGrid(puzzle.grid);
      setRowHints(puzzle.rowHints);
      setColHints(puzzle.colHints);
      setResetTimer(true);
    } catch (error) {
      console.error("Error in startDailyChallenge:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fetch-ranking`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { rankings } = await response.json();
      setRanking(rankings);
    } catch (err) {
      console.error("Error in fetchRanking:", err);
    }
  };

  const handleTimerComplete = (_timeTaken: number) => {
    // Time is now computed server-side; nothing to do here
  };

  const formatServerTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100);
    return `${mins}:${String(secs).padStart(2, "0")}:${String(cs).padStart(2, "0")}`;
  };

  const addRanking = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/add-ranking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWinTime(formatServerTime(data.time));
        setStreak(data.streak ?? 0);
      } else {
        const errorData = await response.json();
        console.error('Error adding ranking:', errorData);
      }
    } catch (err) {
      console.error("Error in addRanking:", err);
    }
  };

  const handleWin = async () => {
    await addRanking();
    fetchRanking();
    setShowWinPopup(true);
  };

  useEffect(() => {
    startDailyChallenge();
    fetchRanking();
  }, []);

  // Monitor changes to the ranking state and log the updated value
  useEffect(() => {
    console.log("Updated Ranking:", ranking);
  }, [ranking]);

  return (
    <div className="font-vt323">
      <DailyWinPopup
        isVisible={showWinPopup}
        time={winTime}
        streak={streak}
        onClose={() => navigate("/")}
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

      {/* Main Content */}
      <div className="flex flex-col min-h-screen text-white relative z-10">
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="relative flex flex-col items-center gap-4">
            {/* Timer */}
            <Timer
              resetTimer={resetTimer}
              onResetComplete={() => setResetTimer(false)}
              onComplete={handleTimerComplete}
            />

            {/* Display loading or error */}
            {loading && <p className="text-2xl text-center">Loading...</p>}
            {error && <p className="text-red-500 text-center text-3xl">{error}</p>}

            {/* Grid */}
            {!loading && !error && !alreadyPlayed && (
              <Grid
                grid={grid}
                rowHints={rowHints}
                colHints={colHints}
                calculateHints={calculateHints}
                winCallBack={handleWin}
              />
            )}

            {/* Buttons */}
            <DailyChallengeButtons/>

            {/* Ranking List */}
            {!loading && ranking.length > 0 && (
              <div className="mt-6 w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="font-bold text-center text-3xl mb-4">Rankings</h2>
                <ul className="text-2xl">
                  {ranking.map((entry, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-gray-700 p-2 rounded-md mb-2"
                    >
                      <span className="font-medium">{entry.username}</span>
                      <span className="text-1xl text-gray-400">
                        {formatTime(entry.time)} {/* Format the time here */}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No rankings available */}
            {!loading && ranking.length === 0 && (
              <p className="mt-6 text-gray-500 text-center text-3xl">No rankings available yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DailyChallenge;