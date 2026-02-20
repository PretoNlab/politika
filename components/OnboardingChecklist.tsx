import React, { useState } from 'react';
import { useLifecycleStore } from '../store/lifecycleStore';
import { ONBOARDING_STEPS } from '../constants';

const OnboardingChecklist: React.FC = () => {
  const completedSteps = useLifecycleStore(s => s.completedSteps);
  const onboardingCompleted = useLifecycleStore(s => s.onboardingCompleted);
  const dismissOnboarding = useLifecycleStore(s => s.dismissOnboarding);
  const [collapsed, setCollapsed] = useState(false);

  if (onboardingCompleted) return null;

  const completedCount = ONBOARDING_STEPS.filter(s => completedSteps.includes(s.id)).length;
  const totalSteps = ONBOARDING_STEPS.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  // Auto-dismiss when all steps completed
  if (completedCount === totalSteps && !onboardingCompleted) {
    setTimeout(() => dismissOnboarding(), 3000);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">checklist</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Primeiros Passos</p>
              <p className="text-[10px] text-slate-500">{completedCount}/{totalSteps} concluídos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">{percentage}%</span>
            <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}>
              expand_less
            </span>
          </div>
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Steps */}
        {!collapsed && (
          <div className="p-3 space-y-1">
            {ONBOARDING_STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isDone ? 'opacity-50' : ''}`}
                >
                  <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${isDone
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                    {isDone ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">{step.icon}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isDone
                    ? 'text-slate-400 line-through'
                    : 'text-slate-700 dark:text-slate-300'
                    }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}

            {completedCount === totalSteps && (
              <div className="text-center py-3">
                <p className="text-xs font-bold text-emerald-600">Parabéns! Onboarding completo!</p>
              </div>
            )}

            <button
              onClick={dismissOnboarding}
              className="w-full text-[10px] text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Dispensar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
