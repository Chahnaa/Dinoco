import React from "react";

const Settings: React.FC = () => {
  const user = React.useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-red-400">Settings</p>
        <h1 className="font-display text-3xl text-white">Account Settings</h1>
        <p className="text-sm text-slate-400">Manage your profile and security preferences.</p>
      </div>

      <div className="glass rounded-2xl border border-slate-800/60 p-5">
        <h2 className="text-sm font-semibold text-white">Profile</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p>
            <p className="text-white">{user?.name || "Guest"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="text-white">{user?.email || "Not signed in"}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-slate-800/60 p-5">
        <h2 className="text-sm font-semibold text-white">Security</h2>
        <p className="mt-2 text-sm text-slate-400">Email OTP is enabled for sign-in verification.</p>
      </div>
    </div>
  );
};

export default Settings;
