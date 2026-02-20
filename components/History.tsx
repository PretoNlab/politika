
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface HistoryEvent {
  id: string;
  type: 'CRISE' | 'INSIGHT' | 'NOTÍCIA' | 'MARCO';
  title: string;
  description: string;
  date: string;
  status: string;
  navigateTo?: string;
  navigationState?: any;
  metrics?: { label: string, value: string };
}

const EXAMPLE_HISTORY: HistoryEvent[] = [
  {
    id: 'example-1',
    type: 'MARCO',
    title: 'Bem-vindo ao Politika',
    description: 'Suas análises aparecerão aqui. Acesse o Dashboard e faça sua primeira análise para começar a construir sua Memória de Guerra.',
    date: 'Agora',
    status: 'Início'
  },
];

const History: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: HistoryEvent[] = data.map((item: any) => ({
            id: item.id,
            type: 'INSIGHT' as const,
            title: item.handle || 'Análise',
            description: item.type === 'comparison'
              ? `Análise comparativa: ${item.handle}`
              : `Análise individual do perfil ${item.handle}`,
            date: new Date(item.created_at).toLocaleDateString('pt-BR'),
            status: 'Concluído',
            navigateTo: item.type === 'comparison' ? `/comparison-detail/${item.id}` : `/insight-detail/${item.id}`,
            navigationState: item.type === 'comparison'
              ? { result: item.result }
              : { result: item.result, handle: item.handle },
          }));
          setEvents(mapped);
        } else {
          setEvents(EXAMPLE_HISTORY);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
        setEvents(EXAMPLE_HISTORY);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  const handleEventClick = (event: HistoryEvent) => {
    if (event.navigateTo && event.navigationState) {
      navigate(event.navigateTo, { state: event.navigationState });
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-12 animate-reveal">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history_edu</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-display">Inteligência Retroativa</span>
        </div>
        <h1 className="text-5xl font-black text-text-heading dark:text-white tracking-tighter uppercase font-display italic">
          Memória de Guerra
        </h1>
        <p className="text-text-subtle dark:text-slate-400 font-medium max-w-lg">
          A linha do tempo completa da sua campanha. Relembre crises, picos de interesse e decisões tomadas através da análise do Politika.
        </p>
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-text-subtle dark:text-slate-300 uppercase tracking-widest">
            <span className="size-2 bg-emerald-500 rounded-full"></span>
            Contexto: {activeWorkspace?.name || 'Geral'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-text-subtle">Carregando histórico...</p>
          </div>
        </div>
      ) : (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
          {events.map((event, i) => (
            <div key={event.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all`}>
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="material-symbols-outlined text-lg">
                  {event.type === 'CRISE' ? 'warning' : event.type === 'NOTÍCIA' ? 'newspaper' : event.type === 'MARCO' ? 'flag' : 'psychology_alt'}
                </span>
              </div>

              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-101 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${event.type === 'CRISE' ? 'bg-red-100 text-red-600' :
                        event.type === 'NOTÍCIA' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                        {event.type}
                      </span>
                      <time className="text-[10px] font-black italic text-slate-400 tracking-tighter">{event.date}</time>
                    </div>
                    <h3 className="text-xl font-black text-text-heading dark:text-white tracking-tighter uppercase italic">{event.title}</h3>
                  </div>
                  {event.metrics && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{event.metrics.label}</span>
                      <span className="text-sm font-black text-primary italic">{event.metrics.value}</span>
                    </div>
                  )}
                </div>
                <p className="text-text-subtle dark:text-slate-400 text-sm leading-relaxed font-medium">
                  {event.description}
                </p>
                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status: <span className="text-text-heading dark:text-white">{event.status}</span></span>
                  {event.navigateTo && (
                    <button
                      onClick={() => handleEventClick(event)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-10 text-center">
        <button className="px-10 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl">
          Exportar Inteligência Completa
        </button>
      </div>
    </div>
  );
};

export default History;
