import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { generatePoliticalInsight, generateComparativeInsight } from '../services/geminiClient';
import { DetailedAnalysis, ComparativeAnalysis } from '../types';
import { useRateLimit } from './useRateLimit';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUsageStore } from '../store/usageStore';
import { useUsageGate } from './useUsageGate';

interface UsePoliticalAnalysisReturn {
  loading: boolean;
  error: string | null;
  analyzeCandidate: (handle: string) => Promise<DetailedAnalysis | null>;
  compareCandidates: (handles: string[]) => Promise<ComparativeAnalysis | null>;
}

/**
 * Hook para análises políticas (individual e comparativa)
 *
 * @returns Funções de análise, estado de loading e erros
 *
 * @example
 * const { analyzeCandidate, compareCandidates, loading } = usePoliticalAnalysis();
 *
 * // Análise individual
 * const result = await analyzeCandidate('joaosilva');
 *
 * // Análise comparativa
 * const comparison = await compareCandidates(['joao', 'maria', 'pedro']);
 */
export const usePoliticalAnalysis = (): UsePoliticalAnalysisReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();
  const incrementUsage = useUsageStore(s => s.increment);
  const analysisGate = useUsageGate('analyses');
  const comparisonGate = useUsageGate('comparisons');

  const workspaceContext = activeWorkspace ? {
    state: activeWorkspace.state,
    region: activeWorkspace.region,
    customContext: activeWorkspace.customContext,
  } : undefined;

  // Rate limiting: 10 análises por minuto
  const checkRateLimit = useRateLimit({
    maxCalls: 10,
    windowMs: 60000,
    errorMessage: 'Muitas análises em pouco tempo'
  });

  const analyzeCandidate = useCallback(async (handle: string): Promise<DetailedAnalysis | null> => {
    if (!handle.trim()) {
      toast.error('Digite um handle válido');
      return null;
    }

    // Verifica limite do free tier
    if (!analysisGate.canProceed) {
      toast.error(`Limite mensal atingido (${analysisGate.usage}/${analysisGate.limit} análises)`);
      return null;
    }

    // Verifica rate limiting
    if (!checkRateLimit()) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await generatePoliticalInsight(handle, workspaceContext);

      if (result) {
        incrementUsage('analyses');
        toast.success('Análise concluída com sucesso!');
        return result as DetailedAnalysis;
      } else {
        toast.error('Não foi possível gerar a análise');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise estratégica';
      setError(errorMessage);
      console.error('Erro ao analisar candidato:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkRateLimit, analysisGate, incrementUsage]);

  const compareCandidates = useCallback(async (handles: string[]): Promise<ComparativeAnalysis | null> => {
    const validHandles = handles.filter(h => h.trim() !== '');

    if (validHandles.length < 2) {
      toast.error('Digite pelo menos 2 candidatos para comparar');
      return null;
    }

    // Verifica limite do free tier
    if (!comparisonGate.canProceed) {
      toast.error(`Limite mensal atingido (${comparisonGate.usage}/${comparisonGate.limit} comparações)`);
      return null;
    }

    // Verifica rate limiting
    if (!checkRateLimit()) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await generateComparativeInsight(validHandles, workspaceContext);

      if (result) {
        incrementUsage('comparisons');
        toast.success('Comparação concluída com sucesso!');
        return result as ComparativeAnalysis;
      } else {
        toast.error('Não foi possível gerar a comparação');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise comparativa';
      setError(errorMessage);
      console.error('Erro ao comparar candidatos:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkRateLimit, comparisonGate, incrementUsage]);

  return {
    loading,
    error,
    analyzeCandidate,
    compareCandidates
  };
};
