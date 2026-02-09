import { useState, useMemo } from 'react';
import {
  buildTrendFromArticles,
  TrendPoint,
  RegionalTrend
} from '../services/trendsService';
import type { TaggedNewsArticle } from '../types';

interface UseTrendsOptions {
  articles: TaggedNewsArticle[];
}

interface UseTrendsReturn {
  pulseData: number[];
  trendPoints: TrendPoint[];
  regionalTrends: RegionalTrend[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para computar dados de tendências a partir de artigos tagueados.
 * Substitui a versão anterior que usava dados simulados.
 */
export const useTrends = (options: UseTrendsOptions): UseTrendsReturn => {
  const { articles } = options;
  const [error] = useState<string | null>(null);

  const trendPoints = useMemo(() => buildTrendFromArticles(articles), [articles]);
  const pulseData = useMemo(() => trendPoints.map(p => p.value), [trendPoints]);

  return {
    pulseData,
    trendPoints,
    regionalTrends: [],
    loading: false,
    error
  };
};
