import { useUsageStore } from '../store/usageStore';
import { FREE_TIER_LIMITS } from '../constants';
import type { UsageCategory } from '../constants';

interface UsageGateResult {
  canProceed: boolean;
  usage: number;
  limit: number;
  remaining: number;
}

export const useUsageGate = (category: UsageCategory): UsageGateResult => {
  const usage = useUsageStore(s => s.getUsage(category));
  const limit = FREE_TIER_LIMITS[category];

  return {
    canProceed: usage < limit,
    usage,
    limit,
    remaining: Math.max(0, limit - usage),
  };
};
