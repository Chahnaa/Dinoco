import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface ReviewSummaryProps {
  reviews: string[];
}

const positiveWords = [
  "amazing",
  "great",
  "excellent",
  "awesome",
  "fantastic",
  "love",
  "loved",
  "brilliant",
  "masterpiece",
  "incredible",
  "fun",
  "thrilling",
  "emotional",
  "beautiful",
  "strong",
];

const negativeWords = [
  "boring",
  "bad",
  "poor",
  "weak",
  "slow",
  "dull",
  "mess",
  "confusing",
  "predictable",
  "forgettable",
  "disappointing",
  "waste",
  "flat",
];

const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "then",
  "so",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "my",
  "our",
  "your",
  "their",
]);

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ reviews }) => {
  const summary = useMemo(() => {
    const text = reviews.join(" ").toLowerCase();
    const words = text
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter(word => !stopWords.has(word));

    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    const topKeywords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    const positiveCount = positiveWords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    const negativeCount = negativeWords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);

    const sentiment = positiveCount === negativeCount
      ? "mixed"
      : positiveCount > negativeCount
        ? "positive"
        : "negative";

    if (!reviews.length) {
      return "No reviews yet. Be the first to share your thoughts and shape the audience buzz.";
    }

    const keywordText = topKeywords.length
      ? `Common themes include ${topKeywords.join(", ")}.`
      : "Themes are still emerging.";

    const sentimentText = sentiment === "positive"
      ? "Overall sentiment is strongly positive with plenty of praise."
      : sentiment === "negative"
        ? "Overall sentiment trends negative with repeated concerns."
        : "Overall sentiment is balanced with mixed reactions.";

    return `${sentimentText} ${keywordText}`;
  }, [reviews]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Review Summary</p>
      <h3 className="mt-1 text-lg font-semibold text-white">Audience Pulse</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{summary}</p>
    </motion.div>
  );
};

export default ReviewSummary;
