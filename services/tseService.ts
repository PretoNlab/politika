/**
 * Serviço TSE — consulta direta ao Supabase
 * Dados públicos do TSE com RLS para usuários autenticados
 */

import { supabase } from '../lib/supabase';
import type {
  TseElectionResult,
  TseCampaignFinance,
  TseVoterDemographics,
  TseSyncStatus,
} from '../types';

/**
 * Busca resultados eleitorais por estado, município e anos
 */
export const fetchElectionResults = async (
  state: string,
  municipality: string,
  years: number[]
): Promise<{ data: TseElectionResult[]; source: string }> => {
  if (!state || !years.length) {
    throw new Error('Estado e anos são obrigatórios');
  }

  let query = supabase
    .from('tse_election_results')
    .select('*')
    .eq('state', state)
    .in('election_year', years)
    .order('election_year', { ascending: false })
    .order('votes', { ascending: false })
    .limit(1000);

  if (municipality) {
    query = query.eq('municipality', municipality);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return { data: (data || []) as TseElectionResult[], source: 'supabase' };
};

/**
 * Busca dados de financiamento de campanha
 */
export const fetchCampaignFinance = async (
  state: string,
  municipality: string,
  years: number[]
): Promise<{ data: TseCampaignFinance[]; source: string }> => {
  if (!state || !years.length) {
    throw new Error('Estado e anos são obrigatórios');
  }

  let query = supabase
    .from('tse_campaign_finance')
    .select('*')
    .eq('state', state)
    .in('election_year', years)
    .limit(500);

  if (municipality) {
    query = query.eq('municipality', municipality);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return { data: (data || []) as TseCampaignFinance[], source: 'supabase' };
};

/**
 * Busca perfil demográfico do eleitorado
 */
export const fetchVoterDemographics = async (
  state: string,
  municipality: string,
  years: number[]
): Promise<{ data: TseVoterDemographics[]; source: string }> => {
  if (!state || !years.length) {
    throw new Error('Estado e anos são obrigatórios');
  }

  let query = supabase
    .from('tse_voter_demographics')
    .select('*')
    .eq('state', state)
    .in('election_year', years)
    .limit(500);

  if (municipality) {
    query = query.eq('municipality', municipality);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return { data: (data || []) as TseVoterDemographics[], source: 'supabase' };
};

/**
 * Verifica status da sincronização de dados TSE
 */
export const checkSyncStatus = async (
  state: string,
  municipality?: string
): Promise<TseSyncStatus> => {
  if (!state) {
    throw new Error('Estado é obrigatório');
  }

  const { count: resultCount } = await supabase
    .from('tse_election_results')
    .select('id', { count: 'exact', head: true })
    .eq('state', state);

  const { count: financeCount } = await supabase
    .from('tse_campaign_finance')
    .select('id', { count: 'exact', head: true })
    .eq('state', state);

  const { data: yearData } = await supabase
    .from('tse_election_results')
    .select('election_year')
    .eq('state', state);

  const availableYears = yearData
    ? [...new Set(yearData.map((r: any) => r.election_year))].sort((a: number, b: number) => b - a)
    : [];

  const { data: lastRow } = await supabase
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
};
