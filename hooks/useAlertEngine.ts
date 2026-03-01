import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import type {
    PolitikaAlert,
    AlertAction,
    AlertCategory,
    AlertSeverity,
    SentimentHistory,
    TaggedNewsArticle,
    TermMetrics
} from '../types';
import { useAnalytics } from './useAnalytics';

// Storage keys
const STORAGE_KEYS = {
    alerts: 'politika_alerts',
    sentimentHistory: 'politika_sentiment_history'
};

// Thresholds for alert generation
const THRESHOLDS = {
    sentimentDropDanger: -0.20,    // -20% = danger
    sentimentDropWarning: -0.10,  // -10% = warning
    sentimentRiseOpportunity: 0.15, // +15% = opportunity
    trendingMultiplier: 2.0,       // 2x average = trending
    minMentionsForAlert: 2         // minimum mentions to trigger
};

// Alert TTL (24 hours)
const ALERT_TTL_MS = 24 * 60 * 60 * 1000;

interface UseAlertEngineProps {
    metrics: Record<string, TermMetrics>;
    globalMetrics: {
        totalMentions: number;
        avgSentiment: number | null;
        hottestTerm: string | null;
        overallTrend: 'up' | 'down' | 'steady';
    };
    allArticles: TaggedNewsArticle[];
    isLoading: boolean;
}

interface UseAlertEngineReturn {
    alerts: PolitikaAlert[];
    unreadCount: number;
    markAsRead: (alertId: string) => void;
    markAsActioned: (alertId: string) => void;
    dismissAlert: (alertId: string) => void;
    clearAllAlerts: () => void;
}

/**
 * Alert Engine Hook
 * Monitors sentiment changes and generates actionable alerts
 */
export const useAlertEngine = ({
    metrics,
    globalMetrics,
    allArticles,
    isLoading
}: UseAlertEngineProps): UseAlertEngineReturn => {
    const { track } = useAnalytics();
    const [alerts, setAlerts] = useState<PolitikaAlert[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.alerts);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Filter out expired alerts
                const now = Date.now();
                return parsed.filter((a: PolitikaAlert) =>
                    now - new Date(a.createdAt).getTime() < ALERT_TTL_MS
                );
            }
        } catch {
            // Ignore parse errors
        }
        return [];
    });

    const processedRef = useRef<Set<string>>(new Set());
    const lastMetricsRef = useRef<string>('');

    // Persist alerts to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
    }, [alerts]);

    // Get sentiment history for a term
    const getSentimentHistory = useCallback((term: string): SentimentHistory | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.sentimentHistory);
            if (stored) {
                const history: Record<string, SentimentHistory> = JSON.parse(stored);
                return history[term] || null;
            }
        } catch {
            // Ignore
        }
        return null;
    }, []);

    // Save sentiment to history
    const saveSentimentHistory = useCallback((term: string, score: number) => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.sentimentHistory);
            const history: Record<string, SentimentHistory> = stored ? JSON.parse(stored) : {};
            history[term] = {
                term,
                score,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.sentimentHistory, JSON.stringify(history));
        } catch {
            // Ignore
        }
    }, []);

    // Generate suggested actions based on alert category
    const generateActions = useCallback((
        category: AlertCategory,
        term: string
    ): AlertAction[] => {
        const baseActions: AlertAction[] = [];

        switch (category) {
            case 'sentiment_drop':
                baseActions.push(
                    { id: 'analyze', label: '🔍 Analisar', type: 'analyze', route: '/analyze' },
                    { id: 'respond', label: '💬 Gerar Resposta', type: 'respond', payload: { term } },
                    { id: 'crisis', label: '🚨 War Room', type: 'analyze', route: '/crisis' }
                );
                break;
            case 'opportunity_detected':
            case 'sentiment_rise':
                baseActions.push(
                    { id: 'content', label: '✍️ Gerar Post', type: 'generate_content', payload: { term } },
                    { id: 'context', label: '📊 Ver Contexto', type: 'analyze', route: '/' }
                );
                break;
            case 'trending_topic':
                baseActions.push(
                    { id: 'analyze', label: '🔍 Analisar', type: 'analyze', route: '/' },
                    { id: 'content', label: '✍️ Capitalizar', type: 'generate_content', payload: { term } }
                );
                break;
            case 'crisis_detected':
                baseActions.push(
                    { id: 'crisis', label: '🚨 War Room', type: 'analyze', route: '/crisis' },
                    { id: 'respond', label: '💬 Resposta Rápida', type: 'respond', payload: { term } }
                );
                break;
        }

        baseActions.push({ id: 'ignore', label: '❌ Ignorar', type: 'ignore' });
        return baseActions;
    }, []);

    // Determine severity based on category and delta
    const determineSeverity = useCallback((
        category: AlertCategory,
        delta?: number
    ): AlertSeverity => {
        if (category === 'crisis_detected') return 'danger';
        if (category === 'opportunity_detected' || category === 'sentiment_rise') return 'opportunity';

        if (category === 'sentiment_drop' && delta !== undefined) {
            if (delta <= THRESHOLDS.sentimentDropDanger) return 'danger';
            return 'warning';
        }

        if (category === 'trending_topic') return 'info';
        return 'warning';
    }, []);

    // Create alert object
    const createAlert = useCallback((
        category: AlertCategory,
        term: string,
        description: string,
        articles: TaggedNewsArticle[],
        delta?: number,
        previousScore?: number,
        currentScore?: number
    ): PolitikaAlert => {
        const titleMap: Record<AlertCategory, string> = {
            sentiment_drop: `"${term}" - Sentimento em queda`,
            sentiment_rise: `"${term}" - Sentimento em alta`,
            crisis_detected: `🚨 "${term}" - Crise detectada`,
            opportunity_detected: `📈 "${term}" - Oportunidade`,
            trending_topic: `🔥 "${term}" - Em alta`
        };

        return {
            id: `${category}-${term}-${Date.now()}`,
            category,
            severity: determineSeverity(category, delta),
            title: titleMap[category],
            description,
            term,
            sentimentDelta: delta,
            previousScore,
            currentScore,
            suggestedActions: generateActions(category, term),
            relatedArticles: articles.slice(0, 5),
            createdAt: new Date().toISOString(),
            isRead: false,
            isActioned: false
        };
    }, [determineSeverity, generateActions]);

    // Main detection logic
    useEffect(() => {
        if (isLoading) return;

        const metricsKey = JSON.stringify(Object.keys(metrics).map(k => ({
            term: k,
            mentions: metrics[k]?.mentions,
            score: metrics[k]?.sentiment?.score
        })));

        // Skip if metrics haven't changed
        if (metricsKey === lastMetricsRef.current) return;
        lastMetricsRef.current = metricsKey;

        const newAlerts: PolitikaAlert[] = [];
        const terms = Object.keys(metrics);

        for (const term of terms) {
            const termMetrics = metrics[term];
            if (!termMetrics || termMetrics.mentions < THRESHOLDS.minMentionsForAlert) continue;

            const currentScore = termMetrics.sentiment?.score;
            if (currentScore === null || currentScore === undefined) continue;

            // Check for sentiment changes
            const history = getSentimentHistory(term);

            if (history) {
                const delta = currentScore - history.score;
                const alertKey = `${term}-${Math.round(currentScore * 100)}`;

                // Only create new alerts for significant changes not already processed
                if (!processedRef.current.has(alertKey)) {
                    // Sentiment DROP
                    if (delta <= THRESHOLDS.sentimentDropWarning) {
                        const desc = delta <= THRESHOLDS.sentimentDropDanger
                            ? `Queda crítica de ${Math.abs(Math.round(delta * 100))}% no sentimento nas últimas horas.`
                            : `Sentimento caiu ${Math.abs(Math.round(delta * 100))}%. Requer atenção.`;

                        newAlerts.push(createAlert(
                            'sentiment_drop',
                            term,
                            desc,
                            termMetrics.articles,
                            delta,
                            history.score,
                            currentScore
                        ));
                        processedRef.current.add(alertKey);
                    }
                    // Sentiment RISE / Opportunity
                    else if (delta >= THRESHOLDS.sentimentRiseOpportunity) {
                        newAlerts.push(createAlert(
                            'opportunity_detected',
                            term,
                            `Sentimento subiu ${Math.round(delta * 100)}%! Bom momento para comunicar.`,
                            termMetrics.articles,
                            delta,
                            history.score,
                            currentScore
                        ));
                        processedRef.current.add(alertKey);
                    }
                }
            }

            // Save current sentiment to history for future comparisons
            saveSentimentHistory(term, currentScore);
        }

        // Check for trending topics (hottest term with high relative mentions)
        if (globalMetrics.hottestTerm && terms.length > 1) {
            const hottestMetrics = metrics[globalMetrics.hottestTerm];
            const avgMentions = globalMetrics.totalMentions / terms.length;

            if (hottestMetrics &&
                hottestMetrics.mentions >= avgMentions * THRESHOLDS.trendingMultiplier &&
                hottestMetrics.mentions >= 5) {
                const trendKey = `trending-${globalMetrics.hottestTerm}`;

                if (!processedRef.current.has(trendKey)) {
                    newAlerts.push(createAlert(
                        'trending_topic',
                        globalMetrics.hottestTerm,
                        `${hottestMetrics.mentions} menções - ${Math.round((hottestMetrics.mentions / avgMentions) * 100)}% acima da média.`,
                        hottestMetrics.articles
                    ));
                    processedRef.current.add(trendKey);
                }
            }
        }

        // Add new alerts if any
        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev]);
            newAlerts.forEach(alert => {
                track('alert_created', {
                    alert_id: alert.id,
                    alert_type: alert.category,
                    severity: alert.severity,
                    term: alert.term,
                });
            });

            // Lifecycle Signals: Trigger prominent toast notifications for new alerts
            newAlerts.forEach(alert => {
                const toastContent = `${alert.title}\n${alert.description}`;
                if (alert.severity === 'danger') {
                    toast.error(toastContent, {
                        duration: 8000,
                        icon: '🚨',
                        style: {
                            border: '1px solid #ef4444',
                            padding: '16px',
                            color: '#7f1d1d',
                            fontWeight: 'bold'
                        },
                    });
                } else if (alert.severity === 'opportunity') {
                    toast.success(toastContent, {
                        duration: 6000,
                        icon: '📈',
                        style: {
                            border: '1px solid #10b981',
                            padding: '16px',
                            color: '#064e3b',
                            fontWeight: 'bold'
                        },
                    });
                } else {
                    toast(alert.title, {
                        duration: 4000,
                        icon: 'ℹ️'
                    });
                }
            });
        }
    }, [metrics, globalMetrics, allArticles, isLoading, getSentimentHistory, saveSentimentHistory, createAlert, track]);

    // Count unread
    const unreadCount = alerts.filter(a => !a.isRead).length;

    // Actions
    const markAsRead = useCallback((alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, isRead: true } : a
        ));
    }, []);

    const markAsActioned = useCallback((alertId: string) => {
        const target = alerts.find(a => a.id === alertId);
        if (target) {
            track('alert_actioned', {
                alert_id: target.id,
                alert_type: target.category,
                severity: target.severity,
                term: target.term,
            });
        }
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, isActioned: true, isRead: true } : a
        ));
    }, [alerts, track]);

    const dismissAlert = useCallback((alertId: string) => {
        const target = alerts.find(a => a.id === alertId);
        if (target) {
            track('alert_dismissed', {
                alert_id: target.id,
                alert_type: target.category,
                severity: target.severity,
                term: target.term,
            });
        }
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, [alerts, track]);

    const clearAllAlerts = useCallback(() => {
        setAlerts([]);
        processedRef.current.clear();
    }, []);

    return {
        alerts,
        unreadCount,
        markAsRead,
        markAsActioned,
        dismissAlert,
        clearAllAlerts
    };
};
