import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { usePoliticalAnalysis } from '../hooks/usePoliticalAnalysis';
import { useNews } from '../hooks/useNews';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../lib/supabase';
import { LOADING_STEPS } from '../constants';
import { useGenerationStore } from '../store/generationStore';
import { useLifecycleStore } from '../store/lifecycleStore';
import SpotlightCard from '../components/ui/SpotlightCard';
import { useTSECandidateSearch } from '../hooks/useTSECandidateSearch';
import type { TseElectionResult } from '../types';


// Formata número de votos de forma legível
const formatVotes = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(1)}k`
    : String(v);

// Agrupa resultados TSE por candidato (nome + partido), listando todos os anos
function groupByCandidateName(results: TseElectionResult[]) {
  const map = new Map<string, TseElectionResult[]>();
  for (const r of results) {
    const key = `${r.candidate_name}|${r.party}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries()).map(([key, rows]) => ({
    key,
    candidate_name: rows[0].candidate_name,
    party: rows[0].party,
    state: rows[0].state,
    rows: rows.sort((a, b) => b.election_year - a.election_year),
    latestYear: rows[0].election_year,
    latestVotes: rows[0].votes,
    latestMunicipality: rows[0].municipality,
    latestType: rows[0].election_type,
  }));
}

const Dashboard: React.FC = () => {
  const [handles, setHandles] = useState<string[]>(['']);
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const stepTimerRef = useRef<number | null>(null);

  // Custom hooks
  const { analyzeCandidate, compareCandidates, loading } = usePoliticalAnalysis();
  // State filter omitido: workspace guarda nome completo ('Bahia') mas TSE usa sigla ('BA')
  const { query: tseQuery, setQuery: setTseQuery, results: tseRaw, isLoading: tseLoading, error: tseError, clear: clearTse } = useTSECandidateSearch();
  const { isGenerating, generatingHandle, initialData, clearState } = useGenerationStore();
  const completeStep = useLifecycleStore(s => s.completeStep);
  const incrementTotalAnalyses = useLifecycleStore(s => s.incrementTotalAnalyses);
  const { news } = useNews({
    region: activeWorkspace?.region,
    watchwords: activeWorkspace?.watchwords || [],
    limit: 100
  });

  // PLG Aha Moment handler
  useEffect(() => {
    if (initialData && generatingHandle) {
      const dataToPass = initialData;
      const handleToPass = generatingHandle;

      // Clear the store so it doesn't fire again on navigation back
      clearState();

      // Save to history and navigate with the persisted ID
      (async () => {
        const savedId = await saveToHistory('insight', handleToPass, dataToPass);
        const path = savedId ? `/insight-detail/${savedId}` : '/insight-detail';
        navigate(path, { state: { result: dataToPass, handle: handleToPass } });
      })();
    }
  }, [initialData, generatingHandle, navigate, clearState]);

  // Load history from Supabase — filtrado pelo workspace ativo
  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        let query = supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Filtra pelo workspace ativo para evitar cruzamento entre projetos
        if (activeWorkspace?.id) {
          query = query.eq('workspace_id', activeWorkspace.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setHistory(data || []);
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user, activeWorkspace?.id]); // Recarrega ao trocar workspace

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, []);

  const saveToHistory = async (type: 'insight' | 'comparison', handle: string, result: any): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          workspace_id: activeWorkspace?.id || null,
          type,
          handle,
          result,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setHistory(prev => [data, ...prev].slice(0, 5));
        // Lifecycle tracking
        completeStep('first_analysis');
        incrementTotalAnalyses();
        return data.id;
      }
      return null;
    } catch (e) {
      console.error('Failed to save analysis:', e);
      return null;
    }
  };
  const handleClearHistory = async () => {
    if (!user) return;
    if (!window.confirm('Deseja realmente apagar todo o histórico de análises? Essa ação não pode ser desfeita.')) return;
    try {
      setHistoryLoading(true);
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history:', e);
      alert('Erro ao apagar o histórico');
    } finally {
      setHistoryLoading(false);
    }
  };

  const startStepper = () => {
    setStepIndex(0);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = window.setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);
  };

  const stopStepper = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const handleAddCompetitor = () => {
    if (handles.length < 3) setHandles([...handles, '']);
  };

  const handleUpdateHandle = (index: number, value: string) => {
    const newHandles = [...handles];
    newHandles[index] = value;
    setHandles(newHandles);
  };

  const handleAnalysis = async () => {
    const activeHandles = handles.filter(h => h.trim() !== '');
    if (activeHandles.length === 0) return;

    const analysisType = activeHandles.length === 1 ? 'individual' : 'comparison';
    const startTime = Date.now();

    track('analysis_requested', {
      type: analysisType,
      handle_count: activeHandles.length,
      workspace_id: activeWorkspace?.id,
      workspace_region: activeWorkspace?.region,
    });

    startStepper();

    try {
      if (activeHandles.length === 1) {
        const result = await analyzeCandidate(activeHandles[0]);
        if (result) {
          track('analysis_completed', {
            type: 'individual',
            handle: activeHandles[0],
            workspace_id: activeWorkspace?.id,
            duration_ms: Date.now() - startTime,
          });
          const savedId = await saveToHistory('insight', activeHandles[0], result);
          const path = savedId ? `/insight-detail/${savedId}` : '/insight-detail';
          navigate(path, { state: { result, handle: activeHandles[0] } });
        }
      } else {
        const result = await compareCandidates(activeHandles);
        if (result) {
          track('analysis_completed', {
            type: 'comparison',
            handle: activeHandles.join(' vs '),
            workspace_id: activeWorkspace?.id,
            duration_ms: Date.now() - startTime,
          });
          const savedId = await saveToHistory('comparison', activeHandles.join(' vs '), result);
          const path = savedId ? `/comparison-detail/${savedId}` : '/comparison-detail';
          navigate(path, { state: { result } });
        }
      }
    } finally {
      stopStepper();
    }
  };

  const tseGroups = groupByCandidateName(tseRaw);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-heading mb-2">
          Resumo da Operação
        </h1>
        <p className="text-text-body text-lg">
          Visão consolidada do cenário em tempo real para tomada de decisão estratégica.
        </p>
      </div>

      {/* Main Analysis Input Card (Centered and Prominent) */}
      <SpotlightCard className="p-8 lg:p-12 mb-10 max-w-4xl mx-auto bg-white border border-border-light shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="size-16 rounded-2xl bg-white shadow-sm border border-border-light flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined text-4xl">person_search</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-text-heading tracking-tight">Nova Análise Estratégica</h2>
            <p className="text-text-body mt-2 text-lg">Insira o @handle para traçar o perfil ou até 3 para comparar.</p>
          </div>

          <div className="w-full space-y-4 max-w-2xl mt-4">
            {handles.map((handle, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder={index === 0 ? "Digite @handle ou nome do candidato" : `Candidato ${index + 1}`}
                  value={handle}
                  onChange={(e) => handleUpdateHandle(index, e.target.value)}
                  className="flex-1 px-6 py-4 bg-white border border-border-light rounded-2xl text-lg text-text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none shadow-sm"
                  disabled={loading}
                />
                {handles.length > 1 && (
                  <button
                    onClick={() => setHandles(handles.filter((_, i) => i !== index))}
                    className="px-4 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl pt-2">
            {handles.length < 3 && (
              <button
                onClick={handleAddCompetitor}
                className="flex-[0.3] py-4 border border-dashed border-border-light bg-surface rounded-2xl text-text-subtle hover:border-primary hover:text-primary transition-all font-bold flex items-center justify-center"
                disabled={loading}
              >
                <span className="material-symbols-outlined align-middle mr-2">add</span>
              </button>
            )}

            <button
              onClick={handleAnalysis}
              disabled={loading || handles.every(h => !h.trim())}
              className="flex-1 py-4 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="size-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{LOADING_STEPS[stepIndex].label}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">analytics</span>
                  {handles.filter(h => h.trim() !== '').length <= 1 ? 'Analisar Perfil' : 'Comparar Candidatos'}
                </>
              )}
            </button>
          </div>

          {loading && (
            <p className="text-sm font-medium text-text-subtle animate-pulse mt-4">
              {LOADING_STEPS[stepIndex].hint}
            </p>
          )}
        </div>
      </SpotlightCard>

      {/* PLG AHA MOMENT: Loading State for Background Generation */}
      {isGenerating && (
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-[3rem] text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden max-w-4xl mx-auto mb-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
            <div className="h-full bg-primary animate-progress-indeterminate"></div>
          </div>
          <div className="size-16 bg-white shadow-sm border border-border-light text-primary rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <span className="material-symbols-outlined text-3xl animate-pulse">neurology</span>
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          </div>
          <h3 className="text-3xl font-bold text-text-heading tracking-tight mt-6">
            Gerando Dossiê Estratégico...
          </h3>
          <p className="text-text-body text-lg max-w-xl mx-auto">
            A Inteligência Artificial está analisando o histórico, o tom dominante e as vulnerabilidades de <strong className="text-primary font-bold">@{generatingHandle}</strong>. Você será redirecionado em instantes.
          </p>
        </div>
      )}

      {/* TSE Candidate Search */}
      <SpotlightCard className="p-8 max-w-4xl mx-auto bg-white border border-border-light shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">how_to_vote</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-heading tracking-tight">Busca TSE — Candidatos</h2>
            <p className="text-sm text-text-subtle">Pesquise pelo nome no banco de dados oficial do TSE</p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-subtle text-xl pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Ex: João Silva, Maria Santos..."
            value={tseQuery}
            onChange={e => { setTseQuery(e.target.value); setExpandedCandidate(null); }}
            className="w-full pl-11 pr-10 py-3.5 bg-surface border border-border-light rounded-2xl text-text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none"
          />
          {tseQuery && (
            <button
              onClick={() => { clearTse(); setExpandedCandidate(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-heading transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* States */}
        {tseLoading && (
          <div className="flex items-center gap-2 text-sm text-text-subtle py-4">
            <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Buscando...
          </div>
        )}

        {tseError && (
          <p className="text-sm text-red-500 py-2">{tseError}</p>
        )}

        {!tseLoading && tseQuery.trim().length >= 2 && tseGroups.length === 0 && !tseError && (
          <p className="text-sm text-text-subtle py-4 text-center">Nenhum candidato encontrado. Os dados TSE podem ainda não estar carregados para esta região.</p>
        )}

        {/* Results */}
        {tseGroups.length > 0 && (
          <div className="space-y-2">
            {tseGroups.map(group => (
              <div key={group.key} className="border border-border-light rounded-2xl overflow-hidden">
                {/* Candidate header row */}
                <button
                  onClick={() => setExpandedCandidate(prev => prev === group.key ? null : group.key)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 text-xs font-black">
                      {group.party.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-heading truncate capitalize">
                        {group.candidate_name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-text-subtle">
                        {group.party} · {group.latestMunicipality} · {group.rows.length} eleição{group.rows.length > 1 ? 'ões' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold hidden sm:block">
                      {group.latestVotes > 0
                        ? `${formatVotes(group.latestVotes)} votos em ${group.latestYear}`
                        : group.latestYear}
                    </span>
                    <span className={`material-symbols-outlined text-text-subtle transition-transform ${expandedCandidate === group.key ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Expanded: election history */}
                {expandedCandidate === group.key && (
                  <div className="border-t border-border-light bg-surface px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <p className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-3">Histórico Eleitoral</p>
                    <div className="space-y-2">
                      {group.rows.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-white border border-border-light rounded-xl px-4 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-black text-primary shrink-0">{r.election_year}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-text-heading truncate">{r.election_type}</p>
                              <p className="text-xs text-text-subtle truncate">{r.municipality} · Nº {r.candidate_number}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {r.votes > 0 ? (
                              <>
                                <p className="text-sm font-black text-text-heading">{formatVotes(r.votes)}</p>
                                <p className="text-xs text-text-subtle">votos</p>
                              </>
                            ) : r.coalition ? (
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${r.coalition === 'ELEITO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-surface text-text-subtle border border-border-light'}`}>
                                {r.coalition}
                              </span>
                            ) : (
                              <p className="text-xs text-text-subtle">cadastrado</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* CTA: usar este candidato na análise IA */}
                    <button
                      onClick={() => {
                        const name = group.candidate_name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                        setHandles([name]);
                        clearTse();
                        setExpandedCandidate(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="mt-2 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">analytics</span>
                      Analisar {group.candidate_name.split(' ')[0].charAt(0).toUpperCase() + group.candidate_name.split(' ')[0].slice(1).toLowerCase()} com IA
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!tseQuery && (
          <p className="text-xs text-text-subtle text-center py-2">
            Digite pelo menos 2 caracteres para buscar
            {activeWorkspace?.state ? ` · Filtrado por ${activeWorkspace.state}` : ''}
          </p>
        )}
      </SpotlightCard>

      {/* Main Content Area (History) */}
      <div className="mt-6">
        <SpotlightCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-heading tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Análises Recentes
            </h2>
            <div className="flex items-center gap-4">
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  disabled={historyLoading}
                  className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Limpar Histórico
                </button>
              )}
              <Link to="/analyze" className="text-sm font-bold text-primary hover:text-blue-700 transition-colors flex items-center gap-1">
                Ver Todos <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface h-20 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {history.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'insight') {
                      navigate(`/insight-detail/${item.id}`, { state: { result: item.result, handle: item.handle } });
                    } else {
                      navigate(`/comparison-detail/${item.id}`, { state: { result: item.result } });
                    }
                  }}
                  className="p-5 bg-surface border border-border-light rounded-2xl flex items-center justify-between hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-white border border-border-light flex items-center justify-center group-hover:bg-primary-soft transition-colors text-text-subtle group-hover:text-primary shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        {item.type === 'insight' ? 'person' : 'group'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-heading group-hover:text-primary transition-colors text-lg truncate pr-2">{item.handle}</p>
                      <p className="text-sm font-medium text-text-subtle">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs bg-white border border-border-light text-text-heading px-3 py-1.5 rounded-full font-bold shadow-sm hidden sm:block">
                      {item.type === 'insight' ? 'Individual' : 'Comparativa'}
                    </span>
                    <span className="material-symbols-outlined text-text-subtle group-hover:translate-x-1 group-hover:text-primary transition-all">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border-light rounded-2xl bg-surface">
              <span className="material-symbols-outlined text-4xl text-text-subtle mb-4">analytics</span>
              <p className="text-lg font-bold text-text-heading">Nenhuma análise no histórico</p>
              <p className="text-sm text-text-body max-w-xs mt-2">Realize uma nova análise no campo principal para popular seu QG.</p>
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
};

export default Dashboard;
