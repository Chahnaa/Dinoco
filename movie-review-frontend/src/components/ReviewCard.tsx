import React from 'react'
import { FaStar } from 'react-icons/fa'
import ReviewReactions, { ReactionCounts } from './ReviewReactions'

const StarIcon = FaStar as unknown as React.ComponentType<{ className?: string }>

type Review = {
  review_id: number
  name?: string
  rating: number
  comment?: string
}

const ReviewCard: React.FC<{ review: Review; reactions: ReactionCounts; onReact: (emoji: string) => void; isTop?: boolean }> = ({ review, reactions, onReact, isTop }) => (
  <div className={`glass rounded-2xl p-4 transition ${isTop ? 'border border-red-400/60 shadow-[0_0_25px_rgba(239,68,68,0.25)]' : ''}`}>
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-sm font-semibold text-red-300">
        {(review.name || 'A')[0].toUpperCase()}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{review.name || 'Anonymous'}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Recently</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            {Array.from({ length: review.rating }).map((_, idx) => (
              <StarIcon key={idx} className="text-xs" />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-300">{review.comment || 'No comment provided.'}</p>
        <ReviewReactions reactions={reactions} onReact={onReact} />
      </div>
    </div>
  </div>
)

export default ReviewCard
