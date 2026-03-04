import React, { useEffect, useState } from 'react';
import { useLifecycleStore } from '../store/lifecycleStore';
import { MILESTONE_THRESHOLDS } from '../constants';

/**
 * MilestoneBadge — exibe um toast de conquista visual quando um milestone é atingido.
 * Monte no layout raiz (Layout.tsx) para que funcione globalmente.
 */

interface BadgeState {
    id: string;
    title: string;
    description: string;
    visible: boolean;
}

const BADGE_ICONS: Record<string, string> = {
    first_analysis: 'military_tech',
    fifth_analysis: 'workspace_premium',
    tenth_analysis: 'star',
    twentyfifth_analysis: 'shield_with_heart',
};

const BADGE_COLORS: Record<string, string> = {
    first_analysis: 'from-blue-500 to-primary',
    fifth_analysis: 'from-emerald-500 to-teal-500',
    tenth_analysis: 'from-amber-400 to-orange-500',
    twentyfifth_analysis: 'from-violet-500 to-purple-600',
};

export const MilestoneBadge: React.FC = () => {
    const { totalAnalyses, milestones, recordMilestone } = useLifecycleStore();
    const [badge, setBadge] = useState<BadgeState | null>(null);

    useEffect(() => {
        for (const threshold of MILESTONE_THRESHOLDS) {
            if (totalAnalyses >= threshold.count && !milestones.includes(threshold.id)) {
                recordMilestone(threshold.id);
                setBadge({
                    id: threshold.id,
                    title: threshold.title,
                    description: threshold.description,
                    visible: true,
                });
                break; // show one at a time
            }
        }
    }, [totalAnalyses, milestones, recordMilestone]);

    useEffect(() => {
        if (badge?.visible) {
            const timer = setTimeout(() => {
                setBadge((b) => (b ? { ...b, visible: false } : null));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [badge?.visible]);

    if (!badge?.visible) return null;

    const icon = BADGE_ICONS[badge.id] ?? 'emoji_events';
    const gradient = BADGE_COLORS[badge.id] ?? 'from-primary to-blue-600';

    return (
        <div
            className="fixed top-20 right-6 z-[100] max-w-xs animate-in slide-in-from-right-4 fade-in duration-500"
            onClick={() => setBadge((b) => (b ? { ...b, visible: false } : null))}
        >
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                {/* Gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                <div className="p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className={`size-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-2xl text-white">{icon}</span>
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                            Conquista Desbloqueada
                        </p>
                        <p className="text-sm font-black text-slate-900 leading-tight">{badge.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{badge.description}</p>
                    </div>

                    {/* Dismiss */}
                    <button
                        className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 shrink-0 ml-auto self-start"
                        onClick={(e) => { e.stopPropagation(); setBadge((b) => (b ? { ...b, visible: false } : null)); }}
                    >
                        <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                </div>

                {/* Auto-dismiss progress bar */}
                <div className="h-0.5 bg-slate-100">
                    <div
                        className={`h-full bg-gradient-to-r ${gradient} origin-left`}
                        style={{ animation: 'shrinkBar 5s linear forwards' }}
                    />
                </div>
            </div>

            <style>{`
        @keyframes shrinkBar {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
        </div>
    );
};

export default MilestoneBadge;
