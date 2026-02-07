import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Account: React.FC = () => {
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  if (!user) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <h1 className="font-display text-2xl text-white">Who’s reviewing tonight?</h1>
        <p className="text-sm text-slate-400">Please sign in to start reviewing.</p>
        <button className="btn-primary" onClick={() => navigate("/login")}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-red-400">Dinoco</p>
        <h1 className="font-display text-3xl text-white">Who’s reviewing tonight?</h1>
        <p className="text-sm text-slate-400">Select your profile to review movies.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 sm:grid-cols-2"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group flex flex-col items-center gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/40 px-8 py-6 transition hover:border-red-400/60"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/30 to-purple-500/30 text-2xl text-white">
            {(user.name || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.name || "User"}</p>
            <p className="text-[11px] text-slate-400">Viewer</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="group flex flex-col items-center gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/40 px-8 py-6 transition hover:border-red-400/60"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700/40 to-slate-900/60 text-2xl text-white">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin</p>
            <p className="text-[11px] text-slate-400">Manage catalog</p>
          </div>
        </button>
      </motion.div>

      <button
        type="button"
        className="btn-secondary"
        onClick={() => navigate("/browse")}
      >
        Browse as guest
      </button>
    </div>
  );
};

export default Account;
