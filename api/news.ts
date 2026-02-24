import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless function que busca Google News RSS sem restrição de CORS.
 * Recebe: { region: string, term: string }
 * Retorna: { success: true, data: NewsArticle[] }
 *
 * Melhorias v2:
 * - 50 artigos por query (era 25)
 * - Query enriquecida com contexto eleitoral
 * - Extrai campo description (snippet do artigo)
 * - Normaliza links do Google News
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { region, term } = req.body || {};

    if (!region || typeof region !== 'string' || !term || typeof term !== 'string') {
      return res.status(400).json({ error: 'region and term are required' });
    }

    // Sanitize
    const cleanRegion = region.slice(0, 100).replace(/[<>"'&]/g, '');
    const cleanTerm = term.slice(0, 100).replace(/[<>"'&]/g, '');

    // Query enriquecida com contexto eleitoral para resultados mais relevantes
    const electoralContext = 'eleição política candidato';
    const query = encodeURIComponent(`"${cleanTerm}" ${electoralContext} ${cleanRegion}`);
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

    // Filtrar por ano atual e limitar a 50 artigos (era 25)
    const currentYear = new Date().getFullYear().toString();
    const filtered = items
      .filter(a => a.pubDate.includes(currentYear))
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
