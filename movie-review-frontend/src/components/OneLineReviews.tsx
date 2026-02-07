import React from "react";

interface OneLineReviewsProps {
  quotes: string[];
}

const OneLineReviews: React.FC<OneLineReviewsProps> = ({ quotes }) => {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">One‑Line Reviews</p>
          <h3 className="text-lg font-semibold text-white">Quick Takes</h3>
        </div>
        <span className="text-[10px] text-slate-500">{quotes.length} quotes</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((quote, index) => (
          <div
            key={`${quote}-${index}`}
            className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-xs text-slate-300 transition duration-300 hover:border-red-400/60 hover:bg-slate-900/70"
          >
            <div className="absolute inset-0 translate-y-full bg-gradient-to-r from-red-500/10 via-purple-500/10 to-transparent transition duration-500 group-hover:translate-y-0" />
            <p className="relative z-10 line-clamp-2 italic text-slate-200 transition-transform duration-300 group-hover:-translate-y-0.5">
              “{quote}”
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OneLineReviews;
