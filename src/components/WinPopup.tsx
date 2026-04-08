import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WinPopupProps {
  isVisible: boolean;
  isNewHighscore: boolean;
  time: string;
  onPlayAgain: () => void;
}

const WinPopup: React.FC<WinPopupProps> = ({ isVisible, isNewHighscore, time, onPlayAgain }) => {
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
            <h1 className="text-7xl title-glow tracking-widest">
              YOU WON!
            </h1>

            {/* Divider */}
            <div className="w-full border-t border-[#c9a227] opacity-40" />

            {/* Time */}
            <p className="text-3xl text-gray-300 tracking-wide">
              TIME&nbsp;&nbsp;<span className="text-white">{time}</span>
            </p>

            {/* New Highscore badge */}
            {isNewHighscore && (
              <motion.div
                className="border-2 border-[#e8b430] text-[#e8b430] px-5 py-1 text-3xl tracking-widest"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.25 }}
              >
                ★ NEW HIGHSCORE ★
              </motion.div>
            )}

            {/* Play again button */}
            <button
              onClick={onPlayAgain}
              className="retro-btn mt-1 w-full text-3xl tracking-widest py-2 font-vt323"
            >
              PLAY AGAIN
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinPopup;
