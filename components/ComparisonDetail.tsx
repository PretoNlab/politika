
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link, Navigate } from 'react-router-dom';
import { ComparativeAnalysis } from '../types';
import { supabase } from '../lib/supabase';
import ShareToolbar from './ShareToolbar';

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
        <p className="text-sm font-medium text-slate-500">Carregando análise comparativa...</p>
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
            <Link to="/" className="text-slate-500 hover:text-primary text-sm flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm">home</span>
              Dashboard
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Battle Card Comparativo</span>
          </div>
          {analysisId && <ShareToolbar analysisId={analysisId} type="comparison" />}
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-text-heading dark:text-white flex items-center gap-3 tracking-tighter">
              Módulo de Confronto
            </h2>
            <p className="text-sm text-text-subtle font-medium">Battle Card Analítico de Precisão</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
            <span className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(19,109,236,0.8)]"></span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Inteligência Estratégica Ativa</span>
          </div>
        </div>
      </header>

      {/* Profile Overview (The "Fighters") */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {result.candidates.map((c, idx) => (
          <div
            key={idx}
            className={`relative p-8 rounded-[3rem] border transition-all duration-500 hover:-translate-y-2 ${idx === 0
              ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20 z-10'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
          >
            {idx === 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-xl border border-white/20">
                Seu Candidato
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-6 pt-4">
              <div className={`size-20 rounded-full flex items-center justify-center text-2xl transition-transform duration-500 hover:scale-110 ${idx === 0 ? 'bg-white/10 ring-4 ring-white/5' : 'bg-slate-50 dark:bg-slate-800 text-primary'
                }`}>
                <span className="material-symbols-outlined text-4xl">{idx === 0 ? 'shield_person' : 'person_search'}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tighter">@{c.handle.replace('@', '')}</h3>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 mt-1`}>{c.profileType}</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 text-left">
                <div className={`p-4 rounded-3xl ${idx === 0 ? 'bg-white/10 border border-white/5' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800'}`}>
                  <p className="text-[9px] uppercase font-black opacity-50 mb-1.5 tracking-widest">Tendência</p>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    {c.sentimentTrend === 'Crescente' && <span className="material-symbols-outlined text-emerald-400 text-sm">trending_up</span>}
                    {c.sentimentTrend === 'Em queda' && <span className="material-symbols-outlined text-red-400 text-sm">trending_down</span>}
                    {c.sentimentTrend}
                  </p>
                </div>
                <div className={`p-4 rounded-3xl ${idx === 0 ? 'bg-white/10 border border-white/5' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800'}`}>
                  <p className="text-[9px] uppercase font-black opacity-50 mb-1.5 tracking-widest">Base Forte</p>
                  <p className="text-xs font-bold truncate">{c.regionalStrength}</p>
                </div>
              </div>

              <div className={`w-full p-5 rounded-3xl text-left ${idx === 0 ? 'bg-red-950/30 border border-white/10' : 'bg-red-50/50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20'
                }`}>
                <p className={`text-[9px] font-black uppercase mb-1.5 tracking-widest ${idx === 0 ? 'text-white/60' : 'text-red-600'}`}>Ponto de Ataque</p>
                <p className={`text-sm font-bold leading-tight ${idx === 0 ? 'text-white' : 'text-text-heading dark:text-slate-100'}`}>{c.mainVulnerability}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Grid (Pillars) */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Comparativo de Domínio de Pauta
        </h3>

        <div className="grid grid-cols-1 gap-6">
          {result.confrontationPillars.map((p, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col md:flex-row transition-all hover:shadow-md">
              <div className="md:w-1/4 p-8 bg-slate-50/50 dark:bg-slate-800/20 border-r border-slate-50 dark:border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Pilastro de Análise</span>
                <h4 className="text-base font-black text-text-heading dark:text-white leading-tight mb-3">{p.pillar}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-subtle">
                  <span className="material-symbols-outlined text-sm text-primary">verified</span>
                  Domínio: @{p.winner_handle.replace('@', '')}
                </div>
              </div>
              <div className="md:w-3/4 p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Posicionamento Strategic</p>
                  <p className="text-sm text-text-subtle dark:text-slate-300 leading-relaxed italic border-l-2 border-primary/30 pl-4">{p.candidateA_status}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Veredito do Radar</p>
                  <p className="text-sm font-bold text-text-heading dark:text-white leading-relaxed">{p.analysis}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winning Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div className="p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-9xl">explore</span>
          </div>
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-400">visibility_off</span>
              <h3 className="font-black uppercase tracking-widest text-sm text-amber-400">O Vácuo Estratégico</h3>
            </div>
            <p className="text-xl font-medium leading-relaxed">
              {result.strategicVoid}
            </p>
            <div className="pt-4 flex items-center gap-2 text-slate-400 text-xs">
              <span className="material-symbols-outlined text-sm">location_on</span>
              Foco Regional: <span className="text-white font-bold">{result.regionalBattleground}</span>
            </div>
          </div>
        </div>

        <div className="p-10 rounded-[3rem] bg-primary text-white shadow-2xl shadow-primary/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined text-9xl">bolt</span>
          </div>
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">rocket_launch</span>
              <h3 className="font-black uppercase tracking-widest text-sm text-white/70">A Jogada de Vitória</h3>
            </div>
            <p className="text-3xl font-black leading-tight tracking-tight">
              {result.winningMove}
            </p>
            <button className="px-6 py-3 bg-white text-primary rounded-2xl font-black text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xl">
              <span className="material-symbols-outlined">description</span>
              Baixar Plano de Execução
            </button>
          </div>
        </div>
      </div>

      {/* Psychological Leverage (Expertise AI) */}
      <div className="bg-indigo-900 rounded-[3rem] p-10 text-white border border-indigo-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-9xl">psychology</span>
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-indigo-400">target</span>
            <h3 className="font-black uppercase tracking-widest text-sm text-indigo-400">Alavancagem Psicológica (Expertise AI)</h3>
          </div>
          <p className="text-xl font-medium leading-relaxed italic">
            "{result.psychologicalLeverage}"
          </p>
        </div>
      </div>

      <div className="flex justify-center py-10">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-all"
        >
          <span className="material-symbols-outlined">print</span>
          Exportar Battle Card PDF
        </button>
      </div>
    </div >
  );
};

export default ComparisonDetail;
