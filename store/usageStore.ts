import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsageCategory } from '../constants';

interface UsageState {
  analyses: number;
  comparisons: number;
  crises: number;
  chats: number;
  monthKey: string;
  increment: (category: UsageCategory) => void;
  getUsage: (category: UsageCategory) => number;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      analyses: 0,
      comparisons: 0,
      crises: 0,
      chats: 0,
      monthKey: getCurrentMonthKey(),

      increment: (category: UsageCategory) => {
        const currentMonth = getCurrentMonthKey();
        const state = get();

        // Auto-reset if month changed
        if (state.monthKey !== currentMonth) {
          set({
            analyses: category === 'analyses' ? 1 : 0,
            comparisons: category === 'comparisons' ? 1 : 0,
            crises: category === 'crises' ? 1 : 0,
            chats: category === 'chats' ? 1 : 0,
            monthKey: currentMonth,
          });
        } else {
          set({ [category]: state[category] + 1 });
        }
      },

      getUsage: (category: UsageCategory) => {
        const state = get();
        const currentMonth = getCurrentMonthKey();
        if (state.monthKey !== currentMonth) return 0;
        return state[category];
      },
    }),
    {
      name: 'politika_usage',
    }
  )
);
