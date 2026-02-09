import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePulseMonitor } from '../hooks/usePulseMonitor';
import { useAlertEngine } from '../hooks/useAlertEngine';
import type { PolitikaAlert } from '../types';

// Severity color mapping
const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
    danger: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🔴' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '🟠' },
    opportunity: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '🟢' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '🔵' }
};

interface AlertCardProps {
    alert: PolitikaAlert;
    onAction: (alertId: string, actionType: string, route?: string) => void;
    onDismiss: (alertId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction, onDismiss }) => {
    const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;

    return (
        <div
            className={`relative p-4 rounded-xl border ${style.bg} ${style.border} 
                  transition-all duration-300 hover:scale-[1.01] animate-fadeIn`}
        >
            {/* Unread indicator */}
            {!alert.isRead && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
                <span className="text-xl">{style.icon}</span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-heading truncate">{alert.title}</h3>
                    <p className="text-sm text-subtle mt-1">{alert.description}</p>

                    {/* Sentiment delta badge */}
                    {alert.sentimentDelta !== undefined && (
                        <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-medium
              ${alert.sentimentDelta < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {alert.sentimentDelta > 0 ? '+' : ''}{Math.round(alert.sentimentDelta * 100)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Related articles preview */}
            {alert.relatedArticles.length > 0 && (
                <div className="mb-3 text-xs text-subtle/70 border-l-2 border-primary/30 pl-2">
                    📰 {alert.relatedArticles[0].title.slice(0, 60)}...
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
                {alert.suggestedActions.map(action => (
                    <button
                        key={action.id}
                        onClick={() => onAction(alert.id, action.type, action.route)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all
              ${action.type === 'ignore'
                                ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                            }`}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Timestamp */}
            <p className="text-xs text-subtle/50 mt-3">
                {new Date(alert.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
        </div>
    );
};

// Metric Card Component
interface MetricCardProps {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'steady';
    subtitle?: string;
    icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, subtitle, icon }) => {
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 
                    hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-subtle">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-heading">{value}</span>
                {trend && (
                    <span className={`text-sm font-medium ${trendColor}`}>
                        {trendIcon} {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
};

// Main Component
const CommandCenter: React.FC = () => {
    const navigate = useNavigate();
    const { activeWorkspace } = useWorkspace();
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Get pulse data
    const {
        metrics,
        globalMetrics,
        allArticles,
        isLoading,
        refresh
    } = usePulseMonitor();

    // Get alerts
    const {
        alerts,
        unreadCount,
        markAsRead,
        markAsActioned,
        dismissAlert
    } = useAlertEngine({
        metrics,
        globalMetrics,
        allArticles,
        isLoading
    });

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
            setLastRefresh(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, [refresh]);

    // Handle action click
    const handleAction = (alertId: string, actionType: string, route?: string) => {
        markAsRead(alertId);

        if (actionType === 'ignore') {
            dismissAlert(alertId);
            return;
        }

        markAsActioned(alertId);

        if (route) {
            navigate(route);
        }
    };

    // Format sentiment
    const formatSentiment = (score: number | null): string => {
        if (score === null) return '--';
        const sign = score >= 0 ? '+' : '';
        return `${sign}${(score * 100).toFixed(0)}%`;
    };

    // Active alerts (not actioned)
    const activeAlerts = alerts.filter(a => !a.isActioned);
    const dangerAlerts = activeAlerts.filter(a => a.severity === 'danger' || a.severity === 'warning');
    const opportunityAlerts = activeAlerts.filter(a => a.severity === 'opportunity' || a.severity === 'info');

    return (
        <div className="min-h-screen bg-dark text-body">
            {/* Header */}
            <header className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-heading flex items-center gap-3">
                            🎯 Command Center
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-sm bg-red-500/20 text-red-400 rounded-full animate-pulse">
                                    {unreadCount} novo{unreadCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </h1>
                        <p className="text-subtle mt-1">
                            {activeWorkspace?.name || 'Nenhum workspace ativo'} •
                            Atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <button
                        onClick={() => { refresh(); setLastRefresh(new Date()); }}
                        disabled={isLoading}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 
                       transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="animate-spin">⟳</span>
                        ) : (
                            '🔄'
                        )}
                    </button>
                </div>
            </header>

            <main className="p-6 space-y-6">
                {/* Alerts Section */}
                {activeAlerts.length > 0 ? (
                    <div className="space-y-6">
                        {/* Danger/Warning Alerts */}
                        {dangerAlerts.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-heading mb-3 flex items-center gap-2">
                                    ⚠️ Alertas Ativos
                                    <span className="text-sm font-normal text-subtle">({dangerAlerts.length})</span>
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {dangerAlerts.slice(0, 4).map(alert => (
                                        <AlertCard
                                            key={alert.id}
                                            alert={alert}
                                            onAction={handleAction}
                                            onDismiss={dismissAlert}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Opportunity Alerts */}
                        {opportunityAlerts.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-heading mb-3 flex items-center gap-2">
                                    📈 Oportunidades
                                    <span className="text-sm font-normal text-subtle">({opportunityAlerts.length})</span>
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {opportunityAlerts.slice(0, 4).map(alert => (
                                        <AlertCard
                                            key={alert.id}
                                            alert={alert}
                                            onAction={handleAction}
                                            onDismiss={dismissAlert}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    // No alerts - show calm state
                    <div className="bg-card/30 border border-white/5 rounded-2xl p-8 text-center">
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="text-lg font-semibold text-heading mb-2">Tudo sob controle</h3>
                        <p className="text-subtle max-w-md mx-auto">
                            Nenhum alerta ativo. O Politika está monitorando seus termos e vai te avisar
                            quando detectar mudanças significativas.
                        </p>
                    </div>
                )}

                {/* Metrics Overview */}
                <section>
                    <h2 className="text-lg font-semibold text-heading mb-3">📊 Visão Geral</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                            icon="💬"
                            label="Menções"
                            value={globalMetrics.totalMentions}
                            trend={globalMetrics.overallTrend}
                            subtitle="24h"
                        />
                        <MetricCard
                            icon="💭"
                            label="Sentimento"
                            value={formatSentiment(globalMetrics.avgSentiment)}
                            trend={globalMetrics.avgSentiment !== null
                                ? (globalMetrics.avgSentiment > 0 ? 'up' : globalMetrics.avgSentiment < 0 ? 'down' : 'steady')
                                : undefined
                            }
                        />
                        <MetricCard
                            icon="🔔"
                            label="Alertas"
                            value={alerts.length}
                            subtitle={unreadCount > 0 ? `${unreadCount} novos` : 'lidos'}
                        />
                        <MetricCard
                            icon="🔥"
                            label="Termo Hot"
                            value={globalMetrics.hottestTerm || '--'}
                        />
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-lg font-semibold text-heading mb-3">⚡ Ações Rápidas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link
                            to="/analyze"
                            className="flex items-center gap-3 p-4 bg-card/50 border border-white/5 rounded-xl
                         hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                            <div>
                                <h3 className="font-medium text-heading">Nova Análise</h3>
                                <p className="text-sm text-subtle">Analisar perfil político</p>
                            </div>
                        </Link>

                        <Link
                            to="/pulse"
                            className="flex items-center gap-3 p-4 bg-card/50 border border-white/5 rounded-xl
                         hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                            <div>
                                <h3 className="font-medium text-heading">Pulse Monitor</h3>
                                <p className="text-sm text-subtle">Sentimento em tempo real</p>
                            </div>
                        </Link>

                        <Link
                            to="/crisis"
                            className="flex items-center gap-3 p-4 bg-card/50 border border-white/5 rounded-xl
                         hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">🚨</span>
                            <div>
                                <h3 className="font-medium text-heading">War Room</h3>
                                <p className="text-sm text-subtle">Gestão de crises</p>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Recent Articles Preview */}
                {allArticles.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-heading">📰 Últimas Notícias</h2>
                            <Link to="/pulse" className="text-sm text-primary hover:underline">
                                Ver todas →
                            </Link>
                        </div>
                        <div className="bg-card/30 border border-white/5 rounded-xl divide-y divide-white/5">
                            {allArticles.slice(0, 3).map((article, i) => (
                                <a
                                    key={i}
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 hover:bg-white/5 transition-colors"
                                >
                                    <p className="text-sm text-heading font-medium line-clamp-2">
                                        {article.title}
                                    </p>
                                    <p className="text-xs text-subtle mt-1">
                                        {article.source} • {new Date(article.pubDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* CSS for animations */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default CommandCenter;
