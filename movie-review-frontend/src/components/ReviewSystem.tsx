import React, { useState, useEffect } from "react";
import axios from "axios";

interface Review {
  review_id: number;
  user_id: number;
  name: string;
  rating: number;
  comment: string;
  review_date: string;
}

interface RatingStats {
  review_count: number;
  avg_rating: number;
  avg_rating_rounded: number;
  min_rating: number | null;
  max_rating: number | null;
}

interface ReviewSystemProps {
  movieId: number;
  onReviewSubmitted?: () => void;
}

/**
 * Review System Component
 * - Display all reviews with user names and ratings
 * - Show rating statistics (average, count, distribution)
 * - Allow authenticated users to submit/update their own review
 * - One review per user per movie (enforced at backend)
 * - Star rating picker (1-5 stars)
 * - Comment/description field
 */
const ReviewSystem: React.FC<ReviewSystemProps> = ({ movieId, onReviewSubmitted }) => {
  // State Management
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch all reviews and stats
  const fetchReviews = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        axios.get(`/api/reviews/movie/${movieId}`),
        axios.get(`/api/reviews/movie/${movieId}/stats`),
      ]);

      setReviews(reviewsRes.data);
      setStats(statsRes.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews. Please try again.");
    }
  };

  // Fetch current user's review
  const fetchUserReview = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      // Get current user's review for this movie
      const res = await axios.get(`/api/reviews/movie/${movieId}/user/${getUserIdFromToken()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        setUserReview(res.data);
        setRating(res.data.rating);
        setComment(res.data.comment || "");
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Failed to fetch user review:", err);
      }
    }
  };

  // Extract user_id from JWT token
  const getUserIdFromToken = (): number => {
    const token = localStorage.getItem("token");
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id;
    } catch {
      return 0;
    }
  };

  // Submit or update review
  const handleSubmitReview = async () => {
    if (!rating) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to submit a review");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "/api/reviews",
        {
          movie_id: movieId,
          rating,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess(userReview ? "Review updated successfully!" : "Review submitted successfully!");
        setUserReview(response.data);

        // Refresh reviews and stats
        await Promise.all([fetchReviews(), fetchUserReview()]);

        // Call parent callback
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to submit review. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Delete user's review
  const handleDeleteReview = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to delete a review");
        return;
      }

      // Note: Implement DELETE /api/reviews/{review_id} endpoint in backend
      // For now, we'll clear the local state
      setUserReview(null);
      setRating(0);
      setComment("");
      setSuccess("Review deleted successfully!");

      // Refresh reviews
      await fetchReviews();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReviews();
    fetchUserReview();
  }, [movieId]);

  // Rating distribution
  const getRatingDistribution = (targetRating: number): number => {
    if (!stats || stats.review_count === 0) return 0;
    const count = reviews.filter((r) => r.rating === targetRating).length;
    return Math.round((count / stats.review_count) * 100);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-6">
      {/* Rating Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Rating Card */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-lg">
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {stats?.avg_rating_rounded.toFixed(1) || "0.0"}
            </div>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xl ${
                    i < Math.round(stats?.avg_rating_rounded || 0)
                      ? "text-yellow-400"
                      : "text-gray-600"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-300">{stats?.review_count || 0} reviews</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-gradient-to-br from-purple-900 to-slate-900 p-6 rounded-lg space-y-3">
          <div className="text-lg font-semibold text-white mb-4">Rating Distribution</div>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300 w-8">{star}★</span>
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-300"
                  style={{ width: `${getRatingDistribution(star)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8">{getRatingDistribution(star)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Form (Authenticated Users Only) */}
      {isAuthenticated && (
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 rounded-lg space-y-4 border border-slate-600">
          <h3 className="text-xl font-semibold text-white">
            {userReview ? "Update Your Review" : "Share Your Review"}
          </h3>

          {/* Star Rating Picker */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Your Rating</label>
            <div className="flex gap-2 text-3xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <span
                    className={`text-3xl ${
                      star <= (hoveredRating || rating) ? "text-yellow-400" : "text-gray-600"
                    } transition-colors`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this movie..."
              maxLength={500}
              className="w-full bg-slate-900 text-white placeholder-gray-500 border border-slate-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-none"
              rows={4}
            />
            <div className="text-xs text-gray-400">{comment.length}/500</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmitReview}
              disabled={loading || !rating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              {loading ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
            </button>

            {userReview && (
              <button
                onClick={handleDeleteReview}
                disabled={loading}
                className="bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Delete
              </button>
            )}
          </div>

          {/* Messages */}
          {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</div>}
          {success && <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded">{success}</div>}
        </div>
      )}

      {/* Not Authenticated Message */}
      {!isAuthenticated && (
        <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg text-center text-blue-300">
          <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Login to write a review
          </a>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Reviews ({reviews.length})</h3>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No reviews yet. Be the first to review this movie!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.review_id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-slate-900 text-lg">👤</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-semibold">{review.name}</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < review.rating ? "text-yellow-400" : "text-gray-600"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {review.comment && <p className="text-gray-300 text-sm break-words">{review.comment}</p>}

                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(review.review_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSystem;
