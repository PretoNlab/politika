import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLifecycleStore } from '../store/lifecycleStore';
import { ONBOARDING_STEPS } from '../constants';

const OnboardingChecklist: React.FC = () => {
  const completedSteps = useLifecycleStore(s => s.completedSteps);
  const onboardingCompleted = useLifecycleStore(s => s.onboardingCompleted);
  const dismissOnboarding = useLifecycleStore(s => s.dismissOnboarding);
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = ONBOARDING_STEPS.filter(s => completedSteps.includes(s.id)).length;
  const totalSteps = ONBOARDING_STEPS.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  // Próximo passo pendente
  const nextStep = ONBOARDING_STEPS.find(s => !completedSteps.includes(s.id));

  // Auto-dismiss quando tudo completado
  useEffect(() => {
    if (completedCount === totalSteps && !onboardingCompleted) {
      const timer = setTimeout(() => dismissOnboarding(), 3000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, totalSteps, onboardingCompleted, dismissOnboarding]);

  if (onboardingCompleted) return null;

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
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Comece por Aqui</p>
              <p className="text-[10px] text-slate-500">{completedCount}/{totalSteps} etapas concluídas</p>
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
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Steps */}
        {!collapsed && (
          <div className="p-3 space-y-1">
            {ONBOARDING_STEPS.map((step, idx) => {
              const isDone = completedSteps.includes(step.id);
              const isNext = nextStep?.id === step.id;

              const content = (
                <div
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${isNext
                      ? 'bg-primary/5 border border-primary/20'
                      : isDone
                        ? 'opacity-50'
                        : ''
                    }`}
                >
                  <div className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : isNext
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                    {isDone ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      <span className="text-[11px] font-black">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${isDone
                        ? 'text-slate-400 line-through'
                        : isNext
                          ? 'text-primary'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                      {step.label}
                    </p>
                    {!isDone && (
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {step.description}
                      </p>
                    )}
                  </div>
                  {isNext && (
                    <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">arrow_forward</span>
                  )}
                </div>
              );

              return isNext && step.route ? (
                <Link key={step.id} to={step.route} className="block">
                  {content}
                </Link>
              ) : (
                <div key={step.id}>{content}</div>
              );
            })}

            {completedCount === totalSteps && (
              <div className="text-center py-3 space-y-1">
                <span className="material-symbols-outlined text-2xl text-emerald-500">celebration</span>
                <p className="text-xs font-bold text-emerald-600">Central totalmente ativada!</p>
              </div>
            )}

            <button
              onClick={dismissOnboarding}
              className="w-full text-[10px] text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Dispensar guia
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
