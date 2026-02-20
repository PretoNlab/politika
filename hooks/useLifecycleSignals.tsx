import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLifecycleStore } from '../store/lifecycleStore';
import { MILESTONE_THRESHOLDS } from '../constants';

/**
 * Hook that monitors lifecycle store and triggers milestone celebrations.
 * Should be mounted once in Layout.
 */
export const useLifecycleSignals = () => {
  const totalAnalyses = useLifecycleStore(s => s.totalAnalyses);
  const milestones = useLifecycleStore(s => s.milestones);
  const recordMilestone = useLifecycleStore(s => s.recordMilestone);
  const prevAnalysesRef = useRef(totalAnalyses);

  useEffect(() => {
    // Only trigger on increment (not on initial load)
    if (prevAnalysesRef.current === totalAnalyses) return;
    prevAnalysesRef.current = totalAnalyses;

    // Check if any milestone threshold was just crossed
    for (const milestone of MILESTONE_THRESHOLDS) {
      if (totalAnalyses >= milestone.count && !milestones.includes(milestone.id)) {
        recordMilestone(milestone.id);

        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'} max-w-sm w-full bg-gradient-to-r from-primary to-blue-600 text-white rounded-2xl shadow-2xl shadow-primary/30 p-5`}
            >
              <div className="flex items-start gap-3">
                <div className="size-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">emoji_events</span>
                </div>
                <div>
                  <p className="font-black text-sm">{milestone.title}</p>
                  <p className="text-xs text-white/80 mt-1">{milestone.description}</p>
                </div>
              </div>
            </div>
          ),
          { duration: 5000 }
        );
        break; // Only one celebration per increment
      }
    }
  }, [totalAnalyses, milestones, recordMilestone]);
};
