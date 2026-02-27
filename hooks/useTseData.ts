import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  fetchElectionResults,
  fetchCampaignFinance,
  fetchVoterDemographics,
  checkSyncStatus,
} from '../services/tseService';
import type {
  TseElectionResult,
  TseCampaignFinance,
  TseVoterDemographics,
  TseSyncStatus,
} from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

const TSE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias
const DEFAULT_YEARS = [2024, 2022, 2020, 2018, 2016, 2014];

interface UseTseDataReturn {
  electionData: TseElectionResult[];
  financeData: TseCampaignFinance[];
  demographicsData: TseVoterDemographics[];
  syncStatus: TseSyncStatus | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  syncAllData: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
}

export const useTseData = (): UseTseDataReturn => {
  const [electionData, setElectionData] = useState<TseElectionResult[]>([]);
  const [financeData, setFinanceData] = useState<TseCampaignFinance[]>([]);
  const [demographicsData, setDemographicsData] = useState<TseVoterDemographics[]>([]);
  const [syncStatus, setSyncStatus] = useState<TseSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const { activeWorkspace } = useWorkspace();
  const state = activeWorkspace?.state || 'Bahia';
  const municipality = activeWorkspace?.region || 'Salvador';

  const refreshSyncStatus = useCallback(async () => {
    try {
      const status = await checkSyncStatus(state, municipality);
      setSyncStatus(status);
    } catch (err: any) {
      console.error('Erro ao verificar sync:', err.message);
    }
  }, [state, municipality]);

  const syncAllData = useCallback(async () => {
    // Evita sync duplicado
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;

    setIsSyncing(true);
    setError(null);

    try {
      toast.loading('Sincronizando dados do TSE...', { id: 'tse-sync' });

      // Fetch em paralelo
      const [elections, finance, demographics] = await Promise.allSettled([
        fetchElectionResults(state, municipality, DEFAULT_YEARS),
        fetchCampaignFinance(state, municipality, DEFAULT_YEARS),
        fetchVoterDemographics(state, municipality, DEFAULT_YEARS),
      ]);

      if (elections.status === 'fulfilled') {
        setElectionData(elections.value.data);
      }
      if (finance.status === 'fulfilled') {
        setFinanceData(finance.value.data);
      }
      if (demographics.status === 'fulfilled') {
        setDemographicsData(demographics.value.data);
      }

      // Atualiza status do sync
      await refreshSyncStatus();

      const successCount = [elections, finance, demographics].filter(
        r => r.status === 'fulfilled'
      ).length;

      toast.dismiss('tse-sync');

      if (successCount === 3) {
        toast.success('Dados do TSE sincronizados!');
      } else if (successCount > 0) {
        toast.success(`Sincronização parcial (${successCount}/3 conjuntos de dados)`);
      } else {
        throw new Error('Falha ao sincronizar dados do TSE');
      }
    } catch (err: any) {
      toast.dismiss('tse-sync');
      const msg = err.message || 'Erro ao sincronizar dados do TSE';
      setError(msg);
      toast.error(msg);
      console.error('TSE sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [state, municipality, refreshSyncStatus]);

  return {
    electionData,
    financeData,
    demographicsData,
    syncStatus,
    isLoading,
    isSyncing,
    error,
    syncAllData,
    refreshSyncStatus,
  };
};
