
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DetailedAnalysis } from '../types';
import { chatWithAnalysis } from '../services/geminiClient';
import { supabase } from '../lib/supabase';
import ShareToolbar from './ShareToolbar';
import { useUsageStore } from '../store/usageStore';
import { useUsageGate } from '../hooks/useUsageGate';
import { useLifecycleStore } from '../store/lifecycleStore';

const CHAT_STORAGE_PREFIX = 'politika_chat_';

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

  const incrementUsage = useUsageStore(s => s.increment);
  const chatGate = useUsageGate('chats');
  const completeLifecycleStep = useLifecycleStore(s => s.completeStep);

  const chatKey = handle ? `${CHAT_STORAGE_PREFIX}${handle}` : '';

  const [chatMessages, setChatMessages] = useState<{ role: string, text: string }[]>(() => {
    if (!chatKey) return [];
    try {
      const saved = sessionStorage.getItem(chatKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatKey && chatMessages.length > 0) {
      sessionStorage.setItem(chatKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, chatKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

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

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!chatGate.canProceed) {
      toast.error(`Limite mensal de chat atingido (${chatGate.usage}/${chatGate.limit})`);
      return;
    }
    const newMessages = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsTyping(true);
    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.text
      }));
      const response = await chatWithAnalysis(handle, result, text, history) as string;
      incrementUsage('chats');
      completeLifecycleStep('use_chat');
      setChatMessages([...newMessages, { role: 'assistant', text: response || 'Desculpe, tive um problema ao processar.' }]);
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar mensagem';
      toast.error(errorMsg);
      setChatMessages([...newMessages, { role: 'assistant', text: 'Erro ao processar. Tente novamente.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">

      {/* ── LEFT: Report ── */}
      <div className="flex-1 min-w-0 space-y-6">

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
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest mb-4">
              Relatório de Inteligência
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-snug">
              {result.headline}
            </h1>
          </div>

          {/* Card Body */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">

            {/* Section: Linguagem + Ressonância */}
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Linguagem Dominante</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{result.tone}</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] rounded-full border border-slate-200 dark:border-slate-700">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ressonância</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.resonance}</p>
              </div>
            </div>

            {/* Section: Aliados + Barreiras */}
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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

            {/* Section: Gatilhos */}
            <div className="px-8 py-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Gatilhos Psicológicos
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.psychologicalTriggers.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-primary uppercase tracking-wide mb-1">{t.trigger}</p>
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
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Próximo Passo Sugerido</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.nextBestMove}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── RIGHT: Chat Panel ── */}
      <div className="lg:w-[380px] shrink-0 flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">

        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary">neurology</span>
            <span className="font-bold text-slate-900 dark:text-white">Chat de Estratégia</span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-40">
              <span className="material-symbols-outlined text-3xl">forum</span>
              <p className="text-sm">Selecione uma pergunta ou comece o debate estratégico.</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions (inside chat panel) */}
        {result.suggestedQuestions?.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Perguntas Sugeridas</p>
            <div className="flex flex-col gap-1.5">
              {result.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(userInput); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Perguntar à IA..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isTyping}
              className="size-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default InsightsDetail;
