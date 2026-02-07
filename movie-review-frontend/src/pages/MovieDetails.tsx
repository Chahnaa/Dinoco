import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaStar } from "react-icons/fa";
import { getReviews, addReview, getMovieDetails } from "../api/api";
import ReviewCard from "../components/ReviewCard";
import AudienceMoodMeter from "../components/AudienceMoodMeter";
import ReviewSummary from "../components/ReviewSummary";
import RatingTimeline, { RatingPoint } from "../components/RatingTimeline";
import MovieBadges from "../components/MovieBadges";

const ArrowLeftIcon = FaArrowLeft as unknown as React.ComponentType<{ className?: string }>;
const StarIcon = FaStar as unknown as React.ComponentType<{ className?: string }>;

interface Review {
  review_id: number;
  user_id: number;
  name?: string;
  rating: number;
  comment?: string;
}

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [selectedMood, setSelectedMood] = useState<"mindBlowing" | "lovedIt" | "good" | "meh" | "boring" | null>(null);
  const [reactionsByReview, setReactionsByReview] = useState<Record<number, Record<string, number>>>({});
  const [movie, setMovie] = useState<{ title?: string; genre?: string; language?: string; release_year?: number; avg_rating?: number; review_count?: number; duration_minutes?: number; poster_url?: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const maxCommentLength = 400;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getReviews(Number(id)).catch(() => ({ data: [] })),
      getMovieDetails(Number(id)).catch(() => ({ data: { title: '' } }))
    ]).then(([reviewsRes, movieRes]) => {
      setReviews(reviewsRes.data);
      setMovie(movieRes.data);
      setLoading(false);
    });
  }, [id]);

  const submitReview = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Please login to submit a review');
      return;
    }
    if (!id || !newComment.trim()) return;
    const user = JSON.parse(userStr);
    addReview({ user_id: user.user_id, movie_id: Number(id), rating: newRating, comment: newComment })
      .then(() => {
        setNewComment('');
        setNewRating(5);
        getReviews(Number(id)).then(res => setReviews(res.data));
      })
      .catch(err => {
        console.error(err);
        alert('Failed to submit review. Please try again.');
      });
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) counts[review.rating - 1] += 1;
    });
    return counts.reverse();
  }, [reviews]);

  const moodCounts = useMemo(
    () => ({
      mindBlowing: reviews.filter(r => r.rating === 5).length,
      lovedIt: reviews.filter(r => r.rating === 4).length,
      good: reviews.filter(r => r.rating === 3).length,
      meh: reviews.filter(r => r.rating === 2).length,
      boring: reviews.filter(r => r.rating === 1).length,
    }),
    [reviews]
  );

  const handleMoodSelect = (mood: "mindBlowing" | "lovedIt" | "good" | "meh" | "boring") => {
    setSelectedMood(mood);
    const ratingMap: Record<typeof mood, number> = {
      mindBlowing: 5,
      lovedIt: 4,
      good: 3,
      meh: 2,
      boring: 1,
    };
    setNewRating(ratingMap[mood]);
  };

  const avgRatingValue = useMemo(() => {
    if (movie?.avg_rating !== undefined && movie?.avg_rating !== null) {
      return Number(movie.avg_rating);
    }
    return averageRating;
  }, [movie?.avg_rating, averageRating]);

  const reviewCountValue = useMemo(() => {
    if (movie?.review_count !== undefined && movie?.review_count !== null) {
      return Number(movie.review_count);
    }
    return reviews.length;
  }, [movie?.review_count, reviews.length]);

  const ratingTimeline = useMemo<RatingPoint[]>(() => {
    const base = averageRating || 3.5;
    const variance = reviews.length ? Math.min(0.6, reviews.length / 20) : 0.2;
    const now = new Date();
    const points: RatingPoint[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleString("en-US", { month: "short" });
      const offset = ((i % 3) - 1) * variance;
      const value = Math.max(0, Math.min(5, Number((base + offset).toFixed(1))));
      points.push({ label, average: value });
    }
    return points;
  }, [averageRating, reviews.length]);

  const handleReaction = (reviewId: number, emoji: string) => {
    setReactionsByReview(prev => {
      const current = prev[reviewId] || {};
      return {
        ...prev,
        [reviewId]: {
          ...current,
          [emoji]: (current[emoji] || 0) + 1,
        },
      };
    });
  };

  const topReviewId = useMemo(() => {
    let topId: number | null = null;
    let topTotal = 0;
    Object.entries(reactionsByReview).forEach(([id, counts]) => {
      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
      if (total > topTotal) {
        topTotal = total;
        topId = Number(id);
      }
    });
    return topId;
  }, [reactionsByReview]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white">
        <ArrowLeftIcon /> Back to Home
      </Link>

      <section className="grid gap-8 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0">
            <img
              src={movie?.poster_url?.startsWith("/")
                ? `${window.location.origin}${movie.poster_url}`
                : movie?.poster_url || "https://placehold.co/600x900/0f172a/ffffff?text=Poster"}
              alt=""
              className="h-full w-full object-cover blur-2xl scale-110 opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>
          <div className="relative z-10 glass rounded-3xl p-4">
            <img
              src={movie?.poster_url?.startsWith("/")
                ? `${window.location.origin}${movie.poster_url}`
                : movie?.poster_url || "https://placehold.co/600x900/0f172a/ffffff?text=Poster"}
              alt={movie?.title || "Movie"}
              className="aspect-[2/3] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-red-400">Movie Spotlight</p>
            <h1 className="font-display text-3xl text-white lg:text-4xl">{movie?.title || "Loading..."}</h1>
            <MovieBadges avgRating={avgRatingValue} reviewCount={reviewCountValue} />
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <StarIcon className="text-yellow-400" />
                <span>
                  {movie?.avg_rating !== undefined && movie?.avg_rating !== null
                    ? Number(movie.avg_rating).toFixed(1)
                    : averageRating || "New"}
                </span>
              </div>
              <span>{movie?.release_year || "2024"}</span>
              <span>{movie?.genre || "Action"} • {movie?.language || "Drama"}</span>
                <span>{movie?.duration_minutes ? `${movie.duration_minutes}m` : "Duration"}</span>
            </div>
            <p className="text-sm text-slate-300">
                {movie?.description || "An atmospheric journey through neon-lit streets where every choice reshapes the story. Drop your review and let the community decide the ending."}
            </p>
            <button className="btn-primary">
              Add Review
            </button>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Community Rating</p>
                <h3 className="text-2xl font-semibold text-white">{averageRating || "New"}</h3>
                <p className="text-xs text-slate-400">Based on {reviews.length} reviews</p>
              </div>
              <div className="text-xs text-slate-300">Top rated by night owls</div>
            </div>
            <div className="mt-4 space-y-2">
              {[5, 4, 3, 2, 1].map((star, index) => {
                const count = ratingBreakdown[index];
                const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs text-slate-300">
                    <span>{star}★</span>
                    <div className="rating-bar flex-1">
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.65fr_0.35fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Reviews</h2>
            <span className="text-xs text-slate-400">{reviews.length} total</span>
          </div>
          <ReviewSummary reviews={reviews.map(review => review.comment || "").filter(Boolean)} />
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-900/60" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-sm text-slate-300">
              No reviews yet. Be the first to review!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <ReviewCard
                  key={r.review_id}
                  review={r}
                  reactions={reactionsByReview[r.review_id] || {}}
                  onReact={(emoji) => handleReaction(r.review_id, emoji)}
                  isTop={topReviewId === r.review_id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <RatingTimeline points={ratingTimeline} />
          <AudienceMoodMeter
            totalVotes={reviews.length}
            moodCounts={moodCounts}
            selectedMood={selectedMood ?? undefined}
            onSelectMood={handleMoodSelect}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-4"
          >
            <h3 className="text-sm font-semibold text-white">Write your review</h3>
            <p className="text-xs text-slate-400">Share your verdict with the community.</p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-300">Your rating</p>
                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`text-lg ${star <= newRating ? "text-yellow-400" : "text-slate-600"}`}
                    >
                      <StarIcon />
                    </button>
                  ))}
                  <span className="text-xs text-slate-400">{newRating}/5</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Your review</p>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value.slice(0, maxCommentLength))}
                  className="mt-2 h-28 w-full rounded-xl border border-slate-700/60 bg-slate-950/40 p-3 text-sm text-white outline-none"
                  placeholder="Share your thoughts..."
                />
                <p className="mt-1 text-right text-[10px] text-slate-500">
                  {newComment.length}/{maxCommentLength}
                </p>
              </div>
              <button
                onClick={submitReview}
                disabled={!newComment.trim()}
                className="w-full rounded-xl bg-red-500 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                Submit Review
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MovieDetails;
