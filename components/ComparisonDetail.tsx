
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link, Navigate } from 'react-router-dom';
import { ComparativeAnalysis } from '../types';
import { supabase } from '../lib/supabase';
import ShareToolbar from './ShareToolbar';
import SpotlightCard from './ui/SpotlightCard';

const ComparisonDetail: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const locationState = location.state as { result: ComparativeAnalysis } | null;

  const [result, setResult] = useState<ComparativeAnalysis | null>(locationState?.result || null);
  const [analysisId, setAnalysisId] = useState<string>(id || '');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch from Supabase if no location.state but we have an ID
  useEffect(() => {
    if (result) return;
    if (!id) {
      setFetchError(true);
      return;
    }

    const fetchAnalysis = async () => {
      setFetchLoading(true);
      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setFetchError(true);
          return;
        }

        setResult(data.result as ComparativeAnalysis);
        setAnalysisId(data.id);
      } catch {
        setFetchError(true);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, result]);

  if (fetchError) return <Navigate to="/" />;

  if (fetchLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-subtle">Carregando análise comparativa...</p>
      </div>
    );
  }

  if (!result || !result.candidates || result.candidates.length === 0) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-12 animate-reveal">
      {/* Breadcrumb & Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-text-subtle hover:text-primary text-sm flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm">home</span>
              Dashboard
            </Link>
            <span className="text-text-subtle/50 text-xs">/</span>
            <span className="text-text-heading text-sm font-semibold">Battle Card Comparativo</span>
          </div>
          {analysisId && <ShareToolbar analysisId={analysisId} type="comparison" />}
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-text-heading flex items-center gap-3 tracking-tighter">
              Módulo de Confronto
            </h2>
            <p className="text-sm text-text-subtle font-medium">Battle Card Analítico de Precisão</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
            <span className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(19,109,236,0.5)]"></span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Inteligência Estratégica Ativa</span>
          </div>
        </div>
      </header>

      {/* Profile Overview (The "Fighters") */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {result.candidates.map((c, idx) => (
          <SpotlightCard
            key={idx}
            className={`relative p-8 ${idx === 0
              ? 'border-primary ring-1 ring-primary/20 shadow-md'
              : ''
              }`}
          >
            {idx === 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-text-heading text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                Seu Candidato
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-6 pt-4">
              <div className={`size-20 rounded-full flex items-center justify-center text-2xl transition-transform duration-500 hover:scale-110 ${idx === 0 ? 'bg-primary/10 text-primary' : 'bg-surface text-text-subtle border border-border-light'
                }`}>
                <span className="material-symbols-outlined text-4xl">{idx === 0 ? 'shield_person' : 'person_search'}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-heading tracking-tighter">@{c.handle.replace('@', '')}</h3>
                <p className="text-[10px] font-black text-text-subtle uppercase tracking-widest mt-1">{c.profileType}</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 text-left">
                <div className="p-4 rounded-3xl bg-surface border border-border-light">
                  <p className="text-[9px] text-text-subtle uppercase font-black mb-1.5 tracking-widest">Tendência</p>
                  <p className="text-xs font-bold text-text-heading flex items-center gap-1.5">
                    {c.sentimentTrend === 'Crescente' && <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>}
                    {c.sentimentTrend === 'Em queda' && <span className="material-symbols-outlined text-red-500 text-sm">trending_down</span>}
                    {c.sentimentTrend}
                  </p>
                </div>
                <div className="p-4 rounded-3xl bg-surface border border-border-light">
                  <p className="text-[9px] text-text-subtle uppercase font-black mb-1.5 tracking-widest">Base Forte</p>
                  <p className="text-xs font-bold text-text-heading truncate">{c.regionalStrength}</p>
                </div>
              </div>

              <div className={`w-full p-5 rounded-3xl text-left ${idx === 0 ? 'bg-red-50 border border-red-100' : 'bg-surface border border-border-light'
                }`}>
                <p className={`text-[9px] font-black uppercase mb-1.5 tracking-widest ${idx === 0 ? 'text-red-500' : 'text-text-subtle'}`}>Ponto de Ataque</p>
                <p className={`text-sm font-bold leading-tight ${idx === 0 ? 'text-red-950' : 'text-text-heading'}`}>{c.mainVulnerability}</p>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Comparison Grid (Pillars) */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-text-heading flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Comparativo de Domínio de Pauta
        </h3>

        <div className="grid grid-cols-1 gap-6">
          {result.confrontationPillars.map((p, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] border border-border-light overflow-hidden shadow-sm flex flex-col md:flex-row transition-all hover:shadow-md">
              <div className="md:w-1/4 p-8 bg-surface border-r border-border-light flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Pilastro de Análise</span>
                <h4 className="text-base font-black text-text-heading leading-tight mb-3">{p.pillar}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-subtle">
                  <span className="material-symbols-outlined text-sm text-primary">verified</span>
                  Domínio: @{p.winner_handle.replace('@', '')}
                </div>
              </div>
              <div className="md:w-3/4 p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-text-subtle uppercase tracking-widest">Posicionamento Estratégico</p>
                  <p className="text-sm text-text-subtle leading-relaxed italic border-l-2 border-primary/30 pl-4">{p.candidateA_status}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-text-subtle uppercase tracking-widest">Veredito do Radar</p>
                  <p className="text-sm font-bold text-text-heading leading-relaxed">{p.analysis}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winning Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <SpotlightCard className="p-10 group bg-surface border border-border-light">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-9xl">explore</span>
          </div>
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500">visibility_off</span>
              <h3 className="font-black uppercase tracking-widest text-sm text-amber-600">O Vácuo Estratégico</h3>
            </div>
            <p className="text-xl font-medium leading-relaxed text-text-heading">
              {result.strategicVoid}
            </p>
            <div className="pt-4 flex items-center gap-2 text-text-subtle text-xs">
              <span className="material-symbols-outlined text-sm">location_on</span>
              Foco Regional: <span className="text-text-heading font-bold">{result.regionalBattleground}</span>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-10 group border border-primary/20 ring-1 ring-primary/5 shadow-lg bg-white">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-primary group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined text-9xl">bolt</span>
          </div>
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">rocket_launch</span>
              <h3 className="font-black uppercase tracking-widest text-sm text-primary">A Jogada de Vitória</h3>
            </div>
            <p className="text-3xl font-black leading-tight tracking-tight text-text-heading">
              {result.winningMove}
            </p>
            <button className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md">
              <span className="material-symbols-outlined">description</span>
              Baixar Plano de Execução
            </button>
          </div>
        </SpotlightCard>
      </div>

      {/* Psychological Leverage (Expertise AI) */}
      <SpotlightCard className="p-10 border border-indigo-100 bg-indigo-50/50 shadow-sm relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-500 transition-transform group-hover:rotate-12">
          <span className="material-symbols-outlined text-9xl">psychology</span>
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-indigo-600">target</span>
            <h3 className="font-black uppercase tracking-widest text-sm text-indigo-600">Alavancagem Psicológica (Expertise AI)</h3>
          </div>
          <p className="text-xl font-medium leading-relaxed italic text-indigo-950">
            "{result.psychologicalLeverage}"
          </p>
        </div>
      </SpotlightCard>

      <div className="flex justify-center py-10">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-8 py-4 bg-surface border border-border-light hover:border-primary/50 rounded-2xl font-bold transition-all text-text-heading shadow-sm"
        >
          <span className="material-symbols-outlined">print</span>
          Exportar Comparativo em PDF
        </button>
      </div>
    </div>
  );
};

export default ComparisonDetail;
