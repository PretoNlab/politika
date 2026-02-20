import { useState, useCallback, useRef } from 'react';
import { analyzeSentiment } from '../services/geminiClient';
import { useRateLimit } from './useRateLimit';
import { RATE_LIMITS, STORAGE_KEYS, CACHE_TTL } from '../constants';
import type { SentimentResult } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Generates a simple hash of article titles for cache key.
 */
function hashTitles(titles: string[]): string {
  const str = titles.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

interface CachedSentiment {
  result: SentimentResult;
  timestamp: number;
}

function getCachedSentiment(term: string, articlesHash: string): SentimentResult | null {
  try {
    const key = STORAGE_KEYS.pulseCache(term, articlesHash);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached: CachedSentiment = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL.sentiment) {
      localStorage.removeItem(key);
      return null;
    }
    return cached.result;
  } catch {
    return null;
  }
}

function setCachedSentiment(term: string, articlesHash: string, result: SentimentResult): void {
  try {
    const key = STORAGE_KEYS.pulseCache(term, articlesHash);
    const cached: CachedSentiment = { result, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

interface UseSentimentReturn {
  analyze: (term: string, articleTitles: string[]) => Promise<SentimentResult | null>;
  results: Record<string, SentimentResult>;
  loadingTerms: Set<string>;
}

export const useSentiment = (): UseSentimentReturn => {
  const [results, setResults] = useState<Record<string, SentimentResult>>({});
  const [loadingTerms, setLoadingTerms] = useState<Set<string>>(new Set());
  const checkRateLimit = useRateLimit({
    ...RATE_LIMITS.sentimentAnalysis,
    errorMessage: 'Muitas análises de sentimento em pouco tempo.'
  });
  const inFlightRef = useRef<Set<string>>(new Set());
  const { activeWorkspace } = useWorkspace();

  const workspaceContext = activeWorkspace ? {
    state: activeWorkspace.state,
    region: activeWorkspace.region,
    customContext: activeWorkspace.customContext,
  } : undefined;

  const analyze = useCallback(async (
    term: string,
    articleTitles: string[]
  ): Promise<SentimentResult | null> => {
    if (!term || articleTitles.length === 0) return null;

    const articlesHash = hashTitles(articleTitles);

    // Check cache first
    const cached = getCachedSentiment(term, articlesHash);
    if (cached) {
      setResults(prev => ({ ...prev, [term]: cached }));
      return cached;
    }

    // Prevent duplicate in-flight requests
    const flightKey = `${term}:${articlesHash}`;
    if (inFlightRef.current.has(flightKey)) return null;

    if (!checkRateLimit()) return null;

    inFlightRef.current.add(flightKey);
    setLoadingTerms(prev => new Set(prev).add(term));

    try {
      const result = await analyzeSentiment(term, articleTitles, workspaceContext) as SentimentResult;
      setCachedSentiment(term, articlesHash, result);
      setResults(prev => ({ ...prev, [term]: result }));
      return result;
    } catch (err) {
      console.error(`Sentiment analysis failed for "${term}":`, err);
      return null;
    } finally {
      inFlightRef.current.delete(flightKey);
      setLoadingTerms(prev => {
        const next = new Set(prev);
        next.delete(term);
        return next;
      });
    }
  }, [checkRateLimit]);

  return { analyze, results, loadingTerms };
};
