import React, { useState } from 'react';
import { usePulseMonitor } from '../hooks/usePulseMonitor';
import { PULSE_ONBOARDING_STEPS, TERM_COLORS } from '../constants';
import type { TaggedNewsArticle } from '../types';

// --- Sub-components ---

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
              {isLastStep ? 'Entendido!' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Highlights matched terms in article title.
 */
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

// --- Main component ---

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
    pulseData,
    isLoading,
    isNewsLoading,
    refresh
  } = usePulseMonitor();

  const formatSentiment = (score: number | null): string => {
    if (score === null) return '—';
    const pct = Math.round((score + 1) * 50); // -1→0%, 0→50%, 1→100%
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
            <span className="size-3 bg-primary rounded-full animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Live Sentiment Feed
            </span>
          </div>
          <h2 className="text-5xl font-black text-text-heading dark:text-white tracking-tighter uppercase font-display">
            Sentiment Pulse
          </h2>
          <p className="text-text-subtle dark:text-slate-400 font-medium max-w-lg">
            Monitoramento por termo em tempo real. Cada watchword do seu workspace é rastreada individualmente com análise de sentimento via IA.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
        <MetricCard
          label="Total de Menções"
          value={isNewsLoading ? '...' : `${globalMetrics.totalMentions}`}
          trend={globalMetrics.overallTrend}
          color="bg-primary text-primary"
        />
        <MetricCard
          label="Sentimento Médio"
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
          label="Artigos Filtrados"
          value={isNewsLoading ? '...' : `${filteredArticles.length}`}
          trend="steady"
          color="bg-blue-500 text-blue-500"
        />
      </div>

      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Waveform */}
        <div className="lg:col-span-2 bg-text-heading rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <span className="material-symbols-outlined text-9xl">insights</span>
          </div>

          <div className="relative space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">
                  Waveform de Ressonância
                </h3>
                <p className="text-[10px] font-medium text-slate-400 max-w-xs leading-normal">
                  Distribuição horária de menções{activeTerm ? ` para "${activeTerm}"` : ' (todos os termos)'}.
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
                  Interesse Ativo
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 flex items-end gap-1 min-h-[200px] border-b border-white/10 pb-4">
              {isNewsLoading ? (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  <span className="text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                    Carregando dados reais...
                  </span>
                </div>
              ) : pulseData.length > 0 && pulseData.some(v => v > 0) ? (
                pulseData.map((val, i) => {
                  const barColor = activeTerm
                    ? TERM_COLORS[terms.indexOf(activeTerm) % TERM_COLORS.length]
                    : undefined;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-lg transition-all duration-500 opacity-60 hover:opacity-100 group/bar relative ${!barColor ? 'bg-primary' : ''}`}
                      style={{
                        height: `${Math.max(val, 2)}%`,
                        ...(barColor ? { backgroundColor: barColor } : {})
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                        {`${i.toString().padStart(2, '0')}h — ${Math.round(val)}%`}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Sem dados de distribuição temporal
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 pt-4">
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </div>
        </div>

        {/* News Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col space-y-6">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">newspaper</span>
              Notícias {activeTerm ? `— ${activeTerm}` : 'em Tempo Real'}
            </h3>
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
            {isNewsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((item: TaggedNewsArticle, idx: number) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-primary/5 transition-all group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                    <HighlightedTitle
                      title={item.title.split(' - ')[0]}
                      terms={item.matchedTerms}
                    />
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.source}</p>
                      {item.matchedTerms.length > 0 && (
                        <div className="flex gap-1">
                          {item.matchedTerms.map(t => (
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
                    </div>
                    <span className="material-symbols-outlined text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_outward
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-3">
                  article
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activeTerm
                    ? `Nenhuma notícia encontrada para "${activeTerm}"`
                    : 'Nenhuma notícia encontrada'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default PulseMonitor;
