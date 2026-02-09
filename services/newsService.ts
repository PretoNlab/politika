
/**
 * News Service - Politika
 * Handles real-time news ingestion via Google News RSS
 */

import type { TaggedNewsArticle } from '../types';

export interface NewsArticle {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}


const CACHE_KEY_PREFIX = 'politika_news_cache_';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Fetches and parses Google News RSS feed based on workspace context.
 * Implements 2026 filtering and 12-hour caching (Updates 2x a day).
 */
export const fetchGoogleNews = async (region: string, watchwords: string[]): Promise<NewsArticle[]> => {
    const cacheKey = `${CACHE_KEY_PREFIX}${region}_${watchwords.join('_')}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const { articles, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
            console.log("Returning cached news (Updated 2x a day policy)");
            return articles;
        }
    }

    try {
        const query = encodeURIComponent(`${region} ${watchwords.join(' OR ')}`);
        const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-150`;

        const proxies = [
            (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        ];

        let data: any = null;

        for (const makeProxy of proxies) {
            try {
                const response = await fetch(makeProxy(rssUrl));
                if (!response.ok) continue;
                const json = await response.json();
                // allorigins wraps in { contents: ... }, codetabs returns raw
                data = json.contents ?? json;
                if (data) break;
            } catch {
                continue;
            }
        }

        if (!data) {
            throw new Error('All CORS proxies failed');
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(typeof data === 'string' ? data : JSON.stringify(data), "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item"));

        const currentYear = new Date().getFullYear().toString(); // "2026" based on current system time

        const filteredArticles = items
            .map(item => ({
                title: item.querySelector("title")?.textContent || '',
                link: item.querySelector("link")?.textContent || '',
                pubDate: item.querySelector("pubDate")?.textContent || '',
                source: item.querySelector("source")?.textContent || 'Google News'
            }))
            .filter(article => {
                // Ensuring the article is from the current year (2026)
                return article.pubDate.includes(currentYear);
            })
            .slice(0, 10);

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
            articles: filteredArticles,
            timestamp: Date.now()
        }));

        return filteredArticles;
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
 * Returns 24-slot array (0-23h). Slots without data get 0.
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
