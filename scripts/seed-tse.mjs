/**
 * Script para baixar dados do TSE e popular o Supabase
 * Fonte: https://cdn.tse.jus.br/estatistica/sead/odsele/
 *
 * Uso: node scripts/seed-tse.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { mkdirSync, existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
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
const TSE_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

// Eleições municipais (prefeito): 2016, 2020, 2024
const MUNICIPAL_YEARS = [2016, 2020, 2024];

// Eleições gerais (estadual + federal): 2018, 2022
const GERAL_YEARS = [2018, 2022];

// Cargo codes das eleições gerais que queremos incluir
const GERAL_CARGOS = new Set(['1', '3', '5', '6', '7']); // Presidente(1), Governador(3), Senador(5), Dep. Federal(6), Dep. Estadual(7)
const CARGO_LABELS = { '1': 'Presidente', '3': 'Governador', '5': 'Senador', '6': 'Deputado Federal', '7': 'Deputado Estadual' };

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function downloadAndExtract(url, destDir) {
  ensureDir(destDir);
  const zipPath = join(destDir, 'data.zip');

  console.log(`  Baixando ${url}...`);
  execSync(`curl -sL --max-time 300 "${url}" -o "${zipPath}"`, { timeout: 320000 });

  console.log(`  Extraindo...`);
  execSync(`unzip -o -q "${zipPath}" -d "${destDir}"`, { timeout: 60000 });
  execSync(`rm "${zipPath}"`);
}

/**
 * Lê CSV do TSE (delimitado por ; encoding latin1)
 */
function parseCSV(filePath) {
  const rows = [];
  const content = readFileSync(filePath, 'latin1');
  const lines = content.split('\n');

  if (lines.length < 2) return rows;

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

function filterBahiaGeral(rows) {
  return rows.filter(r => {
    const uf = r.SG_UF || r.SG_UE || '';
    const cargo = String(r.CD_CARGO || '');
    const situacao = r.DS_SITUACAO_CANDIDATURA || '';
    // Só candidatos aptos (exclui cancelados/impugnados)
    const apto = !situacao.includes('INDEFERIDO') && !situacao.includes('CANCELADO');
    return uf === TARGET_STATE && GERAL_CARGOS.has(cargo) && apto;
  });
}

/**
 * Seed via consulta_cand (sem votos, mas com status de eleição)
 * Usado para eleições gerais cujo arquivo de votos é muito grande (>500MB)
 */
async function seedGeralViaCandidatos(year) {
  console.log(`\n========== ${year} (ESTADUAL/FEDERAL via consulta_cand) ==========`);

  const yearDir = join(TMP_DIR, `${year}_cand`);
  const url = `${TSE_BASE}/consulta_cand/consulta_cand_${year}.zip`;

  try {
    await downloadAndExtract(url, yearDir);

    const files = readdirSync(yearDir).filter(f => f.endsWith('.csv') && f.includes(`_BA`));
    console.log(`  Arquivos CSV da Bahia: ${files.length}`);

    let totalInserted = 0;

    for (const file of files) {
      const filePath = join(yearDir, file);
      console.log(`  Lendo ${file}...`);

      const allRows = parseCSV(filePath);
      console.log(`  Total de linhas: ${allRows.length}`);

      const filtered = filterBahiaGeral(allRows);
      console.log(`  Bahia filtrado (cargos relevantes): ${filtered.length} candidatos`);

      if (filtered.length === 0) continue;

      const batchSize = 500;
      let inserted = 0;

      for (let i = 0; i < filtered.length; i += batchSize) {
        const batch = filtered.slice(i, i + batchSize).map(r => {
          const cargoCode = String(r.CD_CARGO || '');
          const cargoLabel = CARGO_LABELS[cargoCode] || r.DS_CARGO || 'Estadual';
          const situacaoTurno = r.DS_SIT_TOT_TURNO || '';
          // Encoda resultado no campo coalition (nullable string) para exibir no UI
          const resultadoLabel = situacaoTurno.includes('ELEITO') ? 'ELEITO' :
            situacaoTurno.includes('2º TURNO') ? '2º TURNO' : null;
          return {
            election_year: year,
            election_type: cargoLabel,
            state: TARGET_STATE,
            municipality: r.NM_UE || 'BAHIA',
            zone: 0,
            candidate_name: r.NM_URNA_CANDIDATO || r.NM_CANDIDATO || '',
            candidate_number: parseInt(r.NR_CANDIDATO) || 0,
            party: r.SG_PARTIDO || '',
            coalition: resultadoLabel, // ELEITO / 2º TURNO / null
            votes: 0, // não disponível neste dataset
            total_voters: null,
            null_votes: 0,
            blank_votes: 0,
          };
        }).filter(r => r.candidate_name);

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

      console.log(`  Inseridos: ${inserted} candidatos`);
      totalInserted += inserted;
    }

    console.log(`  Total para ${year}: ${totalInserted}`);
    rmSync(yearDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`  Erro no ano ${year}: ${err.message}`);
    try { rmSync(yearDir, { recursive: true, force: true }); } catch (_) {}
  }
}

async function insertBatch(rows, year, electionType) {
  console.log(`  Processando ${rows.length} registros (${electionType} ${year})...`);

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(r => {
      const cargoLabel = CARGO_LABELS[String(r.CD_CARGO)] || r.DS_CARGO || electionType;
      return {
        election_year: year,
        election_type: cargoLabel,
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
      };
    }).filter(r => r.candidate_name && r.votes > 0);

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

async function seedYear(year, filterFn, electionType, label) {
  console.log(`\n========== ${year} (${label}) ==========`);

  const yearDir = join(TMP_DIR, `${year}_${electionType}`);

  // Tenta primeiro o arquivo específico da BA (menor), depois o nacional
  const urls = [
    `${TSE_BASE}/votacao_candidato_munzona/votacao_candidato_munzona_${year}_BA.zip`,
    `${TSE_BASE}/votacao_candidato_munzona/votacao_candidato_munzona_${year}.zip`,
  ];

  let downloaded = false;
  for (const url of urls) {
    try {
      await downloadAndExtract(url, yearDir);
      downloaded = true;
      break;
    } catch (e) {
      console.log(`  Falhou (${url.split('/').pop()}): ${e.message}`);
    }
  }

  if (!downloaded) {
    console.error(`  Não foi possível baixar dados para ${year}`);
    return;
  }

  try {

    const files = readdirSync(yearDir).filter(f => f.endsWith('.csv') && f.includes('_BA'));
    console.log(`  Arquivos CSV da Bahia: ${files.length}`);

    if (files.length === 0) {
      // Tenta sem filtro de BA (alguns anos têm arquivo único nacional)
      const allFiles = readdirSync(yearDir).filter(f => f.endsWith('.csv'));
      console.log(`  Sem BA específico. Arquivos disponíveis: ${allFiles.join(', ')}`);
    }

    let totalInserted = 0;

    for (const file of files) {
      const filePath = join(yearDir, file);
      console.log(`  Lendo ${file}...`);

      const allRows = parseCSV(filePath);
      console.log(`  Total de linhas: ${allRows.length}`);

      const filtered = filterFn(allRows);
      console.log(`  Bahia filtrado: ${filtered.length} registros`);

      if (filtered.length > 0) {
        totalInserted += await insertBatch(filtered, year, electionType);
      }
    }

    console.log(`  Total inserido para ${year}: ${totalInserted}`);
    rmSync(yearDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`  Erro no ano ${year}: ${err.message}`);
    try { rmSync(yearDir, { recursive: true, force: true }); } catch (_) {}
  }
}

async function main() {
  console.log('Seed de dados do TSE para Bahia');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Estado: ${TARGET_STATE}`);
  console.log('');

  ensureDir(TMP_DIR);

  // Pega args: --municipal, --geral, ou ambos (default)
  const args = process.argv.slice(2);
  const runMunicipal = args.length === 0 || args.includes('--municipal');
  const runGeral = args.length === 0 || args.includes('--geral');

  if (runMunicipal) {
    console.log(`=== MUNICIPAIS: ${MUNICIPAL_YEARS.join(', ')} ===`);
    for (const year of MUNICIPAL_YEARS) {
      await seedYear(year, filterBahiaPrefeito, 'Prefeito', 'MUNICIPAL');
    }
  }

  if (runGeral) {
    console.log(`\n=== GERAIS: ${GERAL_YEARS.join(', ')} ===`);
    for (const year of GERAL_YEARS) {
      await seedGeralViaCandidatos(year);
    }
  }

  // Contagem final
  const { count } = await supabase
    .from('tse_election_results')
    .select('id', { count: 'exact', head: true })
    .eq('state', TARGET_STATE);

  console.log(`\n========================================`);
  console.log(`Total de registros no Supabase (BA): ${count}`);
  console.log(`========================================\n`);

  try { rmSync(TMP_DIR, { recursive: true, force: true }); } catch (_) {}
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
