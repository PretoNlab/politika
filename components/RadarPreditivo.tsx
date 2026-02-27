import React, { useState, useEffect } from 'react';
import { useRadarPreditivo } from '../hooks/useRadarPreditivo';
import SpotlightCard from './ui/SpotlightCard';
import AnimatedCounter from './ui/AnimatedCounter';
import type {
  RadarTool,
  ThermometerResult,
  BattleMapResult,
  SimulatorResult,
  EarlyWarningResult,
  ScenarioType,
  ZoneClassification,
} from '../types';

// ============================================
// Tab Configuration
// ============================================

const TABS: { id: RadarTool; label: string; icon: string }[] = [
  { id: 'thermometer', label: 'Termômetro', icon: 'thermostat' },
  { id: 'battlemap', label: 'Mapa de Batalha', icon: 'map' },
  { id: 'simulator', label: 'Simulador', icon: 'science' },
  { id: 'earlywarning', label: 'Alertas', icon: 'warning' },
];

const SCENARIO_TYPES: { value: ScenarioType; label: string }[] = [
  { value: 'position', label: 'Mudança de posição' },
  { value: 'alliance', label: 'Nova aliança' },
  { value: 'crisis', label: 'Crise / escândalo' },
  { value: 'abstention', label: 'Abstenção estratégica' },
  { value: 'spending', label: 'Investimento focado' },
  { value: 'custom', label: 'Personalizado' },
];

const ZONE_COLORS: Record<ZoneClassification, { bg: string; text: string; border: string; label: string }> = {
  allied: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Aliada' },
  adversary: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Adversária' },
  disputed: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Disputada' },
  opportunity: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Oportunidade' },
};

// ============================================
// Guided Tooltip (onboarding interativo)
// ============================================

const TOUR_TOTAL_STEPS = 6;

const GuidedTooltip: React.FC<{
  step: number;
  title: string;
  description: string;
  position?: 'top' | 'bottom';
  onNext: () => void;
  onSkip: () => void;
  isLast?: boolean;
}> = ({ step, title, description, position = 'bottom', onNext, onSkip, isLast }) => (
  <div className={`absolute left-1/2 -translate-x-1/2 z-50 ${
    position === 'bottom' ? 'top-full mt-3' : 'bottom-full mb-3'
  }`}>
    {position === 'bottom' && (
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
    )}
    <div className="bg-primary text-white p-5 rounded-2xl shadow-2xl w-72 animate-in fade-in zoom-in-95 duration-200">
      <p className="font-black text-sm mb-1">{title}</p>
      <p className="text-xs text-white/80 leading-relaxed">{description}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] text-white/50 font-bold">{step + 1}/{TOUR_TOTAL_STEPS}</span>
        <div className="flex gap-2">
          <button onClick={onSkip} className="text-[10px] text-white/50 hover:text-white transition-colors font-medium">
            Pular tour
          </button>
          <button onClick={onNext} className="px-3 py-1 bg-white text-primary rounded-lg text-xs font-bold hover:bg-white/90 transition-colors">
            {isLast ? 'Entendido!' : 'Proximo'}
          </button>
        </div>
      </div>
    </div>
    {position === 'top' && (
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
    )}
  </div>
);

// ============================================
// Sub-components
// ============================================

const TseSyncBanner: React.FC<{
  syncStatus: any;
  isSyncing: boolean;
  onSync: () => void;
}> = ({ syncStatus, isSyncing, onSync }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-card border border-border-subtle">
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-xl">database</span>
      <div>
        <p className="text-sm font-bold text-text-heading">Dados do TSE</p>
        <p className="text-xs text-text-subtle">
          {syncStatus
            ? `${syncStatus.recordCount} registros • Anos: ${syncStatus.availableYears?.slice(0, 4).join(', ') || 'nenhum'}`
            : 'Nenhum dado sincronizado'}
        </p>
      </div>
    </div>
    <button
      onClick={onSync}
      disabled={isSyncing}
      className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider
                 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center gap-2"
    >
      <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin' : ''}`}>
        {isSyncing ? 'progress_activity' : 'sync'}
      </span>
      {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
    </button>
  </div>
);

// ============================================
// Thermometer Panel
// ============================================

const ThermometerPanel: React.FC<{
  result: ThermometerResult | null;
  loading: boolean;
  onGenerate: (name: string, party: string) => void;
  guidedStep: number | null;
  onTourNext: () => void;
  onTourSkip: () => void;
}> = ({ result, loading, onGenerate, guidedStep, onTourNext, onTourSkip }) => {
  const [name, setName] = useState('');
  const [party, setParty] = useState('');

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="relative">
      <SpotlightCard className={`p-6 ${guidedStep === 1 || guidedStep === 2 ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <h3 className="text-lg font-black text-text-heading mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">thermostat</span>
          Termômetro Eleitoral
        </h3>
        <p className="text-sm text-text-subtle mb-4">
          Posicione um candidato na escala de 0-100 comparando com padrões históricos de vencedores.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nome do candidato"
            value={name}
            onChange={e => { setName(e.target.value); if (guidedStep === 1 && e.target.value.length > 0) onTourNext(); }}
            className="flex-1 px-4 py-3 rounded-xl bg-surface-input border border-border-subtle
                       text-text-heading placeholder:text-text-subtle/50 focus:outline-none focus:ring-2
                       focus:ring-primary/30 focus:border-primary text-sm font-medium"
          />
          <input
            type="text"
            placeholder="Partido (ex: PL, PT)"
            value={party}
            onChange={e => setParty(e.target.value)}
            className="w-full sm:w-40 px-4 py-3 rounded-xl bg-surface-input border border-border-subtle
                       text-text-heading placeholder:text-text-subtle/50 focus:outline-none focus:ring-2
                       focus:ring-primary/30 focus:border-primary text-sm font-medium"
          />
          <button
            onClick={() => { onGenerate(name, party); if (guidedStep === 2) onTourNext(); }}
            disabled={loading || !name.trim() || !party.trim()}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm
                       hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base">query_stats</span>
            )}
            {loading ? 'Analisando...' : 'Gerar'}
          </button>
        </div>

      </SpotlightCard>
        {guidedStep === 1 && (
          <GuidedTooltip
            step={1}
            title="Digite um candidato"
            description="Preencha o nome do candidato e o partido. Ex: 'Bruno Reis' e 'UNIAO'. O sistema vai comparar com vencedores históricos."
            onNext={onTourNext}
            onSkip={onTourSkip}
          />
        )}
        {guidedStep === 2 && (
          <GuidedTooltip
            step={2}
            title="Gere a análise"
            description="Preencha os campos e clique em 'Gerar'. A IA vai cruzar dados do TSE para calcular o score do candidato."
            onNext={onTourNext}
            onSkip={onTourSkip}
          />
        )}
      </div>

      {/* Result */}
      {result && (
        <>
          {/* Score Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SpotlightCard className="p-6 flex flex-col items-center justify-center md:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">Score Geral</p>
              <div className="relative size-32">
                <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-border-subtle/30" />
                  <circle
                    cx="60" cy="60" r="50" fill="none" strokeWidth="8"
                    strokeDasharray={`${(result.overallScore / 100) * 314} 314`}
                    strokeLinecap="round"
                    className={result.overallScore >= 60 ? 'text-emerald-500' : result.overallScore >= 40 ? 'text-amber-500' : 'text-red-500'}
                    stroke="currentColor"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatedCounter end={result.overallScore} duration={1200} className="text-3xl font-black text-text-heading" />
                  <span className="text-[10px] font-bold text-text-subtle">/100</span>
                </div>
              </div>
              <p className="text-xs text-text-subtle mt-2 text-center">{result.candidateName} ({result.party})</p>
            </SpotlightCard>

            <SpotlightCard className="p-6 md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-3">Comparação Histórica</p>
              <p className="text-sm text-text-body leading-relaxed">{result.historicalComparison}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                  Eficiência de gasto: {result.spendingEfficiency > 0 ? `${result.spendingEfficiency.toFixed(1)}x` : 'N/A'}
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Strengths & Vulnerabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpotlightCard className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">shield</span>
                Forças
              </p>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-text-body flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
            <SpotlightCard className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">gpp_bad</span>
                Vulnerabilidades
              </p>
              <ul className="space-y-2">
                {result.vulnerabilities.map((v, i) => (
                  <li key={i} className="text-sm text-text-body flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">-</span>
                    {v}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </div>

          {/* Zones */}
          {result.zones.length > 0 && (
            <SpotlightCard className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-4">Análise por Zona Eleitoral</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-text-subtle uppercase tracking-wider border-b border-border-subtle">
                      <th className="text-left py-2 px-3">Zona</th>
                      <th className="text-center py-2 px-3">Score</th>
                      <th className="text-center py-2 px-3">Média Hist.</th>
                      <th className="text-center py-2 px-3">Tendência</th>
                      <th className="text-left py-2 px-3">Insight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.zones.map(z => (
                      <tr key={z.zone} className="border-b border-border-subtle/50">
                        <td className="py-2.5 px-3 font-bold text-text-heading">#{z.zone}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-bold ${z.score >= 60 ? 'text-emerald-500' : z.score >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                            {z.score}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-text-subtle">{z.historicalAvg}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`material-symbols-outlined text-base ${
                            z.trend === 'rising' ? 'text-emerald-500' : z.trend === 'falling' ? 'text-red-400' : 'text-text-subtle'
                          }`}>
                            {z.trend === 'rising' ? 'trending_up' : z.trend === 'falling' ? 'trending_down' : 'trending_flat'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text-body text-xs">{z.keyInsight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          )}

          {/* Recommendation */}
          <SpotlightCard className="p-6 border-l-4 border-l-primary">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Recomendação Estratégica</p>
            <p className="text-sm text-text-body leading-relaxed">{result.recommendation}</p>
          </SpotlightCard>
        </>
      )}
    </div>
  );
};

// ============================================
// Battle Map Panel
// ============================================

const BattleMapPanel: React.FC<{
  result: BattleMapResult | null;
  loading: boolean;
  onGenerate: (candidates: { name: string; party: string; number: number }[]) => void;
}> = ({ result, loading, onGenerate }) => {
  const [candidates, setCandidates] = useState([
    { name: '', party: '', number: 0 },
    { name: '', party: '', number: 0 },
  ]);

  const updateCandidate = (index: number, field: string, value: string | number) => {
    const updated = [...candidates];
    (updated[index] as any)[field] = value;
    setCandidates(updated);
  };

  const addCandidate = () => {
    if (candidates.length < 5) {
      setCandidates([...candidates, { name: '', party: '', number: 0 }]);
    }
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <SpotlightCard className="p-6">
        <h3 className="text-lg font-black text-text-heading mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">map</span>
          Mapa de Batalha
        </h3>
        <p className="text-sm text-text-subtle mb-4">
          Classifique zonas eleitorais por disputabilidade. Adicione os candidatos em disputa.
        </p>
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-subtle w-6">{i + 1}.</span>
              <input
                type="text"
                placeholder="Nome"
                value={c.name}
                onChange={e => updateCandidate(i, 'name', e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-surface-input border border-border-subtle
                           text-text-heading placeholder:text-text-subtle/50 focus:outline-none focus:ring-2
                           focus:ring-primary/30 text-sm"
              />
              <input
                type="text"
                placeholder="Partido"
                value={c.party}
                onChange={e => updateCandidate(i, 'party', e.target.value)}
                className="w-24 px-3 py-2.5 rounded-xl bg-surface-input border border-border-subtle
                           text-text-heading placeholder:text-text-subtle/50 focus:outline-none focus:ring-2
                           focus:ring-primary/30 text-sm"
              />
              <input
                type="number"
                placeholder="#"
                value={c.number || ''}
                onChange={e => updateCandidate(i, 'number', parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2.5 rounded-xl bg-surface-input border border-border-subtle
                           text-text-heading placeholder:text-text-subtle/50 focus:outline-none focus:ring-2
                           focus:ring-primary/30 text-sm"
              />
              {candidates.length > 2 && (
                <button onClick={() => removeCandidate(i)} className="text-text-subtle hover:text-red-400 transition-colors">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          {candidates.length < 5 && (
            <button
              onClick={addCandidate}
              className="px-4 py-2 rounded-xl border border-border-subtle text-text-subtle text-xs font-bold
                         hover:border-primary hover:text-primary transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Candidato
            </button>
          )}
          <button
            onClick={() => onGenerate(candidates.filter(c => c.name.trim() && c.party.trim()))}
            disabled={loading || candidates.filter(c => c.name.trim()).length < 2}
            className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-xs
                       hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base">map</span>
            )}
            {loading ? 'Gerando...' : 'Gerar Mapa'}
          </button>
        </div>
      </SpotlightCard>

      {/* Result */}
      {result && (
        <>
          {/* Zone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.zones.map(z => {
              const colors = ZONE_COLORS[z.classification as ZoneClassification] || ZONE_COLORS.disputed;
              return (
                <SpotlightCard key={z.zone} className={`p-4 border ${colors.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-text-heading">Zona #{z.zone}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                      {colors.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-subtle mb-1">
                    <span className="font-bold">{z.dominantCandidate}</span> • Margem: {z.margin > 0 ? '+' : ''}{z.margin.toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-border-subtle/30 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bg.replace('/10', '')}`}
                        style={{ width: `${Math.min(z.swingPotential * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-subtle font-bold">{(z.swingPotential * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[11px] text-text-body">{z.strategicNote}</p>
                </SpotlightCard>
              );
            })}
          </div>

          {/* Summary */}
          <SpotlightCard className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-3">Resumo Estratégico</p>
            <p className="text-sm text-text-body leading-relaxed mb-4">{result.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-500 mb-1">Prioridades de Ataque</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.priorityTargets.map(z => (
                    <span key={z} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">#{z}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Prioridades de Defesa</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.defensePriorities.map(z => (
                    <span key={z} className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold">#{z}</span>
                  ))}
                </div>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 border-l-4 border-l-primary">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Balanço Geral</p>
            <p className="text-sm text-text-body leading-relaxed">{result.overallBalance}</p>
          </SpotlightCard>
        </>
      )}
    </div>
  );
};

// ============================================
// Simulator Panel
// ============================================

const SimulatorPanel: React.FC<{
  result: SimulatorResult | null;
  loading: boolean;
  onSimulate: (scenario: { type: ScenarioType; description: string; targetZones?: number[] }) => void;
}> = ({ result, loading, onSimulate }) => {
  const [scenarioType, setScenarioType] = useState<ScenarioType>('position');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6">
      <SpotlightCard className="p-6">
        <h3 className="text-lg font-black text-text-heading mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">science</span>
          Simulador de Cenários
        </h3>
        <p className="text-sm text-text-subtle mb-4">
          Projete o impacto de decisões estratégicas usando dados históricos como base.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1.5 block">
              Tipo de cenário
            </label>
            <div className="flex flex-wrap gap-2">
              {SCENARIO_TYPES.map(st => (
                <button
                  key={st.value}
                  onClick={() => setScenarioType(st.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    scenarioType === st.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-input border-border-subtle text-text-subtle hover:border-primary hover:text-primary'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1.5 block">
              Descreva o cenário
            </label>
            <textarea
              placeholder="Ex: O candidato firma aliança com o partido X para fortalecer a base no interior..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border-subtle
                         text-text-heading placeholder:text-text-subtle/50 focus:outline-none focus:ring-2
                         focus:ring-primary/30 text-sm resize-none"
            />
          </div>
          <button
            onClick={() => onSimulate({ type: scenarioType, description })}
            disabled={loading || !description.trim()}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm
                       hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base">play_arrow</span>
            )}
            {loading ? 'Simulando...' : 'Simular'}
          </button>
        </div>
      </SpotlightCard>

      {/* Result */}
      {result && (
        <>
          {/* Impact Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SpotlightCard className="p-6 flex flex-col items-center justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">Impacto Projetado</p>
              <p className={`text-4xl font-black ${result.impactPoints >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {result.impactPoints > 0 ? '+' : ''}{result.impactPoints.toFixed(1)}
              </p>
              <p className="text-xs text-text-subtle mt-1">pontos percentuais</p>
            </SpotlightCard>
            <SpotlightCard className="p-6 flex flex-col items-center justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">Probabilidade</p>
              <AnimatedCounter end={result.probability} suffix="%" duration={1000} className="text-4xl font-black text-text-heading" />
              <p className="text-xs text-text-subtle mt-1">de sucesso</p>
            </SpotlightCard>
            <SpotlightCard className="p-6 flex flex-col items-center justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">Zonas Afetadas</p>
              <p className="text-4xl font-black text-text-heading">{result.affectedZones.length}</p>
              <p className="text-xs text-text-subtle mt-1">zonas impactadas</p>
            </SpotlightCard>
          </div>

          {/* Affected Zones */}
          {result.affectedZones.length > 0 && (
            <SpotlightCard className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-4">Zonas Afetadas</p>
              <div className="space-y-3">
                {result.affectedZones.map(z => (
                  <div key={z.zone} className="flex items-center gap-4 p-3 rounded-xl bg-surface-input/50">
                    <span className="text-sm font-black text-text-heading w-16">#{z.zone}</span>
                    <span className={`text-sm font-bold w-16 text-right ${z.delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {z.delta > 0 ? '+' : ''}{z.delta.toFixed(1)}%
                    </span>
                    <p className="text-xs text-text-body flex-1">{z.explanation}</p>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          )}

          {/* Historical Analogy */}
          <SpotlightCard className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">history_edu</span>
              Analogia Histórica
            </p>
            <p className="text-sm text-text-body leading-relaxed">{result.historicalAnalogy}</p>
          </SpotlightCard>

          {/* Risks */}
          {result.risks.length > 0 && (
            <SpotlightCard className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                Riscos
              </p>
              <ul className="space-y-2">
                {result.risks.map((r, i) => (
                  <li key={i} className="text-sm text-text-body flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 text-xs">!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          )}

          <SpotlightCard className="p-6 border-l-4 border-l-primary">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Recomendação</p>
            <p className="text-sm text-text-body leading-relaxed">{result.recommendation}</p>
          </SpotlightCard>
        </>
      )}
    </div>
  );
};

// ============================================
// Early Warning Panel
// ============================================

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Baixo' },
  moderate: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Moderado' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Alto' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Crítico' },
};

const EarlyWarningPanel: React.FC<{
  result: EarlyWarningResult | null;
  loading: boolean;
  onCheck: () => void;
}> = ({ result, loading, onCheck }) => (
  <div className="space-y-6">
    <SpotlightCard className="p-6">
      <h3 className="text-lg font-black text-text-heading mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-500">warning</span>
        Alerta Antecipado
      </h3>
      <p className="text-sm text-text-subtle mb-4">
        Detecta padrões que precedem crises políticas antes que aconteçam, com base em sentimento e dados históricos.
      </p>
      <button
        onClick={onCheck}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm
                   hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2"
      >
        {loading ? (
          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-base">radar</span>
        )}
        {loading ? 'Verificando...' : 'Verificar Agora'}
      </button>
    </SpotlightCard>

    {result && (
      <>
        {/* Overall Risk */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-subtle">Risco Geral</p>
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
              RISK_COLORS[result.overallRiskLevel]?.bg || RISK_COLORS.moderate.bg
            } ${RISK_COLORS[result.overallRiskLevel]?.text || RISK_COLORS.moderate.text}`}>
              {RISK_COLORS[result.overallRiskLevel]?.label || 'Moderado'}
            </span>
          </div>
          <p className="text-xs text-text-subtle">
            Próxima verificação: {result.nextCheckIn}
          </p>
        </SpotlightCard>

        {/* Warnings */}
        {result.warnings.length > 0 ? (
          <div className="space-y-3">
            {result.warnings
              .sort((a, b) => b.probability - a.probability)
              .map((w, i) => (
                <SpotlightCard key={i} className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-base ${
                        w.probability >= 70 ? 'text-red-400' : w.probability >= 40 ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {w.probability >= 70 ? 'error' : w.probability >= 40 ? 'warning' : 'info'}
                      </span>
                      <span className="text-sm font-black text-text-heading">{w.patternType}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${
                        w.probability >= 70 ? 'text-red-400' : w.probability >= 40 ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {w.probability}%
                      </span>
                      <span className="text-xs text-text-subtle bg-surface-input px-2 py-0.5 rounded-lg">
                        {w.horizonHours}h
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-body mb-2">{w.description}</p>
                  {w.historicalPrecedent && (
                    <p className="text-xs text-text-subtle italic">
                      Precedente: {w.historicalPrecedent}
                    </p>
                  )}
                </SpotlightCard>
              ))}
          </div>
        ) : (
          <SpotlightCard className="p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">verified_user</span>
            <p className="text-sm font-bold text-text-heading">Nenhum alerta detectado</p>
            <p className="text-xs text-text-subtle">O radar não identificou padrões de risco no momento.</p>
          </SpotlightCard>
        )}
      </>
    )}
  </div>
);

// ============================================
// Main Component
// ============================================

const RADAR_ONBOARDING_KEY = 'politika_radar_onboarding_seen';

const RadarPreditivo: React.FC = () => {
  const radar = useRadarPreditivo();

  // Guided tour state — null = tour desligado, 0-5 = step ativo
  const [guidedStep, setGuidedStep] = useState<number | null>(() => {
    return localStorage.getItem(RADAR_ONBOARDING_KEY) ? null : 0;
  });

  const nextStep = () => {
    setGuidedStep(s => {
      if (s === null) return null;
      if (s >= TOUR_TOTAL_STEPS - 1) {
        localStorage.setItem(RADAR_ONBOARDING_KEY, 'true');
        return null;
      }
      return s + 1;
    });
  };

  const skipTour = () => {
    setGuidedStep(null);
    localStorage.setItem(RADAR_ONBOARDING_KEY, 'true');
  };

  const restartTour = () => setGuidedStep(0);

  // Auto-advance: step 3 → when tab changes to battlemap
  useEffect(() => {
    if (guidedStep === 3 && radar.activeTab === 'battlemap') nextStep();
  }, [radar.activeTab, guidedStep]);

  // Auto-advance: step 4 → when tab changes to simulator
  useEffect(() => {
    if (guidedStep === 4 && radar.activeTab === 'simulator') nextStep();
  }, [radar.activeTab, guidedStep]);

  // Sync status on mount
  useEffect(() => {
    radar.tse.refreshSyncStatus();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-heading tracking-tight">
            Radar Preditivo
          </h1>
          <p className="text-sm text-text-subtle mt-1">
            Inteligência preditiva baseada em dados históricos do TSE + IA
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={restartTour}
            className="flex items-center gap-1 text-xs text-primary hover:text-blue-600 font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">help</span>
            Como funciona?
          </button>
          {guidedStep === 5 && (
            <GuidedTooltip
              step={5}
              title="Pronto!"
              description="Sempre que precisar, clique em 'Como funciona?' para rever o tour completo."
              position="bottom"
              onNext={nextStep}
              onSkip={skipTour}
              isLast
            />
          )}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-base">query_stats</span>
            <span className="text-xs font-bold">TSE + Gemini AI</span>
          </div>
        </div>
      </div>

      {/* TSE Sync Banner */}
      <div className="relative">
        <TseSyncBanner
          syncStatus={radar.tse.syncStatus}
          isSyncing={radar.tse.isSyncing}
          onSync={() => { radar.tse.syncAllData(); if (guidedStep === 0) nextStep(); }}
        />
        {guidedStep === 0 && (
          <GuidedTooltip
            step={0}
            title="Sincronize os dados"
            description="Clique em 'Sincronizar' para carregar dados eleitorais reais do TSE (2016-2024) da Bahia."
            onNext={nextStep}
            onSkip={skipTour}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const isHighlighted =
              (guidedStep === 3 && tab.id === 'battlemap') ||
              (guidedStep === 4 && tab.id === 'simulator');

            return (
              <button
                key={tab.id}
                onClick={() => { radar.setActiveTab(tab.id); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest
                            transition-all border-2 whitespace-nowrap ${
                  radar.activeTab === tab.id
                    ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(19,109,236,0.3)]'
                    : 'bg-surface-card border-border-subtle text-text-subtle hover:border-primary/50 hover:text-primary'
                } ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {guidedStep === 3 && (
          <GuidedTooltip
            step={3}
            title="Mapa de Batalha"
            description="Clique nesta aba para classificar zonas eleitorais. Adicione candidatos e veja onde atacar e defender."
            onNext={nextStep}
            onSkip={skipTour}
          />
        )}
        {guidedStep === 4 && (
          <GuidedTooltip
            step={4}
            title="Simulador de Cenários"
            description="Clique aqui para simular 'e se' - alianças, crises, mudanças de posição. Veja o impacto em pontos."
            onNext={nextStep}
            onSkip={skipTour}
          />
        )}
      </div>

      {/* Active Panel */}
      {radar.activeTab === 'thermometer' && (
        <ThermometerPanel
          result={radar.thermometer}
          loading={radar.thermometerLoading}
          onGenerate={(name, party) => radar.generateThermometerData(name, party)}
          guidedStep={guidedStep}
          onTourNext={nextStep}
          onTourSkip={skipTour}
        />
      )}

      {radar.activeTab === 'battlemap' && (
        <BattleMapPanel
          result={radar.battleMap}
          loading={radar.battleMapLoading}
          onGenerate={candidates => radar.generateBattleMapData(candidates)}
        />
      )}

      {radar.activeTab === 'simulator' && (
        <SimulatorPanel
          result={radar.simulator}
          loading={radar.simulatorLoading}
          onSimulate={scenario => radar.runSimulation(scenario)}
        />
      )}

      {radar.activeTab === 'earlywarning' && (
        <EarlyWarningPanel
          result={radar.earlyWarnings}
          loading={radar.earlyWarningLoading}
          onCheck={() => radar.checkEarlyWarnings([], [])}
        />
      )}

      {/* Error Display */}
      {radar.error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-400 text-lg mt-0.5">error</span>
          <div>
            <p className="text-sm font-bold text-red-400">Erro</p>
            <p className="text-xs text-text-body">{radar.error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarPreditivo;
