import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, sendRateLimitResponse } from './_rateLimit';

// API key segura no servidor (variável de ambiente)
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  return new GoogleGenAI({ apiKey });
};

/**
 * Constrói o contexto político regional dinamicamente com base no estado do workspace.
 * Permite que a plataforma opere como consultor nacional.
 */
function buildRegionalContext(
  state: string = 'Brasil',
  region: string = '',
  customContext?: string
): string {
  const stateContexts: Record<string, string> = {
    'Acre': 'Estado de fronteira amazônica com forte influência da economia florestal e agropecuária. Eleitorado sensível a temas ambientais e desenvolvimento regional. Rio Branco concentra força eleitoral decisiva.',
    'Alagoas': 'Política marcada por oligarquias históricas e forte clientelismo. Eleitorado sensível a programas sociais. Maceió versus interior são dinâmicas opostas. Seca e desigualdade são temas centrais.',
    'Amapá': 'Estado jovem com forte presença federal e militar. Macapá tem predominância eleitoral. Temas amazônicos e de infraestrutura (energia, conectividade) dominam o debate.',
    'Amazonas': 'Zona Franca de Manaus é tema central e divisor de águas. Eleitorado urbano em Manaus versus comunidades ribeirinhas com dinâmicas distintas. Meio ambiente e desenvolvimento equilibrados.',
    'Bahia': 'Comunicação via WhatsApp extremamente rápida e volátil. Instagram/TikTok ditam o ritmo da pauta política. O eleitor baiano valoriza autenticidade; silêncio é interpretado como culpa. Regiões (Oeste, Recôncavo, Salvador, Sul) com culturas políticas distintas.',
    'Ceará': 'Tradição de gestão progressista com resultados em indicadores sociais. Eleitorado urbano sofisticado em Fortaleza. Interior com forte cultura de política de base. Seca e recursos hídricos são temas permanentes.',
    'Distrito Federal': 'Eleitorado peculiar: servidores públicos federais concentrados, alta renda e escolaridade média. Política nacional domina o debate local. Cidades-satélites com dinâmicas próprias distintas do Plano Piloto.',
    'Espírito Santo': 'Estado equilibrado entre agronegócio (interior) e indústria/porto (Vitória/Grande Vitória). Eleitorado pragmático com baixa volatilidade. Segurança pública é tema constante.',
    'Goiás': 'Agronegócio de alta produtividade é base eleitoral dominante. Goiânia tem eleitorado urbano e conservador. Interior com forte tradição religiosa e ruralismo. Infraestrutura logística é tema central.',
    'Maranhão': 'Oligarquia Sarney moldou a política por décadas. Eleitorado sensível a programas sociais. São Luís versus interior com diferenças culturais marcantes. Pobreza e desenvolvimento são temas permanentes.',
    'Mato Grosso': 'Agronegócio de exportação é o motor político. Eleitorado conservador e ruralista dominante. Cuiabá com crescimento urbano recente. Desmatamento e sustentabilidade são temas de pressão externa.',
    'Mato Grosso do Sul': 'Estado de fronteira com forte presença indígena e agronegócio. Campo Grande tem eleitorado equilibrado. Questão fundiária e segurança na fronteira são temas sensíveis.',
    'Minas Gerais': 'Política de coalizão histórica e eleitorado indecisos ("povo de Minas não decide cedo"). Interior conservador versus RMBH progressista. Agronegócio, mineração e indústria como bases eleitorais distintas.',
    'Pará': 'Região amazônica com conflitos fundiários históricos. Belém ganhou projeção com COP30. Eleitorado sensível a desenvolvimento versus preservação. Interior com forte influência religiosa e ruralista.',
    'Paraíba': 'Tradição de famílias políticas consolidadas. João Pessoa com eleitorado universitário expressivo. Semiárido e políticas de convivência com a seca são temas permanentes.',
    'Paraná': 'Estado desenvolvido com eleitorado sofisticado e conservador. Curitiba tem tradição de voto anti-establishment. Agronegócio forte no interior. MST e questão agrária são temas sensíveis.',
    'Pernambuco': 'Polo político e econômico do Nordeste. Recife com eleitorado urbano e progressista. Interior com forte cultura de política de base. Suape e desenvolvimento industrial são temas centrais.',
    'Piauí': 'Um dos estados mais pobres; programas sociais têm impacto eleitoral decisivo. Teresina concentra poder eleitoral. Interior profundo com forte clientelismo e influência religiosa.',
    'Rio de Janeiro': 'Milícias e crime organizado influenciam eleições em múltiplas regiões. Capital com eleitorado fragmentado. Interior com dinâmicas municipais autônomas. Segurança pública e crise fiscal são temas permanentes.',
    'Rio Grande do Norte': 'Estado com tradição de ruptura com oligarquias. Natal tem eleitorado universitário expressivo. Energia eólica é tema de desenvolvimento local. Seca e recursos hídricos são constantes.',
    'Rio Grande do Sul': 'Eleitorado europeu e gaúcho com forte identidade regional. Porto Alegre com tradição de esquerda alternada com direita. Interior conservador e ruralista. Reconstrução pós-enchentes é tema imediato.',
    'Rondônia': 'Colonização recente com eleitorado heterogêneo. Agropecuária e extrativismo como bases econômicas. Porto Velho com crescimento acelerado. Infraestrutura e energia (hidrelétricas) são temas centrais.',
    'Roraima': 'Estado marcado pela imigração venezuelana e questão indígena Yanomami. Boa Vista com eleitorado concentrado. Segurança de fronteira é tema permanente e sensível.',
    'Santa Catarina': 'Estado mais conservador do Sul; eleitorado pró-mercado e empreendedor. Indústria diversificada e turismo como bases eleitorais. Florianópolis com eleitorado urbano e de alta renda.',
    'São Paulo': 'Eleitorado fragmentado e urbano é o maior desafio. Mídia tradicional ainda relevante em SP capital. Interior paulista com dinâmicas municipais autônomas. Mobilidade urbana, segurança e saúde dominam pauta.',
    'Sergipe': 'Menor estado do Brasil com política concentrada em Aracaju. Petróleo offshore é tema de desenvolvimento. Eleitorado sensível a programas sociais e gestão eficiente.',
    'Tocantins': 'Estado jovem com fronteira agronegócio-cerrado-amazônia. Palmas é capital planejada com eleitorado de servidores. Agropecuária e desenvolvimento logístico são temas centrais.',
  };

  const baseContext = stateContexts[state]
    ? `Contexto político de ${state}: ${stateContexts[state]}`
    : `Contexto nacional brasileiro: Eleitor valoriza transparência, resultados concretos e boa comunicação nas redes sociais. Ciclo de notícias é determinado pelo Twitter/X, Instagram e WhatsApp. Polarização nacional exige posicionamento claro.`;

  const regionNote = region
    ? ` Foco específico na região/cidade: ${region}.`
    : '';

  const custom = customContext
    ? ` Contexto adicional fornecido pelo consultor: ${customContext}`
    : '';

  return `${baseContext}${regionNote}${custom}`;
}

/**
 * Define a persona de alto nível da IA: Um Oficial de Inteligência Política (Chief of Intelligence).
 * Foco em estratégia pura, identificação de riscos e comando de ação.
 */
function buildExpertInstructions(state: string = 'Brasil'): string {
  return `VOCÊ É O CHIEF OF INTELLIGENCE & SENIOR STRATEGIST DE POLÍTICA, SOCIEDADE E DINÂMICAS CULTURAIS.
Sua missão é dar poder de decisão ao candidato através de uma visão holística que cruza poder político com movimentos sociais e sentimentos coletivos.
ESTILO DE PENSAMENTO:
1. Ofensiva Narrativa: Onde o adversário está vulnerável hoje?
2. Defesa Proativa: Qual ataque está sendo gestado e como neutralizá-lo?
3. Inteligência Sociocultural: Como as mudanças na sociedade de ${state} influenciam o voto (ex: religião, economia local, cultura)?
4. Curto e Grosso: Políticos não têm tempo. Seja cirúrgico.
5. Vácuo de Narrativa: Identifique sobre o que NINGUÉM está falando, mas que o eleitor está sentindo no dia a dia.`;
}

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

interface WorkspaceContext {
  state?: string;
  region?: string;
  customContext?: string;
}

const ALLOWED_ORIGIN = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '*';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://politika-plum.vercel.app',
    'https://iapolitika.com.br',
    'https://www.iapolitika.com.br',
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

  // Rate limiting
  const rateCheck = await checkRateLimit(userId, '/api/gemini');
  if (rateCheck.limited) {
    return sendRateLimitResponse(res, rateCheck.retryAfter!);
  }

  try {
    const body = req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { action, data, workspaceContext } = body;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: 'Action is required' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Data is required' });
    }

    // Contexto regional do workspace ativo
    const wsCtx: WorkspaceContext = workspaceContext && typeof workspaceContext === 'object'
      ? workspaceContext
      : {};

    const ai = getAI();

    switch (action) {
      case 'politicalInsight':
        return await handlePoliticalInsight(ai, data, res, wsCtx);

      case 'comparativeInsight':
        return await handleComparativeInsight(ai, data, res, wsCtx);

      case 'crisisResponse':
        return await handleCrisisResponse(ai, data, res, wsCtx);

      case 'evaluateResponse':
        return await handleEvaluateResponse(ai, data, res, wsCtx);

      case 'sentiment':
        return await handleSentiment(ai, data, res, wsCtx);

      case 'chat':
        return await handleChat(ai, data, res, wsCtx);

      case 'briefing':
        return await handleBriefing(ai, data, res, wsCtx);

      case 'prediction:thermometer':
        return await handleThermometer(ai, data, res, wsCtx);

      case 'prediction:battlemap':
        return await handleBattleMap(ai, data, res, wsCtx);

      case 'prediction:simulator':
        return await handleSimulator(ai, data, res, wsCtx);

      case 'prediction:earlywarning':
        return await handleEarlyWarning(ai, data, res, wsCtx);

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
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { handle } = data;

  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'Handle is required' });
  }

  if (handle.length > 100) {
    return res.status(400).json({ error: 'Handle too long (max 100 chars)' });
  }

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const expertInstructions = buildExpertInstructions(wsCtx.state);

  // Exemplo de tom de análise esperado (Few-shot)
  const analysisExample = `Exemplo de Output Desejado:
  {
    "headline": "Dominância Frágil: @handle lidera, mas deixa flanco aberto em segurança",
    "tone": "Oficial de Inteligência - Assertivo",
    "psychologicalTriggers": [{"trigger": "Prova Social", "application": "Explorar o apoio de lideranças do interior de ${wsCtx.state || 'Brasil'}"}],
    "strategicRisk": "Vácuo narrativo identificado: o silêncio de @handle sobre o tema X será preenchido pela oposição em 48h."
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `ANÁLISE ESTRATÉGICA DE PERFIL: @${handle}. 
    ${regionalContext}. 
    ${expertInstructions}
    
    ${analysisExample}
    
    TAREFA: Realize um Deep Dive no perfil. Identifique o "Ponto de Quebra" da narrativa atual dele.
    COMO PENSAR: Se você fosse o estrategista da oposição, onde você bateria hoje? Se fosse o estrategista dele, qual vácuo você preencheria?
    
    REQUISITOS JSON: 
    - headlines: Impacto imediato.
    - strategicRisk: Qual o maior perigo para a reputação dele AGORA em ${wsCtx.state || 'sua região'}.
    - psychTriggers: Use gatilhos que funcionem com o eleitor real, não termos acadêmicos.`,
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
  res: VercelResponse,
  wsCtx: WorkspaceContext
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

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const expertInstructions = buildExpertInstructions(wsCtx.state);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Compare os perfis: ${handles.join(', ')}. ${regionalContext}. ${expertInstructions} Analise a alavancagem psicológica do Candidato A sobre os outros. Retorne JSON.`,
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
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { incident, mediaData, location } = data;

  if (!incident && !mediaData) {
    return res.status(400).json({ error: 'Incident description or media is required' });
  }

  if (incident && (typeof incident !== 'string' || incident.length > 5000)) {
    return res.status(400).json({ error: 'Incident too long (max 5000 chars)' });
  }

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const parts: any[] = [{
    text: `Você é um Spin Doctor especialista em ${stateName}. Analise a crise e retorne um objeto JSON estrito.
    Se houver mídia, analise tom de voz e imagem.
    Incidente: "${incident}"

    ${regionalContext}

    REGRAS DE RESPOSTA (SPIN DOCTOR MODE):
    1. Retorne APENAS um objeto JSON.
    2. Use exatamente estas chaves: incidentSummary, severityLevel (Baixo, Médio, Alto, Crítico), targetAudienceImpact, narrativeRisk, responses (array de objetos com strategyName, description, actionPoints, suggestedScript), immediateAdvice.
    3. Isole o "Vetor de Crise": Isso é um ataque de reputação ou um erro de gestão?
    4. Proponha uma "Vacina Narrativa": Como mudar o assunto sem parecer fuga?
    5. NÃO adicione explicações fora do JSON.
    6. Se houver mídia, CRITIQUE o tom de voz e a postura corporal/visual. Estão passando confiança ou medo?`,
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
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { incident, proposedResponse } = data;

  if (!incident || typeof incident !== 'string' || !proposedResponse || typeof proposedResponse !== 'string') {
    return res.status(400).json({ error: 'Incident and proposed response are required' });
  }

  if (incident.length > 5000 || proposedResponse.length > 10000) {
    return res.status(400).json({ error: 'Input too long' });
  }

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const expertInstructions = buildExpertInstructions(wsCtx.state);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analise a eficácia desta resposta para o incidente: "${incident}".
    Resposta Proposta: "${proposedResponse}"
    ${regionalContext}
    ${expertInstructions}
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
  res: VercelResponse,
  wsCtx: WorkspaceContext
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
  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `VOCÊ É O RADAR DE INTELIGÊNCIA. 
    Analise o sentimento político sobre o termo "${term}" com base nestas manchetes de ${stateName}:
    
    ${titlesText}
    
    ${regionalContext}
    
    TAREFA: Diferencie RUÍDO de CRISE REAL.
    - Se o sentimento for negativo, avalie o RISCO DE CONTÁGIO (Quão rápido isso explode no WhatsApp da região?).
    - Se for positivo, identifique a OPORTUNIDADE DE CAPITALIZAÇÃO.
    
    Retorne um JSON com:
    - score: número de -1.0 a 1.0.
    - classification: "Positivo", "Neutro" ou "Negativo".
    - summary: Fato -> Impacto -> Recomendação (1-2 frases).`,
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
  res: VercelResponse,
  wsCtx: WorkspaceContext
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

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const systemInstruction = `Você é um consultor político sênior especialista em ${stateName}. Contexto @${handle}: ${JSON.stringify(analysis).slice(0, 5000)}. ${regionalContext}`;

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
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { metrics, alerts, topArticles } = data;

  if (!metrics || typeof metrics !== 'object') {
    return res.status(400).json({ error: 'Metrics data is required' });
  }

  const articlesContext = topArticles && topArticles.length > 0
    ? `\nManchetes recentes:\n${topArticles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}`
    : '';

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const prompt = `Você é um consultor político sênior monitorando a situação em ${stateName}.
Com base nos dados abaixo, gere um briefing executivo de 2-3 frases em português brasileiro.

Dados do Monitoramento:
- Total de menções nas últimas 24h: ${metrics.totalMentions}
- Sentimento médio: ${metrics.avgSentiment !== null ? (metrics.avgSentiment * 100).toFixed(0) + '%' : 'sem dados'}
- Tendência geral: ${metrics.overallTrend}
- Termo mais quente: ${metrics.hottestTerm || 'nenhum'}
- Alertas ativos: ${alerts?.total || 0} (${alerts?.dangerCount || 0} perigos, ${alerts?.opportunityCount || 0} oportunidades)
${alerts?.topAlert ? `- Alerta principal: ${alerts.topAlert}` : ''}
${articlesContext}

${regionalContext}

Regras de SitRep (Situation Report):
1. STATUS: 
   - "crisis" (Fogo no WhatsApp, sentimento < -30%, ataques diretos sem resposta)
   - "alert" (Tendência de queda, boatos surgindo, perda de espaço na mídia)
   - "calm" (Cenário sob controle, dominância de narrativa)
2. SUMMARY (2-3 frases): Linguagem de comando. Fato -> Risco -> Ação.
3. RECOMMENDATIONS: Ações táticas imediatas (ex: "Poste um vídeo de bastidor AGORA", "Não responda ao ataque X para não dar palco").`;

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

// ============================================
// Radar Preditivo — Prediction Handlers
// ============================================

async function handleThermometer(
  ai: GoogleGenAI,
  data: {
    candidateName: string;
    party: string;
    electionData: any[];
    financeData: any[];
    sentimentScore?: number;
  },
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { candidateName, party, electionData, financeData, sentimentScore } = data;

  if (!candidateName || !party) {
    return res.status(400).json({ error: 'candidateName e party são obrigatórios' });
  }

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const prompt = `Você é um analista eleitoral sênior especializado em ${stateName}.
Analise a posição do candidato ${candidateName} (${party}) com base nos dados históricos do TSE.

DADOS HISTÓRICOS DE ELEIÇÕES (por zona eleitoral):
${JSON.stringify(electionData?.slice(0, 50) || [], null, 1)}

DADOS DE FINANCIAMENTO DE CAMPANHA:
${JSON.stringify(financeData?.slice(0, 20) || [], null, 1)}

SENTIMENTO ATUAL EM TEMPO REAL: ${sentimentScore !== undefined ? `Score: ${sentimentScore} (-1 a 1)` : 'Não disponível'}

${regionalContext}

TAREFA: Gere um Termômetro Eleitoral que posicione o candidato numa escala de 0 a 100.
- Compare com padrões históricos de vencedores na mesma região.
- Avalie por zona eleitoral: onde está forte, onde está fraco.
- Analise eficiência do gasto (votos por R$ investido vs média histórica).
- Liste forças, vulnerabilidades e uma recomendação estratégica final.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          candidateName: { type: Type.STRING },
          party: { type: Type.STRING },
          zones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                zone: { type: Type.NUMBER },
                score: { type: Type.NUMBER },
                historicalAvg: { type: Type.NUMBER },
                trend: { type: Type.STRING },
                keyInsight: { type: Type.STRING },
              },
              required: ['zone', 'score', 'historicalAvg', 'trend', 'keyInsight'],
            },
          },
          spendingEfficiency: { type: Type.NUMBER },
          historicalComparison: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING },
        },
        required: ['overallScore', 'candidateName', 'party', 'zones', 'spendingEfficiency', 'historicalComparison', 'strengths', 'vulnerabilities', 'recommendation'],
      },
    },
  });

  const result = safeParseAIResponse(response.text, ['overallScore', 'zones', 'recommendation']);
  return res.status(200).json({ success: true, data: result });
}

async function handleBattleMap(
  ai: GoogleGenAI,
  data: {
    candidates: { name: string; party: string; number: number }[];
    electionData: any[];
    sentimentData?: Record<string, number>;
  },
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { candidates, electionData, sentimentData } = data;

  if (!candidates || candidates.length === 0) {
    return res.status(400).json({ error: 'candidates[] é obrigatório' });
  }

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const prompt = `Você é um estrategista eleitoral de campanha em ${stateName}.
Classifique cada zona eleitoral por disputabilidade com base nos dados históricos.

CANDIDATOS EM ANÁLISE:
${candidates.map(c => `- ${c.name} (${c.party}) #${c.number}`).join('\n')}

DADOS HISTÓRICOS DE ELEIÇÕES (por zona):
${JSON.stringify(electionData?.slice(0, 80) || [], null, 1)}

SENTIMENTO EM TEMPO REAL POR CANDIDATO:
${sentimentData ? JSON.stringify(sentimentData) : 'Não disponível'}

${regionalContext}

TAREFA: Crie um Mapa de Batalha classificando cada zona eleitoral:
- "allied": Zona dominada pelo candidato principal (margem > 15%)
- "adversary": Zona dominada pelo adversário (margem > 15%)
- "disputed": Zona em disputa real (margem < 15%)
- "opportunity": Zona com alto potencial de conquista (abstenção alta, candidato fraco)

Para cada zona: quem domina, margem %, potencial de virada, perfil do eleitor, nota estratégica.
No resumo: quantas zonas em cada categoria, prioridades de ataque e defesa.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          zones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                zone: { type: Type.NUMBER },
                classification: { type: Type.STRING },
                dominantCandidate: { type: Type.STRING },
                margin: { type: Type.NUMBER },
                swingPotential: { type: Type.NUMBER },
                voterProfile: { type: Type.STRING },
                strategicNote: { type: Type.STRING },
              },
              required: ['zone', 'classification', 'dominantCandidate', 'margin', 'swingPotential', 'voterProfile', 'strategicNote'],
            },
          },
          summary: { type: Type.STRING },
          priorityTargets: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          defensePriorities: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          overallBalance: { type: Type.STRING },
        },
        required: ['zones', 'summary', 'priorityTargets', 'defensePriorities', 'overallBalance'],
      },
    },
  });

  const result = safeParseAIResponse(response.text, ['zones', 'summary']);
  return res.status(200).json({ success: true, data: result });
}

async function handleSimulator(
  ai: GoogleGenAI,
  data: {
    scenario: { type: string; description: string; targetZones?: number[] };
    baselineData: any[];
    currentSentiment?: number;
  },
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { scenario, baselineData, currentSentiment } = data;

  if (!scenario?.type || !scenario?.description) {
    return res.status(400).json({ error: 'scenario.type e scenario.description são obrigatórios' });
  }

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const prompt = `Você é um simulador de cenários eleitorais especializado em ${stateName}.
Projete o impacto de uma decisão estratégica usando dados históricos como base.

CENÁRIO PROPOSTO:
- Tipo: ${scenario.type}
- Descrição: ${scenario.description}
${scenario.targetZones?.length ? `- Zonas-alvo: ${scenario.targetZones.join(', ')}` : ''}

DADOS DE BASELINE (resultados históricos):
${JSON.stringify(baselineData?.slice(0, 40) || [], null, 1)}

SENTIMENTO ATUAL: ${currentSentiment !== undefined ? currentSentiment : 'Não disponível'}

${regionalContext}

TAREFA: Simule o impacto deste cenário.
- Calcule impacto em pontos percentuais (positivo ou negativo).
- Liste zonas afetadas com delta e explicação.
- Encontre uma analogia histórica de cenário similar na política brasileira.
- Estime probabilidade de sucesso (0-100%).
- Liste riscos e dê uma recomendação final.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          impactPoints: { type: Type.NUMBER },
          affectedZones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                zone: { type: Type.NUMBER },
                delta: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
              },
              required: ['zone', 'delta', 'explanation'],
            },
          },
          historicalAnalogy: { type: Type.STRING },
          probability: { type: Type.NUMBER },
          recommendation: { type: Type.STRING },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['scenario', 'impactPoints', 'affectedZones', 'historicalAnalogy', 'probability', 'recommendation', 'risks'],
      },
    },
  });

  const result = safeParseAIResponse(response.text, ['scenario', 'impactPoints', 'recommendation']);
  return res.status(200).json({ success: true, data: result });
}

async function handleEarlyWarning(
  ai: GoogleGenAI,
  data: {
    sentimentTrajectory: { term: string; scores: number[]; timestamps: string[] }[];
    recentAlerts: { title: string; severity: string; createdAt: string }[];
    electionData?: any[];
  },
  res: VercelResponse,
  wsCtx: WorkspaceContext
) {
  const { sentimentTrajectory, recentAlerts, electionData } = data;

  const regionalContext = buildRegionalContext(wsCtx.state, wsCtx.region, wsCtx.customContext);
  const stateName = wsCtx.state || 'Brasil';

  const prompt = `Você é um sistema de alerta antecipado para crises políticas em ${stateName}.
Analise a trajetória de sentimento e padrões emergentes para detectar sinais de crise ANTES que aconteçam.

TRAJETÓRIA DE SENTIMENTO (últimas 24-48h):
${JSON.stringify(sentimentTrajectory?.slice(0, 10) || [], null, 1)}

ALERTAS RECENTES DO SISTEMA:
${JSON.stringify(recentAlerts?.slice(0, 10) || [], null, 1)}

PADRÕES HISTÓRICOS DE REFERÊNCIA:
${JSON.stringify(electionData?.slice(0, 20) || [], null, 1)}

${regionalContext}

TAREFA: Detecte padrões que precedem crises políticas:
- Queda abrupta de sentimento (>20% em 6h)
- Pico de menções negativas sem resposta
- Padrões que historicamente precederam viradas eleitorais
- Movimentações de adversários que indicam ataque coordenado

Para cada warning: tipo do padrão, probabilidade (0-100%), horizonte (em horas), descrição, precedente histórico.
Classifique o risco geral: low, moderate, high, critical.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          warnings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                patternType: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                horizonHours: { type: Type.NUMBER },
                description: { type: Type.STRING },
                historicalPrecedent: { type: Type.STRING },
              },
              required: ['patternType', 'probability', 'horizonHours', 'description'],
            },
          },
          overallRiskLevel: { type: Type.STRING },
          nextCheckIn: { type: Type.STRING },
        },
        required: ['warnings', 'overallRiskLevel', 'nextCheckIn'],
      },
    },
  });

  const result = safeParseAIResponse(response.text, ['warnings', 'overallRiskLevel']);

  // Validar risco geral
  if (!['low', 'moderate', 'high', 'critical'].includes(result.overallRiskLevel)) {
    result.overallRiskLevel = 'moderate';
  }

  return res.status(200).json({ success: true, data: result });
}
