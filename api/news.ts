import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  try {
    const { region, term } = req.body || {};

    if (!region || typeof region !== 'string' || !term || typeof term !== 'string') {
      return res.status(400).json({ error: 'region and term are required' });
    }

    // Sanitize
    const cleanRegion = region.slice(0, 100).replace(/[<>"'&]/g, '');
    const cleanTerm = term.slice(0, 100).replace(/[<>"'&]/g, '');

    const query = encodeURIComponent(`${cleanTerm} ${cleanRegion}`);
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
    const items: Array<{ title: string; link: string; pubDate: string; source: string }> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || '';
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
      const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || 'Google News';

      if (title) {
        items.push({ title, link, pubDate, source });
      }
    }

    // Filtrar por ano atual
    const currentYear = new Date().getFullYear().toString();
    const filtered = items
      .filter(a => a.pubDate.includes(currentYear))
      .slice(0, 25);

    return res.status(200).json({ success: true, data: filtered });
  } catch (error: any) {
    console.error('News API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch news' });
  }
}
