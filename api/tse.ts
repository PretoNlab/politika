import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, sendRateLimitResponse } from './_rateLimit';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Autentica request via JWT do Supabase
 */
async function authenticateRequest(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token de autenticação não fornecido');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Token inválido ou expirado');
  }

  return user.id;
}

// ============================================
// Action Handlers — Leitura direta do Supabase
// Dados populados via script seed-tse.mjs
// ============================================

async function handleElectionResults(body: any) {
  const { state, municipality, years } = body;

  if (!state || !years || !Array.isArray(years)) {
    throw new Error('state e years[] são obrigatórios');
  }

  const db = getSupabase();

  let query = db
    .from('tse_election_results')
    .select('*')
    .eq('state', state)
    .in('election_year', years)
    .order('election_year', { ascending: false })
    .order('votes', { ascending: false });

  if (municipality) {
    query = query.eq('municipality', municipality);
  }

  const { data, error, count } = await query.limit(1000);

  if (error) throw new Error(error.message);

  return { data: data || [], source: 'supabase', count: data?.length || 0 };
}

async function handleCampaignFinance(body: any) {
  const { state, municipality, years } = body;

  if (!state || !years || !Array.isArray(years)) {
    throw new Error('state e years[] são obrigatórios');
  }

  const db = getSupabase();

  let query = db
    .from('tse_campaign_finance')
    .select('*')
    .eq('state', state)
    .in('election_year', years);

  if (municipality) {
    query = query.eq('municipality', municipality);
  }

  const { data, error } = await query.limit(500);

  if (error) throw new Error(error.message);

  return { data: data || [], source: 'supabase' };
}

async function handleVoterDemographics(body: any) {
  const { state, municipality, years } = body;

  if (!state || !years || !Array.isArray(years)) {
    throw new Error('state e years[] são obrigatórios');
  }

  const db = getSupabase();

  let query = db
    .from('tse_voter_demographics')
    .select('*')
    .eq('state', state)
    .in('election_year', years);

  if (municipality) {
    query = query.eq('municipality', municipality);
  }

  const { data, error } = await query.limit(500);

  if (error) throw new Error(error.message);

  return { data: data || [], source: 'supabase' };
}

async function handleSyncStatus(body: any) {
  const { state, municipality } = body;

  if (!state) {
    throw new Error('state é obrigatório');
  }

  const db = getSupabase();

  const { count: resultCount } = await db
    .from('tse_election_results')
    .select('id', { count: 'exact', head: true })
    .eq('state', state);

  const { count: financeCount } = await db
    .from('tse_campaign_finance')
    .select('id', { count: 'exact', head: true })
    .eq('state', state);

  const { data: yearData } = await db
    .from('tse_election_results')
    .select('election_year')
    .eq('state', state);

  const availableYears = yearData
    ? [...new Set(yearData.map((r: any) => r.election_year))].sort((a: number, b: number) => b - a)
    : [];

  // Pega último fetched_at
  const { data: lastRow } = await db
    .from('tse_election_results')
    .select('fetched_at')
    .eq('state', state)
    .order('fetched_at', { ascending: false })
    .limit(1);

  return {
    lastSync: lastRow?.[0]?.fetched_at || null,
    recordCount: (resultCount || 0) + (financeCount || 0),
    availableYears,
    state,
    municipality: municipality || '',
  };
}

// ============================================
// Main Handler
// ============================================

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

  try {
    const userId = await authenticateRequest(req);

    // Rate limiting
    const rateCheck = await checkRateLimit(userId, '/api/tse');
    if (rateCheck.limited) {
      return sendRateLimitResponse(res, rateCheck.retryAfter!);
    }

    const { action, data } = req.body || {};

    if (!action || !data) {
      return res.status(400).json({ error: 'action and data are required' });
    }

    let result: any;

    switch (action) {
      case 'electionResults':
        result = await handleElectionResults(data);
        break;
      case 'campaignFinance':
        result = await handleCampaignFinance(data);
        break;
      case 'voterDemographics':
        result = await handleVoterDemographics(data);
        break;
      case 'syncStatus':
        result = await handleSyncStatus(data);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error('[TSE API Error]', err.message);
    const status = err.message.includes('autenticação') || err.message.includes('Token') ? 401 : 500;
    return res.status(status).json({ success: false, error: err.message });
  }
}
