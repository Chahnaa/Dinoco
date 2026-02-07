import React from "react";
import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa";

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

const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
  const rating = movie.avg_rating;
  const ratingValue = typeof rating === "number" ? rating : Number(rating);
  const movieId = movie.movie_id ?? (movie as { id?: number }).id;
  
  // Use local poster paths directly; proxy only external URLs to avoid CORS issues
  const posterUrl = movie.poster_url
    ? movie.poster_url.startsWith("/")
      ? `${window.location.origin}${movie.poster_url}`
      : `http://127.0.0.1:5002/api/proxy-image?url=${encodeURIComponent(movie.poster_url)}`
    : undefined;

  // Generate SVG poster with gradient and movie title
  const colors = [
    '#8b5cf6', '#6366f1', '#dc2626', '#09a3af', '#7c3aed',
    '#f59e0b', '#06b6d4', '#2563eb', '#10b981', '#7c3aed'
  ];
  const bgColor = colors[movie.movie_id ? (movie.movie_id - 1) % colors.length : 0];
  const accentColor = colors[(movie.movie_id || 0) % colors.length];
  
  const svgPoster = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Cdefs%3E%3ClinearGradient id='grad'%3E%3Cstop offset='0%25' style='stop-color:${bgColor.replace('#', '%23')}'/%3E%3Cstop offset='100%25' style='stop-color:${accentColor.replace('#', '%23')}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23grad)'/%3E%3Ctext x='200' y='300' font-size='28' fill='white' text-anchor='middle' font-weight='bold' font-family='Arial'%3E${encodeURIComponent(movie.title)}%3C/text%3E%3C/svg%3E`;

  const initialPoster = posterUrl || svgPoster;
  const [imgSrc, setImgSrc] = React.useState(initialPoster);

  React.useEffect(() => {
    setImgSrc(initialPoster);
  }, [initialPoster]);

    return (
    <motion.div
      whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.25 }}
      className="group card-glow overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 [transform-style:preserve-3d]"
    >
      <div className="relative">
        <div className="poster-frame aspect-[2/3] w-full bg-gradient-to-br from-slate-800 to-slate-900">
          <img
            className="h-full w-full object-cover"
            src={imgSrc}
            alt={movie.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgSrc(svgPoster)}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="absolute -inset-10 bg-gradient-to-tr from-red-500/15 via-transparent to-purple-500/10" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
          {movie.genre || "Drama"}
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-red-500/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
          Spotlight
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-white">
          <StarIcon className="text-yellow-400" />
          <span>{Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : "New"}</span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-white">{movie.title}</h3>
          <p className="text-xs text-slate-400">
            {movie.release_year || "Unknown"} • {movie.language || "English"}
          </p>
        </div>
        <a
          href={movieId ? `/movie/${movieId}` : "/browse"}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition group-hover:border-red-400/60 group-hover:text-white"
        >
          View Details
        </a>
      </div>
    </motion.div>
  );
};

export default MovieCard;
