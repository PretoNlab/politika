
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
  const [showChat, setShowChat] = useState(() => {
    if (!chatKey) return false;
    try {
      const saved = sessionStorage.getItem(chatKey);
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch { return false; }
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persist chat to sessionStorage
  useEffect(() => {
    if (chatKey && chatMessages.length > 0) {
      sessionStorage.setItem(chatKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, chatKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  if (fetchError) {
    return <Navigate to="/" />;
  }

  if (fetchLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Carregando análise...</p>
      </div>
    );
  }

  if (!result) {
    return <Navigate to="/" />;
  }

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
    setShowChat(true);

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
      {/* Left Column: Report */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-slate-500 hover:text-primary text-sm flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm">home</span>
              Dashboard
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Análise @{handle}</span>
          </div>
          {analysisId && <ShareToolbar analysisId={analysisId} type="insight" />}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Relatório de Inteligência</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {result.headline}
              </h2>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* Tone & Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Linguagem Dominante</h4>
                <p className="text-slate-900 dark:text-white font-medium">{result.tone}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-700 text-[11px] rounded border border-slate-200 dark:border-slate-600">#{kw}</span>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ressonância</h4>
                <p className="text-slate-900 dark:text-white font-medium">{result.resonance}</p>
              </div>
            </div>

            {/* Strategic Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">thumb_up</span> Aliados Potenciais
                </h3>
                <div className="space-y-3">
                  {result.compatibleGroups.map((g, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{g.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{g.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-orange-600 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">block</span> Barreiras
                </h3>
                <div className="space-y-3">
                  {result.ignoredGroups.map((g, i) => (
                    <div key={i} className="p-3 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{g.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{g.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Psychological Triggers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600 uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">psychology</span> Gatilhos Psicológicos (Expertise AI)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.psychologicalTriggers.map((t, i) => (
                  <div key={i} className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                    <div className="mt-1 size-2 rounded-full bg-indigo-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase mb-1">{t.trigger}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t.application}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Move */}
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">rocket_launch</span> Próximo Passo Sugerido
              </h3>
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {result.nextBestMove}
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Questions (Chips) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interrogar Análise</h4>
          <div className="flex flex-wrap gap-2">
            {result.suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Chat Drawer */}
      <div className={`lg:w-[400px] flex flex-col h-[600px] lg:h-auto lg:sticky lg:top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all ${showChat ? 'opacity-100 scale-100' : 'opacity-50 grayscale scale-[0.98]'}`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">neurology</span>
            <span className="font-bold">Chat de Estratégia</span>
          </div>
          {!showChat && <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-1 rounded">Offline</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
              <span className="material-symbols-outlined text-4xl">forum</span>
              <p className="text-sm">Selecione uma pergunta acima ou digite algo para iniciar o debate estratégico.</p>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(userInput); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Perguntar à IA..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm p-3 focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isTyping}
              className="size-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsightsDetail;
