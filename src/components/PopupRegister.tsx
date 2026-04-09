import React, { useEffect, useState } from "react";

interface PopupRegisterProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
}

const inputClass =
  "w-full bg-transparent border-b-2 border-[#c9a227] text-white text-xl py-1 px-0 outline-none placeholder-gray-600 focus:border-[#e8b430] transition-colors duration-150";

const PopupRegister: React.FC<PopupRegisterProps> = ({ onRegisterSuccess, onBack }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:3000";

  useEffect(() => {
    const stored = localStorage.getItem("possibleName");
    if (stored) setUsername(stored);
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, email }),
      });
      const data = await response.json();
      if (response.ok) onRegisterSuccess();
      else setError(data.message);
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="retro-card w-full max-w-sm p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b-2 border-[#c9a227] pb-3 flex items-center justify-between">
        <h2 className="text-4xl tracking-widest text-[#e8b430]">REGISTER</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-[#c9a227] text-2xl tracking-widest transition-colors"
        >
          ← BACK
        </button>
      </div>

      <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-lg text-[#c9a227] tracking-widest">USERNAME</label>
          <input
            type="text"
            placeholder="enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            required
            autoComplete="username"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-lg text-[#c9a227] tracking-widest">
            EMAIL <span className="text-gray-600 text-base">(optional)</span>
          </label>
          <input
            type="email"
            placeholder="enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-lg text-[#c9a227] tracking-widest">PASSWORD</label>
          <input
            type="password"
            placeholder="enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-red-400 text-lg">{error}</p>}

        <button type="submit" className="retro-btn w-full py-2 text-xl tracking-widest mt-1">
          CREATE ACCOUNT
        </button>
      </form>
    </div>
  );
};

export default PopupRegister;
