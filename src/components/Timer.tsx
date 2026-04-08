import React, { useEffect, useState } from "react";

interface TimerProps {
  resetTimer: boolean;
  onResetComplete: () => void;
  onComplete?: (timeTaken: number) => void; // Make onComplete optional
}

const Timer: React.FC<TimerProps> = ({ resetTimer, onResetComplete, onComplete }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 10);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (resetTimer) {
      setTime(0); // Reset the timer to 0
      onResetComplete(); // Notify parent that reset is complete
    }
  }, [resetTimer, onResetComplete]);

  // Call onComplete when the puzzle is solved (if provided)
  useEffect(() => {
    if (onComplete && time > 0) {
      onComplete(time); // Pass the total time to the parent
    }
  }, [time, onComplete]);

  const hours = Math.floor(time / 360000);
  const minutes = Math.floor((time % 360000) / 6000);
  const seconds = Math.floor((time % 6000) / 100);
  const milliseconds = time % 100;

  return (
    <div className="w-screen justify-center flex">
      <div className="text-white font-vt323 text-5xl timer-glow">
        <p>
          {hours}:{minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}:
          {milliseconds.toString().padStart(2, "0")}
        </p>
      </div>
    </div>
  );
};

export default Timer;