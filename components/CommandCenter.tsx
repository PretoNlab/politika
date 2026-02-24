import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePulseMonitor } from '../hooks/usePulseMonitor';
import { useAlertEngine } from '../hooks/useAlertEngine';
import { useBriefing } from '../hooks/useBriefing';
import { TERM_COLORS } from '../constants';
import type { PolitikaAlert, TaggedNewsArticle, BriefingResult, TermMetrics } from '../types';
import { useGenerationStore } from '../store/generationStore';
import { supabase } from '../lib/supabase';

// ============================================
// Severity & Briefing Style Maps
// ============================================

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; iconColor: string }> = {
  danger: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: 'error', iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'warning', iconColor: 'text-amber-500' },
  opportunity: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'trending_up', iconColor: 'text-emerald-500' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'info', iconColor: 'text-blue-500' },
};

const BRIEFING_STYLES: Record<string, { bg: string; border: string; icon: string; iconColor: string; pulseColor: string; label: string }> = {
  calm: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'verified',
    iconColor: 'text-emerald-500',
    pulseColor: 'bg-emerald-500',
    label: 'Situacao Estavel'
  },
  alert: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'warning',
    iconColor: 'text-amber-500',
    pulseColor: 'bg-amber-500',
    label: 'Requer Atencao'
  },
  crisis: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'crisis_alert',
    iconColor: 'text-red-500',
    pulseColor: 'bg-red-500',
    label: 'Situacao Critica'
  }
};

// ============================================
// Sub-components
// ============================================

// --- BriefingBanner (Layer 1) ---

interface BriefingBannerProps {
  briefing: BriefingResult | null;
  isBriefingLoading: boolean;
  hasWorkspace: boolean;
  firstName: string;
  workspaceName: string;
  watchwordCount: number;
  unreadAlertCount: number;
  isDataLoading: boolean;
  lastRefresh: Date;
  onRefresh: () => void;
}

const BriefingBanner: React.FC<BriefingBannerProps> = ({
  briefing, isBriefingLoading, hasWorkspace, firstName,
  workspaceName, watchwordCount, unreadAlertCount,
  isDataLoading, lastRefresh, onRefresh
}) => {
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const status = briefing?.status || 'calm';
  const style = BRIEFING_STYLES[status];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.pulseColor} opacity-75`} />
              <span className={`relative inline-flex rounded-full size-3 ${style.pulseColor}`} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Quartel General
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-text-heading dark:text-white tracking-tighter">
            {getGreeting()}, {firstName}
          </h2>
          <p className="text-text-subtle dark:text-slate-400 font-medium max-w-lg">
            {hasWorkspace
              ? <>Monitorando <strong className="text-text-heading dark:text-white">{workspaceName}</strong> &bull; {watchwordCount} termos rastreados</>
              : 'Selecione ou crie um projeto para ativar o monitoramento.'
            }
          </p>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          {unreadAlertCount > 0 && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-red-100 dark:border-red-800">
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              {unreadAlertCount} {unreadAlertCount > 1 ? 'alertas' : 'alerta'}
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isDataLoading}
            className="px-5 py-3 bg-white dark:bg-slate-800 text-text-heading dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isDataLoading ? 'animate-spin' : ''}`}>refresh</span>
            Atualizar
          </button>
        </div>
      </div>

      {/* Briefing card */}
      {hasWorkspace && (
        <div className={`relative p-6 md:p-8 rounded-[2rem] border ${style.bg} ${style.border} transition-all duration-500 animate-fade-up`}>
          <div className="flex items-start gap-4">
            <div className={`size-12 rounded-2xl flex items-center justify-center ${style.iconColor} bg-white/60 dark:bg-slate-900/40 flex-shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{style.icon}</span>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${style.iconColor}`}>
                  {style.label}
                </span>
                {isBriefingLoading && (
                  <span className="text-[10px] font-bold text-text-subtle dark:text-slate-500 animate-pulse">
                    Gerando briefing...
                  </span>
                )}
                <span className="text-[10px] font-medium text-text-subtle/60 dark:text-slate-500 ml-auto">
                  {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-sm md:text-base font-medium text-text-heading dark:text-white leading-relaxed">
                {briefing?.summary || 'Carregando dados de monitoramento...'}
              </p>

              {briefing?.recommendations && briefing.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {briefing.recommendations.map((rec, i) => (
                    <span key={i} className="px-3 py-1 bg-white/60 dark:bg-slate-900/40 rounded-xl text-xs font-bold text-text-heading dark:text-white border border-white/40 dark:border-slate-700">
                      {rec}
                    </span>
                  ))}
                </div>
              )}

              {/* Contextual actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {status === 'crisis' && (
                  <Link to="/crisis" className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-lg shadow-red-500/20">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    War Room
                  </Link>
                )}
                <Link to="/analyze" className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">person_search</span>
                  Nova Analise
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- TermFilterBar ---

interface TermFilterBarProps {
  terms: string[];
  activeTerm: string | null;
  onSelect: (term: string | null) => void;
  metrics: Record<string, TermMetrics>;
}

const TermFilterBar: React.FC<TermFilterBarProps> = ({ terms, activeTerm, onSelect, metrics }) => (
  <div className="flex flex-wrap gap-3">
    <button
      onClick={() => onSelect(null)}
      className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${activeTerm === null
        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg shadow-slate-900/20'
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
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${isActive
            ? 'text-white shadow-lg'
            : 'bg-white dark:bg-slate-800 text-text-heading dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          style={isActive ? { backgroundColor: color, borderColor: color } : undefined}
        >
          <span className={`size-2 rounded-full ${m?.sentimentLoading ? 'animate-pulse bg-slate-400' : sentimentColor}`} />
          {term}
          {m && <span className="text-[10px] opacity-70">({m.mentions})</span>}
        </button>
      );
    })}
  </div>
);

// --- CompactTermCard ---

interface CompactTermCardProps {
  term: string;
  metrics: TermMetrics;
  color: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CompactTermCard: React.FC<CompactTermCardProps> = ({ term, metrics: m, color, isExpanded, onToggleExpand }) => {
  const sentColor = !m.sentiment ? '#94a3b8'
    : m.sentiment.score > 0.2 ? '#10b981'
      : m.sentiment.score < -0.2 ? '#ef4444'
        : '#f59e0b';

  return (
    <button
      onClick={onToggleExpand}
      className={`w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-md ${isExpanded ? 'border-primary shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-primary/50'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
          {term}
        </span>
        <div className="flex items-center gap-2">
          {m.sentimentLoading ? (
            <div className="size-3 rounded-full bg-slate-400 animate-pulse" />
          ) : (
            <div className="size-3 rounded-full" style={{ backgroundColor: sentColor }} />
          )}
          <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </div>
      <p className="text-2xl font-black text-text-heading dark:text-white">{m.mentions}</p>
      <p className="text-[10px] text-text-subtle dark:text-slate-400 mt-0.5">
        {m.sentimentLoading ? 'Analisando...'
          : m.sentiment ? m.sentiment.classification
            : m.mentions > 0 ? 'Aguardando analise' : 'Sem mencoes'}
      </p>
    </button>
  );
};

// --- ExpandedTermPanel (Layer 3) ---

interface ExpandedTermPanelProps {
  term: string;
  metrics: TermMetrics;
  color: string;
  terms: string[];
  onClose: () => void;
}

const ExpandedTermPanel: React.FC<ExpandedTermPanelProps> = ({ term, metrics: m, color, terms, onClose }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-lg animate-fade-up space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-black uppercase tracking-widest" style={{ color }}>{term}</span>
        <span className="text-xs font-bold text-text-subtle dark:text-slate-400">{m.mentions} mencoes</span>
      </div>
      <button onClick={onClose} className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        <span className="material-symbols-outlined text-sm text-text-subtle">close</span>
      </button>
    </div>

    {/* Sentiment detail */}
    {m.sentiment && (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((m.sentiment.score + 1) * 50)}%`,
                backgroundColor: m.sentiment.score > 0.2 ? '#10b981' : m.sentiment.score < -0.2 ? '#ef4444' : '#f59e0b'
              }}
            />
          </div>
          <span className="text-xs font-black text-text-heading dark:text-white w-12 text-right">
            {(m.sentiment.score * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-sm text-text-subtle dark:text-slate-400 leading-relaxed">{m.sentiment.summary}</p>
      </div>
    )}

    {/* Related articles */}
    {m.articles.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400">
          Artigos relacionados
        </h4>
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {m.articles.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-primary/5 transition-colors group"
            >
              <p className="text-xs font-bold text-text-heading dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                <HighlightedTitle title={article.title.split(' - ')[0]} terms={article.matchedTerms} />
              </p>
              <p className="text-[10px] text-text-subtle dark:text-slate-500 mt-1">{article.source}</p>
            </a>
          ))}
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-2 pt-2">
      <Link to="/analyze" className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/20 transition-all">
        Analisar
      </Link>
      <Link to="/crisis" className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
        War Room
      </Link>
    </div>
  </div>
);

// --- MiniWaveform ---

interface MiniWaveformProps {
  pulseData: number[];
  activeTerm: string | null;
  terms: string[];
  isLoading: boolean;
}

const MiniWaveform: React.FC<MiniWaveformProps> = ({ pulseData, activeTerm, terms, isLoading }) => (
  <div className="bg-text-heading rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl h-full">
    <div className="relative space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">
            Waveform 24h
          </h3>
          <p className="text-[10px] font-medium text-slate-400">
            {activeTerm ? `"${activeTerm}"` : 'Todos os termos'}
          </p>
        </div>
        {activeTerm && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-slate-400 uppercase"
            style={{ backgroundColor: `${TERM_COLORS[terms.indexOf(activeTerm) % TERM_COLORS.length]}20` }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: TERM_COLORS[terms.indexOf(activeTerm) % TERM_COLORS.length] }} />
            {activeTerm}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-end gap-1 min-h-[160px] border-b border-white/10 pb-3">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <span className="text-xs font-black uppercase tracking-[0.2em] animate-pulse">Carregando...</span>
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
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {`${i.toString().padStart(2, '0')}h — ${Math.round(val)}%`}
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Sem dados de distribuicao</span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>
    </div>
  </div>
);

// --- Relative Time Helper ---

const relativeTime = (dateStr: string): string => {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return '';
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

// --- HighlightedTitle ---

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

// --- CompactAlertCard ---

interface CompactAlertCardProps {
  alert: PolitikaAlert;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAction: (alertId: string, actionType: string, route?: string) => void;
  onDismiss: (alertId: string) => void;
}

const CompactAlertCard: React.FC<CompactAlertCardProps> = ({ alert, isExpanded, onToggleExpand, onAction, onDismiss }) => {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;

  return (
    <div className={`relative p-4 rounded-2xl border ${style.bg} ${style.border} transition-all duration-300 hover:shadow-md cursor-pointer ${isExpanded ? 'ring-2 ring-primary' : ''}`}>
      {!alert.isRead && (
        <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
      )}

      <div className="flex items-start gap-3" onClick={onToggleExpand}>
        <span className={`material-symbols-outlined text-lg ${style.iconColor}`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-text-heading dark:text-white truncate">{alert.title}</h3>
          <p className="text-xs text-text-subtle dark:text-slate-400 mt-0.5 line-clamp-1">{alert.description}</p>
        </div>
        {alert.sentimentDelta !== undefined && (
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-black flex-shrink-0
            ${alert.sentimentDelta < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
            {alert.sentimentDelta > 0 ? '+' : ''}{Math.round(alert.sentimentDelta * 100)}%
          </span>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3 animate-fade-up">
          <p className="text-xs text-text-subtle dark:text-slate-400 leading-relaxed">{alert.description}</p>

          {alert.relatedArticles.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-500">Artigos que geraram este alerta</p>
              {alert.relatedArticles.slice(0, 3).map((article, i) => (
                <a key={i} href={article.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-primary/5 transition-colors group">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">article</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-heading dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title.split(' - ')[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-subtle dark:text-slate-500">{article.source}</span>
                      {(article as any).pubDate && (
                        <span className="text-[10px] text-text-subtle/60 dark:text-slate-600">{relativeTime((article as any).pubDate)}</span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors text-sm flex-shrink-0">open_in_new</span>
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {alert.suggestedActions.map(action => (
              <button
                key={action.id}
                onClick={(e) => { e.stopPropagation(); onAction(alert.id, action.type, action.route); }}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all
                  ${action.type === 'ignore'
                    ? 'bg-slate-100 dark:bg-slate-800 text-text-subtle dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
              >
                {action.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-text-subtle/60 dark:text-slate-500 font-medium">
            {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Main QG Component
// ============================================

const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const { isGenerating, generatingHandle, initialData, clearState } = useGenerationStore();

  const saveToHistory = async (type: 'insight' | 'comparison', handle: string, result: any) => {
    if (!user) return;
    try {
      await supabase.from('analyses').insert({
        user_id: user.id,
        workspace_id: activeWorkspace?.id || null,
        type,
        handle,
        result,
      });
    } catch (e) {
      console.error('Failed to save analysis:', e);
    }
  };

  // PLG Aha Moment handler
  useEffect(() => {
    if (initialData && generatingHandle) {
      const dataToPass = initialData;
      const handleToPass = generatingHandle;
      clearState();
      saveToHistory('insight', handleToPass, dataToPass);
      navigate('/insight-detail', { state: { result: dataToPass, handle: handleToPass } });
    }
  }, [initialData, generatingHandle, navigate, clearState]);

  const {
    terms, activeTerm, setActiveTerm,
    metrics, globalMetrics,
    filteredArticles, allArticles,
    pulseData,
    isLoading, isNewsLoading,
    refresh
  } = usePulseMonitor();

  const {
    alerts, unreadCount,
    markAsRead, markAsActioned, dismissAlert
  } = useAlertEngine({ metrics, globalMetrics, allArticles, isLoading });

  const { briefing, isBriefingLoading } = useBriefing({
    globalMetrics,
    alerts,
    allArticles,
    isLoading,
    hasWorkspace: !!activeWorkspace
  });

  // Auto-refresh 60s
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Derived
  const activeAlerts = useMemo(() => alerts.filter(a => !a.isActioned), [alerts]);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Operador';

  // Handlers
  const toggleTermExpand = (term: string) => {
    setExpandedTerm(prev => prev === term ? null : term);
    setExpandedAlertId(null);
  };

  const toggleAlertExpand = (alertId: string) => {
    setExpandedAlertId(prev => prev === alertId ? null : alertId);
    setExpandedTerm(null);
  };

  const handleAction = (alertId: string, actionType: string, route?: string) => {
    markAsRead(alertId);
    if (actionType === 'ignore') {
      dismissAlert(alertId);
      return;
    }
    markAsActioned(alertId);
    if (route) navigate(route);
  };

  const handleRefresh = () => {
    refresh();
    setLastRefresh(new Date());
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8 animate-reveal">

      {/* LAYER 1: Briefing Banner */}
      <BriefingBanner
        briefing={briefing}
        isBriefingLoading={isBriefingLoading}
        hasWorkspace={!!activeWorkspace}
        firstName={firstName}
        workspaceName={activeWorkspace?.name || ''}
        watchwordCount={activeWorkspace?.watchwords?.length || 0}
        unreadAlertCount={unreadCount}
        isDataLoading={isLoading}
        lastRefresh={lastRefresh}
        onRefresh={handleRefresh}
      />

      {/* PLG AHA MOMENT: Loading State for Background Generation */}
      {isGenerating && (
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-[3rem] text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
            <div className="h-full bg-primary animate-progress-indeterminate"></div>
          </div>
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <span className="material-symbols-outlined text-3xl animate-pulse">neurology</span>
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            Gerando Dossiê Estratégico Inicial...
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
            A Inteligência Artificial está analisando o histórico, o tom dominante e as vulnerabilidades de <strong className="text-primary">@{generatingHandle}</strong>. Você será redirecionado assim que estiver pronto.
          </p>
        </div>
      )}

      {!activeWorkspace && !isGenerating ? (
        /* No workspace CTA */
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-16 border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
            <span className="material-symbols-outlined text-4xl">rocket_launch</span>
          </div>
          <div className="space-y-3 max-w-md mx-auto">
            <h3 className="text-2xl md:text-3xl font-black text-text-heading dark:text-white tracking-tighter">
              Comece Aqui
            </h3>
            <p className="text-text-subtle dark:text-slate-400 font-medium">
              Crie seu primeiro projeto para ativar o monitoramento de inteligencia politica,
              alertas em tempo real e analise de sentimento.
            </p>
          </div>
          <Link
            to="/workspaces"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Criar Projeto
          </Link>
        </div>
      ) : !isGenerating ? (
        <>
          {/* LAYER 2: Panorama */}

          {/* Term Filter Bar */}
          {terms.length > 0 && (
            <TermFilterBar
              terms={terms}
              activeTerm={activeTerm}
              onSelect={setActiveTerm}
              metrics={metrics}
            />
          )}

          {/* Bento Grid: Term Cards */}
          {terms.length > 0 && Object.keys(metrics).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {terms.map((term, idx) => {
                const m = metrics[term];
                if (!m) return null;
                return (
                  <CompactTermCard
                    key={term}
                    term={term}
                    metrics={m}
                    color={TERM_COLORS[idx % TERM_COLORS.length]}
                    isExpanded={expandedTerm === term}
                    onToggleExpand={() => toggleTermExpand(term)}
                  />
                );
              })}
            </div>
          )}

          {/* Layer 3: Expanded Term Panel */}
          {expandedTerm && metrics[expandedTerm] && (
            <ExpandedTermPanel
              term={expandedTerm}
              metrics={metrics[expandedTerm]}
              color={TERM_COLORS[terms.indexOf(expandedTerm) % TERM_COLORS.length]}
              terms={terms}
              onClose={() => setExpandedTerm(null)}
            />
          )}

          {/* Waveform — full width */}
          <MiniWaveform
            pulseData={pulseData}
            activeTerm={activeTerm}
            terms={terms}
            isLoading={isNewsLoading}
          />

          {/* Alerts Section */}
          {activeAlerts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-red-500">notifications_active</span>
                Alertas
                <span className="ml-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full text-[10px]">
                  {activeAlerts.length}
                </span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {activeAlerts.slice(0, 4).map(alert => (
                  <CompactAlertCard
                    key={alert.id}
                    alert={alert}
                    isExpanded={expandedAlertId === alert.id}
                    onToggleExpand={() => toggleAlertExpand(alert.id)}
                    onAction={handleAction}
                    onDismiss={dismissAlert}
                  />
                ))}
              </div>
              {activeAlerts.length > 4 && (
                <p className="text-[10px] font-bold text-text-subtle dark:text-slate-500 text-center">
                  + {activeAlerts.length - 4} alertas adicionais
                </p>
              )}
            </div>
          )}

          {/* "All clear" state when no alerts */}
          {activeAlerts.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
              <div className="size-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <h3 className="text-xl font-black text-text-heading dark:text-white tracking-tighter">
                Tudo sob controle
              </h3>
              <p className="text-sm text-text-subtle dark:text-slate-400 font-medium max-w-md mx-auto">
                Nenhum alerta ativo. Monitorando {activeWorkspace?.watchwords?.length || 0} termos.
              </p>
            </div>
          )}

          {/* ═══ LIVE FEED ═══ */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Feed Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">rss_feed</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-heading dark:text-white tracking-tight">Feed ao Vivo</h3>
                  <p className="text-[10px] text-text-subtle dark:text-slate-400 font-medium">
                    {filteredArticles.length} artigos · atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Ao vivo</span>
              </div>
            </div>

            {/* Feed Filters */}
            {terms.length > 0 && (
              <div className="flex gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                <button
                  onClick={() => setActiveTerm(null)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${activeTerm === null
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-text-subtle dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  Todos
                </button>
                {terms.map((term, idx) => {
                  const color = TERM_COLORS[idx % TERM_COLORS.length];
                  const isActive = activeTerm === term;
                  return (
                    <button
                      key={term}
                      onClick={() => setActiveTerm(isActive ? null : term)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-1.5`}
                      style={isActive
                        ? { backgroundColor: color, color: '#fff' }
                        : { backgroundColor: `${color}18`, color }}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: isActive ? '#fff' : color }} />
                      {term}
                      {metrics[term] && <span className="opacity-70">({metrics[term].mentions})</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feed Articles */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isNewsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredArticles.length > 0 ? (
                filteredArticles.slice(0, 12).map((article: TaggedNewsArticle, idx: number) => (
                  <a
                    key={idx}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Source icon */}
                    <div className="size-10 rounded-xl bg-primary/8 dark:bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <span className="material-symbols-outlined text-primary text-base">article</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-heading dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        <HighlightedTitle title={article.title.split(' - ')[0]} terms={article.matchedTerms} />
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-[11px] font-medium text-text-subtle dark:text-slate-400">{article.source}</span>
                        {(article as any).pubDate && (
                          <span className="text-[11px] text-text-subtle/60 dark:text-slate-500">{relativeTime((article as any).pubDate)}</span>
                        )}
                        {article.matchedTerms.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {article.matchedTerms.map((t, ti) => (
                              <span
                                key={t}
                                className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: TERM_COLORS[terms.indexOf(t) % TERM_COLORS.length] }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 group-hover:text-primary transition-all text-base flex-shrink-0 group-hover:translate-x-0.5">
                      open_in_new
                    </span>
                  </a>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-5xl mb-3">newspaper</span>
                  <p className="text-sm font-bold text-text-subtle dark:text-slate-500">
                    {activeTerm ? `Nenhum artigo para "${activeTerm}"` : 'Nenhum artigo encontrado'}
                  </p>
                  <p className="text-xs text-text-subtle/60 dark:text-slate-600 mt-1">Adicione watchwords ao workspace para monitorar</p>
                </div>
              )}
            </div>

            {/* Feed Footer */}
            {filteredArticles.length > 12 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-text-subtle dark:text-slate-500 font-medium">
                  Mostrando 12 de {filteredArticles.length} artigos
                </span>
                <a href="#/pulse" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                  Ver todos no Radar
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link
              to="/analyze"
              className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-primary transition-all"
            >
              <div className="space-y-4">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-heading dark:text-white tracking-tight">
                    Nova Analise
                  </h3>
                  <p className="text-sm text-text-subtle dark:text-slate-400 mt-1">
                    Analisar perfil politico com IA
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all text-sm inline-block">
                  arrow_forward
                </span>
              </div>
            </Link>

            <Link
              to="/crisis"
              className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-red-400 transition-all"
            >
              <div className="space-y-4">
                <div className="size-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-heading dark:text-white tracking-tight">
                    War Room
                  </h3>
                  <p className="text-sm text-text-subtle dark:text-slate-400 mt-1">
                    Gestao de crises e contra-medidas
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all text-sm inline-block">
                  arrow_forward
                </span>
              </div>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CommandCenter;
