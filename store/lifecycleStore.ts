import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LifecycleState {
  onboardingCompleted: boolean;
  completedSteps: string[];
  milestones: string[];
  totalAnalyses: number;
  firstAnalysisAt: string | null;
  pagesVisited: string[];

  completeStep: (stepId: string) => void;
  recordMilestone: (milestoneId: string) => void;
  incrementTotalAnalyses: () => void;
  recordPageVisit: (path: string) => void;
  dismissOnboarding: () => void;
}

export const useLifecycleStore = create<LifecycleState>()(
  persist(
    (set, get) => ({
      onboardingCompleted: false,
      completedSteps: [],
      milestones: [],
      totalAnalyses: 0,
      firstAnalysisAt: null,
      pagesVisited: [],

      completeStep: (stepId: string) => {
        const state = get();
        if (state.completedSteps.includes(stepId)) return;

        const newSteps = [...state.completedSteps, stepId];
        set({ completedSteps: newSteps });
      },

      recordMilestone: (milestoneId: string) => {
        const state = get();
        if (state.milestones.includes(milestoneId)) return;
        set({ milestones: [...state.milestones, milestoneId] });
      },

      incrementTotalAnalyses: () => {
        const state = get();
        set({
          totalAnalyses: state.totalAnalyses + 1,
          firstAnalysisAt: state.firstAnalysisAt || new Date().toISOString(),
        });
      },

      recordPageVisit: (path: string) => {
        const state = get();
        if (state.pagesVisited.includes(path)) return;
        set({ pagesVisited: [...state.pagesVisited, path] });
      },

      dismissOnboarding: () => {
        set({ onboardingCompleted: true });
      },
    }),
    {
      name: 'politika_lifecycle',
    }
  )
);
