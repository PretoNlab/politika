import React, { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePulseMonitor } from '../hooks/usePulseMonitor';
import { useAlertEngine } from '../hooks/useAlertEngine';
import { generateSituationalReport } from '../services/geminiClient';
import { STORAGE_KEYS } from '../constants';
import type { PolitikaAlert, TaggedNewsArticle } from '../types';

export interface ReportData {
    executiveSummary: string;
    keyMovements: Array<{ headline: string; impact: string; source: string }>;
    strategicRecommendations: Array<{ area: string; action: string; priority: string }>;
    generatedAt: string;
}

const SituationalReport: React.FC = () => {
    const { activeWorkspace } = useWorkspace();
    const [report, setReport] = useState<ReportData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load hooks that provide data for the report
    const {
        metrics, globalMetrics,
        allArticles,
        isNewsLoading: isPulseLoading
    } = usePulseMonitor();

    const {
        alerts,
    } = useAlertEngine({ metrics, globalMetrics, allArticles, isLoading: isPulseLoading });

    const getStorageKey = useCallback(() => {
        if (!activeWorkspace) return null;
        const dateStr = new Date().toISOString().split('T')[0];
        return `${STORAGE_KEYS.reportCache}_${activeWorkspace.id}_${dateStr}`;
    }, [activeWorkspace]);

    // Try to load cached report for today
    useEffect(() => {
        const key = getStorageKey();
        if (key) {
            const cached = localStorage.getItem(key);
            if (cached) {
                try {
                    setReport(JSON.parse(cached));
                } catch (e) {
                    console.error('Failed to parse cached report', e);
                }
            }
        }
    }, [getStorageKey]);

    const handleGenerate = async () => {
        if (!activeWorkspace) return;
        setIsGenerating(true);
        setError(null);

        try {
            // 1. Prepare data
            const activeAlerts = alerts.filter(a => !a.isActioned);
            const dangerCount = activeAlerts.filter(a => a.severity === 'danger' || a.severity === 'warning').length;
            const opportunityCount = activeAlerts.filter(a => a.severity === 'opportunity' || a.severity === 'info').length;

            const metricsSnapshot = {
                totalMentions: globalMetrics.totalMentions,
                avgSentiment: globalMetrics.avgSentiment,
                hottestTerm: globalMetrics.hottestTerm,
                overallTrend: globalMetrics.overallTrend,
                termMetrics: metrics // map 'metrics' to 'termMetrics' the API expects
            };

            const alertsSummary = {
                total: activeAlerts.length,
                dangerCount,
                opportunityCount,
                recentAlerts: activeAlerts.slice(0, 5).map(a => `${a.severity.toUpperCase()}: ${a.title}`)
            };

            const topArticleTitles = allArticles.slice(0, 15).map(a => a.title);

            const workspaceContext = {
                state: activeWorkspace.state,
                region: activeWorkspace.region,
                customContext: activeWorkspace.customContext
            };

            // 2. Call API
            const result = await generateSituationalReport(
                metricsSnapshot,
                alertsSummary,
                topArticleTitles,
                workspaceContext
            );

            // 3. Save result
            const newReport: ReportData = {
                ...result,
                generatedAt: new Date().toISOString()
            };

            setReport(newReport);

            const key = getStorageKey();
            if (key) {
                localStorage.setItem(key, JSON.stringify(newReport));
            }

        } catch (err: any) {
            console.error('Report Generation Error:', err);
            setError(err.message || 'Falha ao gerar o relatório. Tente novamente mais tarde.');
        } finally {
            setIsGenerating(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        const p = priority.toLowerCase();
        if (p.includes('alt') || p.includes('crític') || p.includes('high') || p.includes('critical')) return 'text-red-500 bg-red-50 dark:bg-red-900/20 ring-red-500/30';
        if (p.includes('médi') || p.includes('medium')) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-amber-500/30';
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-500/30';
    };

    if (!activeWorkspace) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">analytics</span>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Nenhum projeto selecionado</h2>
                <p className="text-slate-500 max-w-md mt-2">Você precisa de um projeto ativo para gerar o Relatório Situacional.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8 pb-32 animate-fade-in">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                            Briefing Matinal
                        </span>
                        <span className="text-slate-400 text-sm font-medium">#{activeWorkspace.state || 'Nacional'}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Relatório Situacional
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 font-medium max-w-2xl mt-2 line-clamp-2">
                        Visão gerencial condensada dos últimos movimentos políticos, riscos mapeados e recomendações táticas baseadas no monitoramento atual.
                    </p>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || isPulseLoading}
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[1.25rem] font-bold tracking-wide text-white transition-all overflow-hidden shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-primary to-blue-600 bg-[length:200%_auto] animate-gradient" />
                    <span className="relative flex items-center gap-2">
                        {isGenerating ? (
                            <>
                                <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                                Processando Inteligência...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                {report ? 'Atualizar Briefing' : 'Gerar Relatório'}
                            </>
                        )}
                    </span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5">error</span>
                    <div>
                        <h3 className="font-bold">Erro ao gerar relatório</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* EMPTY STATE */}
            {!report && !isGenerating && !error && (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="size-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary">article</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Relatório não gerado</h2>
                    <p className="text-slate-500 max-w-sm mb-8">
                        Clique no botão acima para consolidar os dados das últimas 24h em um briefing executivo claro e acionável.
                    </p>
                </div>
            )}

            {/* GENERATING STATE */}
            {isGenerating && (
                <div className="flex flex-col items-center justify-center py-32 px-6 text-center rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-slate-200 dark:bg-slate-800">
                        <div className="h-full bg-primary animate-progress-indeterminate rounded-r-full" />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative size-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700 mb-6 z-10">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">neurology</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Sintetizando Cenário...</h2>

                    <div className="space-y-2 mt-4 text-sm font-medium text-slate-500 max-w-sm">
                        <p className="flex items-center gap-2 justify-center animate-fade-in"><span className="size-1.5 rounded-full bg-emerald-500"></span> Analisando {globalMetrics.totalMentions} menções...</p>
                        <p className="flex items-center gap-2 justify-center animate-fade-in" style={{ animationDelay: '1s' }}><span className="size-1.5 rounded-full bg-blue-500"></span> Avaliando {alerts.length} alertas...</p>
                        <p className="flex items-center gap-2 justify-center animate-fade-in" style={{ animationDelay: '2s' }}><span className="size-1.5 rounded-full bg-purple-500"></span> Formulando estratégias...</p>
                    </div>
                </div>
            )}

            {/* REPORT VIEW */}
            {report && !isGenerating && (
                <div className="space-y-8 animate-fade-up">

                    {/* Metadata Bar */}
                    <div className="flex px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 items-center justify-between text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">verified</span>
                            Gerado com sucesso
                        </div>
                        <div>
                            {new Date(report.generatedAt).toLocaleString('pt-BR')}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN: Summary & Movements */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Executive Summary */}
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-blue-500" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">summarize</span>
                                    Sumário Executivo
                                </h2>

                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    {report.executiveSummary.split('\n\n').map((paragraph, i) => (
                                        <p key={i} className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4 last:mb-0">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Key Movements */}
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">swap_calls</span>
                                    Movimentos Chave
                                </h2>
                                <div className="space-y-4">
                                    {report.keyMovements.map((movement, i) => (
                                        <div key={i} className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:border-primary/50 hover:shadow-lg">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                                    {movement.headline}
                                                </h3>
                                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0">
                                                    {movement.source}
                                                </div>
                                            </div>
                                            <div className="flex gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                                <span className="material-symbols-outlined text-slate-400 mt-0.5 shrink-0">insights</span>
                                                <p className="text-sm">{movement.impact}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Recommendations */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">crisis_alert</span>
                                Ações Recomendadas
                            </h2>

                            <div className="space-y-4">
                                {report.strategicRecommendations.map((rec, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                {rec.area}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ring-1 ${getPriorityColor(rec.priority)}`}>
                                                {rec.priority}
                                            </span>
                                        </div>
                                        <p className="text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                            {rec.action}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Actions (Future integration) */}
                            <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl mt-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">bolt</span>
                                    Ações Rápidas
                                </h3>
                                <div className="space-y-2">
                                    <button className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-between border border-slate-200 dark:border-slate-700">
                                        Exportar PDF
                                        <span className="material-symbols-outlined text-slate-400">picture_as_pdf</span>
                                    </button>
                                    <button className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-between border border-slate-200 dark:border-slate-700">
                                        Compartilhar no WhatsApp
                                        <span className="material-symbols-outlined text-slate-400">share</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SituationalReport;
