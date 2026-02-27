import React from 'react';
import type { UsageCategory } from '../constants';

interface UpgradePromptProps {
  category: UsageCategory;
  usage: number;
  limit: number;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<UsageCategory, string> = {
  analyses: 'Análises Individuais',
  comparisons: 'Análises Comparativas',
  crises: 'Respostas de Crise',
  chats: 'Mensagens no Chat',
  predictions: 'Predições do Radar',
};

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ category, usage, limit, onClose }) => {
  const percentage = Math.min(100, Math.round((usage / limit) * 100));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center space-y-6">
          <div className="size-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">rocket_launch</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              Limite Atingido
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Você usou todas as <strong>{CATEGORY_LABELS[category]}</strong> do plano gratuito neste mês.
            </p>
          </div>

          {/* Usage bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>{usage} usadas</span>
              <span>{limit} limite</span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => window.open('mailto:contato@politika.app?subject=Upgrade%20de%20Plano', '_blank')}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-blue-600 transition-all shadow-xl shadow-primary/20"
            >
              Fale com a Equipe
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
