/**
 * Script para baixar dados do TSE e popular o Supabase
 * Fonte: https://cdn.tse.jus.br/estatistica/sead/odsele/
 *
 * Uso: node scripts/seed-tse.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { createReadStream, mkdirSync, existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { createReadStream as fsCreateReadStream } from 'fs';
import { config } from 'dotenv';

// Carrega .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TMP_DIR = '/tmp/tse-seed';
const TARGET_STATE = 'BA';

// Eleições municipais: 2016, 2020, 2024
const MUNICIPAL_YEARS = [2016, 2020, 2024];

const TSE_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function downloadAndExtract(url, destDir) {
  ensureDir(destDir);
  const zipPath = join(destDir, 'data.zip');

  console.log(`  Baixando ${url}...`);
  execSync(`curl -sL "${url}" -o "${zipPath}"`, { timeout: 120000 });

  console.log(`  Extraindo...`);
  execSync(`unzip -o -q "${zipPath}" -d "${destDir}"`, { timeout: 60000 });
  execSync(`rm "${zipPath}"`);
}

/**
 * Lê CSV do TSE (delimitado por ; encoding latin1)
 * e retorna array de objetos
 */
async function parseCSV(filePath) {
  const rows = [];
  const content = readFileSync(filePath, 'latin1');
  const lines = content.split('\n');

  if (lines.length < 2) return rows;

  // Header: remove aspas e normaliza
  const header = lines[0].replace(/"/g, '').split(';').map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.replace(/"/g, '').split(';');
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = values[j]?.trim() || '';
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * Filtra dados da Bahia e cargo de Prefeito
 */
function filterBahiaPrefeito(rows) {
  return rows.filter(r => {
    const uf = r.SG_UF || r.SG_UE || '';
    const cargo = r.DS_CARGO || r.CD_CARGO || '';
    return uf === TARGET_STATE && (
      cargo === 'PREFEITO' ||
      cargo === 'Prefeito' ||
      cargo === '11' ||
      String(r.CD_CARGO) === '11'
    );
  });
}

/**
 * Insere resultados eleitorais no Supabase
 */
async function insertElectionResults(rows, year) {
  console.log(`  Processando ${rows.length} registros para ${year}...`);

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(r => ({
      election_year: year,
      election_type: 'municipal',
      state: TARGET_STATE,
      municipality: r.NM_MUNICIPIO || r.NM_UE || '',
      zone: parseInt(r.NR_ZONA) || 0,
      candidate_name: r.NM_URNA_CANDIDATO || r.NM_CANDIDATO || '',
      candidate_number: parseInt(r.NR_CANDIDATO) || 0,
      party: r.SG_PARTIDO || '',
      coalition: r.NM_COLIGACAO || r.DS_COMPOSICAO_COLIGACAO || null,
      votes: parseInt(r.QT_VOTOS_NOMINAIS || r.QT_VOTOS) || 0,
      total_voters: parseInt(r.QT_APTOS) || null,
      null_votes: parseInt(r.QT_VOTOS_NULOS) || 0,
      blank_votes: parseInt(r.QT_VOTOS_BRANCOS) || 0,
    })).filter(r => r.candidate_name && r.votes > 0);

    if (batch.length === 0) continue;

    const { error } = await supabase
      .from('tse_election_results')
      .upsert(batch, {
        onConflict: 'election_year,state,municipality,zone,candidate_number',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error(`  Erro no batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  Inseridos: ${inserted} registros`);
  return inserted;
}

async function seedYear(year) {
  console.log(`\n========== ${year} ==========`);

  const yearDir = join(TMP_DIR, String(year));
  const url = `${TSE_BASE}/votacao_candidato_munzona/votacao_candidato_munzona_${year}.zip`;

  try {
    await downloadAndExtract(url, yearDir);

    // Encontra APENAS o CSV da Bahia (ignora BRASIL.csv que é gigante)
    const files = readdirSync(yearDir).filter(f => f.endsWith('.csv') && f.includes('_BA'));
    console.log(`  Arquivos CSV da Bahia: ${files.length}`);

    let totalInserted = 0;

    for (const file of files) {
      const filePath = join(yearDir, file);
      console.log(`  Lendo ${file}...`);

      const allRows = await parseCSV(filePath);
      console.log(`  Total de linhas: ${allRows.length}`);

      const baRows = filterBahiaPrefeito(allRows);
      console.log(`  Bahia (Prefeito): ${baRows.length} registros`);

      if (baRows.length > 0) {
        totalInserted += await insertElectionResults(baRows, year);
      }
    }

    console.log(`  Total inserido para ${year}: ${totalInserted}`);

    // Limpa
    rmSync(yearDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`  Erro no ano ${year}: ${err.message}`);
  }
}

async function main() {
  console.log('Seed de dados do TSE para Bahia');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Estado: ${TARGET_STATE}`);
  console.log(`Anos: ${MUNICIPAL_YEARS.join(', ')}`);
  console.log('');

  ensureDir(TMP_DIR);

  for (const year of MUNICIPAL_YEARS) {
    await seedYear(year);
  }

  // Verifica contagem final
  const { count } = await supabase
    .from('tse_election_results')
    .select('id', { count: 'exact', head: true })
    .eq('state', TARGET_STATE);

  console.log(`\n========================================`);
  console.log(`Total de registros no Supabase: ${count}`);
  console.log(`========================================\n`);

  // Limpa
  rmSync(TMP_DIR, { recursive: true, force: true });
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
