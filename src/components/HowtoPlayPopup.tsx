import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HowToPlayPopupProps {
  onClose: () => void;
  isVisible: boolean;
}

const HowToPlayPopup: React.FC<HowToPlayPopupProps> = ({ onClose, isVisible }) => {
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
            className="font-vt323 retro-card text-white max-w-2xl w-full mx-4 flex flex-col"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b-2 border-[#c9a227]">
              <h2 className="text-4xl tracking-widest text-[#e8b430]">HOW TO PLAY</h2>
              <button
                onClick={onClose}
                className="text-[#c9a227] hover:text-[#e8b430] text-4xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4 text-2xl text-gray-300 leading-snug">
              <p>
                Discover a board made up of{" "}
                <span className="text-blue-400">blue squares</span> and free spaces.
                Look at the row and column clues — sequences of numbers describing
                groups of consecutive filled squares.
              </p>
              <p>
                Example: <span className="text-[#e8b430]">1 5 2</span> means one
                square, five squares, and two squares — in that order, separated by
                at least one gap.
              </p>

              <div className="border-t border-[#c9a227] opacity-30" />

              <p>
                <span className="text-[#e8b430]">Click once</span> → fills the square{" "}
                <span className="text-blue-400">■</span>
              </p>
              <p>
                <span className="text-[#e8b430]">Click again</span> → marks it as
                empty <span className="text-red-400">✕</span>
              </p>
              <p>
                <span className="text-[#e8b430]">Click again</span> → clears it back
                to white
              </p>
              <p className="text-gray-400">
                Drag the mouse while holding to mark multiple squares at once.
              </p>

              <img
                src="/nonogram_example.png"
                alt="Example"
                className="border-2 border-[#c9a227] opacity-90"
              />
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button onClick={onClose} className="retro-btn w-full text-3xl tracking-widest py-2 font-vt323">
                GOT IT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HowToPlayPopup;
