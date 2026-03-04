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
        console.warn('Missing fields in AI response:', missing);
    }

    return parsed;
}

const aiResponse = `Aqui estão 3 notícias reais sobre "Alexandre de Moraes" de hoje, 2 de março de 2026:

\`\`\`json
{
  "headline": "...",
  "tone": "...",
  "keywords": [],
  "resonance": "...",
  "compatibleGroups": [],
  "ignoredGroups": [],
  "strategicRisk": "...",
  "projection": "...",
  "suggestedQuestions": [],
  "nextBestMove": "...",
  "psychologicalTriggers": [],
  "recentFindings": [
    {
      "title": "Moraes nega prisão domiciliar ao ex-presidente Jair Bolsonaro",
      "source": "Agência Brasil",
      "verified": true
    }
  ]
}
\`\`\`
`;

const res = safeParseAIResponse(aiResponse, ['headline']);
console.log(JSON.stringify(res, null, 2));
