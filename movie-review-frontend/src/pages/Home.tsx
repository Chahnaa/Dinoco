import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChartLine, FaSearch, FaStar, FaUserFriends } from "react-icons/fa";
import { getMovies } from "../api/api";
import { getWatchlistIds, subscribeWatchlist } from "../utils/watchlist";
import MovieCard from "../components/MovieCard";
import Recommendations from "../components/Recommendations";
import MovieNightPlanner from "../components/MovieNightPlanner";

const SearchIcon = FaSearch as unknown as React.ComponentType<{ className?: string }>;
const UsersIcon = FaUserFriends as unknown as React.ComponentType<{ className?: string }>;
const ChartIcon = FaChartLine as unknown as React.ComponentType<{ className?: string }>;
const StarIcon = FaStar as unknown as React.ComponentType<{ className?: string }>;

interface Movie {
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
}

const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

  useEffect(() => {
    setLoading(true);
    getMovies()
      .then(res => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setWatchlistIds(getWatchlistIds());
    return subscribeWatchlist(setWatchlistIds);
  }, []);

  const genres = useMemo(() => {
    const values = new Set(movies.map(movie => movie.genre).filter(Boolean) as string[])
    return ["All", ...Array.from(values)]
  }, [movies])

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesGenre = genre === "All" || movie.genre === genre
      const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase())
      return matchesGenre && matchesSearch
    })
  }, [movies, genre, search])

  const topMovies = useMemo(() => filteredMovies.slice(0, 3), [filteredMovies])
  const trendingMovies = useMemo(() => filteredMovies.slice(0, 8), [filteredMovies])
  const watchlistMovies = useMemo(
    () => movies.filter(movie => watchlistIds.includes(movie.movie_id)).slice(0, 6),
    [movies, watchlistIds]
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <section className="hero-gradient hero-glow relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] overflow-hidden px-5 py-6 lg:px-12">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[0.6fr_0.4fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-400/50 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-red-300">
                Now Streaming
              </span>
              <span className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300">
                Editor's Pick
              </span>
            </div>
            <h1 className="font-display text-2xl text-white lg:text-4xl leading-tight">
              Discover. Review. Rate.
            </h1>
            <p className="text-xs text-slate-300 lg:text-sm">
              Dive into the most stylish movie review hub. Browse trending titles, share your thoughts,
              and see what the community is buzzing about.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#movies" className="btn-primary">
                Browse Movies
              </a>
              <Link to="/login" className="btn-secondary">
                Write a Review
              </Link>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Weekly top charts</span>
              <span>120+ titles</span>
              <span>Trusted by cinephiles</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass w-full rounded-3xl p-3"
          >
            <div className="relative overflow-hidden rounded-2xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop"
                alt="The Midnight Cut"
                className="h-48 w-full object-cover"
                style={{ filter: "blur(4px)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 mb-1">Featured</p>
                <h3 className="text-base font-semibold text-white mb-1">The Midnight Cut</h3>
                <p className="text-[10px] text-slate-300">Thriller • Drama • 2025</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Movie Night Planner - INNOVATIVE FEATURE */}
      <section className="w-full">
        <MovieNightPlanner />
      </section>

      {watchlistMovies.length > 0 && (
        <section className="glass flex w-full flex-col gap-4 rounded-3xl border border-slate-800/60 p-5">
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Watchlist</h2>
              <p className="text-xs text-slate-400">Quick access to the movies you saved.</p>
            </div>
            <Link className="text-xs text-slate-300 hover:text-white" to="/browse">Browse more</Link>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
            {watchlistMovies.map(movie => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      <section className="glass flex w-full flex-col gap-4 rounded-3xl border border-slate-800/60 p-5" id="trending">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Trending Now</h2>
            <p className="text-xs text-slate-400">High momentum picks this week.</p>
          </div>
          <Link className="text-xs text-slate-300 hover:text-white" to="/browse">View all</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide snap-x snap-mandatory">
          {trendingMovies.map(movie => (
            <Link
              key={movie.movie_id}
              to={`/movie/${movie.movie_id}`}
              className="group relative w-40 flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40"
            >
              <div className="aspect-[2/3] w-full bg-slate-900">
                  <img
                    src={movie.poster_url?.startsWith("/")
                      ? `${window.location.origin}${movie.poster_url}`
                      : movie.poster_url || "/posters/inception.jpg"}
                  alt={movie.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs font-semibold text-white line-clamp-2">{movie.title}</p>
                <p className="text-[10px] text-slate-300">{movie.release_year || ""}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommendations Section */}
      {localStorage.getItem("token") && (
        <section className="w-full">
          <Recommendations />
        </section>
      )}

      <section className="glass flex w-full flex-col gap-4 rounded-3xl border border-slate-800/60 p-5" id="movies">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Top Picks</h2>
            <p className="text-xs text-slate-400">Curated for cinematic obsessives.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border border-slate-700/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass grid gap-4 rounded-2xl p-4 md:grid-cols-[1.5fr_1fr]"
            >
              <label className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-3">
                <SearchIcon className="text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by title"
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 text-sm text-white"
              >
                {genres.map(item => (
                  <option key={item} value={item} className="bg-slate-900">
                    {item}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
              <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="skeleton h-80 rounded-2xl" />
                ))}
              </div>
        ) : topMovies.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-sm text-slate-300">
            No movies match your search. Try another keyword.
          </div>
        ) : (
          <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topMovies.map(movie => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass card-glow rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center gap-3 text-red-300">
            <UsersIcon className="text-base" />
            <p className="text-[10px] uppercase tracking-[0.25em]">Community</p>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">Create your critic profile</h3>
          <p className="mt-2 text-xs text-slate-300">Save your favorites, follow reviewers, and keep a watchlist.</p>
          <Link to="/register" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wide text-red-300 hover:text-white">
            Get started →
          </Link>
        </div>
        <div className="glass card-glow rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center gap-3 text-red-300">
            <StarIcon className="text-base" />
            <p className="text-[10px] uppercase tracking-[0.25em]">Ratings</p>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">Rate in seconds</h3>
          <p className="mt-2 text-xs text-slate-300">Drop quick reactions or full reviews from any device.</p>
          <Link to="/browse" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wide text-red-300 hover:text-white">
            Explore films →
          </Link>
        </div>
        <div className="glass card-glow rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center gap-3 text-red-300">
            <ChartIcon className="text-base" />
            <p className="text-[10px] uppercase tracking-[0.25em]">Insights</p>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">Track what's trending</h3>
          <p className="mt-2 text-xs text-slate-300">Follow momentum, top picks, and weekly highlights.</p>
          <a href="#trending" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wide text-red-300 hover:text-white">
            See charts →
          </a>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-5 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Live now</p>
          <p className="text-xl font-semibold text-white">2.3k</p>
          <p className="text-xs text-slate-400">Active movie discussions</p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Weekly reviews</p>
          <p className="text-xl font-semibold text-white">14.8k</p>
          <p className="text-xs text-slate-400">Fresh reactions added</p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Average rating</p>
          <p className="text-xl font-semibold text-white">4.6/5</p>
          <p className="text-xs text-slate-400">Audience sentiment score</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
