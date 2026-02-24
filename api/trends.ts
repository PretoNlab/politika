import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless function para buscar dados do Google Trends.
 *
 * Recebe: { term: string, region?: string }
 * Retorna: { success: true, data: TrendDataPoint[] }
 *
 * Estratégia de múltiplos fallbacks:
 * 1. Google Trends dailytrends (trending topics BR)
 * 2. Google Trends widgetdata via explore token
 * 3. Dados estimados baseados em sazonalidade eleitoral (fallback final)
 */

export interface TrendDataPoint {
    date: string;
    label: string;
    relativeInterest: number; // 0-100
    isEstimated: boolean;     // true = dado estimado (sem dados reais)
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Referer': 'https://trends.google.com/',
    'Cookie': 'NID=; CONSENT=YES+;',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'https://politika-plum.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
    ];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { term, region } = req.body || {};
    if (!term || typeof term !== 'string') {
        return res.status(400).json({ error: 'term is required' });
    }

    const cleanTerm = term.slice(0, 100).replace(/[<>"'&]/g, '');

    // Tenta buscar dados reais do Google Trends
    let data: TrendDataPoint[] | null = null;

    // Tentativa 1: Google Trends Explore (série temporal)
    try {
        data = await fetchTrendsExplore(cleanTerm);
    } catch (err) {
        console.warn(`Trends explore failed for "${cleanTerm}":`, (err as Error).message);
    }

    // Tentativa 2: Google Trends Daily (trending do dia — menos preciso mas mais estável)
    if (!data || data.length === 0) {
        try {
            data = await fetchTrendsDaily(cleanTerm);
        } catch (err) {
            console.warn(`Trends daily failed:`, (err as Error).message);
        }
    }

    // Fallback final: dados estimados baseados em sazonalidade
    if (!data || data.length === 0) {
        data = buildEstimatedTrends();
    }

    return res.status(200).json({ success: true, data });
}

/**
 * Tenta buscar série temporal via Google Trends Explore API.
 */
async function fetchTrendsExplore(term: string): Promise<TrendDataPoint[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timeRange = `${thirtyDaysAgo.toISOString().split('T')[0]} ${now.toISOString().split('T')[0]}`;

    const exploreReq = JSON.stringify({
        comparisonItem: [{ keyword: term, geo: 'BR', time: timeRange }],
        category: 396, // categoria "Política"
        property: '',
    });

    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=pt-BR&tz=180&req=${encodeURIComponent(exploreReq)}`;

    const exploreRes = await fetch(exploreUrl, { headers: HEADERS });

    if (exploreRes.status === 429) throw new Error('Rate limited by Google Trends');
    if (!exploreRes.ok) throw new Error(`Explore returned ${exploreRes.status}`);

    const raw = await exploreRes.text();
    // Google Trends prefixes response with ")]}',\n"
    const json = raw.replace(/^\)\]\}'[^\n]*\n/, '');
    const parsed = JSON.parse(json);

    const widgets = parsed?.widgets ?? [];
    const timeWidget = widgets.find((w: any) => w.type === 'TIMESERIES');
    if (!timeWidget?.token || !timeWidget?.request) throw new Error('No TIMESERIES widget');

    // Fetch real data via widgetdata/multiline
    const dataUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=pt-BR&tz=180&req=${encodeURIComponent(JSON.stringify(timeWidget.request))}&token=${encodeURIComponent(timeWidget.token)}`;

    const dataRes = await fetch(dataUrl, { headers: HEADERS });
    if (!dataRes.ok) throw new Error(`Multiline returned ${dataRes.status}`);

    const dataRaw = await dataRes.text();
    const dataJson = dataRaw.replace(/^\)\]\}'[^\n]*\n/, '');
    const dataParsed = JSON.parse(dataJson);

    const timelineData: any[] = dataParsed?.default?.timelineData ?? [];
    if (timelineData.length === 0) throw new Error('Empty timeline data');

    return timelineData.map((pt: any) => {
        const date = new Date(Number(pt.time) * 1000);
        const daysAgo = Math.floor((Date.now() - date.getTime()) / 86400000);
        return {
            date: date.toISOString().split('T')[0],
            label: daysAgo === 0 ? 'Hoje' : daysAgo === 1 ? 'Ontem'
                : date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''),
            relativeInterest: pt.value?.[0] ?? 0,
            isEstimated: false,
        };
    });
}

/**
 * Tenta buscar trending topics do dia via dailytrends.
 * Retorna scores baseados na presença do termo nos trending.
 */
async function fetchTrendsDaily(term: string): Promise<TrendDataPoint[]> {
    const url = `https://trends.google.com/trends/api/dailytrends?hl=pt-BR&tz=180&geo=BR&ns=15`;
    const res = await fetch(url, { headers: HEADERS });

    if (res.status === 429) throw new Error('Rate limited');
    if (!res.ok) throw new Error(`Dailytrends returned ${res.status}`);

    const raw = await res.text();
    const json = raw.replace(/^\)\]\}'[^\n]*\n/, '');
    const parsed = JSON.parse(json);

    const trendingStories: any[] = parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
    const termLower = term.toLowerCase();

    const matchScore = trendingStories.reduce((max: number, story: any) => {
        const title = (story.title?.query ?? '').toLowerCase();
        const articles = story.articles ?? [];
        const articleMatch = articles.some((a: any) =>
            (a.title ?? '').toLowerCase().includes(termLower)
        );
        if (title.includes(termLower) || articleMatch) {
            return Math.max(max, Number(story.formattedTraffic?.replace(/[^0-9]/g, '')) || 75);
        }
        return max;
    }, 0);

    // Retorna apenas o dia de hoje com o score encontrado
    const today = new Date();
    return [{
        date: today.toISOString().split('T')[0],
        label: 'Hoje',
        relativeInterest: Math.min(matchScore > 0 ? 70 : 30, 100),
        isEstimated: true,
    }];
}

/**
 * Fallback final: estima trends baseado em sazonalidade eleitoral.
 * Retorna 30 dias com curva crescente (simula interesse eleitoral).
 */
function buildEstimatedTrends(): TrendDataPoint[] {
    const points: TrendDataPoint[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        const daysAgo = i;

        const label = daysAgo === 0 ? 'Hoje' : daysAgo === 1 ? 'Ontem'
            : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

        // Curva crescente com ruído natural
        const base = 40 + (30 - i) * 1.5;
        const noise = Math.sin(i * 1.3) * 8;
        const relativeInterest = Math.min(100, Math.max(10, Math.round(base + noise)));

        points.push({ date: isoDate, label, relativeInterest, isEstimated: true });
    }

    return points;
}
