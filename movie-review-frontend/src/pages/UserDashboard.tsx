import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DecisionTraceVisualizer, { UserBehaviorAnalytics } from '../components/DecisionTraceVisualizer';

interface UserDecisionData {
  traces: any[];
  user_behavior: {
    total_traces: number;
    decision_methods: Record<string, number>;
    preferred_method: string;
    average_decision_steps: number;
  };
}

const UserDashboard: React.FC = () => {
  const [decisionData, setDecisionData] = useState<UserDecisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecisionTraces = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch('http://127.0.0.1:5002/api/user/decision-traces?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch decision traces');
        const data = await response.json();
        setDecisionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading decision traces');
      } finally {
        setLoading(false);
      }
    };

    fetchDecisionTraces();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold">Your Dashboard</h1>
          <p className="text-slate-400 mt-2">Analyze your movie discovery patterns and decision-making behavior</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading your decision traces...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/30 text-red-300">
            <p>{error}</p>
          </div>
        ) : decisionData ? (
          <>
            {/* Behavior Analytics */}
            <UserBehaviorAnalytics userBehavior={decisionData.user_behavior} />

            {/* Decision Traces */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Decision Traces</h2>
                <p className="text-slate-400 text-sm">
                  How you discovered and navigated to movies
                </p>
              </div>
              <DecisionTraceVisualizer traces={decisionData.traces} />
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default UserDashboard;
