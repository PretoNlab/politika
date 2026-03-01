import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useNews } from './useNews';
import { useSentiment } from './useSentiment';
import { useMultiTermTrends } from './useTrendsData';
import { tagArticlesWithTerms, computeTimeDistribution, clearNewsCache } from '../services/newsService';
import { buildTrendFromArticles, computeTrendDirection, buildDailyTrendFromArticles, groupArticlesByDay } from '../services/trendsService';
import type { TaggedNewsArticle, TermMetrics, SentimentResult } from '../types';
import type { TrendPoint, DailyTrendPoint, DayGroup } from '../services/trendsService';
import type { TrendDataPoint } from './useTrendsData';

interface UsePulseMonitorReturn {
  terms: string[];
  activeTerm: string | null;
  setActiveTerm: (term: string | null) => void;
  metrics: Record<string, TermMetrics>;
  globalMetrics: {
    totalMentions: number;
    avgSentiment: number | null;
    hottestTerm: string | null;
    overallTrend: 'up' | 'down' | 'steady';
  };
  filteredArticles: TaggedNewsArticle[];
  allArticles: TaggedNewsArticle[];
  breakingNews: TaggedNewsArticle[];   // Artigos publicados há < 2h
  pulseData: number[];
  trendPoints: TrendPoint[];
  isLoading: boolean;
  isNewsLoading: boolean;
  refresh: () => Promise<void>;
  // 15-day daily data
  dailyTrendPoints: DailyTrendPoint[];
  dailyPulseData: number[];
  articlesByDay: DayGroup[];
  dailyTrendDirection: 'up' | 'down' | 'steady';
  // Google Trends reais
  googleTrendsData: TrendDataPoint[];
  isTrendsLoading: boolean;
}

export const usePulseMonitor = (): UsePulseMonitorReturn => {
  const { activeWorkspace } = useWorkspace();
  const watchwords = activeWorkspace?.watchwords || [];
  const region = activeWorkspace?.region || activeWorkspace?.state || 'Brasil';

  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  const { news, loading: isNewsLoading, refetch: refetchNews } = useNews({
    region,
    watchwords,
    limit: 0, // sem truncar — deduplicação feita no service
    autoFetch: true
  });

  // Dados reais do Google Trends para todos os watchwords
  const { mergedData: googleTrendsData, loading: isTrendsLoading } = useMultiTermTrends(
    watchwords,
    region
  );

  const { analyze, results: sentimentResults, loadingTerms } = useSentiment();
  const sentimentTriggeredRef = useRef<string>('');

  // Tag articles with matching terms (agora também checa description)
  const taggedArticles = useMemo(() => {
    if (news.length === 0 || watchwords.length === 0) return [];
    return tagArticlesWithTerms(news, watchwords);
  }, [news, watchwords]);

  // Breaking news: artigos publicados há menos de 2 horas
  const breakingNews = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return taggedArticles.filter(a => {
      if (!a.pubDate) return false;
      const pubTime = new Date(a.pubDate).getTime();
      return !isNaN(pubTime) && pubTime > twoHoursAgo;
    });
  }, [taggedArticles]);

  // Compute metrics per term
  const metrics = useMemo((): Record<string, TermMetrics> => {
    const result: Record<string, TermMetrics> = {};

    for (const term of watchwords) {
      const termArticles = taggedArticles.filter(a => a.matchedTerms.includes(term));
      const timeDistribution = computeTimeDistribution(taggedArticles, term);

      result[term] = {
        term,
        mentions: termArticles.length,
        sentiment: sentimentResults[term] || null,
        sentimentLoading: loadingTerms.has(term),
        articles: termArticles,
        timeDistribution
      };
    }

    return result;
  }, [watchwords, taggedArticles, sentimentResults, loadingTerms]);

  // Trigger sentiment analysis for each term when articles change
  useEffect(() => {
    if (taggedArticles.length === 0 || watchwords.length === 0) return;

    const articlesKey = taggedArticles.map(a => a.title).join('|').slice(0, 200);
    if (sentimentTriggeredRef.current === articlesKey) return;
    sentimentTriggeredRef.current = articlesKey;

    for (const term of watchwords) {
      const termArticles = taggedArticles.filter(a => a.matchedTerms.includes(term));
      if (termArticles.length > 0) {
        const titles = termArticles.map(a => a.title);
        analyze(term, titles);
      }
    }
  }, [taggedArticles, watchwords, analyze]);

  // Build waveform: combina dados do Google Trends reais com contagem de artigos
  const { pulseData, trendPoints } = useMemo(() => {
    const source = activeTerm
      ? taggedArticles.filter(a => a.matchedTerms.includes(activeTerm))
      : taggedArticles;

    const articlePoints = buildTrendFromArticles(source);

    // Se temos dados reais do Google Trends, usar como overlay para o pulso
    // O waveform de 24h vem dos artigos; os trends reais enriquecem a visão diária
    return {
      pulseData: articlePoints.map(p => p.value),
      trendPoints: articlePoints
    };
  }, [taggedArticles, activeTerm]);

  // Filtered articles based on active term
  const filteredArticles = useMemo(() => {
    if (!activeTerm) return taggedArticles;
    return taggedArticles.filter(a => a.matchedTerms.includes(activeTerm));
  }, [taggedArticles, activeTerm]);

  // Global metrics
  const globalMetrics = useMemo(() => {
    const totalMentions = taggedArticles.reduce(
      (sum, a) => sum + a.matchedTerms.length, 0
    );

    const sentimentScores = Object.values(sentimentResults)
      .map(s => s.score)
      .filter(s => typeof s === 'number');
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : null;

    let hottestTerm: string | null = null;
    let maxMentions = 0;
    for (const term of watchwords) {
      const count = metrics[term]?.mentions || 0;
      if (count > maxMentions) {
        maxMentions = count;
        hottestTerm = term;
      }
    }

    const allValues = pulseData;
    const overallTrend = computeTrendDirection(allValues);

    return { totalMentions, avgSentiment, hottestTerm, overallTrend };
  }, [taggedArticles, sentimentResults, watchwords, metrics, pulseData]);

  // 15-day daily waveform
  // Se temos dados reais do Google Trends, usa eles para enriquecer a visão diária
  const { dailyPulseData, dailyTrendPoints } = useMemo(() => {
    const source = activeTerm
      ? taggedArticles.filter(a => a.matchedTerms.includes(activeTerm))
      : taggedArticles;

    const articlePoints = buildDailyTrendFromArticles(source);

    // Enriquecer com dados reais do Google Trends quando disponíveis
    if (googleTrendsData.length > 0) {
      const trendsMap = new Map(googleTrendsData.map(p => [p.date, p.relativeInterest]));
      const enriched = articlePoints.map(point => {
        const googleInterest = trendsMap.get(point.date);
        if (googleInterest !== undefined) {
          // Combinar: média ponderada entre contagem de artigos (40%) e Google Trends (60%)
          const combined = Math.round(point.value * 0.4 + googleInterest * 0.6);
          return { ...point, value: combined };
        }
        return point;
      });
      return { dailyPulseData: enriched.map(p => p.value), dailyTrendPoints: enriched };
    }

    return { dailyPulseData: articlePoints.map(p => p.value), dailyTrendPoints: articlePoints };
  }, [taggedArticles, activeTerm, googleTrendsData]);

  // Articles grouped by day (most recent first)
  const articlesByDay = useMemo(() => {
    const source = activeTerm
      ? taggedArticles.filter(a => a.matchedTerms.includes(activeTerm))
      : taggedArticles;
    return groupArticlesByDay(source);
  }, [taggedArticles, activeTerm]);

  // 15-day trend direction
  const dailyTrendDirection = useMemo(
    () => computeTrendDirection(dailyPulseData),
    [dailyPulseData]
  );

  const refresh = useCallback(async () => {
    sentimentTriggeredRef.current = '';
    clearNewsCache();
    await refetchNews();
  }, [refetchNews]);

  return {
    terms: watchwords,
    activeTerm,
    setActiveTerm,
    metrics,
    globalMetrics,
    filteredArticles,
    allArticles: taggedArticles,
    breakingNews,
    pulseData,
    trendPoints,
    isLoading: isNewsLoading,
    isNewsLoading,
    refresh,
    dailyTrendPoints,
    dailyPulseData,
    articlesByDay,
    dailyTrendDirection,
    googleTrendsData,
    isTrendsLoading,
  };
};
