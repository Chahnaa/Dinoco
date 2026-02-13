import React, { useMemo } from "react";
import { motion } from "framer-motion";

type ReviewInput = {
  rating: number;
  review_date?: string;
};

interface ThrillPulseProps {
  reviews: ReviewInput[];
  averageRating: number;
  reviewCount: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const getPulseColor = (score: number) => {
  if (score >= 70) return "from-red-500 via-orange-400 to-yellow-300";
  if (score >= 40) return "from-orange-400 via-amber-300 to-yellow-200";
  return "from-slate-500 via-slate-400 to-slate-300";
};

const getPulseLabel = (score: number) => {
  if (score >= 70) return "Peak suspense";
  if (score >= 40) return "Rising tension";
  return "Low simmer";
};

const ThrillPulse: React.FC<ThrillPulseProps> = ({ reviews, averageRating, reviewCount }) => {
  const metrics = useMemo(() => {
    const ratings = reviews.map((r) => r.rating).filter((r) => Number.isFinite(r));
    const mean = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    const variance = ratings.length
      ? ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const volatility = clamp((stdDev / 1.5) * 100);

    const now = Date.now();
    const recentReviews = reviews.filter((r) => {
      if (!r.review_date) return false;
      const time = new Date(r.review_date).getTime();
      if (!Number.isFinite(time)) return false;
      return now - time <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const momentumBase = Math.max(5, Math.min(20, reviewCount || 0));
    const momentum = clamp((recentReviews / momentumBase) * 100);
    const audienceHeat = clamp((averageRating / 5) * 100);

    const thrillScore = clamp(0.45 * volatility + 0.35 * momentum + 0.2 * audienceHeat);

    return {
      stdDev: Number(stdDev.toFixed(2)),
      volatility: Math.round(volatility),
      momentum: Math.round(momentum),
      audienceHeat: Math.round(audienceHeat),
      recentReviews,
      thrillScore: Math.round(thrillScore),
    };
  }, [reviews, averageRating, reviewCount]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">Thrill Pulse</p>
          <h3 className="text-2xl font-semibold text-white">{metrics.thrillScore}</h3>
          <p className="text-xs text-slate-400">{getPulseLabel(metrics.thrillScore)}</p>
        </div>
        <div className="text-xs text-slate-300">Updated live from reviews</div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.thrillScore}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${getPulseColor(metrics.thrillScore)}`}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-slate-300 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Volatility</p>
          <p className="mt-2 text-lg font-semibold text-white">{metrics.volatility}%</p>
          <p className="text-[11px] text-slate-400">Rating spread: σ {metrics.stdDev}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Momentum</p>
          <p className="mt-2 text-lg font-semibold text-white">{metrics.momentum}%</p>
          <p className="text-[11px] text-slate-400">{metrics.recentReviews} new reviews this week</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Audience Heat</p>
          <p className="mt-2 text-lg font-semibold text-white">{metrics.audienceHeat}%</p>
          <p className="text-[11px] text-slate-400">Based on average rating</p>
        </div>
      </div>
    </div>
  );
};

export default ThrillPulse;