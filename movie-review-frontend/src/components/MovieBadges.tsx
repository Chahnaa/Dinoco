import React, { useMemo } from "react";
import { FaCrown, FaFire, FaStar, FaHeartBroken, FaSeedling } from "react-icons/fa";

const CrownIcon = FaCrown as unknown as React.ComponentType<{ className?: string }>;
const FireIcon = FaFire as unknown as React.ComponentType<{ className?: string }>;
const StarIcon = FaStar as unknown as React.ComponentType<{ className?: string }>;
const BrokenIcon = FaHeartBroken as unknown as React.ComponentType<{ className?: string }>;
const SeedlingIcon = FaSeedling as unknown as React.ComponentType<{ className?: string }>;

interface MovieBadgesProps {
  avgRating: number;
  reviewCount: number;
}

type Badge = {
  key: string;
  label: string;
  description: string;
  className: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const MovieBadges: React.FC<MovieBadgesProps> = ({ avgRating, reviewCount }) => {
  const badges = useMemo<Badge[]>(() => {
    const list: Badge[] = [];

    if (avgRating >= 4.6) {
      list.push({
        key: "top-rated",
        label: "Top Rated",
        description: "Elite audience scores. Certified crowd-pleaser.",
        className: "bg-yellow-500/15 text-yellow-200 border-yellow-400/40",
        Icon: CrownIcon,
      });
    }

    if (reviewCount >= 10) {
      list.push({
        key: "fan-favorite",
        label: "Fan Favorite",
        description: "Lots of reviews and strong engagement.",
        className: "bg-red-500/15 text-red-200 border-red-400/40",
        Icon: FireIcon,
      });
    }

    if (avgRating >= 4 && reviewCount > 0 && reviewCount < 10) {
      list.push({
        key: "hidden-gem",
        label: "Hidden Gem",
        description: "High ratings but still under the radar.",
        className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
        Icon: SeedlingIcon,
      });
    }

    if (reviewCount < 3) {
      list.push({
        key: "new",
        label: "New",
        description: "Fresh release with early reactions.",
        className: "bg-slate-500/20 text-slate-200 border-slate-400/40",
        Icon: StarIcon,
      });
    }

    if (avgRating > 0 && avgRating < 3.5) {
      list.push({
        key: "needs-love",
        label: "Needs Love",
        description: "Mixed feedback so far—room to grow.",
        className: "bg-indigo-500/15 text-indigo-200 border-indigo-400/40",
        Icon: BrokenIcon,
      });
    }

    return list;
  }, [avgRating, reviewCount]);

  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(({ key, label, description, className, Icon }) => (
        <div key={key} className="group relative">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${className}`}
          >
            <Icon className="text-xs" />
            {label}
          </div>
          <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-lg border border-slate-700/60 bg-slate-950/90 p-2 text-[10px] text-slate-200 opacity-0 shadow-lg transition duration-200 group-hover:opacity-100">
            {description}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovieBadges;
