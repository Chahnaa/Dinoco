import React from "react";
import { motion } from "framer-motion";
import { FaFilm } from "react-icons/fa";
import MovieCard from "../components/MovieCard";
import { getMovies } from "../api/api";

const FilmIcon = FaFilm as unknown as React.ComponentType<{ className?: string }>;

type Movie = {
  movie_id: number;
  title: string;
  genre?: string;
  language?: string;
  release_year?: number;
  avg_rating?: number;
  review_count?: number;
  duration_minutes?: number;
  poster_url?: string;
  description?: string;
};

const BrowseMovies: React.FC = () => {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [genre, setGenre] = React.useState("All");
  const [minRating, setMinRating] = React.useState("All");

  React.useEffect(() => {
    setLoading(true);
    getMovies()
      .then(res => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  const genres = React.useMemo(() => {
    const values = new Set(movies.map(movie => movie.genre).filter(Boolean) as string[]);
    return ["All", ...Array.from(values)];
  }, [movies]);

  const filteredMovies = React.useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = genre === "All" || movie.genre === genre;
      const ratingValue = movie.avg_rating ? Number(movie.avg_rating) : 0;
      const matchesRating = minRating === "All" || ratingValue >= Number(minRating);
      return matchesSearch && matchesGenre && matchesRating;
    });
  }, [movies, search, genre, minRating]);

  const suggestions = React.useMemo(() => {
    if (!search.trim()) return [] as Movie[];
    return movies
      .filter(movie => movie.title.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [movies, search]);

  return (
    <div className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] bg-gradient-to-b from-red-950/60 via-[#050505] to-black py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">Browse</p>
          <h1 className="font-display text-3xl text-white">Browse Movies</h1>
          <p className="text-sm text-slate-400">All titles in the catalog.</p>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <FilmIcon />
          <span className="text-xs">{movies.length} titles</span>
        </div>
      </motion.div>

      <div className="glass rounded-2xl border border-slate-800/60 p-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.6fr] md:items-end">
          <div className="relative">
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search titles..."
              className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-red-400/60"
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/95 shadow-lg">
                {suggestions.map(movie => (
                  <button
                    key={movie.movie_id}
                    type="button"
                    onClick={() => setSearch(movie.title)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-900/80"
                  >
                    <span>{movie.title}</span>
                    <span className="text-[10px] text-slate-500">{movie.release_year || ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Genre</label>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-red-400/60"
            >
              {genres.map(value => (
                <option key={value} value={value} className="bg-slate-950">
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Minimum Rating</label>
            <select
              value={minRating}
              onChange={e => setMinRating(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-red-400/60"
            >
              <option value="All" className="bg-slate-950">All</option>
              <option value="4" className="bg-slate-950">4.0+</option>
              <option value="3" className="bg-slate-950">3.0+</option>
              <option value="2" className="bg-slate-950">2.0+</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-sm text-slate-300">
          No movies found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default BrowseMovies;
