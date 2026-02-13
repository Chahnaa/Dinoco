import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../api/api";

interface Movie {
  movie_id: number;
  title: string;
  genre?: string;
  poster_url?: string;
  avg_rating: number;
  review_count: number;
  recommendation_reason?: string;
}

interface RecommendationData {
  recommendations: Movie[];
  preferred_genres: string[];
  algorithm: string;
  user_watch_count: number;
}

const Recommendations: React.FC = () => {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getRecommendations()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch recommendations:", err);
        setError("Failed to load recommendations");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  if (data.recommendations.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🎬</div>
        <h3 className="text-lg font-semibold text-white mb-2">No Recommendations Yet</h3>
        <p className="text-sm text-slate-400">
          Start reviewing movies to get personalized recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Recommended For You</h2>
          <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-full">
            {data.algorithm.toUpperCase()}
          </span>
        </div>
        {data.preferred_genres.length > 0 && (
          <p className="text-sm text-slate-400">
            Based on your interest in:{" "}
            <span className="text-purple-400 font-semibold">
              {data.preferred_genres.slice(0, 3).join(", ")}
            </span>
          </p>
        )}
        {data.user_watch_count > 0 && (
          <p className="text-xs text-slate-500">
            Analyzed {data.user_watch_count} of your reviews
          </p>
        )}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {data.recommendations.map((movie) => (
          <Link
            key={movie.movie_id}
            to={`/movies/${movie.movie_id}`}
            className="group relative overflow-hidden rounded-xl bg-slate-800 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            {/* Poster */}
            <div className="aspect-[2/3] overflow-hidden">
              <img
                src={
                  movie.poster_url?.startsWith("/")
                    ? `${window.location.origin}${movie.poster_url}`
                    : movie.poster_url || "https://placehold.co/300x450/1e293b/cbd5e1?text=No+Poster"
                }
                alt={movie.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
            </div>

            {/* Overlay with info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                <h3 className="text-sm font-semibold text-white line-clamp-2">
                  {movie.title}
                </h3>
                {movie.genre && (
                  <p className="text-xs text-slate-300">{movie.genre}</p>
                )}
                {movie.avg_rating > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white font-semibold">
                      {Number(movie.avg_rating).toFixed(1)}
                    </span>
                    <span className="text-slate-400">
                      ({movie.review_count})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation Badge */}
            {movie.recommendation_reason && (
              <div className="absolute top-2 left-2 right-2">
                <div className="bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full text-center">
                  {movie.recommendation_reason}
                </div>
              </div>
            )}

            {/* Rating badge (always visible) */}
            {movie.avg_rating > 0 && (
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="text-white text-xs font-bold">
                  {Number(movie.avg_rating).toFixed(1)}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Algorithm Info */}
      <div className="glass rounded-xl p-4 text-xs text-slate-400">
        <div className="flex items-start gap-2">
          <span>💡</span>
          <div>
            <strong className="text-slate-300">How recommendations work:</strong>
            <p className="mt-1">
              We analyze your review history to find genres you enjoy (rated 4+ stars), then
              recommend unwatched movies from those genres. If you haven't reviewed enough movies,
              we show trending and highly-rated films.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
