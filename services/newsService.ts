
/**
 * News Service - Politika
 * Handles real-time news ingestion via Google News RSS
 *
 * Pipeline: backend proxy (primário) → CORS proxies (fallback) → cache 30min
 *
 * v2 melhorias:
 * - Cache reduzido de 2h → 30min (dados mais frescos)
 * - Campo description (snippet) incluído
 * - Breaking news detection (< 2h)
 * - Ranking por relevância (termo no título = prioridade)
 * - Deduplicação por link + título
 */

import type { TaggedNewsArticle } from '../types';
import { supabase } from '../lib/supabase';

export interface NewsArticle {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description?: string;
    isBreaking?: boolean;
    relevanceScore?: number;
}

const CACHE_KEY_PREFIX = 'politika_news_cache_v2_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos (era 2h)
const MAX_ARTICLES_PER_TERM = 50;       // era 25
const BREAKING_NEWS_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas

const NEWS_API_URL = '/api/news';

const CORS_PROXIES = [
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Busca notícias de um termo via backend proxy (sem CORS).
 */
async function fetchViaBackend(region: string, term: string): Promise<NewsArticle[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(NEWS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ region, term }),
    });

    if (!response.ok) {
        throw new Error(`Backend news API returned ${response.status}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
        throw new Error('Invalid backend response');
    }

    return result.data;
}

/**
 * Fallback: busca RSS via CORS proxy público.
 */
async function fetchViaCORSProxy(region: string, term: string): Promise<NewsArticle[]> {
    // Query enriquecida igual ao backend
    const electoralContext = 'eleição política candidato';
    const queryStr = `"${term}" ${electoralContext} ${region}`;
    const query = encodeURIComponent(queryStr);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    for (const makeProxy of CORS_PROXIES) {
        try {
            const response = await fetch(makeProxy(rssUrl));
            if (!response.ok) continue;
            const json = await response.json();
            const data = json.contents ?? json;
            if (!data) continue;

            const xmlStr = typeof data === 'string' ? data : JSON.stringify(data);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
            const items = Array.from(xmlDoc.querySelectorAll("item"));
            const currentYear = new Date().getFullYear().toString();

            return items
                .map(item => ({
                    title: item.querySelector("title")?.textContent || '',
                    link: item.querySelector("link")?.textContent || '',
                    pubDate: item.querySelector("pubDate")?.textContent || '',
                    source: item.querySelector("source")?.textContent || 'Google News',
                    description: item.querySelector("description")?.textContent
                        ?.replace(/<[^>]+>/g, '')
                        .trim()
                        .slice(0, 300) || '',
                }))
                .filter(a => a.pubDate.includes(currentYear) && a.title.length > 0)
                .slice(0, MAX_ARTICLES_PER_TERM);
        } catch {
            continue;
        }
    }

    return [];
}

/**
 * Calcula o score de relevância de um artigo para um termo.
 * - Título contém o termo: +3
 * - Descrição contém o termo: +1
 * - Artigo mais recente: +1 (últimas 6h)
 * - Breaking news (< 2h): +2
 */
function computeRelevanceScore(article: NewsArticle, term: string): number {
    const titleLower = article.title.toLowerCase();
    const termLower = term.toLowerCase();
    const descLower = (article.description || '').toLowerCase();

    let score = 0;

    if (titleLower.includes(termLower)) score += 3;
    if (descLower.includes(termLower)) score += 1;

    if (article.pubDate) {
        const pubTime = new Date(article.pubDate).getTime();
        const now = Date.now();
        const ageMs = now - pubTime;

        if (ageMs < BREAKING_NEWS_THRESHOLD_MS) {
            score += 2; // Breaking
        } else if (ageMs < 6 * 60 * 60 * 1000) {
            score += 1; // Recente (< 6h)
        }
    }

    return score;
}

/**
 * Enriquece artigos com isBreaking e relevanceScore.
 */
function enrichArticles(articles: NewsArticle[], term: string): NewsArticle[] {
    const now = Date.now();
    return articles.map(article => {
        const pubTime = article.pubDate ? new Date(article.pubDate).getTime() : 0;
        const ageMs = pubTime ? now - pubTime : Infinity;
        return {
            ...article,
            isBreaking: ageMs < BREAKING_NEWS_THRESHOLD_MS,
            relevanceScore: computeRelevanceScore(article, term),
        };
    });
}

/**
 * Busca notícias por termo com cache.
 * Tenta backend primeiro, fallback pra CORS proxies.
 */
async function fetchNewsForTerm(region: string, term: string): Promise<NewsArticle[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${region}_${term}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        try {
            const { articles, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return articles;
            }
        } catch {
            localStorage.removeItem(cacheKey);
        }
    }

    let articles: NewsArticle[] = [];

    // Tenta backend (sem CORS)
    try {
        articles = await fetchViaBackend(region, term);
    } catch (err) {
        console.warn(`Backend news failed for "${term}", trying CORS proxies:`, err);
        articles = await fetchViaCORSProxy(region, term);
    }

    // Enriquecer com isBreaking e relevanceScore
    const enriched = enrichArticles(articles, term);

    if (enriched.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({
            articles: enriched,
            timestamp: Date.now()
        }));
    }

    return enriched;
}

/**
 * Deduplica artigos por link (primário) e título (secundário).
 */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seenLinks = new Set<string>();
    const seenTitles = new Set<string>();
    return articles.filter(article => {
        const linkKey = article.link.toLowerCase().trim();
        const titleKey = article.title.toLowerCase().trim();

        if (linkKey && seenLinks.has(linkKey)) return false;
        if (seenTitles.has(titleKey)) return false;

        if (linkKey) seenLinks.add(linkKey);
        seenTitles.add(titleKey);
        return true;
    });
}

/**
 * Fetches Google News para todos os watchwords em paralelo.
 * Backend como fonte primária, CORS proxies como fallback.
 * Artigos ordenados por relevanceScore desc, depois por data.
 */
export const fetchGoogleNews = async (region: string, watchwords: string[]): Promise<NewsArticle[]> => {
    if (watchwords.length === 0) return [];
    const safeRegion = region?.trim() || 'Brasil';

    try {
        const results = await Promise.allSettled(
            watchwords.map(term => fetchNewsForTerm(safeRegion, term))
        );

        const allArticles: NewsArticle[] = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                allArticles.push(...result.value);
            }
        }

        const unique = deduplicateArticles(allArticles);

        // Ordenar: breaking news primeiro, depois por relevanceScore, depois por data
        unique.sort((a, b) => {
            // Breaking news primeiro
            if (a.isBreaking && !b.isBreaking) return -1;
            if (!a.isBreaking && b.isBreaking) return 1;

            // Depois por relevanceScore (maior = mais relevante)
            const scoreA = a.relevanceScore ?? 0;
            const scoreB = b.relevanceScore ?? 0;
            if (scoreB !== scoreA) return scoreB - scoreA;

            // Por último, por data
            const dateA = new Date(a.pubDate).getTime();
            const dateB = new Date(b.pubDate).getTime();
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });

        return unique;
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
};

/**
 * Tags each article with the watchwords it mentions (case-insensitive).
 */
export const tagArticlesWithTerms = (
    articles: NewsArticle[],
    watchwords: string[]
): TaggedNewsArticle[] => {
    return articles.map(article => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || '').toLowerCase();
        const matchedTerms = watchwords.filter(term =>
            titleLower.includes(term.toLowerCase()) ||
            descLower.includes(term.toLowerCase())
        );
        return {
            ...article,
            matchedTerms,
        };
    });
};

/**
 * Computes hourly distribution of mentions for a given term.
 */
export const computeTimeDistribution = (
    articles: TaggedNewsArticle[],
    term: string
): number[] => {
    const distribution = new Array(24).fill(0);

    const relevant = term
        ? articles.filter(a => a.matchedTerms.includes(term))
        : articles;

    for (const article of relevant) {
        if (!article.pubDate) continue;
        const date = new Date(article.pubDate);
        if (!isNaN(date.getTime())) {
            const hour = date.getHours();
            distribution[hour]++;
        }
    }

    return distribution;
};
