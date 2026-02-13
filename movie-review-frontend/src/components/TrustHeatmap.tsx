import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HeatmapData {
  rating_consistency: number;
  reviewer_credibility: number;
  trust_score: number;
  review_count: number;
  average_rating: number;
  rating_distribution?: {
    min: number;
    max: number;
    std_dev: number;
  };
}

interface TrustHeatmapProps {
  movieId: number;
  showDetails?: boolean;
}

const TrustHeatmap: React.FC<TrustHeatmapProps> = ({ movieId, showDetails = false }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5002/api/trust-heatmap/${movieId}`);
        if (!response.ok) throw new Error("Failed to fetch trust heatmap");
        const data = await response.json();
        setHeatmapData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading trust data");
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [movieId]);

  if (loading) {
    return (
      <div className="h-20 animate-pulse rounded-lg bg-slate-800/50" />
    );
  }

  if (error || !heatmapData) {
    return null;
  }

  // Get color based on score
  const getGradientColor = (score: number) => {
    if (score >= 80) return "from-green-600 to-green-400";
    if (score >= 60) return "from-yellow-600 to-yellow-400";
    if (score >= 40) return "from-orange-600 to-orange-400";
    return "from-red-600 to-red-400";
  };

  const getTrustLevel = (score: number) => {
    if (score >= 80) return "Highly Trustworthy";
    if (score >= 60) return "Reliable";
    if (score >= 40) return "Mixed Reviews";
    return "Use with Caution";
  };

  const consistencyGradient = getGradientColor(heatmapData.rating_consistency);
  const credibilityGradient = getGradientColor(heatmapData.reviewer_credibility);
  const trustGradient = getGradientColor(heatmapData.trust_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4"
    >
      {/* Main Trust Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Trust Score</div>
          <div className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${trustGradient} text-white`}>
            {heatmapData.trust_score.toFixed(1)}/100
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/30 border border-slate-700/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${heatmapData.trust_score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${trustGradient} shadow-lg shadow-current/50`}
          />
        </div>
        <div className="text-xs text-slate-300">{getTrustLevel(heatmapData.trust_score)}</div>
      </div>

      {/* Consistency & Credibility Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Consistency */}
        <div className="space-y-1.5 rounded-lg bg-slate-800/30 p-3 border border-slate-700/30">
          <div className="text-xs font-semibold text-slate-300">Rating Consistency</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/30 border border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${heatmapData.rating_consistency}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className={`h-full bg-gradient-to-r ${consistencyGradient} shadow-sm`}
            />
          </div>
          <div className="text-xs text-slate-400">{heatmapData.rating_consistency.toFixed(0)}%</div>
        </div>

        {/* Credibility */}
        <div className="space-y-1.5 rounded-lg bg-slate-800/30 p-3 border border-slate-700/30">
          <div className="text-xs font-semibold text-slate-300">Reviewer Credibility</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/30 border border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${heatmapData.reviewer_credibility}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              className={`h-full bg-gradient-to-r ${credibilityGradient} shadow-sm`}
            />
          </div>
          <div className="text-xs text-slate-400">{heatmapData.reviewer_credibility.toFixed(0)}%</div>
        </div>
      </div>

      {/* Additional Details */}
      {showDetails && heatmapData.rating_distribution && (
        <div className="border-t border-slate-700/30 pt-3 space-y-2 text-xs text-slate-400">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded bg-slate-800/50 p-2 text-center">
              <div className="text-slate-500">Reviews</div>
              <div className="font-bold text-white">{heatmapData.review_count}</div>
            </div>
            <div className="rounded bg-slate-800/50 p-2 text-center">
              <div className="text-slate-500">Avg Rating</div>
              <div className="font-bold text-white">{heatmapData.average_rating.toFixed(1)}</div>
            </div>
            <div className="rounded bg-slate-800/50 p-2 text-center">
              <div className="text-slate-500">Variation</div>
              <div className="font-bold text-white">±{heatmapData.rating_distribution.std_dev.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TrustHeatmap;
