import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";

export interface TimerHandle {
  getTime: () => number;
}

interface TimerProps {
  resetTimer: boolean;
  onResetComplete: () => void;
  initialTime?: number;
}

const Timer = forwardRef<TimerHandle, TimerProps>(({ resetTimer, onResetComplete, initialTime }, ref) => {
  const [time, setTime] = useState(initialTime ?? 0);
  const timeRef = useRef(initialTime ?? 0);

  useImperativeHandle(ref, () => ({
    getTime: () => timeRef.current,
  }));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((prevTime) => {
        const next = prevTime + 1;
        timeRef.current = next;
        return next;
      });
    }, 10);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (resetTimer) {
      const initial = initialTime ?? 0;
      setTime(initial);
      timeRef.current = initial;
      onResetComplete();
    }
  }, [resetTimer, onResetComplete]);

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
});

export default Timer;