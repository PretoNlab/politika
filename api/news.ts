import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from './_auth.js';
import { checkRateLimit, sendRateLimitResponse } from './_rateLimit.js';

/**
 * Serverless function que busca Google News RSS sem restrição de CORS.
 * Recebe: { region: string, term: string }
 * Retorna: { success: true, data: NewsArticle[] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://politika-plum.vercel.app',
    'https://iapolitika.com.br',
    'https://www.iapolitika.com.br',
    'http://localhost:3000',
    'http://localhost:5173',
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

  // Auth + rate limiting
  let userId: string;
  try {
    userId = await authenticateRequest(req);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
  }

  const rateCheck = await checkRateLimit(userId, '/api/news');
  if (rateCheck.limited) {
    return sendRateLimitResponse(res, rateCheck.retryAfter!);
  }

  try {
    const { region, term } = req.body || {};

    if (!region || typeof region !== 'string' || !term || typeof term !== 'string') {
      return res.status(400).json({ error: 'region and term are required' });
    }

    // Sanitize
    const cleanRegion = region.slice(0, 100).replace(/[<>"'&]/g, '');
    const cleanTerm = term.slice(0, 100).replace(/[<>"'&]/g, '');

    // Query direta — sem contexto eleitoral forçado para não restringir demais
    // after: restringe ao últimos 7 dias para garantir frescor das notícias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10); // YYYY-MM-DD
    const query = encodeURIComponent(`"${cleanTerm}" ${cleanRegion} after:${sevenDaysAgo}`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Politika/1.0)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Google News returned ${response.status}` });
    }

    const xml = await response.text();

    // Parse XML server-side com regex (sem DOMParser no Node)
    const items: Array<{
      title: string;
      link: string;
      pubDate: string;
      source: string;
      description: string;
    }> = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const title = itemXml
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .trim() || '';

      const rawLink = itemXml
        .match(/<link>([\s\S]*?)<\/link>/)?.[1]
        ?.trim() || '';

      const pubDate = itemXml
        .match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]
        ?.trim() || '';

      const source = itemXml
        .match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
        ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .trim() || 'Google News';

      // Extrair description/snippet do artigo
      const rawDescription = itemXml
        .match(/<description>([\s\S]*?)<\/description>/)?.[1]
        ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '') // Remove tags HTML
        .trim() || '';

      // Extrair a URL real do link redirecionado do Google News
      // Os links vêm como: https://news.google.com/articles/... com redirects
      // Tentamos extrair a URL original do campo de link quando possível
      const link = normalizeGoogleNewsLink(rawLink);

      if (title) {
        items.push({ title, link, pubDate, source, description: rawDescription.slice(0, 300) });
      }
    }

    // Filtrar artigos dos últimos 30 dias (evita artigos antigos que passariam pelo filtro de ano)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = items
      .filter(a => {
        if (!a.pubDate) return false;
        const pubTime = new Date(a.pubDate).getTime();
        return !isNaN(pubTime) && pubTime >= thirtyDaysAgo;
      })
      .slice(0, 50);

    return res.status(200).json({ success: true, data: filtered });
  } catch (error: any) {
    console.error('News API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch news' });
  }
}

/**
 * Tenta extrair a URL real de um link do Google News.
 * Links podem ser redirecionados — quando possível, mantemos o link original.
 */
function normalizeGoogleNewsLink(link: string): string {
  if (!link) return '';

  // Links do Google News redirect: https://news.google.com/...
  // Ficamos com o link completo — o redirect é válido e acessível
  return link;
}
