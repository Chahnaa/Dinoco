import React from "react";
import { motion } from "framer-motion";

export type Mood = "happy" | "dark" | "motivational" | "thriller" | "emotional" | "adventurous" | "romantic";

interface MoodOption {
  id: Mood;
  label: string;
  icon: string;
  gradient: string;
  genres: string[];
  description: string;
}

const moodOptions: MoodOption[] = [
  {
    id: "happy",
    label: "Happy",
    icon: "😊",
    gradient: "from-yellow-400 to-orange-500",
    genres: ["Comedy", "Animation", "Family", "Musical"],
    description: "Lighthearted & fun"
  },
  {
    id: "dark",
    label: "Dark",
    icon: "🌑",
    gradient: "from-gray-700 to-black",
    genres: ["Horror", "Thriller", "Mystery", "Crime"],
    description: "Intense & gripping"
  },
  {
    id: "motivational",
    label: "Motivational",
    icon: "💪",
    gradient: "from-blue-500 to-purple-600",
    genres: ["Biography", "Drama", "Sport", "Documentary"],
    description: "Inspiring stories"
  },
  {
    id: "thriller",
    label: "Thriller",
    icon: "😱",
    gradient: "from-red-600 to-red-900",
    genres: ["Thriller", "Action", "Crime", "Mystery"],
    description: "Edge of your seat"
  },
  {
    id: "emotional",
    label: "Emotional",
    icon: "😢",
    gradient: "from-pink-400 to-purple-500",
    genres: ["Drama", "Romance", "Family"],
    description: "Heartfelt moments"
  },
  {
    id: "adventurous",
    label: "Adventurous",
    icon: "🗺️",
    gradient: "from-green-500 to-teal-600",
    genres: ["Adventure", "Action", "Fantasy", "Sci-Fi"],
    description: "Epic journeys"
  },
  {
    id: "romantic",
    label: "Romantic",
    icon: "💕",
    gradient: "from-pink-500 to-rose-600",
    genres: ["Romance", "Drama", "Comedy"],
    description: "Love stories"
  }
];

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onMoodSelect: (mood: Mood | null) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onMoodSelect }) => {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span>🎭</span>
          <span>How are you feeling?</span>
        </h3>
        <p className="text-xs text-slate-400">Discover movies that match your mood</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {moodOptions.map((mood) => (
          <motion.button
            key={mood.id}
            onClick={() => onMoodSelect(selectedMood === mood.id ? null : mood.id)}
            className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
              selectedMood === mood.id
                ? "border-white scale-105 shadow-lg"
                : "border-slate-700/60 hover:border-slate-600"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} ${
                selectedMood === mood.id ? "opacity-20" : "opacity-10"
              } transition-opacity`}
            />
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">{mood.icon}</span>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">{mood.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{mood.description}</p>
              </div>
            </div>

            {selectedMood === mood.id && (
              <motion.div
                layoutId="mood-selected"
                className="absolute inset-0 border-2 border-white rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60"
        >
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">Showing:</span>{" "}
            {moodOptions.find(m => m.id === selectedMood)?.genres.join(", ")} movies
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MoodSelector;
export { moodOptions };
export type { MoodOption };
