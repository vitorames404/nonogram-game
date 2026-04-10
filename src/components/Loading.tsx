import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";

const Loading = () => {
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0f0f1c]">
        <Canvas>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      <div className="font-vt323 relative z-10 flex flex-col items-center justify-center min-h-screen gap-4 select-none">
        <motion.span
          className="title-glow text-6xl md:text-7xl tracking-widest"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          LOADING...
        </motion.span>
        <p className="text-[#c9a227] text-xl tracking-[0.3em] opacity-60">PLEASE WAIT</p>
      </div>
    </>
  );
};

export default Loading;
