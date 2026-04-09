import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PopupLogin from "../components/PopupLogin";
import PopupRegister from "../components/PopupRegister";
import { Navigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useAuth } from "../components/auth/AuthContext";

const Login = () => {
  const [state, setState] = useState<"login" | "register">("login");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!loading && isAuthenticated) setRedirectTo("/");
  }, [isAuthenticated, loading]);

  const handleLoginSuccess = () => { window.location.href = "/"; };
  const handleRegisterSuccess = () => { window.location.href = "/"; };

  const handleGuestLogin = async () => {
    try {
      const username = `guest_${Math.random().toString(36).substring(7)}`;
      const response = await fetch(`${API_BASE_URL}/login-guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      if (response.ok) window.location.href = "/";
      else console.error("Failed to login as guest");
    } catch (err) {
      console.error("Error during guest login:", err);
    }
  };

  if (redirectTo) return <Navigate to={redirectTo} />;

  return (
    <>
      {/* Starfield */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#080810]">
        <Canvas>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      {/* Page */}
      <div className="font-vt323 relative z-10 flex flex-col items-center justify-center min-h-screen gap-8 px-4">

        {/* Title */}
        <div className="flex flex-col items-center gap-1 select-none">
          <motion.h1
            className="title-glow text-7xl md:text-8xl tracking-widest"
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            NONOGRAM
          </motion.h1>
          <p className="text-[#c9a227] text-xl tracking-[0.3em] opacity-70">
            PUZZLE GAME
          </p>
        </div>

        {/* Form card */}
        <AnimatePresence mode="wait">
          {state === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.18 }}
            >
              <PopupLogin
                onLoginSuccess={handleLoginSuccess}
                onRegister={() => setState("register")}
                onGuestLogin={handleGuestLogin}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.18 }}
            >
              <PopupRegister
                onRegisterSuccess={handleRegisterSuccess}
                onBack={() => setState("login")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Login;
