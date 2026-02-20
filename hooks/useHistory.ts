import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import type { AnalysisHistoryItem, DetailedAnalysis, ComparativeAnalysis } from '../types';
import toast from 'react-hot-toast';

interface UseHistoryReturn {
    history: AnalysisHistoryItem[];
    loading: boolean;
    saveAnalysis: (
        type: 'insight' | 'comparison',
        handle: string,
        result: DetailedAnalysis | ComparativeAnalysis
    ) => Promise<boolean>;
    deleteAnalysis: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useHistory = (): UseHistoryReturn => {
    const { user } = useAuth();
    const { activeWorkspace } = useWorkspace();
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            let query = supabase
                .from('analyses')
                .select('*')
                .order('created_at', { ascending: false });

            if (activeWorkspace?.id) {
                query = query.eq('workspace_id', activeWorkspace.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setHistory(data as AnalysisHistoryItem[]);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    }, [user, activeWorkspace?.id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const saveAnalysis = async (
        type: 'insight' | 'comparison',
        handle: string,
        result: DetailedAnalysis | ComparativeAnalysis
    ) => {
        if (!user) {
            toast.error('Você precisa estar logado para salvar');
            return false;
        }

        try {
            const { error } = await supabase.from('analyses').insert({
                user_id: user.id,
                workspace_id: activeWorkspace?.id || null,
                type,
                handle,
                result
            });

            if (error) throw error;

            toast.success('Análise salva no histórico');
            fetchHistory(); // Refresh list
            return true;
        } catch (error) {
            console.error('Error saving analysis:', error);
            toast.error('Erro ao salvar análise');
            return false;
        }
    };

    const deleteAnalysis = async (id: string) => {
        try {
            const { error } = await supabase
                .from('analyses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Análise removida');
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error deleting analysis:', error);
            toast.error('Erro ao remover análise');
        }
    };

    return {
        history,
        loading,
        saveAnalysis,
        deleteAnalysis,
        refresh: fetchHistory
    };
};
