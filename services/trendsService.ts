
/**
 * Trends Service - Politika
 * Computes trend metrics from real tagged news articles.
 */

import type { TaggedNewsArticle } from '../types';

export interface TrendPoint {
    time: string;
    value: number;
}

export interface RegionalTrend {
    municipality: string;
    mood: string;
    intensity: number;
    trend: 'up' | 'down' | 'steady';
}

/**
 * Builds hourly trend points from tagged articles.
 * Returns 24 data points (0h-23h) with mention count as value.
 * If no articles have parseable dates, returns a flat baseline.
 */
export const buildTrendFromArticles = (articles: TaggedNewsArticle[]): TrendPoint[] => {
    const hourly = new Array(24).fill(0);

    for (const article of articles) {
        if (!article.pubDate) continue;
        const date = new Date(article.pubDate);
        if (!isNaN(date.getTime())) {
            hourly[date.getHours()]++;
        }
    }

    const maxVal = Math.max(...hourly, 1);

    return hourly.map((count, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        value: Math.round((count / maxVal) * 100)
    }));
};

/**
 * Computes a trend direction by comparing recent vs earlier halves.
 */
export const computeTrendDirection = (values: number[]): 'up' | 'down' | 'steady' => {
    if (values.length < 2) return 'steady';
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
    const diff = secondHalf - firstHalf;
    if (diff > 0.1 * Math.max(firstHalf, 1)) return 'up';
    if (diff < -0.1 * Math.max(firstHalf, 1)) return 'down';
    return 'steady';
};
