import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getMovies } from "../api/api";
import { moodOptions, Mood } from "./MoodSelector";

interface Movie {
  movie_id: number;
  title: string;
  genre?: string;
  duration_minutes?: number;
  poster_url?: string;
  avg_rating?: number;
  review_count?: number;
  release_year?: number;
  description?: string;
}

interface MovieNightPlan {
  movie: Movie;
  snackSuggestion: string;
  reason: string;
}

const snackSuggestions: { [key: string]: string[] } = {
  happy: ["🍿 Classic Popcorn & Candy", "🍕 Pizza Party Box", "🍦 Ice Cream Sundae Bar"],
  dark: ["🍫 Dark Chocolate & Red Wine", "🥤 Energy Drinks & Chips", "🍪 Cookies & Cold Brew"],
  motivational: ["🥗 Healthy Snack Platter", "🥤 Protein Smoothies", "🍎 Fresh Fruit & Nuts"],
  thriller: ["🌶️ Spicy Nachos", "🍕 Hot Wings & Cola", "🍿 Buttery Popcorn & Soda"],
  emotional: ["🍦 Ice Cream & Tissues", "🍫 Chocolate & Tea", "🧁 Cupcakes & Warm Milk"],
  adventurous: ["🌮 Tacos & Margaritas", "🍔 Burgers & Fries", "🍿 Trail Mix & Lemonade"],
  romantic: ["🍷 Wine & Cheese", "🍫 Strawberries & Chocolate", "🍰 Dessert Platter"]
};

const MovieNightPlanner: React.FC = () => {
  const [numPeople, setNumPeople] = useState<number>(2);
  const [availableTime, setAvailableTime] = useState<number>(120);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [plan, setPlan] = useState<MovieNightPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await getMovies();
      let movies: Movie[] = response.data;

      // Filter by duration
      movies = movies.filter(m => {
        const duration = m.duration_minutes || 120;
        return duration <= availableTime;
      });

      // Filter by mood if selected
      if (selectedMood) {
        const moodGenres = moodOptions.find(m => m.id === selectedMood)?.genres || [];
        movies = movies.filter(m => 
          moodGenres.some(genre => m.genre?.includes(genre))
        );
      }

      // Sort by rating and popularity
      movies.sort((a, b) => {
        const scoreA = (a.avg_rating || 0) * 0.7 + (a.review_count || 0) * 0.3;
        const scoreB = (b.avg_rating || 0) * 0.7 + (b.review_count || 0) * 0.3;
        return scoreB - scoreA;
      });

      if (movies.length === 0) {
        alert("No movies found matching your criteria. Try adjusting your preferences!");
        setLoading(false);
        return;
      }

      // Select top movie
      const selectedMovie = movies[0];

      // Get snack suggestion
      const moodKey = selectedMood || "happy";
      const snacks = snackSuggestions[moodKey] || snackSuggestions["happy"];
      const randomSnack = snacks[Math.floor(Math.random() * snacks.length)];

      // Generate reason
      let reason = "";
      if (selectedMood) {
        reason = `Perfect ${selectedMood} movie for ${numPeople} ${numPeople === 1 ? 'person' : 'people'}`;
      } else {
        reason = `Highly rated choice for ${numPeople} ${numPeople === 1 ? 'person' : 'people'}`;
      }

      if (selectedMovie.duration_minutes) {
        reason += ` (${selectedMovie.duration_minutes} min)`;
      }

      setPlan({
        movie: selectedMovie,
        snackSuggestion: randomSnack,
        reason: reason
      });
    } catch (error) {
      console.error("Failed to generate plan:", error);
      alert("Failed to generate movie night plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-slate-800/60 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">Movie Night Planner</h2>
          </div>
          <p className="text-sm text-slate-400">
            Tell us your preferences and we'll plan the perfect movie night!
          </p>
        </div>

        {/* Input Form */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Number of People */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <span>👥</span>
              <span>Number of People</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-white">{numPeople}</span>
              </div>
              <button
                onClick={() => setNumPeople(Math.min(10, numPeople + 1))}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Available Time */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <span>⏰</span>
              <span>Available Time</span>
            </label>
            <select
              value={availableTime}
              onChange={(e) => setAvailableTime(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-white outline-none focus:border-purple-400/60"
            >
              <option value={90}>90 min (Quick Watch)</option>
              <option value={120}>2 hours (Standard)</option>
              <option value={150}>2.5 hours (Long)</option>
              <option value={180}>3+ hours (Epic)</option>
            </select>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <span>🎭</span>
              <span>Mood</span>
            </label>
            <select
              value={selectedMood || ""}
              onChange={(e) => setSelectedMood((e.target.value as Mood) || null)}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-white outline-none focus:border-purple-400/60"
            >
              <option value="">Any Mood</option>
              {moodOptions.map((mood) => (
                <option key={mood.id} value={mood.id}>
                  {mood.icon} {mood.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePlan}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? "Planning Your Night..." : "🎬 Plan My Movie Night!"}
        </button>

        {/* Results */}
        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 pt-4 border-t border-slate-700/60"
            >
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span>✨</span>
                  <span>Your Perfect Movie Night</span>
                </h3>
                <p className="text-sm text-slate-300">{plan.reason}</p>
              </div>

              {/* Movie & Snack Grid */}
              <div className="grid md:grid-cols-[2fr_1fr] gap-4">
                {/* Movie Card */}
                <Link
                  to={`/movies/${plan.movie.movie_id}`}
                  className="group relative overflow-hidden rounded-xl bg-slate-800 border-2 border-purple-500/40 hover:border-purple-400 transition-all hover:shadow-xl hover:shadow-purple-500/20"
                >
                  <div className="flex gap-4 p-4">
                    {/* Poster */}
                    <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={
                          plan.movie.poster_url?.startsWith("/")
                            ? `${window.location.origin}${plan.movie.poster_url}`
                            : plan.movie.poster_url || "https://placehold.co/300x450/1e293b/cbd5e1?text=No+Poster"
                        }
                        alt={plan.movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          {plan.movie.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          {plan.movie.genre && <span>🎬 {plan.movie.genre}</span>}
                          {plan.movie.release_year && <span>📅 {plan.movie.release_year}</span>}
                          {plan.movie.duration_minutes && <span>⏱️ {plan.movie.duration_minutes} min</span>}
                        </div>
                      </div>

                      {plan.movie.description && (
                        <p className="text-sm text-slate-300 line-clamp-2">
                          {plan.movie.description}
                        </p>
                      )}

                      {plan.movie.avg_rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-yellow-600/20 px-2 py-1 rounded">
                            <span className="text-yellow-400 text-sm">★</span>
                            <span className="text-white font-bold text-sm">
                              {Number(plan.movie.avg_rating).toFixed(1)}
                            </span>
                          </div>
                          {plan.movie.review_count && (
                            <span className="text-xs text-slate-400">
                              {plan.movie.review_count} reviews
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Snack Suggestion */}
                <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="text-4xl">{plan.snackSuggestion.split(" ")[0]}</div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Snack Pairing</p>
                    <p className="text-sm font-bold text-white">
                      {plan.snackSuggestion.substring(plan.snackSuggestion.indexOf(" ") + 1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={generatePlan}
                  className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
                >
                  🔄 Try Another
                </button>
                <Link
                  to={`/movies/${plan.movie.movie_id}`}
                  className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors text-center"
                >
                  📖 View Details
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MovieNightPlanner;
