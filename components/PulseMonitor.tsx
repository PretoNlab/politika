import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePulseMonitor } from '../hooks/usePulseMonitor';
import { PULSE_ONBOARDING_STEPS, TERM_COLORS } from '../constants';
import SpotlightCard from '../components/ui/SpotlightCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
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
  isNumeric?: boolean;
}

const MetricCard: React.FC<MetricProps> = ({ label, value, trend, color, isNumeric = true }) => {
  const numericValue = isNumeric ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : 0;
  const suffix = value.replace(/[0-9.-]+/g, "");

  return (
    <SpotlightCard className="p-6 flex flex-col justify-between min-h-[160px]">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-bold uppercase tracking-wider text-text-subtle">
          {label}
        </span>
        <div className={`size-10 rounded-xl flex items-center justify-center bg-opacity-10 text-opacity-100 ${color.replace('text-', 'bg-').split(' ')[0]} ${color.split(' ')[1]}`}>
          <span className="material-symbols-outlined text-lg font-black">
            {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'straight'}
          </span>
        </div>
      </div>
      <div className="space-y-1 mt-auto">
        {isNumeric && !isNaN(numericValue) ? (
          <AnimatedCounter end={Math.abs(numericValue)} suffix={suffix} prefix={numericValue < 0 ? '-' : ''} duration={1500} className="text-4xl md:text-5xl font-black text-text-heading tracking-tighter" />
        ) : (
          <h4 className="text-4xl md:text-5xl font-black text-text-heading tracking-tighter">{value}</h4>
        )}
        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-2">
          <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          Ativo agora no radar
        </p>
      </div>
    </SpotlightCard>
  );
};

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
      className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${activeTerm === null
        ? 'bg-text-heading text-white border-text-heading shadow-md'
        : 'bg-white text-text-heading border-border-light hover:border-text-heading/30 hover:bg-surface'
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
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${isActive
            ? 'text-white shadow-md'
            : 'bg-white text-text-heading border-border-light hover:border-text-heading/30 hover:bg-surface'
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
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-slate-200 dark:bg-slate-700'
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
// DayGroupedNewsFeed — articles grouped by day
// ============================================

interface DayGroupedNewsFeedProps {
  articlesByDay: DayGroup[];
  terms: string[];
  activeTerm: string | null;
  isLoading: boolean;
}

const DayGroupedNewsFeed: React.FC<DayGroupedNewsFeedProps> = ({ articlesByDay, terms, activeTerm, isLoading }) => {
  const [filter, setFilter] = useState<'all' | 'negative' | 'positive' | 'urgent'>('all');

  const filteredDays = useMemo(() => {
    return articlesByDay.map(group => {
      const filteredArticles = group.articles.filter(article => {
        if (filter === 'all') return true;
        // Mock sentiment logic for timeline filters (in a real app, sentiment should be attached to each article or term)
        // Since we don't have it on the article level easily here, we'll do a basic text match for demo
        const titleLower = article.title.toLowerCase();
        const snipLower = (article.description || '').toLowerCase();
        const content = titleLower + ' ' + snipLower;

        const isNegative = /(crise|escândalo|polêmica|investigação|acusado|queda|rejeição|erro|problema|urgente|denúncia)/.test(content);
        const isPositive = /(sucesso|aprovação|crescimento|vitória|acordo|investimento|alta|solução|lidera)/.test(content);
        const isUrgent = /(urgente|plantão|bomba|breaking|exclusivo)/.test(content) || (article.isBreaking === true);

        if (filter === 'negative') return isNegative;
        if (filter === 'positive') return isPositive;
        if (filter === 'urgent') return isUrgent;
        return true;
      });
      return { ...group, articles: filteredArticles };
    }).filter(g => g.articles.length > 0);
  }, [articlesByDay, filter]);

  return (
    <SpotlightCard className="p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-subtle flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">newspaper</span>
            Notícias por Dia
          </h3>
          <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </div>

        {/* Timeline Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${filter === 'all' ? 'bg-text-heading text-white border-text-heading' : 'bg-surface-input border-border-subtle text-text-subtle hover:border-primary'
              }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${filter === 'negative' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-surface-input border-border-subtle text-text-subtle hover:border-red-400 hover:text-red-500'
              }`}
          >
            <span className="material-symbols-outlined text-[12px]">warning</span>
            Negativas
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${filter === 'positive' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-surface-input border-border-subtle text-text-subtle hover:border-emerald-400 hover:text-emerald-500'
              }`}
          >
            <span className="material-symbols-outlined text-[12px]">thumb_up</span>
            Positivas
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${filter === 'urgent' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-surface-input border-border-subtle text-text-subtle hover:border-amber-400 hover:text-amber-500'
              }`}
          >
            <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
            Urgente
          </button>
        </div>
      </div>

      <div className="space-y-8 max-h-[700px] overflow-y-auto custom-scrollbar pr-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredDays.length > 0 ? (
          filteredDays.map(group => (
            <div key={group.date}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-4">
                <h4 className="text-sm font-black text-text-heading uppercase tracking-widest">
                  {group.label}
                </h4>
                <span className="text-[10px] font-bold text-text-subtle bg-white border border-border-light px-2.5 py-1 rounded-full shadow-sm">
                  {group.articles.length} {group.articles.length === 1 ? 'artigo' : 'artigos'}
                </span>
                <div className="flex-1 h-px bg-border-light" />
              </div>

              {/* Articles for this day */}
              <div className="space-y-3 pl-3 border-l-2 border-border-light">
                {group.articles.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 bg-white border border-border-light rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <p className="text-xs font-bold text-text-heading line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">
                      <HighlightedTitle title={article.title.split(' - ')[0]} terms={article.matchedTerms} />
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <p className="text-[10px] font-medium text-text-subtle">{article.source}</p>
                      <span className="text-[10px] text-text-subtle/50">
                        {formatRelativeTime(article.pubDate)}
                      </span>
                      {article.matchedTerms.length > 0 && (
                        <div className="flex gap-1 ml-auto">
                          {article.matchedTerms.map(t => (
                            <span
                              key={t}
                              className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow-sm"
                              style={{ backgroundColor: TERM_COLORS[terms.indexOf(t) % TERM_COLORS.length] }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="material-symbols-outlined text-text-subtle group-hover:text-primary transition-colors text-xs ml-auto">
                        arrow_outward
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border-light rounded-2xl bg-white">
            <span className="material-symbols-outlined text-border-light text-5xl mb-3">
              article
            </span>
            <p className="text-sm font-bold text-text-subtle">
              {activeTerm
                ? `Nenhuma noticia encontrada para "${activeTerm}"`
                : 'Nenhuma noticia encontrada'}
            </p>
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}

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

      {/* 15-Day Chart Row */}
      <SpotlightCard className="p-8 md:p-10 relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-50 dark:opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-sm font-black text-text-heading dark:text-white uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                Evolução (15 Dias)
              </h3>
              <p className="text-xs text-text-subtle mt-1 font-medium">Volume de Menções vs. Sentimento Médio</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-surface-input px-4 py-2 rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-primary rounded-full"></div>
                Volume
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full"></div>
                Sentimento
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {isNewsLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <div className="size-10 rounded-full border-4 border-border-subtle border-t-primary animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-text-subtle">Carregando dados...</p>
              </div>
            ) : dailyTrendPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTrendPoints}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSentiment" x1="0" y1="0" x2="1" y2="0">
                      {/* Render stops based on data to approximate a sentiment gradient line. 
                           For simplicity in this static def, we map it genericly. 
                           In a fully custom chart, you'd calculate stop percentages. */}
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                    reversed={true} // data is newest first, we want it left-to-right (oldest to newest), so reverse the axis to match index 0 (oldest visually right if not reversed, wait data is days - 1 - i. Actually data is 0=oldest to 14=today in buildDailyTrendFromArticles! So no reverse needed. Let's verify: slots[0] is Days - 1 (oldest). Perfect.)
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dx={-10}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[-1, 1]}
                    hide={true} // Hide the sentiment axis visually to keep it clean
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl">
                            <p className="text-xs font-black uppercase text-white mb-2">{label}</p>
                            <div className="space-y-2">
                              {/* Volume */}
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                                  <div className="size-2 bg-primary rounded-full"></div> Menções
                                </span>
                                <span className="text-sm font-black text-white">{data.count}</span>
                              </div>
                              {/* Sentiment */}
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                                  <div className={`size-2 rounded-full ${data.sentimentClassification === 'Positivo' ? 'bg-emerald-500' : data.sentimentClassification === 'Negativo' ? 'bg-red-500' : 'bg-amber-500'}`}></div> Sentimento
                                </span>
                                <span className={`text-sm font-black ${data.sentimentClassification === 'Positivo' ? 'text-emerald-500' : data.sentimentClassification === 'Negativo' ? 'text-red-500' : 'text-amber-500'}`}>
                                  {data.sentimentClassification} ({(data.sentiment || 0).toFixed(2)})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Volume Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                    animationDuration={1500}
                  />
                  {/* Sentiment Line (simulated as area with zero fill) */}
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="sentiment"
                    stroke="url(#colorSentiment)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#fff', strokeWidth: 3 }}
                    fillOpacity={0}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border-light rounded-2xl bg-white/50">
                <span className="material-symbols-outlined text-border-light text-4xl mb-2">monitoring</span>
                <p className="text-sm font-bold text-text-subtle">Dados insuficientes</p>
              </div>
            )}
          </div>
        </div>
      </SpotlightCard>



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
                  className={`p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 transition-all cursor-pointer group ${activeTerm === term ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary'
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
