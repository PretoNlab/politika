import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useNews } from './useNews';
import { useSentiment } from './useSentiment';
import { tagArticlesWithTerms, computeTimeDistribution } from '../services/newsService';
import { buildTrendFromArticles, computeTrendDirection } from '../services/trendsService';
import type { TaggedNewsArticle, TermMetrics, SentimentResult } from '../types';
import type { TrendPoint } from '../services/trendsService';

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
  pulseData: number[];
  trendPoints: TrendPoint[];
  isLoading: boolean;
  isNewsLoading: boolean;
  refresh: () => Promise<void>;
}

export const usePulseMonitor = (): UsePulseMonitorReturn => {
  const { activeWorkspace } = useWorkspace();
  const watchwords = activeWorkspace?.watchwords || [];
  const region = activeWorkspace?.region;

  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  const { news, loading: isNewsLoading, refetch: refetchNews } = useNews({
    region,
    watchwords,
    limit: 20,
    autoFetch: true
  });

  const { analyze, results: sentimentResults, loadingTerms } = useSentiment();
  const sentimentTriggeredRef = useRef<string>('');

  // Tag articles with matching terms
  const taggedArticles = useMemo(() => {
    if (news.length === 0 || watchwords.length === 0) return [];
    return tagArticlesWithTerms(news, watchwords);
  }, [news, watchwords]);

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

  // Build waveform from active term or all articles
  const { pulseData, trendPoints } = useMemo(() => {
    const source = activeTerm
      ? taggedArticles.filter(a => a.matchedTerms.includes(activeTerm))
      : taggedArticles;

    const points = buildTrendFromArticles(source);
    return {
      pulseData: points.map(p => p.value),
      trendPoints: points
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

  const refresh = useCallback(async () => {
    sentimentTriggeredRef.current = '';
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
    pulseData,
    trendPoints,
    isLoading: isNewsLoading,
    isNewsLoading,
    refresh
  };
};
