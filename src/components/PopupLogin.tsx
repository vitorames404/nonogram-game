import React, { useState } from "react";

interface PopupLoginProps {
  onLoginSuccess: (username: string) => void;
  onRegister: () => void;
  onGuestLogin: () => void;
}

const inputClass =
  "w-full bg-transparent border-b-2 border-[#c9a227] text-white text-xl py-1 px-0 outline-none placeholder-gray-600 focus:border-[#e8b430] transition-colors duration-150";

const PopupLogin: React.FC<PopupLoginProps> = ({ onLoginSuccess, onRegister, onGuestLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isUserExists, setIsUserExists] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:3000";

  const checkUserExists = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setIsUserExists(data.exists);
      setError("");
      if (!data.exists) localStorage.setItem("possibleName", username);
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  const handleLoginSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (response.ok) {
        onLoginSuccess(username);
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUserExists === true) handleLoginSubmit();
    else checkUserExists();
  };

  return (
    <div className="retro-card w-full max-w-sm p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b-2 border-[#c9a227] pb-3">
        <h2 className="text-4xl tracking-widest text-[#e8b430]">SIGN IN</h2>
      </div>

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-lg text-[#c9a227] tracking-widest">USERNAME</label>
          <input
            type="text"
            placeholder="enter username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setIsUserExists(null); }}
            className={inputClass}
            autoComplete="username"
          />
        </div>

        {/* Password — only shown once username is confirmed to exist */}
        {isUserExists === true && (
          <div className="flex flex-col gap-1">
            <label className="text-lg text-[#c9a227] tracking-widest">PASSWORD</label>
            <input
              type="password"
              placeholder="enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              autoFocus
            />
          </div>
        )}

        {error && <p className="text-red-400 text-lg">{error}</p>}

        {/* Primary action */}
        {isUserExists !== false && (
          <button type="submit" className="retro-btn w-full py-2 text-xl tracking-widest mt-1">
            {isUserExists === true ? "LOGIN" : "NEXT"}
          </button>
        )}

        {/* User doesn't exist — offer register or guest */}
        {isUserExists === false && (
          <div className="flex flex-col gap-3">
            <p className="text-gray-400 text-lg">Username not found.</p>
            <button
              type="button"
              onClick={onRegister}
              className="retro-btn w-full py-2 text-xl tracking-widest"
            >
              CREATE ACCOUNT
            </button>
            <button
              type="button"
              onClick={onGuestLogin}
              className="w-full py-2 text-xl tracking-widest border-2 border-gray-600 text-gray-400 hover:border-[#c9a227] hover:text-[#c9a227] transition-colors duration-150"
            >
              PLAY AS GUEST
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PopupLogin;
