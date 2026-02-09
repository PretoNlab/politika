import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { usePoliticalAnalysis } from '../hooks/usePoliticalAnalysis';
import { useNews } from '../hooks/useNews';
import { supabase } from '../lib/supabase';
import { LOADING_STEPS } from '../constants';

const Dashboard: React.FC = () => {
  const [handles, setHandles] = useState<string[]>(['']);
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const stepTimerRef = useRef<number | null>(null);

  // Custom hooks
  const { analyzeCandidate, compareCandidates, loading } = usePoliticalAnalysis();
  const { news, loading: loadingNews } = useNews({
    region: activeWorkspace?.region,
    watchwords: activeWorkspace?.watchwords || [],
    limit: 3
  });

  // Load history from Supabase
  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setHistory(data || []);
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, []);

  const saveToHistory = async (type: 'insight' | 'comparison', handle: string, result: any) => {
    if (!user) return;

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
      }
    } catch (e) {
      console.error('Failed to save analysis:', e);
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

    startStepper();

    try {
      if (activeHandles.length === 1) {
        const result = await analyzeCandidate(activeHandles[0]);
        if (result) {
          saveToHistory('insight', activeHandles[0], result);
          navigate('/insight-detail', { state: { result, handle: activeHandles[0] } });
        }
      } else {
        const result = await compareCandidates(activeHandles);
        if (result) {
          saveToHistory('comparison', activeHandles.join(' vs '), result);
          navigate('/comparison-detail', { state: { result } });
        }
      }
    } finally {
      stopStepper();
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
          Centro de Comando
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Análise estratégica de perfis e disputas políticas
        </p>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-3xl">person_search</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nova Análise</h2>
        </div>

        <div className="space-y-4">
          {handles.map((handle, index) => (
            <div key={index} className="flex gap-3">
              <input
                type="text"
                placeholder={index === 0 ? "Digite @handle ou nome do candidato" : `Candidato ${index + 1}`}
                value={handle}
                onChange={(e) => handleUpdateHandle(index, e.target.value)}
                className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg focus:ring-2 focus:ring-primary/20 transition-all"
                disabled={loading}
              />
              {handles.length > 1 && (
                <button
                  onClick={() => setHandles(handles.filter((_, i) => i !== index))}
                  className="px-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {handles.length < 3 && (
          <button
            onClick={handleAddCompetitor}
            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all font-bold"
            disabled={loading}
          >
            <span className="material-symbols-outlined align-middle mr-2">add</span>
            Adicionar Adversário ({handles.length}/3)
          </button>
        )}

        <button
          onClick={handleAnalysis}
          disabled={loading || handles.every(h => !h.trim())}
          className="w-full py-5 bg-primary hover:opacity-90 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{LOADING_STEPS[stepIndex].label}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">analytics</span>
              {handles.length === 1 ? 'Analisar Perfil' : 'Comparar Candidatos'}
            </>
          )}
        </button>

        {loading && (
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              {LOADING_STEPS[stepIndex].hint}
            </p>
          </div>
        )}
      </div>

      {/* Recent News */}
      {activeWorkspace && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">newspaper</span>
              Notícias Recentes - {activeWorkspace.region}
            </h3>
          </div>

          {loadingNews ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-800 h-24 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid gap-4">
              {news.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                        {item.title.split(' - ')[0]}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{item.source}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                      arrow_outward
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Nenhuma notícia encontrada para esta região
            </p>
          )}
        </div>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Análises Recentes
            </h3>
            <Link to="/history" className="text-primary hover:underline text-sm font-bold">
              Ver todas
            </Link>
          </div>

          <div className="grid gap-3">
            {history.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'insight') {
                    navigate('/insight-detail', { state: { result: item.result, handle: item.handle } });
                  } else {
                    navigate('/comparison-detail', { state: { result: item.result } });
                  }
                }}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-primary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    {item.type === 'insight' ? 'person' : 'group'}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.handle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                    {item.type === 'insight' ? 'Individual' : 'Comparativa'}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
