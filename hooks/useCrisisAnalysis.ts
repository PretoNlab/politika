import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { generateCrisisResponse, evaluateResponse } from '../services/geminiClient';
import { CrisisAnalysis } from '../types';
import { useRateLimit } from './useRateLimit';
import { isValidFileSize, isValidMimeType } from '../utils/security';

interface MediaFile {
  data: string;
  mimeType: string;
  name: string;
}

interface UseCrisisAnalysisReturn {
  loading: boolean;
  evalLoading: boolean;
  error: string | null;
  result: CrisisAnalysis | null;
  evaluation: any | null;
  analyzeCrisis: (incident: string, mediaFile?: MediaFile) => Promise<void>;
  evaluateResponseDraft: (proposedDraft: string) => Promise<void>;
  reset: () => void;
}

const ALLOWED_MIME_TYPES = [
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp'
];

/**
 * Hook para análises de crise e avaliação de respostas
 *
 * @returns Funções de análise, estado e resultados
 *
 * @example
 * const { analyzeCrisis, evaluateResponseDraft, result, loading } = useCrisisAnalysis();
 *
 * // Analisar crise
 * await analyzeCrisis('Candidato envolvido em escândalo', mediaFile);
 *
 * // Avaliar resposta proposta
 * await evaluateResponseDraft('Nossa resposta oficial...');
 */
export const useCrisisAnalysis = (): UseCrisisAnalysisReturn => {
  const [loading, setLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrisisAnalysis | null>(null);
  const [evaluation, setEvaluation] = useState<any | null>(null);

  // Rate limiting: 5 análises por minuto
  const checkRateLimit = useRateLimit({
    maxCalls: 5,
    windowMs: 60000,
    errorMessage: 'Muitas análises de crise em pouco tempo'
  });

  const getGeolocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | undefined> => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
    } catch (e) {
      console.warn('Geolocalização não disponível ou recusada:', e);
      return undefined;
    }
  }, []);

  const analyzeCrisis = useCallback(async (
    incident: string,
    mediaFile?: MediaFile
  ): Promise<void> => {
    if (!incident.trim() && !mediaFile) {
      toast.error('Digite uma descrição do incidente ou anexe mídia');
      return;
    }

    // Valida arquivo se fornecido
    if (mediaFile) {
      // Estima tamanho do base64 (aproximadamente 3/4 do tamanho original)
      const estimatedSize = (mediaFile.data.length * 3) / 4;

      if (!isValidFileSize(estimatedSize, 10)) {
        toast.error('Arquivo muito grande. Máximo: 10MB');
        return;
      }

      if (!isValidMimeType(mediaFile.mimeType, ALLOWED_MIME_TYPES)) {
        toast.error('Tipo de arquivo não suportado');
        return;
      }
    }

    // Verifica rate limiting
    if (!checkRateLimit()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setEvaluation(null);

    try {
      // Obtém geolocalização se disponível
      const location = await getGeolocation();

      // Prepara mídia para a API
      const mediaData = mediaFile ? {
        data: mediaFile.data,
        mimeType: mediaFile.mimeType
      } : undefined;

      const data = await generateCrisisResponse(incident, mediaData, location);

      if (data && data.incidentSummary) {
        setResult(data);
        toast.success('Análise de crise concluída!');
      } else {
        throw new Error('Resposta incompleta da Inteligência Artificial');
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Ocorreu um erro inesperado ao processar a crise';

      setError(errorMessage);
      console.error('Erro na análise de crise:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkRateLimit, getGeolocation]);

  const evaluateResponseDraft = useCallback(async (proposedDraft: string): Promise<void> => {
    if (!proposedDraft.trim() || !result) {
      toast.error('Digite uma resposta para avaliar');
      return;
    }

    setEvalLoading(true);

    try {
      const data = await evaluateResponse(result.incidentSummary, proposedDraft);
      setEvaluation(data);
      toast.success('Avaliação concluída!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao avaliar resposta';
      console.error('Erro ao avaliar resposta:', err);
      toast.error(errorMessage);
    } finally {
      setEvalLoading(false);
    }
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setEvaluation(null);
    setError(null);
  }, []);

  return {
    loading,
    evalLoading,
    error,
    result,
    evaluation,
    analyzeCrisis,
    evaluateResponseDraft,
    reset
  };
};
