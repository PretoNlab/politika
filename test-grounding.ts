import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `ANÁLISE INVESTIGATIVA OSINT DE PERFIL: @Alexandre de Moraes. 
    Contexto político de Brasil: Eleitor valoriza transparência, resultados concretos e boa comunicação nas redes sociais. Ciclo de notícias é determinado pelo Twitter/X, Instagram e WhatsApp. Polarização nacional exige posicionamento claro.. 
    Aja como Oficial de Inteligência. Foco em estratégia pura, identificação de riscos e comando de ação.
    
    Exemplo de Output Desejado:
    {
      "headline": "Ataques Diretos: @handle isolado nas críticas à infraestrutura",
      "tone": "Oficial de Inteligência - Alerta e Direto",
      "recentFindings": [
        { "title": "Oposição protocola pedido de CPI embasado nas investigações do portal de compras.", "source": "G1, 14/05/2026", "verified": true }
      ],
      "keywords": ["infraestrutura", "cpi"],
      "resonance": "Alta nas bases de oposição",
      "compatibleGroups": [{"name": "Empresários", "description": "Lideranças do setor de serviços"}],
      "ignoredGroups": [{"name": "Servidores Públicos", "description": "Categoria pressionando por reajuste"}],
      "projection": "Isolamento a curto prazo",
      "suggestedQuestions": ["Qual foi o critério para aprovar o aditivo?"],
      "nextBestMove": "Anunciar auditoria independente",
      "psychologicalTriggers": [{"trigger": "Urgência", "application": "Mobilizar base para defender a pauta antes de sexta-feira"}],
      "strategicRisk": "Caso a CPI seja instaurada, a pauta positiva de 100 dias será totalmente sufocada."
    }
    
    TAREFA: 
    1. Utilize SEMPRE a pesquisa na internet para encontrar notícias e fatos recentes.
    2. Com base na pesquisa, extraia fatos (Open Source Intelligence).
    3. Analise a consequência imediata desses fatos na narrativa do alvo.
    
    COMO PENSAR: Você é um Oficial de Inteligência. Sua missão não é dar conselhos genéricos, mas levantar fatos recentes da internet e apontar o Risco Estratégico Real acontecendo AGORA em Brasil.
    
    REQUISITOS JSON: 
    - headlines: Impacto imediato.
    - recentFindings: De 1 a 3 fatos verificados usando o Google sobre as últimas notícias/escândalos (Coloque o título do fato e o nome do veículo).
    - strategicRisk: Maior perigo reputacional atual.
    - psychTriggers: Gatilhos táticos de resposta imediata baseados em fatos reais.
    
    IMPORTANTE: Retorne APENAS um bloco puro de JSON válido, sem NENHUM texto fora do JSON. Certifique-se de que a estrutura corresponda exatamente às chaves do exemplo (headline, tone, keywords, resonance, compatibleGroups, ignoredGroups, strategicRisk, projection, suggestedQuestions, nextBestMove, psychologicalTriggers, recentFindings).`,
            config: {
                tools: [{ googleSearch: {} }],
                // responseMimeType: 'application/json' -> removed
            }
        });

        console.log(response.text);
    } catch (err) {
        console.error(err);
    }
}

test();
