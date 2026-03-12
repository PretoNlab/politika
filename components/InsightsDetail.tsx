
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link, Navigate } from 'react-router-dom';
import { DetailedAnalysis } from '../types';
import { supabase } from '../lib/supabase';
import ShareToolbar from './ShareToolbar';

const InsightsDetail: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const locationState = location.state as { result: DetailedAnalysis; handle: string } | null;

  const [result, setResult] = useState<DetailedAnalysis | null>(locationState?.result || null);
  const [handle, setHandle] = useState<string>(locationState?.handle || '');
  const [analysisId, setAnalysisId] = useState<string>(id || '');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (result) return;
    if (!id) { setFetchError(true); return; }

    const fetchAnalysis = async () => {
      setFetchLoading(true);
      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) { setFetchError(true); return; }
        setResult(data.result as DetailedAnalysis);
        setHandle(data.handle || '');
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
        <p className="text-sm font-medium text-slate-500">Carregando análise...</p>
      </div>
    );
  }

  if (!result) return <Navigate to="/" />;

  return (
    <div className="detail-container space-y-6">

      {/* Breadcrumb + Share */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-base">home</span>
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium">Análise @{handle}</span>
        </div>
        {analysisId && <ShareToolbar analysisId={analysisId} type="insight" />}
      </div>

      {/* Main Report Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Relatório de Inteligência
          </span>
          <h1 className="type-page-title dark:text-white leading-snug">
            {result.headline}
          </h1>
        </div>

        {/* Card Body */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">

          {/* Section: Linguagem + Ressonância */}
          <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="type-label mb-2">Linguagem Dominante</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{result.tone}</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-full border border-slate-200 dark:border-slate-700">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="type-label mb-2">Ressonância</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.resonance}</p>
            </div>
          </div>

          {/* Section: Aliados + Barreiras */}
          <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="type-label mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">groups</span>
                Aliados Potenciais
              </p>
              <div className="space-y-2">
                {result.compatibleGroups.map((g, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1.5 size-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{g.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{g.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="type-label mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">block</span>
                Barreiras
              </p>
              <div className="space-y-2">
                {result.ignoredGroups.map((g, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1.5 size-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{g.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{g.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: OSINT / Grounding */}
          {result.recentFindings && result.recentFindings.length > 0 && (
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="type-label text-primary mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">search_insights</span>
                Descobertas Recentes (Inteligência de Rede)
              </p>
              <div className="space-y-3">
                {result.recentFindings.map((finding, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-start gap-3">
                      {finding.verified ? (
                        <div className="mt-0.5 size-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[14px] text-blue-600 dark:text-blue-400">verified</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 size-5 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[14px] text-orange-600 dark:text-orange-400">warning</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{finding.title}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
                          Fonte: {finding.source}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Gatilhos */}
          <div className="px-8 py-6">
            <p className="type-label mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">psychology</span>
              Gatilhos Psicológicos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.psychologicalTriggers.map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="type-label text-primary mb-1">{t.trigger}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.application}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Próximo Passo */}
          <div className="px-8 py-6">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/15">
              <span className="material-symbols-outlined text-primary mt-0.5">rocket_launch</span>
              <div>
                <p className="type-label text-primary mb-1.5">Próximo Passo Sugerido</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.nextBestMove}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default InsightsDetail;
