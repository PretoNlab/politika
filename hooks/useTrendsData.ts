import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TrendDataPoint } from '../api/trends';

/**
 * Re-export do tipo para uso no frontend sem importar o módulo server-side.
 */
export type { TrendDataPoint };

interface UseTrendsDataOptions {
    term: string;
    region?: string;
    enabled?: boolean;
}

interface UseTrendsDataReturn {
    data: TrendDataPoint[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const TRENDS_CACHE_KEY_PREFIX = 'politika_trends_cache_';
const TRENDS_CACHE_DURATION = 60 * 60 * 1000; // 1h (Trends muda menos que notícias)

const TRENDS_API_URL = import.meta.env.PROD
    ? '/api/trends'
    : 'http://localhost:3000/api/trends';

/**
 * Hook para buscar dados reais do Google Trends por termo.
 *
 * @example
 * const { data, loading } = useTrendsData({ term: 'João Silva', region: 'Bahia' });
 */
export const useTrendsData = (options: UseTrendsDataOptions): UseTrendsDataReturn => {
    const { term, region = 'Brasil', enabled = true } = options;

    const [data, setData] = useState<TrendDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTrends = useCallback(async () => {
        if (!term || !enabled) return;

        const cacheKey = `${TRENDS_CACHE_KEY_PREFIX}${term}_${region}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { data: cachedData, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < TRENDS_CACHE_DURATION) {
                    setData(cachedData);
                    return;
                }
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(TRENDS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term, region }),
            });

            if (!response.ok) {
                throw new Error(`Trends API returned ${response.status}`);
            }

            const result = await response.json();
            if (!result.success || !result.data) {
                throw new Error('Invalid trends response');
            }

            const trendData: TrendDataPoint[] = result.data;
            setData(trendData);

            // Cache local
            localStorage.setItem(cacheKey, JSON.stringify({
                data: trendData,
                timestamp: Date.now(),
            }));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao carregar trends';
            setError(msg);
            console.warn(`useTrendsData: ${msg}`, err);
        } finally {
            setLoading(false);
        }
    }, [term, region, enabled]);

    useEffect(() => {
        fetchTrends();
    }, [fetchTrends]);

    return { data, loading, error, refetch: fetchTrends };
};

/**
 * Hook agregado: busca trends para múltiplos termos.
 * Retorna os dados mesclados (maior interesse relativo por dia).
 */
export const useMultiTermTrends = (
    terms: string[],
    region: string = 'Brasil'
): { mergedData: TrendDataPoint[]; loading: boolean } => {
    const [results, setResults] = useState<Record<string, TrendDataPoint[]>>({});
    const [loadingTerms, setLoadingTerms] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (terms.length === 0) return;

        terms.forEach(async term => {
            if (results[term]) return; // já carregado

            setLoadingTerms(prev => new Set(prev).add(term));

            const cacheKey = `${TRENDS_CACHE_KEY_PREFIX}${term}_${region}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const { data: cachedData, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < TRENDS_CACHE_DURATION) {
                        setResults(prev => ({ ...prev, [term]: cachedData }));
                        setLoadingTerms(prev => { const s = new Set(prev); s.delete(term); return s; });
                        return;
                    }
                } catch { /* ignore */ }
            }

            try {
                const response = await fetch(TRENDS_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ term, region }),
                });
                const result = await response.json();
                if (result.success && result.data) {
                    setResults(prev => ({ ...prev, [term]: result.data }));
                    localStorage.setItem(cacheKey, JSON.stringify({ data: result.data, timestamp: Date.now() }));
                }
            } catch (err) {
                console.warn(`useMultiTermTrends: failed for "${term}"`, err);
            } finally {
                setLoadingTerms(prev => { const s = new Set(prev); s.delete(term); return s; });
            }
        });
    }, [terms.join(','), region]);

    // Mesclar: para cada dia, pegar o maior interest entre todos os termos
    const mergedData = useMemo<TrendDataPoint[]>(() => {
        const allArrays = Object.values(results);
        if (allArrays.length === 0) return [];

        const byDate: Record<string, TrendDataPoint> = {};
        for (const termData of allArrays) {
            for (const point of termData) {
                if (!byDate[point.date] || point.relativeInterest > byDate[point.date].relativeInterest) {
                    byDate[point.date] = point;
                }
            }
        }

        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }, [results]);

    return { mergedData, loading: loadingTerms.size > 0 };
};
