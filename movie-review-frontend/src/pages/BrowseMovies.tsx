import React from "react";
import { motion } from "framer-motion";
import { FaFilm, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import MovieCard from "../components/MovieCard";
import MoodSelector, { Mood, moodOptions } from "../components/MoodSelector";
import { getMovies } from "../api/api";

const FilmIcon = FaFilm as unknown as React.ComponentType<{ className?: string }>;
const ChevronLeftIcon = FaChevronLeft as unknown as React.ComponentType<{ className?: string }>;
const ChevronRightIcon = FaChevronRight as unknown as React.ComponentType<{ className?: string }>;

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
  const [sortBy, setSortBy] = React.useState("newest");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedMood, setSelectedMood] = React.useState<Mood | null>(null);
  const itemsPerPage = 6;

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

  const years = React.useMemo(() => {
    const values = new Set(movies.map(movie => movie.release_year).filter(Boolean) as number[]);
    return ["All", ...Array.from(values).sort((a, b) => b - a)];
  }, [movies]);

  const filteredMovies = React.useMemo(() => {
    let result = movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase());
      
      // Mood-based filtering
      let matchesGenreOrMood = true;
      if (selectedMood) {
        const moodGenres = moodOptions.find(m => m.id === selectedMood)?.genres || [];
        matchesGenreOrMood = moodGenres.some(g => movie.genre?.includes(g));
      } else {
        matchesGenreOrMood = genre === "All" || movie.genre === genre;
      }
      
      const ratingValue = movie.avg_rating ? Number(movie.avg_rating) : 0;
      const matchesRating = minRating === "All" || ratingValue >= Number(minRating);
      return matchesSearch && matchesGenreOrMood && matchesRating;
    });

    // Sort
    if (sortBy === "rating-high") {
      result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    } else if (sortBy === "rating-low") {
      result.sort((a, b) => (a.avg_rating || 0) - (b.avg_rating || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
    } else if (sortBy === "title-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "title-desc") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [movies, search, genre, minRating, sortBy, selectedMood]);

  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const paginatedMovies = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredMovies.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredMovies, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, genre, minRating, sortBy, selectedMood]);

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

      {/* Mood-Based Discovery - INNOVATIVE FEATURE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-2xl border border-slate-800/60 p-5"
      >
        <MoodSelector
          selectedMood={selectedMood}
          onMoodSelect={(mood) => {
            setSelectedMood(mood);
            if (mood) setGenre("All"); // Clear genre filter when mood is selected
          }}
        />
      </motion.div>

      <div className="glass rounded-2xl border border-slate-800/60 p-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr] md:items-end">
          <div className="relative">
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search titles..."
              className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-red-400/60"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Genre</label>
            <select
              value={genre}
              onChange={e => {
                setGenre(e.target.value);
                if (e.target.value !== "All") setSelectedMood(null); // Clear mood when genre is selected
              }}
              disabled={selectedMood !== null}
              className={`mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-red-400/60 ${
                selectedMood ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {genres.map(value => (
                <option key={value} value={value} className="bg-slate-950">
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Min Rating</label>
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
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-red-400/60"
            >
              <option value="newest" className="bg-slate-950">Newest</option>
              <option value="oldest" className="bg-slate-950">Oldest</option>
              <option value="rating-high" className="bg-slate-950">Rating: High</option>
              <option value="rating-low" className="bg-slate-950">Rating: Low</option>
              <option value="title-asc" className="bg-slate-950">Title: A-Z</option>
              <option value="title-desc" className="bg-slate-950">Title: Z-A</option>
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
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredMovies.length)} of {filteredMovies.length} movies
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedMovies.map(movie => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-400/60 hover:text-red-300 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrentPage = pageNum === currentPage;
                  const isVisible = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages;
                  
                  return isVisible ? (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrentPage
                          ? 'bg-red-600/80 text-white'
                          : 'border border-slate-700/60 text-slate-300 hover:border-red-400/60 hover:text-red-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ) : pageNum === 2 && currentPage > 3 ? (
                    <span key="dots-start" className="text-slate-500">...</span>
                  ) : pageNum === totalPages - 1 && currentPage < totalPages - 2 ? (
                    <span key="dots-end" className="text-slate-500">...</span>
                  ) : null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-400/60 hover:text-red-300 transition-colors"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default BrowseMovies;
