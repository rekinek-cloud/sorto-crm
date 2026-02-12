'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pipelineStagesApi, PipelineStage } from '@/lib/api/pipelineStages';

interface PipelineStageContextValue {
  stages: PipelineStage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStageById: (id: string) => PipelineStage | undefined;
  getStageColor: (stageId: string) => string;
  openStages: PipelineStage[];
  closedStages: PipelineStage[];
  wonStages: PipelineStage[];
  lostStages: PipelineStage[];
}

const PipelineStageContext = createContext<PipelineStageContextValue | null>(null);

export function PipelineStageProvider({ children }: { children: React.ReactNode }) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pipelineStagesApi.getStages();
      setStages(data);
    } catch (err: any) {
      console.error('Failed to fetch pipeline stages:', err);
      setError(err.message || 'Failed to load pipeline stages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const getStageById = useCallback(
    (id: string) => stages.find((s) => s.id === id),
    [stages]
  );

  const getStageColor = useCallback(
    (stageId: string): string => {
      const stage = stages.find((s) => s.id === stageId);
      return stage?.color || '#9CA3AF';
    },
    [stages]
  );

  const openStages = stages.filter((s) => !s.isClosed);
  const closedStages = stages.filter((s) => s.isClosed);
  const wonStages = stages.filter((s) => s.isClosed && s.isWon);
  const lostStages = stages.filter((s) => s.isClosed && !s.isWon);

  return (
    <PipelineStageContext.Provider
      value={{
        stages,
        isLoading,
        error,
        refetch: fetchStages,
        getStageById,
        getStageColor,
        openStages,
        closedStages,
        wonStages,
        lostStages,
      }}
    >
      {children}
    </PipelineStageContext.Provider>
  );
}

export function usePipelineStages() {
  const context = useContext(PipelineStageContext);
  if (!context) {
    throw new Error('usePipelineStages must be used within a PipelineStageProvider');
  }
  return context;
}
