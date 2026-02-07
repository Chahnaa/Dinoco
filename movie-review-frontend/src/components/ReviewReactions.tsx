import React from "react";
import { FaThumbsUp, FaHeart, FaLaugh, FaSurprise, FaSadTear } from "react-icons/fa";

export type ReactionCounts = Record<string, number>;

interface ReviewReactionsProps {
  reactions: ReactionCounts;
  onReact: (reaction: string) => void;
}

type ReactionOption = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const reactionOptions: ReactionOption[] = [
  { key: "like", label: "Like", Icon: FaThumbsUp as unknown as React.ComponentType<{ className?: string }> },
  { key: "love", label: "Love", Icon: FaHeart as unknown as React.ComponentType<{ className?: string }> },
  { key: "laugh", label: "Laugh", Icon: FaLaugh as unknown as React.ComponentType<{ className?: string }> },
  { key: "wow", label: "Wow", Icon: FaSurprise as unknown as React.ComponentType<{ className?: string }> },
  { key: "sad", label: "Sad", Icon: FaSadTear as unknown as React.ComponentType<{ className?: string }> },
];

const ReviewReactions: React.FC<ReviewReactionsProps> = ({ reactions, onReact }) => {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {reactionOptions.map(({ key, label, Icon }) => {
        const count = reactions[key] || 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onReact(key)}
            className="group inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-900/50 px-2.5 py-1 text-xs text-slate-200 transition duration-200 hover:border-red-400/60 hover:bg-slate-800/70 active:scale-95"
          >
            <Icon className="text-[11px] text-slate-200 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[10px] uppercase tracking-wide text-slate-300">{label}</span>
            <span className="text-[10px] text-slate-400">{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ReviewReactions;
