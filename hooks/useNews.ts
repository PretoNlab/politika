import { useState, useEffect, useMemo } from 'react';
import { fetchGoogleNews, NewsArticle } from '../services/newsService';

interface UseNewsOptions {
  region?: string;
  watchwords?: string[];
  limit?: number;
  autoFetch?: boolean;
}

interface UseNewsReturn {
  news: NewsArticle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar notícias do Google News
 *
 * @param options - Configurações de busca
 * @returns Estado das notícias, loading e função de refetch
 *
 * @example
 * const { news, loading, refetch } = useNews({
 *   region: 'Bahia',
 *   watchwords: ['eleições', 'política'],
 *   limit: 5
 * });
 */
export const useNews = (options: UseNewsOptions = {}): UseNewsReturn => {
  const {
    region,
    watchwords = [],
    limit = 10,
    autoFetch = true
  } = options;

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable key for watchwords to avoid infinite re-renders
  const watchwordsKey = useMemo(() => watchwords.join(','), [watchwords]);

  const fetchNews = async () => {
    if (!region) {
      setNews([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGoogleNews(region, watchwords);
      setNews(data.slice(0, limit));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notícias';
      setError(errorMessage);
      console.error('useNews error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && region) {
      fetchNews();
    }
  }, [region, watchwordsKey, limit, autoFetch]);

  return {
    news,
    loading,
    error,
    refetch: fetchNews
  };
};
