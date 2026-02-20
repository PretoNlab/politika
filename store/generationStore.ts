import { create } from 'zustand';
import { DetailedAnalysis } from '../types';

interface GenerationState {
    isGenerating: boolean;
    generatingForWorkspaceId: string | null;
    generatingHandle: string | null;
    initialData: DetailedAnalysis | null;
    error: string | null;
    startGeneration: (workspaceId: string, handle: string) => void;
    finishGeneration: (data: DetailedAnalysis) => void;
    failGeneration: (error: string) => void;
    clearState: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
    isGenerating: false,
    generatingForWorkspaceId: null,
    generatingHandle: null,
    initialData: null,
    error: null,
    startGeneration: (workspaceId: string, handle: string) =>
        set({ isGenerating: true, generatingForWorkspaceId: workspaceId, generatingHandle: handle, error: null, initialData: null }),
    finishGeneration: (data: DetailedAnalysis) =>
        set({ isGenerating: false, initialData: data }),
    failGeneration: (error: string) =>
        set({ isGenerating: false, error }),
    clearState: () =>
        set({ isGenerating: false, generatingForWorkspaceId: null, generatingHandle: null, initialData: null, error: null }),
}));
