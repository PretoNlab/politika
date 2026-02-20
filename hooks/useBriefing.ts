import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { generateBriefing } from '../services/geminiClient';
import { CACHE_TTL, STORAGE_KEYS } from '../constants';
import type { BriefingResult, BriefingStatus, PolitikaAlert, TaggedNewsArticle } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

const BRIEFING_DEBOUNCE_MS = 5000;

interface CachedBriefing {
  result: BriefingResult;
  metricsHash: string;
  timestamp: number;
}

function computeMetricsHash(
  totalMentions: number,
  avgSentiment: number | null,
  alertCount: number,
  dangerCount: number
): string {
  return `${totalMentions}:${avgSentiment?.toFixed(2) ?? 'null'}:${alertCount}:${dangerCount}`;
}

function getCachedBriefing(hash: string): BriefingResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.briefingCache);
    if (!raw) return null;
    const cached: CachedBriefing = JSON.parse(raw);
    if (cached.metricsHash !== hash) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL.briefing) {
      localStorage.removeItem(STORAGE_KEYS.briefingCache);
      return null;
    }
    return cached.result;
  } catch {
    return null;
  }
}

function setCachedBriefing(hash: string, result: BriefingResult): void {
  try {
    const cached: CachedBriefing = { result, metricsHash: hash, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.briefingCache, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Deriva briefing a partir dos dados locais (fallback sem IA)
 */
function deriveFallbackBriefing(
  globalMetrics: { totalMentions: number; avgSentiment: number | null; overallTrend: 'up' | 'down' | 'steady' },
  dangerCount: number,
  opportunityCount: number
): BriefingResult {
  let status: BriefingStatus = 'calm';
  let summary = 'Situacao estavel. Nenhuma alteracao significativa nos termos monitorados.';
  const recommendations: string[] = [];

  if (dangerCount >= 2 || (globalMetrics.avgSentiment !== null && globalMetrics.avgSentiment < -0.3)) {
    status = 'crisis';
    summary = `Atencao critica: ${dangerCount} alerta(s) de perigo detectado(s). Sentimento em queda requer acao imediata.`;
    recommendations.push('Abrir War Room para avaliar contra-medidas');
  } else if (dangerCount > 0 || (globalMetrics.avgSentiment !== null && globalMetrics.avgSentiment < -0.1) || globalMetrics.overallTrend === 'down') {
    status = 'alert';
    summary = `Monitoramento detectou sinais de atencao. Tendencia ${globalMetrics.overallTrend === 'down' ? 'em queda' : 'instavel'}.`;
    recommendations.push('Acompanhar evolucao nas proximas horas');
  } else if (opportunityCount > 0) {
    status = 'calm';
    summary = `Cenario favoravel com ${opportunityCount} oportunidade(s) identificada(s). Bom momento para comunicar.`;
    recommendations.push('Capitalizar o momento positivo');
  }

  return { status, summary, recommendations };
}

interface UseBriefingProps {
  globalMetrics: {
    totalMentions: number;
    avgSentiment: number | null;
    hottestTerm: string | null;
    overallTrend: 'up' | 'down' | 'steady';
  };
  alerts: PolitikaAlert[];
  allArticles: TaggedNewsArticle[];
  isLoading: boolean;
  hasWorkspace: boolean;
}

interface UseBriefingReturn {
  briefing: BriefingResult | null;
  isBriefingLoading: boolean;
  refreshBriefing: () => void;
}

export const useBriefing = ({
  globalMetrics,
  alerts,
  allArticles,
  isLoading,
  hasWorkspace
}: UseBriefingProps): UseBriefingReturn => {
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const { activeWorkspace } = useWorkspace();

  const workspaceContext = activeWorkspace ? {
    state: activeWorkspace.state,
    region: activeWorkspace.region,
    customContext: activeWorkspace.customContext,
  } : undefined;

  const activeAlerts = useMemo(() => alerts.filter(a => !a.isActioned), [alerts]);
  const dangerCount = useMemo(() => activeAlerts.filter(a => a.severity === 'danger' || a.severity === 'warning').length, [activeAlerts]);
  const opportunityCount = useMemo(() => activeAlerts.filter(a => a.severity === 'opportunity' || a.severity === 'info').length, [activeAlerts]);

  const metricsHash = useMemo(
    () => computeMetricsHash(globalMetrics.totalMentions, globalMetrics.avgSentiment, activeAlerts.length, dangerCount),
    [globalMetrics.totalMentions, globalMetrics.avgSentiment, activeAlerts.length, dangerCount]
  );

  // Fallback imediato quando dados mudam
  useEffect(() => {
    if (!hasWorkspace || isLoading) return;
    const fallback = deriveFallbackBriefing(globalMetrics, dangerCount, opportunityCount);
    setBriefing(prev => prev ?? fallback);
  }, [hasWorkspace, isLoading, globalMetrics, dangerCount, opportunityCount]);

  // Chamada IA com debounce
  const fetchBriefing = useCallback(async () => {
    if (!hasWorkspace || isLoading || inFlightRef.current) return;

    const cached = getCachedBriefing(metricsHash);
    if (cached) {
      setBriefing(cached);
      return;
    }

    inFlightRef.current = true;
    setIsBriefingLoading(true);

    try {
      const topAlert = activeAlerts.length > 0 ? activeAlerts[0].title : undefined;
      const result = await generateBriefing(
        globalMetrics,
        { total: activeAlerts.length, dangerCount, opportunityCount, topAlert },
        allArticles.slice(0, 10).map(a => a.title),
        workspaceContext
      );

      const normalized: BriefingResult = {
        status: (['calm', 'alert', 'crisis'].includes(result.status) ? result.status : 'alert') as BriefingStatus,
        summary: result.summary,
        recommendations: result.recommendations || []
      };

      setCachedBriefing(metricsHash, normalized);
      setBriefing(normalized);
    } catch (err) {
      console.error('Briefing generation failed:', err);
      // Fallback já está setado
    } finally {
      inFlightRef.current = false;
      setIsBriefingLoading(false);
    }
  }, [hasWorkspace, isLoading, metricsHash, globalMetrics, activeAlerts, dangerCount, opportunityCount, allArticles]);

  // Trigger debounced
  useEffect(() => {
    if (!hasWorkspace || isLoading) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchBriefing, BRIEFING_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [metricsHash, hasWorkspace, isLoading, fetchBriefing]);

  const refreshBriefing = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.briefingCache);
    fetchBriefing();
  }, [fetchBriefing]);

  return { briefing, isBriefingLoading, refreshBriefing };
};
