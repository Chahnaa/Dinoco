import React, { createContext, useContext, useState, useCallback } from "react";

interface DecisionTraceContextType {
  currentPath: string[];
  decisionSource: 'search' | 'filter' | 'trending' | 'recommendation' | 'browse' | 'direct';
  startTime: number;
  
  // Navigation tracking
  addStep: (step: string) => void;
  setDecisionSource: (source: 'search' | 'filter' | 'trending' | 'recommendation' | 'browse' | 'direct') => void;
  resetTrace: () => void;
  
  // Submit trace to backend
  submitTrace: (movieId: number, userId?: number) => Promise<any>;
}

const DecisionTraceContext = createContext<DecisionTraceContextType | undefined>(undefined);

export const DecisionTraceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string[]>(['Home']);
  const [decisionSource, setDecisionSourceState] = useState<'search' | 'filter' | 'trending' | 'recommendation' | 'browse' | 'direct'>('browse');
  const [startTime] = useState(Date.now());

  const addStep = useCallback((step: string) => {
    setCurrentPath(prev => {
      // Avoid duplicate consecutive steps
      if (prev[prev.length - 1] !== step) {
        return [...prev, step];
      }
      return prev;
    });
  }, []);

  const setDecisionSource = useCallback((source: 'search' | 'filter' | 'trending' | 'recommendation' | 'browse' | 'direct') => {
    setDecisionSourceState(source);
  }, []);

  const resetTrace = useCallback(() => {
    setCurrentPath(['Home']);
    setDecisionSourceState('browse');
  }, []);

  const submitTrace = useCallback(async (movieId: number, userId?: number) => {
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      const response = await fetch('http://127.0.0.1:5002/api/decision-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          movie_id: movieId,
          trace_path: currentPath,
          decision_source: decisionSource,
          time_spent_seconds: timeSpent,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit decision trace');
      
      const result = await response.json();
      resetTrace();
      return result;
    } catch (error) {
      console.error('Error submitting decision trace:', error);
      throw error;
    }
  }, [currentPath, decisionSource, startTime, resetTrace]);

  return (
    <DecisionTraceContext.Provider
      value={{
        currentPath,
        decisionSource,
        startTime,
        addStep,
        setDecisionSource,
        resetTrace,
        submitTrace,
      }}
    >
      {children}
    </DecisionTraceContext.Provider>
  );
};

export const useDecisionTrace = () => {
  const context = useContext(DecisionTraceContext);
  if (!context) {
    throw new Error('useDecisionTrace must be used within DecisionTraceProvider');
  }
  return context;
};
