import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  generateThermometer,
  generateBattleMap,
  simulateScenario,
  generateEarlyWarnings,
} from '../services/geminiClient';
import type {
  RadarTool,
  ThermometerResult,
  BattleMapResult,
  SimulatorResult,
  EarlyWarningResult,
  ScenarioInput,
} from '../types';
import { useRateLimit } from './useRateLimit';
import { useTseData } from './useTseData';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUsageStore } from '../store/usageStore';
import { useUsageGate } from './useUsageGate';

const EARLY_WARNING_INTERVAL = 30 * 60 * 1000; // 30 minutos

interface UseRadarPrediticoReturn {
  // TSE Data
  tse: ReturnType<typeof useTseData>;

  // Active tool
  activeTab: RadarTool;
  setActiveTab: (tab: RadarTool) => void;

  // Thermometer
  thermometer: ThermometerResult | null;
  thermometerLoading: boolean;
  generateThermometerData: (candidateName: string, party: string, sentimentScore?: number) => Promise<void>;

  // Battle Map
  battleMap: BattleMapResult | null;
  battleMapLoading: boolean;
  generateBattleMapData: (
    candidates: { name: string; party: string; number: number }[],
    sentimentData?: Record<string, number>
  ) => Promise<void>;

  // Simulator
  simulator: SimulatorResult | null;
  simulatorLoading: boolean;
  runSimulation: (scenario: ScenarioInput, currentSentiment?: number) => Promise<void>;

  // Early Warning
  earlyWarnings: EarlyWarningResult | null;
  earlyWarningLoading: boolean;
  checkEarlyWarnings: (
    sentimentTrajectory: { term: string; scores: number[]; timestamps: string[] }[],
    recentAlerts: { title: string; severity: string; createdAt: string }[]
  ) => Promise<void>;

  // General
  error: string | null;
  reset: () => void;
}

export const useRadarPreditivo = (): UseRadarPrediticoReturn => {
  const [activeTab, setActiveTab] = useState<RadarTool>('thermometer');

  // Results
  const [thermometer, setThermometer] = useState<ThermometerResult | null>(null);
  const [battleMap, setBattleMap] = useState<BattleMapResult | null>(null);
  const [simulator, setSimulator] = useState<SimulatorResult | null>(null);
  const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarningResult | null>(null);

  // Loading states
  const [thermometerLoading, setThermometerLoading] = useState(false);
  const [battleMapLoading, setBattleMapLoading] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [earlyWarningLoading, setEarlyWarningLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // TSE Data
  const tse = useTseData();

  // Context
  const { activeWorkspace } = useWorkspace();
  const incrementUsage = useUsageStore(s => s.increment);
  const predictionGate = useUsageGate('predictions');

  const workspaceContext = activeWorkspace ? {
    state: activeWorkspace.state,
    region: activeWorkspace.region,
    customContext: activeWorkspace.customContext,
  } : undefined;

  // Rate limit: 5 predictions per 2 minutes
  const checkRateLimit = useRateLimit({
    maxCalls: 5,
    windowMs: 120000,
    errorMessage: 'Muitas predições em pouco tempo',
  });

  // Early warning interval
  const earlyWarningTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (earlyWarningTimerRef.current) {
        clearTimeout(earlyWarningTimerRef.current);
      }
    };
  }, []);

  const canProceed = useCallback((): boolean => {
    if (!predictionGate.canProceed) {
      toast.error(`Limite mensal de predições atingido (${predictionGate.usage}/${predictionGate.limit})`);
      return false;
    }
    if (!checkRateLimit()) return false;
    return true;
  }, [predictionGate, checkRateLimit]);

  // ============================================
  // Thermometer
  // ============================================

  const generateThermometerData = useCallback(async (
    candidateName: string,
    party: string,
    sentimentScore?: number
  ) => {
    if (!candidateName.trim() || !party.trim()) {
      toast.error('Nome do candidato e partido são obrigatórios');
      return;
    }

    if (!canProceed()) return;

    setThermometerLoading(true);
    setError(null);

    try {
      const result = await generateThermometer(
        candidateName,
        party,
        tse.electionData,
        tse.financeData,
        sentimentScore,
        workspaceContext
      );

      setThermometer(result);
      incrementUsage('predictions');
      toast.success('Termômetro gerado!');
    } catch (err: any) {
      const msg = err.message || 'Erro ao gerar termômetro';
      setError(msg);
      toast.error(msg);
    } finally {
      setThermometerLoading(false);
    }
  }, [canProceed, tse.electionData, tse.financeData, workspaceContext, incrementUsage]);

  // ============================================
  // Battle Map
  // ============================================

  const generateBattleMapData = useCallback(async (
    candidates: { name: string; party: string; number: number }[],
    sentimentData?: Record<string, number>
  ) => {
    if (!candidates.length) {
      toast.error('Adicione pelo menos um candidato');
      return;
    }

    if (!canProceed()) return;

    setBattleMapLoading(true);
    setError(null);

    try {
      const result = await generateBattleMap(
        candidates,
        tse.electionData,
        sentimentData,
        workspaceContext
      );

      setBattleMap(result);
      incrementUsage('predictions');
      toast.success('Mapa de Batalha gerado!');
    } catch (err: any) {
      const msg = err.message || 'Erro ao gerar mapa de batalha';
      setError(msg);
      toast.error(msg);
    } finally {
      setBattleMapLoading(false);
    }
  }, [canProceed, tse.electionData, workspaceContext, incrementUsage]);

  // ============================================
  // Simulator
  // ============================================

  const runSimulation = useCallback(async (
    scenario: ScenarioInput,
    currentSentiment?: number
  ) => {
    if (!scenario.description.trim()) {
      toast.error('Descreva o cenário a simular');
      return;
    }

    if (!canProceed()) return;

    setSimulatorLoading(true);
    setError(null);

    try {
      const result = await simulateScenario(
        scenario,
        tse.electionData,
        currentSentiment,
        workspaceContext
      );

      setSimulator(result);
      incrementUsage('predictions');
      toast.success('Simulação concluída!');
    } catch (err: any) {
      const msg = err.message || 'Erro ao simular cenário';
      setError(msg);
      toast.error(msg);
    } finally {
      setSimulatorLoading(false);
    }
  }, [canProceed, tse.electionData, workspaceContext, incrementUsage]);

  // ============================================
  // Early Warning
  // ============================================

  const checkEarlyWarnings = useCallback(async (
    sentimentTrajectory: { term: string; scores: number[]; timestamps: string[] }[],
    recentAlerts: { title: string; severity: string; createdAt: string }[]
  ) => {
    if (!canProceed()) return;

    setEarlyWarningLoading(true);
    setError(null);

    try {
      const result = await generateEarlyWarnings(
        sentimentTrajectory,
        recentAlerts,
        tse.electionData,
        workspaceContext
      );

      setEarlyWarnings(result);
      incrementUsage('predictions');

      if (result.overallRiskLevel === 'high' || result.overallRiskLevel === 'critical') {
        toast.error(`Alerta: Risco ${result.overallRiskLevel === 'critical' ? 'CRÍTICO' : 'ALTO'} detectado!`, { duration: 5000 });
      } else {
        toast.success('Verificação de alertas concluída');
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao verificar alertas';
      setError(msg);
      toast.error(msg);
    } finally {
      setEarlyWarningLoading(false);
    }
  }, [canProceed, tse.electionData, workspaceContext, incrementUsage]);

  // ============================================
  // Reset
  // ============================================

  const reset = useCallback(() => {
    setThermometer(null);
    setBattleMap(null);
    setSimulator(null);
    setEarlyWarnings(null);
    setError(null);
  }, []);

  return {
    tse,
    activeTab,
    setActiveTab,
    thermometer,
    thermometerLoading,
    generateThermometerData,
    battleMap,
    battleMapLoading,
    generateBattleMapData,
    simulator,
    simulatorLoading,
    runSimulation,
    earlyWarnings,
    earlyWarningLoading,
    checkEarlyWarnings,
    error,
    reset,
  };
};
