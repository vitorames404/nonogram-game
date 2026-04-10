import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DailyWinPopupProps {
  isVisible: boolean;
  time: string;
  streak: number;
  onClose: () => void;
}

const DailyWinPopup: React.FC<DailyWinPopupProps> = ({ isVisible, time, streak, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="font-vt323 retro-card p-10 text-white text-center max-w-sm w-full mx-4 flex flex-col items-center gap-5"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Title */}
            <h1 className="text-6xl title-glow tracking-widest">DAILY DONE!</h1>

            {/* Divider */}
            <div className="w-full border-t border-[#c9a227] opacity-40" />

            {/* Time */}
            <p className="text-3xl text-gray-300 tracking-wide">
              TIME&nbsp;&nbsp;<span className="text-white">{time}</span>
            </p>

            {/* Streak */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-base text-gray-400 tracking-widest uppercase">current streak</p>
              <p className="text-5xl text-[#e8b430] tracking-widest">
                {streak} {streak === 1 ? "DAY" : "DAYS"}
              </p>
            </div>

            {/* Back button */}
            <button
              onClick={onClose}
              className="retro-btn mt-1 w-full text-3xl tracking-widest py-2 font-vt323"
            >
              BACK TO MENU
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyWinPopup;
