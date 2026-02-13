import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaSearch, FaFilter, FaFire, FaLightbulb, FaCompass, FaDirections } from "react-icons/fa";

const SearchIcon = FaSearch as unknown as React.ComponentType<{ className?: string }>;
const FilterIcon = FaFilter as unknown as React.ComponentType<{ className?: string }>;
const FireIcon = FaFire as unknown as React.ComponentType<{ className?: string }>;
const BulbIcon = FaLightbulb as unknown as React.ComponentType<{ className?: string }>;
const CompassIcon = FaCompass as unknown as React.ComponentType<{ className?: string }>;
const DirectionsIcon = FaDirections as unknown as React.ComponentType<{ className?: string }>;
const ArrowIcon = FaArrowRight as unknown as React.ComponentType<{ className?: string }>;

interface DecisionTrace {
  trace_id: number;
  trace_path: string[];
  trace_summary: string;
  decision_source: 'search' | 'filter' | 'trending' | 'recommendation' | 'browse' | 'direct';
  num_steps: number;
  time_spent_seconds: number;
  created_at: string;
}

interface DecisionTraceVisualizerProps {
  traces: DecisionTrace[];
}

const DecisionTraceVisualizer: React.FC<DecisionTraceVisualizerProps> = ({ traces }) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'search':
        return <SearchIcon className="text-blue-400" />;
      case 'filter':
        return <FilterIcon className="text-purple-400" />;
      case 'trending':
        return <FireIcon className="text-red-400" />;
      case 'recommendation':
        return <BulbIcon className="text-yellow-400" />;
      case 'browse':
        return <CompassIcon className="text-cyan-400" />;
      case 'direct':
        return <DirectionsIcon className="text-green-400" />;
      default:
        return null;
    }
  };

  const getSourceLabel = (source: string) => {
    return source.charAt(0).toUpperCase() + source.slice(1);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'search':
        return 'from-blue-600/20 to-blue-500/10';
      case 'filter':
        return 'from-purple-600/20 to-purple-500/10';
      case 'trending':
        return 'from-red-600/20 to-red-500/10';
      case 'recommendation':
        return 'from-yellow-600/20 to-yellow-500/10';
      case 'browse':
        return 'from-cyan-600/20 to-cyan-500/10';
      case 'direct':
        return 'from-green-600/20 to-green-500/10';
      default:
        return 'from-slate-600/20 to-slate-500/10';
    }
  };

  if (!traces || traces.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No decision traces recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {traces.map((trace, idx) => (
        <motion.div
          key={trace.trace_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`p-4 rounded-lg border border-slate-700/50 bg-gradient-to-r ${getSourceColor(trace.decision_source)}`}
        >
          {/* Header: Source + Time */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getSourceIcon(trace.decision_source)}
              <span className="text-xs font-bold uppercase tracking-wide text-slate-200">
                {getSourceLabel(trace.decision_source)}
              </span>
              <span className="text-xs text-slate-400">({trace.num_steps} steps)</span>
            </div>
            <span className="text-xs text-slate-400">
              {trace.time_spent_seconds}s
            </span>
          </div>

          {/* Decision Path */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {trace.trace_path.map((step, stepIdx) => (
              <React.Fragment key={stepIdx}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 * stepIdx }}
                  className="px-3 py-1 rounded-full bg-slate-800/60 text-xs text-slate-200 font-medium whitespace-nowrap border border-slate-700/30 hover:border-slate-600/60 transition"
                >
                  {step}
                </motion.div>
                {stepIdx < trace.trace_path.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.05 * stepIdx + 0.1 }}
                    className="origin-left"
                  >
                    <ArrowIcon className="text-slate-600 text-xs mx-1" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface UserBehaviorAnalyticsProps {
  userBehavior: {
    total_traces: number;
    decision_methods: Record<string, number>;
    preferred_method: string;
    average_decision_steps: number;
  };
}

export const UserBehaviorAnalytics: React.FC<UserBehaviorAnalyticsProps> = ({ userBehavior }) => {
  const methods = userBehavior.decision_methods;
  const total = userBehavior.total_traces;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6"
    >
      <h3 className="text-lg font-bold text-white">Your Decision Behavior</h3>

      {/* Preferred Method */}
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
        <p className="text-xs text-slate-400 mb-1">Preferred Decision Method</p>
        <p className="text-xl font-bold text-cyan-400">
          {userBehavior.preferred_method.charAt(0).toUpperCase() + userBehavior.preferred_method.slice(1)}
        </p>
      </div>

      {/* Average Steps */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <p className="text-xs text-slate-400">Total Decisions</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <p className="text-xs text-slate-400">Avg Steps</p>
          <p className="text-2xl font-bold text-white">{userBehavior.average_decision_steps.toFixed(1)}</p>
        </div>
      </div>

      {/* Decision Method Distribution */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Decision Methods</p>
        {Object.entries(methods).map(([method, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={method} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{method}</span>
                <span className="text-slate-300 font-semibold">{count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-700/30 overflow-hidden border border-slate-700/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-700/30">
        <p className="text-xs text-blue-300">
          <span className="font-bold">💡 Insight:</span> You typically take{' '}
          <span className="font-semibold">{Math.round(userBehavior.average_decision_steps)}</span> steps to discover a movie,
          preferring <span className="font-semibold">{userBehavior.preferred_method}</span> methods.
        </p>
      </div>
    </motion.div>
  );
};

export default DecisionTraceVisualizer;
