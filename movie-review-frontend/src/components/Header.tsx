import React from "react";
import { Link } from "react-router-dom";
import { FaLock, FaUserShield } from "react-icons/fa";

const LockIcon = FaLock as unknown as React.ComponentType<{ className?: string }>;
const ShieldIcon = FaUserShield as unknown as React.ComponentType<{ className?: string }>;

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const user = React.useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  React.useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    if (!menuOpen) return;
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-[999] isolate border-b border-slate-800/60 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 overflow-visible">
        <div className="flex items-center gap-3">
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="flex h-10 w-10 items-center justify-center text-white transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
              aria-label="Open menu"
            >
              <span className="flex flex-col items-center justify-center gap-1.5">
                <span className="h-[2px] w-7 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.35)]" />
                <span className="h-[2px] w-7 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.35)]" />
                <span className="h-[2px] w-7 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.35)]" />
              </span>
            </button>
          </div>
          <Link className="flex items-center gap-2 text-sm font-semibold text-white" to="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/80 ring-1 ring-red-500/40 shadow-glow">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="dinocoMark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path
                d="M4.5 18.5L10.2 5.8c.2-.4.7-.4.9 0l5.6 12.7a.6.6 0 0 1-.5.9h-2.7a.6.6 0 0 1-.6-.4l-.8-2H9.9l-.8 2a.6.6 0 0 1-.6.4H5a.6.6 0 0 1-.5-.9Zm6-5.6h2.1L11.6 9.6l-1.1 3.3Z"
                fill="url(#dinocoMark)"
              />
            </svg>
          </span>
          <span className="tracking-[0.25em] text-[11px] uppercase text-slate-200">Dinoco</span>
          </Link>
        </div>
        <nav className="flex items-center gap-5 text-[10px] uppercase tracking-[0.25em] text-slate-300">
          <Link className="transition hover:text-white" to="/">Home</Link>
          <Link className="transition hover:text-white" to="/browse">Browse Movies</Link>
          <Link className="flex items-center gap-2 transition hover:text-white" to="/login">
            <LockIcon /> Sign In
          </Link>
          <Link className="flex items-center gap-2 transition hover:text-white" to="/admin">
            <ShieldIcon /> Admin
          </Link>
        </nav>
      </div>
      {menuOpen && (
        <div className="mx-auto max-w-6xl px-5 pb-4">
          <div className="w-64 rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur">
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Profile</p>
              <p className="mt-2 text-sm font-semibold text-white">{user?.name || "Guest"}</p>
              <p className="text-[10px] text-slate-400">{user?.email || "Not signed in"}</p>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-300">
              <Link className="block rounded-lg px-3 py-2 transition hover:bg-slate-950/70 hover:text-white" to="/account">Account</Link>
              <Link className="block rounded-lg px-3 py-2 transition hover:bg-slate-950/70 hover:text-white" to="/settings">Settings</Link>
              <Link className="block rounded-lg px-3 py-2 transition hover:bg-slate-950/70 hover:text-white" to="/browse">Browse Movies</Link>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
                className="block w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-950/70 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
