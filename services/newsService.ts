
/**
 * News Service - Politika
 * Handles real-time news ingestion via Google News RSS
 *
 * Pipeline: backend proxy (primário) → CORS proxies (fallback) → cache 2h
 */

import type { TaggedNewsArticle } from '../types';
import { supabase } from '../lib/supabase';

export interface NewsArticle {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}

const CACHE_KEY_PREFIX = 'politika_news_cache_';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas
const MAX_ARTICLES_PER_TERM = 15;

const NEWS_API_URL = import.meta.env.PROD
    ? '/api/news'
    : 'http://localhost:3000/api/news';

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
    const query = encodeURIComponent(`${term} ${region}`);
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
                    source: item.querySelector("source")?.textContent || 'Google News'
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
        // Fallback pra CORS proxies
        articles = await fetchViaCORSProxy(region, term);
    }

    if (articles.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({
            articles,
            timestamp: Date.now()
        }));
    }

    return articles;
}

/**
 * Deduplica artigos por título normalizado.
 */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
        const key = article.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Fetches Google News para todos os watchwords em paralelo.
 * Backend como fonte primária, CORS proxies como fallback.
 */
export const fetchGoogleNews = async (region: string, watchwords: string[]): Promise<NewsArticle[]> => {
    if (!region || watchwords.length === 0) return [];

    try {
        const results = await Promise.allSettled(
            watchwords.map(term => fetchNewsForTerm(region, term))
        );

        const allArticles: NewsArticle[] = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                allArticles.push(...result.value);
            }
        }

        const unique = deduplicateArticles(allArticles);
        unique.sort((a, b) => {
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
        const matchedTerms = watchwords.filter(term =>
            titleLower.includes(term.toLowerCase())
        );
        return { ...article, matchedTerms };
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
