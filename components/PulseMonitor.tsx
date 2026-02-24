import React, { useState } from 'react';
import { usePulseMonitor } from '../hooks/usePulseMonitor';
import { PULSE_ONBOARDING_STEPS, TERM_COLORS } from '../constants';
import type { TaggedNewsArticle } from '../types';
import type { DailyTrendPoint, DayGroup } from '../services/trendsService';

// ============================================
// Helpers
// ============================================

function formatRelativeTime(pubDate: string): string {
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return diffMins <= 1 ? 'agora' : `${diffMins}min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  return `${diffDays}d`;
}

// ============================================
// Sub-components
// ============================================

interface MetricProps {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'steady';
  color: string;
}

const MetricCard: React.FC<MetricProps> = ({ label, value, trend, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-40 transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400">
        {label}
      </span>
      <div className={`size-8 rounded-xl flex items-center justify-center ${color} bg-opacity-10 text-opacity-100`}>
        <span className="material-symbols-outlined text-sm font-black">
          {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'straight'}
        </span>
      </div>
    </div>
    <div className="space-y-1">
      <h4 className="text-3xl font-black text-text-heading dark:text-white tracking-tighter">{value}</h4>
      <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
        <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        Ativo agora
      </p>
    </div>
  </div>
);

interface TermFilterBarProps {
  terms: string[];
  activeTerm: string | null;
  onSelect: (term: string | null) => void;
  metrics: Record<string, { mentions: number; sentiment: { score: number; classification: string } | null; sentimentLoading: boolean }>;
}

const TermFilterBar: React.FC<TermFilterBarProps> = ({ terms, activeTerm, onSelect, metrics }) => (
  <div className="flex flex-wrap gap-3">
    <button
      onClick={() => onSelect(null)}
      className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
        activeTerm === null
          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
          : 'bg-white dark:bg-slate-800 text-text-heading dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400'
      }`}
    >
      Todos
    </button>
    {terms.map((term, idx) => {
      const color = TERM_COLORS[idx % TERM_COLORS.length];
      const m = metrics[term];
      const isActive = activeTerm === term;
      const sentimentColor = !m?.sentiment ? 'bg-slate-400'
        : m.sentiment.score > 0.2 ? 'bg-emerald-500'
        : m.sentiment.score < -0.2 ? 'bg-red-500'
        : 'bg-amber-500';

      return (
        <button
          key={term}
          onClick={() => onSelect(isActive ? null : term)}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
            isActive
              ? 'text-white shadow-lg'
              : 'bg-white dark:bg-slate-800 text-text-heading dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400'
          }`}
          style={isActive ? { backgroundColor: color, borderColor: color } : undefined}
        >
          <span
            className={`size-2 rounded-full ${m?.sentimentLoading ? 'animate-pulse bg-slate-400' : sentimentColor}`}
          />
          {term}
          {m && <span className="text-[10px] opacity-70">({m.mentions})</span>}
        </button>
      );
    })}
  </div>
);

const HighlightedTitle: React.FC<{ title: string; terms: string[] }> = ({ title, terms }) => {
  if (terms.length === 0) return <>{title}</>;

  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = title.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some(t => t.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-primary/20 text-primary rounded px-0.5 font-black">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
};

interface OnboardingModalProps {
  show: boolean;
  step: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ show, step, onNext, onPrevious, onClose }) => {
  if (!show) return null;

  const currentStep = PULSE_ONBOARDING_STEPS[step];
  const isLastStep = step === PULSE_ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-300">
        <div className="p-10 space-y-8 text-center">
          <div className="flex justify-center">
            <div className={`size-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${currentStep.color}`}>
              <span className="material-symbols-outlined text-4xl leading-none">{currentStep.icon}</span>
            </div>
          </div>

          <div className="space-y-3 px-4">
            <h3 className="text-3xl font-black text-text-heading dark:text-white tracking-tighter uppercase italic">
              {currentStep.title}
            </h3>
            <p className="text-text-subtle dark:text-slate-400 text-lg leading-relaxed font-medium">
              {currentStep.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {PULSE_ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            {step > 0 && (
              <button
                onClick={onPrevious}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-text-heading dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200"
              >
                Anterior
              </button>
            )}
            <button
              onClick={isLastStep ? onClose : onNext}
              className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-primary/20"
            >
              {isLastStep ? 'Entendido!' : 'Proximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DailyWaveform — 15-day bar chart
// ============================================

interface DailyWaveformProps {
  dailyTrendPoints: DailyTrendPoint[];
  activeTerm: string | null;
  terms: string[];
  isLoading: boolean;
}

const DailyWaveform: React.FC<DailyWaveformProps> = ({ dailyTrendPoints, activeTerm, terms, isLoading }) => {
  const barColor = activeTerm
    ? TERM_COLORS[terms.indexOf(activeTerm) % TERM_COLORS.length]
    : undefined;

  return (
    <div className="bg-text-heading rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <span className="material-symbols-outlined text-9xl">radar</span>
      </div>

      <div className="relative space-y-6 flex flex-col">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">
              Radar 15 Dias
            </h3>
            <p className="text-[10px] font-medium text-slate-400 max-w-xs leading-normal">
              Volume diário de notícias{activeTerm ? ` para "${activeTerm}"` : ' (todos os termos)'}.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
            {activeTerm && (
              <div
                className="flex items-center gap-1.5 p-1 px-3 rounded-full border border-white/10 uppercase"
                style={{ backgroundColor: `${TERM_COLORS[terms.indexOf(activeTerm) % TERM_COLORS.length]}20` }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: TERM_COLORS[terms.indexOf(activeTerm) % TERM_COLORS.length] }}
                />
                {activeTerm}
              </div>
            )}
            <div className="flex items-center gap-1.5 p-1 px-3 bg-white/5 rounded-full border border-white/10 uppercase">
              <span className="size-1.5 bg-primary rounded-full shadow-[0_0_5px_rgba(19,109,236,0.8)]"></span>
              Cobertura
            </div>
          </div>
        </div>

        {/* Bar chart — 15 bars */}
        <div className="flex items-end gap-2 min-h-[220px] border-b border-white/10 pb-4">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <span className="text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                Carregando dados reais...
              </span>
            </div>
          ) : dailyTrendPoints.length > 0 && dailyTrendPoints.some(p => p.value > 0) ? (
            dailyTrendPoints.map((point, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-lg transition-all duration-500 opacity-60 hover:opacity-100 group/bar relative cursor-default ${!barColor ? 'bg-primary' : ''}`}
                style={{
                  height: `${Math.max(point.value, 4)}%`,
                  ...(barColor ? { backgroundColor: barColor } : {})
                }}
              >
                {/* Hover tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                  <span className="text-slate-500">{point.label}</span>
                  <span className="mx-1">—</span>
                  <span>{point.count} {point.count === 1 ? 'artigo' : 'artigos'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                Sem dados no periodo
              </span>
            </div>
          )}
        </div>

        {/* Day labels */}
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
          {dailyTrendPoints.length > 0 && (
            <>
              <span>{dailyTrendPoints[0]?.label}</span>
              <span>{dailyTrendPoints[Math.floor(dailyTrendPoints.length / 4)]?.label}</span>
              <span>{dailyTrendPoints[Math.floor(dailyTrendPoints.length / 2)]?.label}</span>
              <span>{dailyTrendPoints[Math.floor(dailyTrendPoints.length * 3 / 4)]?.label}</span>
              <span>{dailyTrendPoints[dailyTrendPoints.length - 1]?.label}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// DayGroupedNewsFeed — articles grouped by day
// ============================================

interface DayGroupedNewsFeedProps {
  articlesByDay: DayGroup[];
  terms: string[];
  activeTerm: string | null;
  isLoading: boolean;
}

const DayGroupedNewsFeed: React.FC<DayGroupedNewsFeedProps> = ({ articlesByDay, terms, activeTerm, isLoading }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-xs font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">newspaper</span>
        Notícias por Dia
      </h3>
      <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
    </div>

    <div className="space-y-8 max-h-[700px] overflow-y-auto custom-scrollbar">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articlesByDay.length > 0 ? (
        articlesByDay.map(group => (
          <div key={group.date}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              <h4 className="text-sm font-black text-text-heading dark:text-white uppercase tracking-widest">
                {group.label}
              </h4>
              <span className="text-[10px] font-bold text-text-subtle dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {group.articles.length} {group.articles.length === 1 ? 'artigo' : 'artigos'}
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Articles for this day */}
            <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
              {group.articles.map((article, idx) => (
                <a
                  key={idx}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-primary/5 transition-all group"
                >
                  <p className="text-xs font-bold text-text-heading dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                    <HighlightedTitle title={article.title.split(' - ')[0]} terms={article.matchedTerms} />
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[10px] text-text-subtle dark:text-slate-500">{article.source}</p>
                    <span className="text-[10px] text-text-subtle/50 dark:text-slate-600">
                      {formatRelativeTime(article.pubDate)}
                    </span>
                    {article.matchedTerms.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {article.matchedTerms.map(t => (
                          <span
                            key={t}
                            className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: TERM_COLORS[terms.indexOf(t) % TERM_COLORS.length] }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="material-symbols-outlined text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                      arrow_outward
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-3">
            article
          </span>
          <p className="text-sm text-text-subtle dark:text-slate-500">
            {activeTerm
              ? `Nenhuma noticia encontrada para "${activeTerm}"`
              : 'Nenhuma noticia encontrada'}
          </p>
        </div>
      )}
    </div>
  </div>
);

// ============================================
// Main Component — Radar de Notícias
// ============================================

const PulseMonitor: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const {
    terms,
    activeTerm,
    setActiveTerm,
    metrics,
    globalMetrics,
    filteredArticles,
    dailyTrendPoints,
    articlesByDay,
    dailyTrendDirection,
    isLoading,
    isNewsLoading,
    refresh
  } = usePulseMonitor();

  const formatSentiment = (score: number | null): string => {
    if (score === null) return '—';
    const pct = Math.round((score + 1) * 50);
    return `${pct}%`;
  };

  const sentimentTrend = (): 'up' | 'down' | 'steady' => {
    if (globalMetrics.avgSentiment === null) return 'steady';
    if (globalMetrics.avgSentiment > 0.1) return 'up';
    if (globalMetrics.avgSentiment < -0.1) return 'down';
    return 'steady';
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10 animate-reveal">
      {/* Onboarding Modal */}
      <OnboardingModal
        show={showOnboarding}
        step={onboardingStep}
        onNext={() => setOnboardingStep(prev => prev + 1)}
        onPrevious={() => setOnboardingStep(prev => prev - 1)}
        onClose={() => { setShowOnboarding(false); setOnboardingStep(0); }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">radar</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Radar de Notícias
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-text-heading dark:text-white tracking-tighter">
            Ultimos 15 Dias
          </h2>
          <p className="text-text-subtle dark:text-slate-400 font-medium max-w-lg">
            Monitoramento continuo das suas watchwords. Cada mencao rastreada e classificada por sentimento via IA.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-6 py-3 bg-white dark:bg-slate-800 text-text-heading dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 border border-slate-100 dark:border-slate-700 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">help</span>
            Como funciona?
          </button>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-6 py-3 bg-white dark:bg-slate-800 text-text-heading dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 border border-slate-100 dark:border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            Atualizar
          </button>
        </div>
      </div>

      {/* Term Filter Bar */}
      {terms.length > 0 && (
        <TermFilterBar
          terms={terms}
          activeTerm={activeTerm}
          onSelect={setActiveTerm}
          metrics={metrics}
        />
      )}

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
        <MetricCard
          label="Menções (15d)"
          value={isNewsLoading ? '...' : `${globalMetrics.totalMentions}`}
          trend={dailyTrendDirection}
          color="bg-primary text-primary"
        />
        <MetricCard
          label="Sentimento Medio"
          value={isNewsLoading ? '...' : formatSentiment(globalMetrics.avgSentiment)}
          trend={sentimentTrend()}
          color="bg-emerald-500 text-emerald-500"
        />
        <MetricCard
          label="Termo Mais Quente"
          value={isNewsLoading ? '...' : globalMetrics.hottestTerm || '—'}
          trend="up"
          color="bg-amber-500 text-amber-500"
        />
        <MetricCard
          label="Total Artigos"
          value={isNewsLoading ? '...' : `${filteredArticles.length}`}
          trend="steady"
          color="bg-blue-500 text-blue-500"
        />
      </div>

      {/* 15-Day Waveform */}
      <DailyWaveform
        dailyTrendPoints={dailyTrendPoints}
        activeTerm={activeTerm}
        terms={terms}
        isLoading={isNewsLoading}
      />

      {/* Per-term Sentiment Cards */}
      {terms.length > 0 && Object.keys(metrics).length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 space-y-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-text-heading dark:text-white">Sentimento por Termo</h3>
              <p className="text-sm text-text-subtle dark:text-slate-400 mt-1">
                Análise de sentimento via IA para cada watchword do seu workspace
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-2">
                <span className="size-3 bg-emerald-500 rounded"></span>
                Positivo
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 bg-amber-500 rounded"></span>
                Neutro
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 bg-red-500 rounded"></span>
                Negativo
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {terms.map((term, idx) => {
              const m = metrics[term];
              if (!m) return null;
              const color = TERM_COLORS[idx % TERM_COLORS.length];
              const sentColor = !m.sentiment ? '#94a3b8'
                : m.sentiment.score > 0.2 ? '#10b981'
                : m.sentiment.score < -0.2 ? '#ef4444'
                : '#f59e0b';

              return (
                <div
                  key={term}
                  onClick={() => setActiveTerm(activeTerm === term ? null : term)}
                  className={`p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 transition-all cursor-pointer group ${
                    activeTerm === term ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color }}
                    >
                      {term}
                    </span>
                    {m.sentimentLoading ? (
                      <div className="size-3 rounded-full bg-slate-400 animate-pulse" />
                    ) : (
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: sentColor }}
                      />
                    )}
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{m.mentions}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {m.sentimentLoading ? 'Analisando...'
                      : m.sentiment ? m.sentiment.classification
                      : m.mentions > 0 ? 'Aguardando análise' : 'Sem menções'}
                  </p>
                  {m.sentiment?.summary && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {m.sentiment.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day-Grouped News Feed */}
      <DayGroupedNewsFeed
        articlesByDay={articlesByDay}
        terms={terms}
        activeTerm={activeTerm}
        isLoading={isNewsLoading}
      />
    </div>
  );
};

export default PulseMonitor;
