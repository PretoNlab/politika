import { useState, useEffect, useCallback, useRef } from 'react';
import { searchCandidates } from '../services/tseService';
import type { TseElectionResult } from '../types';

interface UseTSECandidateSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: TseElectionResult[];
  isLoading: boolean;
  error: string | null;
  clear: () => void;
}

export const useTSECandidateSearch = (state?: string): UseTSECandidateSearchReturn => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TseElectionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const doSearch = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchCandidates(q, state);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar candidatos');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      doSearch(query);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, isLoading, error, clear };
};
