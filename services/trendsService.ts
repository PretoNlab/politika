
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

// ============================================
// 15-Day Daily Distribution
// ============================================

export interface DailyTrendPoint {
    date: string;       // ISO date "2026-02-11"
    label: string;      // "Hoje", "Ontem", "9 fev", etc.
    dayIndex: number;   // 0 = oldest, 14 = today
    count: number;      // Raw article count
    value: number;      // Normalized 0-100%
}

export interface DayGroup {
    date: string;
    label: string;
    articles: TaggedNewsArticle[];
}

/**
 * Builds daily trend points from tagged articles over N days.
 * Returns array from oldest (index 0) to today (index days-1).
 */
export const buildDailyTrendFromArticles = (
    articles: TaggedNewsArticle[],
    days: number = 15
): DailyTrendPoint[] => {
    const now = new Date();
    const slots: DailyTrendPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];

        let label: string;
        if (i === 0) label = 'Hoje';
        else if (i === 1) label = 'Ontem';
        else label = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

        slots.push({ date: isoDate, label, dayIndex: days - 1 - i, count: 0, value: 0 });
    }

    for (const article of articles) {
        if (!article.pubDate) continue;
        const articleDate = new Date(article.pubDate);
        if (isNaN(articleDate.getTime())) continue;
        const articleIso = articleDate.toISOString().split('T')[0];
        const slot = slots.find(s => s.date === articleIso);
        if (slot) slot.count++;
    }

    const maxCount = Math.max(...slots.map(s => s.count), 1);
    for (const slot of slots) {
        slot.value = Math.round((slot.count / maxCount) * 100);
    }

    return slots;
};

/**
 * Groups articles by day, most recent first.
 * Only returns days that have at least one article.
 */
export const groupArticlesByDay = (
    articles: TaggedNewsArticle[],
    days: number = 15
): DayGroup[] => {
    const now = new Date();
    const groups: DayGroup[] = [];

    for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];

        let label: string;
        if (i === 0) label = 'Hoje';
        else if (i === 1) label = 'Ontem';
        else label = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

        groups.push({ date: isoDate, label, articles: [] });
    }

    for (const article of articles) {
        if (!article.pubDate) continue;
        const articleDate = new Date(article.pubDate);
        if (isNaN(articleDate.getTime())) continue;
        const articleIso = articleDate.toISOString().split('T')[0];
        const group = groups.find(g => g.date === articleIso);
        if (group) group.articles.push(article);
    }

    return groups.filter(g => g.articles.length > 0);
};
