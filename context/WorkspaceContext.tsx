
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface Workspace {
    id: string;
    name: string;
    region: string;
    watchwords: string[];
    status: 'active' | 'archived';
    createdAt: string;
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    loading: boolean;
    setActiveWorkspace: (workspace: Workspace) => void;
    addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'status'>) => void;
    updateWorkspace: (id: string, updates: Partial<Omit<Workspace, 'id' | 'createdAt'>>) => void;
    deleteWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const ACTIVE_WORKSPACE_KEY = 'politika_active_workspace_id';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    const loadWorkspaces = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped: Workspace[] = (data || []).map(row => ({
                id: row.id,
                name: row.name,
                region: row.region,
                watchwords: row.watchwords || [],
                status: row.status,
                createdAt: row.created_at,
            }));

            setWorkspaces(mapped);

            // Restore active workspace from localStorage preference
            const savedId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
            const active = mapped.find(w => w.id === savedId) || mapped[0] || null;
            setActiveWorkspaceState(active);
        } catch (err: any) {
            console.error('Failed to load workspaces:', err);
            toast.error('Erro ao carregar workspaces');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    const setActiveWorkspace = (workspace: Workspace) => {
        setActiveWorkspaceState(workspace);
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace.id);
    };

    const addWorkspace = async (newWorkspace: Omit<Workspace, 'id' | 'createdAt' | 'status'>) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('workspaces')
                .insert({
                    user_id: user.id,
                    name: newWorkspace.name,
                    region: newWorkspace.region,
                    watchwords: newWorkspace.watchwords,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;

            const workspace: Workspace = {
                id: data.id,
                name: data.name,
                region: data.region,
                watchwords: data.watchwords || [],
                status: data.status,
                createdAt: data.created_at,
            };

            setWorkspaces(prev => [workspace, ...prev]);

            if (!activeWorkspace) {
                setActiveWorkspace(workspace);
            }
        } catch (err: any) {
            console.error('Failed to add workspace:', err);
            toast.error('Erro ao criar workspace');
        }
    };

    const updateWorkspace = async (id: string, updates: Partial<Omit<Workspace, 'id' | 'createdAt'>>) => {
        if (!user) return;

        try {
            const dbUpdates: Record<string, any> = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.region !== undefined) dbUpdates.region = updates.region;
            if (updates.watchwords !== undefined) dbUpdates.watchwords = updates.watchwords;
            if (updates.status !== undefined) dbUpdates.status = updates.status;

            const { error } = await supabase
                .from('workspaces')
                .update(dbUpdates)
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));

            if (activeWorkspace?.id === id) {
                setActiveWorkspaceState(prev => prev ? { ...prev, ...updates } : prev);
            }
        } catch (err: any) {
            console.error('Failed to update workspace:', err);
            toast.error('Erro ao atualizar workspace');
        }
    };

    const deleteWorkspace = async (id: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('workspaces')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setWorkspaces(prev => {
                const updated = prev.filter(w => w.id !== id);
                if (activeWorkspace?.id === id) {
                    const next = updated[0] || null;
                    setActiveWorkspaceState(next);
                    if (next) {
                        localStorage.setItem(ACTIVE_WORKSPACE_KEY, next.id);
                    } else {
                        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
                    }
                }
                return updated;
            });
        } catch (err: any) {
            console.error('Failed to delete workspace:', err);
            toast.error('Erro ao deletar workspace');
        }
    };

    return (
        <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, loading, setActiveWorkspace, addWorkspace, updateWorkspace, deleteWorkspace }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
