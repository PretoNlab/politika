import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// API key segura no servidor (variável de ambiente)
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  return new GoogleGenAI({ apiKey });
};

/**
 * Autentica a request verificando o JWT do Supabase
 */
async function authenticateRequest(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token de autenticação não fornecido');
  }

  const token = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase não configurado no servidor');
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Token inválido ou expirado');
  }

  return user.id;
}

/**
 * Parse seguro da resposta da IA com validação de campos obrigatórios
 */
function safeParseAIResponse(text: string | undefined, requiredFields: string[]): any {
  if (!text) {
    throw new Error('AI returned empty response');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Tenta extrair JSON de blocos markdown
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (match) {
      const clean = (match[1] || match[0]).replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } else {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response is not a valid object');
  }

  const missing = requiredFields.filter(f => !(f in parsed));
  if (missing.length > 0) {
    throw new Error(`AI response missing fields: ${missing.join(', ')}`);
  }

  return parsed;
}

const BAHIA_CONTEXT = `
Contexto Estratégico Bahia:
- Comunicação via WhatsApp é extremamente rápida e volátil.
- Redes sociais (Instagram/TikTok) ditam o ritmo da pauta política.
- O eleitor baiano valoriza a autenticidade e a resposta rápida; o silêncio é interpretado como culpa.
- Regiões (Oeste, Recôncavo, Salvador, Sul) possuem culturas políticas distintas.
`;

const EXPERT_INSTRUCTIONS = `
Instruções de Especialista:
1. Ciência Política: Analise o perfil como um cientista político focado na Bahia.
2. Psicologia de Marketing: Identifique gatilhos de persuasão.
3. Copywriting: Textos persuasivos para o público-alvo.
`;

const ALLOWED_ORIGIN = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '*';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://politika-plum.vercel.app',
    'http://localhost:3000',
  ];
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate request
  let userId: string;
  try {
    userId = await authenticateRequest(req);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
  }

  try {
    const body = req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { action, data } = body;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: 'Action is required' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Data is required' });
    }

    const ai = getAI();

    switch (action) {
      case 'politicalInsight':
        return await handlePoliticalInsight(ai, data, res);

      case 'comparativeInsight':
        return await handleComparativeInsight(ai, data, res);

      case 'crisisResponse':
        return await handleCrisisResponse(ai, data, res);

      case 'evaluateResponse':
        return await handleEvaluateResponse(ai, data, res);

      case 'sentiment':
        return await handleSentiment(ai, data, res);

      case 'chat':
        return await handleChat(ai, data, res);

      case 'briefing':
        return await handleBriefing(ai, data, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

async function handlePoliticalInsight(
  ai: GoogleGenAI,
  data: { handle: string },
  res: VercelResponse
) {
  const { handle } = data;

  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'Handle is required' });
  }

  if (handle.length > 100) {
    return res.status(400).json({ error: 'Handle too long (max 100 chars)' });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analise o perfil @${handle} no contexto da Bahia. ${BAHIA_CONTEXT}. ${EXPERT_INSTRUCTIONS} Retorne JSON com gatilhos psicológicos detalhados.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          tone: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          resonance: { type: Type.STRING },
          compatibleGroups: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['name', 'description']
            }
          },
          ignoredGroups: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['name', 'description']
            }
          },
          strategicRisk: { type: Type.STRING },
          projection: { type: Type.STRING },
          suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          nextBestMove: { type: Type.STRING },
          psychologicalTriggers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                trigger: { type: Type.STRING },
                application: { type: Type.STRING }
              },
              required: ['trigger', 'application']
            }
          }
        },
        required: ['headline', 'tone', 'keywords', 'resonance', 'compatibleGroups', 'ignoredGroups', 'strategicRisk', 'projection', 'suggestedQuestions', 'nextBestMove', 'psychologicalTriggers']
      }
    }
  });

  const result = safeParseAIResponse(response.text, [
    'headline', 'tone', 'keywords', 'resonance', 'compatibleGroups',
    'ignoredGroups', 'strategicRisk', 'projection', 'suggestedQuestions',
    'nextBestMove', 'psychologicalTriggers'
  ]);
  return res.status(200).json({ success: true, data: result });
}

async function handleComparativeInsight(
  ai: GoogleGenAI,
  data: { handles: string[] },
  res: VercelResponse
) {
  const { handles } = data;

  if (!handles || !Array.isArray(handles) || handles.length === 0) {
    return res.status(400).json({ error: 'Handles are required' });
  }

  if (handles.length > 5) {
    return res.status(400).json({ error: 'Too many handles (max 5)' });
  }

  if (handles.some((h: any) => typeof h !== 'string' || h.length > 100)) {
    return res.status(400).json({ error: 'Invalid handle format' });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Compare os perfis: ${handles.join(', ')} na Bahia. ${BAHIA_CONTEXT}. ${EXPERT_INSTRUCTIONS} Analise a alavancagem psicológica do Candidato A sobre os outros. Retorne JSON.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          candidates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                handle: { type: Type.STRING },
                profileType: { type: Type.STRING },
                sentimentTrend: { type: Type.STRING },
                regionalStrength: { type: Type.STRING },
                mainVulnerability: { type: Type.STRING }
              },
              required: ['handle', 'profileType', 'sentimentTrend', 'regionalStrength', 'mainVulnerability']
            }
          },
          confrontationPillars: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pillar: { type: Type.STRING },
                winner_handle: { type: Type.STRING },
                candidateA_status: { type: Type.STRING },
                analysis: { type: Type.STRING }
              },
              required: ['pillar', 'winner_handle', 'candidateA_status', 'analysis']
            }
          },
          strategicVoid: { type: Type.STRING },
          winningMove: { type: Type.STRING },
          regionalBattleground: { type: Type.STRING },
          psychologicalLeverage: { type: Type.STRING }
        },
        required: ['candidates', 'confrontationPillars', 'strategicVoid', 'winningMove', 'regionalBattleground', 'psychologicalLeverage']
      }
    }
  });

  const result = safeParseAIResponse(response.text, [
    'candidates', 'confrontationPillars', 'strategicVoid',
    'winningMove', 'regionalBattleground', 'psychologicalLeverage'
  ]);
  return res.status(200).json({ success: true, data: result });
}

async function handleCrisisResponse(
  ai: GoogleGenAI,
  data: {
    incident: string;
    mediaData?: { data: string; mimeType: string };
    location?: { latitude: number; longitude: number };
  },
  res: VercelResponse
) {
  const { incident, mediaData, location } = data;

  if (!incident && !mediaData) {
    return res.status(400).json({ error: 'Incident description or media is required' });
  }

  if (incident && (typeof incident !== 'string' || incident.length > 5000)) {
    return res.status(400).json({ error: 'Incident too long (max 5000 chars)' });
  }

  const parts: any[] = [{
    text: `Você é um Spin Doctor baiano. Analise a crise e retorne um objeto JSON estrito.
    Se houver mídia, analise tom de voz e imagem.
    Incidente: "${incident}"

    ${BAHIA_CONTEXT}

    REGRAS DE RESPOSTA:
    1. Retorne APENAS um objeto JSON.
    2. Use exatamente estas chaves: incidentSummary, severityLevel (Baixo, Médio, Alto, Crítico), targetAudienceImpact, narrativeRisk, responses (array de objetos com strategyName, description, actionPoints, suggestedScript), immediateAdvice.
    3. NÃO adicione explicações fora do JSON.`
  }];

  if (mediaData) {
    parts.push({
      inlineData: {
        data: mediaData.data,
        mimeType: mediaData.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      tools: [
        { googleSearch: {} },
        { googleMaps: {} }
      ],
      toolConfig: location ? {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      } : undefined
    }
  });

  // Parse JSON from response
  const text = response.text;
  let parsed: any;

  try {
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      parsed = JSON.parse(jsonBlockMatch[1].trim());
    } else {
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        const cleaned = jsonObjectMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } else {
        throw new Error('No valid JSON found');
      }
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to parse AI response' });
  }

  // Extract grounding sources
  const sources: { uri: string; title: string }[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title });
      } else if (chunk.maps) {
        sources.push({ uri: chunk.maps.uri, title: chunk.maps.title });
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: { ...parsed, sources }
  });
}

async function handleEvaluateResponse(
  ai: GoogleGenAI,
  data: { incident: string; proposedResponse: string },
  res: VercelResponse
) {
  const { incident, proposedResponse } = data;

  if (!incident || typeof incident !== 'string' || !proposedResponse || typeof proposedResponse !== 'string') {
    return res.status(400).json({ error: 'Incident and proposed response are required' });
  }

  if (incident.length > 5000 || proposedResponse.length > 10000) {
    return res.status(400).json({ error: 'Input too long' });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analise a eficácia desta resposta para o incidente: "${incident}".
    Resposta Proposta: "${proposedResponse}"
    ${BAHIA_CONTEXT}
    ${EXPERT_INSTRUCTIONS}
    Retorne JSON.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          verdict: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          optimizedVersion: { type: Type.STRING }
        },
        required: ['score', 'verdict', 'pros', 'cons', 'optimizedVersion']
      }
    }
  });

  const result = safeParseAIResponse(response.text, [
    'score', 'verdict', 'pros', 'cons', 'optimizedVersion'
  ]);
  return res.status(200).json({ success: true, data: result });
}

async function handleSentiment(
  ai: GoogleGenAI,
  data: { term: string; articleTitles: string[] },
  res: VercelResponse
) {
  const { term, articleTitles } = data;

  if (!term || typeof term !== 'string') {
    return res.status(400).json({ error: 'Term is required' });
  }

  if (!articleTitles || !Array.isArray(articleTitles) || articleTitles.length === 0) {
    return res.status(400).json({ error: 'Article titles are required' });
  }

  if (term.length > 100) {
    return res.status(400).json({ error: 'Term too long (max 100 chars)' });
  }

  if (articleTitles.length > 20) {
    return res.status(400).json({ error: 'Too many articles (max 20)' });
  }

  const titlesText = articleTitles.map((t, i) => `${i + 1}. ${t}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analise o sentimento político sobre o termo "${term}" com base nestas manchetes de notícias da Bahia:

${titlesText}

${BAHIA_CONTEXT}

Retorne um JSON com:
- score: número de -1.0 (muito negativo) a 1.0 (muito positivo)
- classification: "Positivo", "Neutro" ou "Negativo"
- summary: resumo de 1-2 frases do sentimento predominante sobre "${term}"`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          classification: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ['score', 'classification', 'summary']
      }
    }
  });

  const result = safeParseAIResponse(response.text, ['score', 'classification', 'summary']);
  return res.status(200).json({ success: true, data: result });
}

async function handleChat(
  ai: GoogleGenAI,
  data: {
    handle: string;
    analysis: any;
    message: string;
    history: any[];
  },
  res: VercelResponse
) {
  const { handle, analysis, message, history } = data;

  if (!handle || typeof handle !== 'string' || !message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Handle and message are required' });
  }

  if (message.length > 3000) {
    return res.status(400).json({ error: 'Message too long (max 3000 chars)' });
  }

  if (history && (!Array.isArray(history) || history.length > 50)) {
    return res.status(400).json({ error: 'Invalid chat history' });
  }

  const formattedHistory = (history || []).map(h => ({
    role: h.role,
    parts: [{ text: h.parts }]
  }));

  const systemInstruction = `Você é um consultor político sênior na Bahia. Contexto @${handle}: ${JSON.stringify(analysis).slice(0, 5000)}. ${BAHIA_CONTEXT}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: { systemInstruction }
  });

  return res.status(200).json({
    success: true,
    data: response.text
  });
}

async function handleBriefing(
  ai: GoogleGenAI,
  data: {
    metrics: {
      totalMentions: number;
      avgSentiment: number | null;
      hottestTerm: string | null;
      overallTrend: string;
    };
    alerts: {
      total: number;
      dangerCount: number;
      opportunityCount: number;
      topAlert?: string;
    };
    topArticles: string[];
  },
  res: VercelResponse
) {
  const { metrics, alerts, topArticles } = data;

  if (!metrics || typeof metrics !== 'object') {
    return res.status(400).json({ error: 'Metrics data is required' });
  }

  const articlesContext = topArticles && topArticles.length > 0
    ? `\nManchetes recentes:\n${topArticles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}`
    : '';

  const prompt = `Voce e um consultor politico senior monitorando a situacao na Bahia.
Com base nos dados abaixo, gere um briefing executivo de 2-3 frases em portugues brasileiro.

Dados do Monitoramento:
- Total de mencoes nas ultimas 24h: ${metrics.totalMentions}
- Sentimento medio: ${metrics.avgSentiment !== null ? (metrics.avgSentiment * 100).toFixed(0) + '%' : 'sem dados'}
- Tendencia geral: ${metrics.overallTrend}
- Termo mais quente: ${metrics.hottestTerm || 'nenhum'}
- Alertas ativos: ${alerts?.total || 0} (${alerts?.dangerCount || 0} perigos, ${alerts?.opportunityCount || 0} oportunidades)
${alerts?.topAlert ? `- Alerta principal: ${alerts.topAlert}` : ''}
${articlesContext}

${BAHIA_CONTEXT}

Regras:
1. Se ha alertas de perigo ou sentimento muito negativo (< -30%), status = "crisis"
2. Se ha alertas moderados ou sentimento em queda, status = "alert"
3. Se tudo esta estavel ou positivo, status = "calm"
4. O "summary" deve ser direto, em linguagem de briefing militar/politico, 2-3 frases
5. As "recommendations" devem ser 1-3 acoes concretas e curtas`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          summary: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['status', 'summary', 'recommendations']
      }
    }
  });

  const result = safeParseAIResponse(response.text, ['status', 'summary', 'recommendations']);

  // Valida campo status
  if (!['calm', 'alert', 'crisis'].includes(result.status)) {
    result.status = 'alert';
  }

  return res.status(200).json({ success: true, data: result });
}
