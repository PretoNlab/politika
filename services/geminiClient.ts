/**
 * Cliente HTTP para comunicação com backend proxy
 * Substitui chamadas diretas à API Gemini
 */

import { sanitizeHandle, sanitizeInput, detectPromptInjection } from '../utils/security';
import { TIMEOUTS } from '../constants';
import { supabase } from '../lib/supabase';

// URL do backend (ajusta automaticamente para dev/prod)
const API_URL = import.meta.env.PROD
  ? '/api/gemini' // Produção (Vercel)
  : 'http://localhost:3000/api/gemini'; // Desenvolvimento local

const API_TIMEOUT_MS = TIMEOUTS.apiRequest || 60000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1000;

interface ApiRequest {
  action: string;
  data: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

function isRetryable(err: any, status?: number): boolean {
  if (err.name === 'AbortError') return false;
  // Retry on network errors and 5xx server errors
  if (!status) return true;
  return status >= 500;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Você precisa estar autenticado para usar esta funcionalidade.');
  }
  return session.access_token;
}

/**
 * Faz chamada ao backend proxy com timeout e retry
 */
async function callApi<T>(request: ApiRequest): Promise<T> {
  let lastError: any;
  const token = await getAuthToken();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        const err = new Error(error.error || `API request failed with status ${response.status}`);
        if (attempt < MAX_RETRIES && isRetryable(err, response.status)) {
          lastError = err;
          clearTimeout(timeoutId);
          await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      if (!result.data) {
        throw new Error('No data returned from API');
      }

      return result.data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('A requisição excedeu o tempo limite. Tente novamente.');
      }
      if (attempt < MAX_RETRIES && isRetryable(err)) {
        lastError = err;
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

/**
 * Gera análise política de um candidato
 */
export const generatePoliticalInsight = async (handle: string) => {
  // Sanitiza o handle antes de enviar
  const sanitizedHandle = sanitizeHandle(handle);

  if (!sanitizedHandle) {
    throw new Error('Handle inválido');
  }

  return callApi({
    action: 'politicalInsight',
    data: { handle: sanitizedHandle }
  });
};

/**
 * Gera análise comparativa entre candidatos
 */
export const generateComparativeInsight = async (handles: string[]) => {
  // Sanitiza todos os handles
  const sanitizedHandles = handles
    .map(h => sanitizeHandle(h))
    .filter(h => h.length > 0);

  if (sanitizedHandles.length === 0) {
    throw new Error('Nenhum handle válido fornecido');
  }

  return callApi({
    action: 'comparativeInsight',
    data: { handles: sanitizedHandles }
  });
};

/**
 * Gera resposta para crise
 */
export const generateCrisisResponse = async (
  incident: string,
  mediaData?: { data: string; mimeType: string },
  location?: { latitude: number; longitude: number }
) => {
  // Sanitiza o incidente
  const sanitizedIncident = sanitizeInput(incident, { maxLength: 3000 });

  if (!sanitizedIncident && !mediaData) {
    throw new Error('É necessário fornecer uma descrição do incidente ou mídia');
  }

  return callApi({
    action: 'crisisResponse',
    data: {
      incident: sanitizedIncident,
      mediaData,
      location
    }
  });
};

/**
 * Avalia eficácia de uma resposta proposta
 */
export const evaluateResponse = async (
  incident: string,
  proposedResponse: string
) => {
  const sanitizedIncident = sanitizeInput(incident, { maxLength: 3000 });
  const sanitizedResponse = sanitizeInput(proposedResponse, { maxLength: 5000 });

  return callApi({
    action: 'evaluateResponse',
    data: {
      incident: sanitizedIncident,
      proposedResponse: sanitizedResponse
    }
  });
};

/**
 * Analisa sentimento político de um termo com base nos artigos relacionados
 */
export const analyzeSentiment = async (
  term: string,
  articleTitles: string[]
): Promise<{ score: number; classification: string; summary: string }> => {
  if (!term || term.trim().length === 0) {
    throw new Error('Termo é obrigatório para análise de sentimento');
  }

  if (!articleTitles || articleTitles.length === 0) {
    throw new Error('É necessário fornecer artigos para análise');
  }

  const sanitizedTerm = sanitizeInput(term, { maxLength: 100 });
  const sanitizedTitles = articleTitles
    .slice(0, 20)
    .map(t => sanitizeInput(t, { maxLength: 300 }));

  return callApi({
    action: 'sentiment',
    data: {
      term: sanitizedTerm,
      articleTitles: sanitizedTitles
    }
  });
};

/**
 * Gera briefing situacional baseado no estado atual do monitoramento
 */
export const generateBriefing = async (
  metricsSnapshot: {
    totalMentions: number;
    avgSentiment: number | null;
    hottestTerm: string | null;
    overallTrend: 'up' | 'down' | 'steady';
  },
  alertsSummary: {
    total: number;
    dangerCount: number;
    opportunityCount: number;
    topAlert?: string;
  },
  topArticleTitles: string[]
): Promise<{ status: string; summary: string; recommendations: string[] }> => {
  // Short-circuit: sem dados suficientes, retorna resposta estática
  if (metricsSnapshot.totalMentions === 0 && alertsSummary.total === 0) {
    return {
      status: 'calm',
      summary: 'Nenhuma atividade relevante detectada no momento. Todos os termos monitorados estao sem alteracoes significativas.',
      recommendations: []
    };
  }

  const sanitizedTitles = topArticleTitles
    .slice(0, 10)
    .map(t => sanitizeInput(t, { maxLength: 200 }));

  return callApi({
    action: 'briefing',
    data: {
      metrics: metricsSnapshot,
      alerts: alertsSummary,
      topArticles: sanitizedTitles
    }
  });
};

/**
 * Chat com contexto de análise
 */
export const chatWithAnalysis = async (
  handle: string,
  analysis: any,
  message: string,
  history: any[]
) => {
  // Sanitiza handle e mensagem
  const sanitizedHandle = sanitizeHandle(handle);
  const sanitizedMessage = sanitizeInput(message, { maxLength: 2000 });

  // Detecta tentativas de prompt injection
  if (detectPromptInjection(sanitizedMessage)) {
    throw new Error('Mensagem contém padrões suspeitos. Por favor, reformule sua pergunta.');
  }

  // Sanitiza histórico
  const sanitizedHistory = history.map(h => ({
    role: h.role,
    parts: sanitizeInput(h.parts, { maxLength: 2000 })
  }));

  return callApi({
    action: 'chat',
    data: {
      handle: sanitizedHandle,
      analysis,
      message: sanitizedMessage,
      history: sanitizedHistory
    }
  });
};
