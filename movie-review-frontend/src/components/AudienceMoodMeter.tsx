import React from "react";

export type MoodCounts = {
  mindBlowing: number;
  lovedIt: number;
  good: number;
  meh: number;
  boring: number;
};

type MoodOption = {
  key: keyof MoodCounts;
  label: string;
  emoji: string;
  color: string;
};

const moodOptions: MoodOption[] = [
  { key: "mindBlowing", label: "Mind-blowing", emoji: "🤯", color: "from-purple-500 to-indigo-500" },
  { key: "lovedIt", label: "Loved it", emoji: "😍", color: "from-red-500 to-pink-500" },
  { key: "good", label: "Good", emoji: "👍", color: "from-emerald-500 to-teal-500" },
  { key: "meh", label: "Meh", emoji: "😐", color: "from-amber-500 to-yellow-500" },
  { key: "boring", label: "Boring", emoji: "🥱", color: "from-slate-500 to-slate-700" },
];

interface AudienceMoodMeterProps {
  totalVotes: number;
  moodCounts: MoodCounts;
  selectedMood?: keyof MoodCounts;
  onSelectMood?: (mood: keyof MoodCounts) => void;
}

const AudienceMoodMeter: React.FC<AudienceMoodMeterProps> = ({
  totalVotes,
  moodCounts,
  selectedMood,
  onSelectMood,
}) => {
  const safeTotal = totalVotes > 0 ? totalVotes : 1;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Audience Mood</p>
          <h3 className="text-lg font-semibold text-white">Mood Meter</h3>
        </div>
        <span className="text-xs text-slate-400">{totalVotes} votes</span>
      </div>

      <div className="mt-4 space-y-3">
        {moodOptions.map(option => {
          const count = moodCounts[option.key] || 0;
          const percentage = Math.round((count / safeTotal) * 100);
          const isSelected = selectedMood === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelectMood?.(option.key)}
              className={`group w-full rounded-xl border p-3 text-left transition duration-200 ${
                isSelected
                  ? "border-red-400/70 bg-slate-900/70 shadow-[0_0_0_1px_rgba(239,68,68,0.4)]"
                  : "border-slate-800/60 bg-slate-950/30 hover:border-red-400/50 hover:bg-slate-900/60"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-base">{option.emoji}</span>
                  <span className="font-medium text-white">{option.label}</span>
                </div>
                <span className="text-slate-400">{count}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${option.color} transition-all duration-500 ease-out group-hover:brightness-110`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">{percentage}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AudienceMoodMeter;
