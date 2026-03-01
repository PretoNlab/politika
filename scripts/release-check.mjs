#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const quick = args.has('--quick');
const live = args.has('--live');
const apiBase = process.env.API_BASE || 'http://localhost:3000';
const strictLive = process.env.STRICT_LIVE_CHECK === 'true';

const results = [];

function addResult(section, item, status, details = '') {
  results.push({ section, item, status, details });
}

function pass(section, item, details = '') {
  addResult(section, item, 'PASS', details);
}

function warn(section, item, details = '') {
  addResult(section, item, 'WARN', details);
}

function fail(section, item, details = '') {
  addResult(section, item, 'FAIL', details);
}

function file(pathname) {
  return path.join(ROOT, pathname);
}

function runCommand(cmd, cmdArgs) {
  return spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

function checkFilesExist() {
  const requiredFiles = [
    'App.tsx',
    'package.json',
    'vercel.json',
    'api/gemini.ts',
    'api/news.ts',
    'api/trends.ts',
    'api/tse.ts',
    'context/AuthContext.tsx',
    'context/WorkspaceContext.tsx',
    'hooks/useAlertEngine.ts',
    'hooks/useCrisisAnalysis.ts',
    'components/Dashboard.tsx',
    'components/PulseMonitor.tsx',
    'components/CommandCenter.tsx',
  ];

  const missing = requiredFiles.filter((f) => !existsSync(file(f)));
  if (missing.length === 0) {
    pass('Smoke', 'Arquivos críticos existem', `${requiredFiles.length} arquivos verificados`);
  } else {
    fail('Smoke', 'Arquivos críticos existem', `Ausentes: ${missing.join(', ')}`);
  }
}

function checkAppRoutes() {
  const appPath = file('App.tsx');
  if (!existsSync(appPath)) {
    fail('Smoke', 'Rotas principais', 'App.tsx não encontrado');
    return;
  }

  const content = readFileSync(appPath, 'utf8');
  const requiredRoutes = [
    '/',
    '/onboarding',
    '/auth/callback',
    '/login',
    '/privacy',
    '/terms',
    '/dashboard',
    '/analyze',
    '/radar',
    '/insight-detail/:id?',
    '/comparison-detail/:id?',
    '/crisis',
    '/pulse',
    '/workspaces',
  ];

  const missing = requiredRoutes.filter((route) => !content.includes(`path=\"${route}\"`));
  if (missing.length === 0) {
    pass('Smoke', 'Rotas principais', `${requiredRoutes.length} rotas encontradas`);
  } else {
    fail('Smoke', 'Rotas principais', `Rotas ausentes: ${missing.join(', ')}`);
  }
}

function checkAnalyticsCoverage() {
  const filesToScan = [
    'context/AuthContext.tsx',
    'context/WorkspaceContext.tsx',
    'components/Dashboard.tsx',
    'hooks/useAlertEngine.ts',
    'hooks/useCrisisAnalysis.ts',
    'components/PulseMonitor.tsx',
  ];

  const requiredEvents = [
    'signup_completed',
    'login_completed',
    'workspace_created',
    'analysis_requested',
    'analysis_completed',
    'first_analysis_completed',
    'alert_actioned',
    'crisis_evaluation_completed',
    'pulse_viewed',
  ];

  const blob = filesToScan
    .filter((f) => existsSync(file(f)))
    .map((f) => readFileSync(file(f), 'utf8'))
    .join('\n');

  const missing = requiredEvents.filter((event) => !blob.includes(`'${event}'`) && !blob.includes(`\"${event}\"`));
  if (missing.length === 0) {
    pass('Observabilidade', 'Eventos críticos instrumentados', `${requiredEvents.length} eventos encontrados`);
  } else {
    fail('Observabilidade', 'Eventos críticos instrumentados', `Eventos ausentes: ${missing.join(', ')}`);
  }
}

function checkMigrations() {
  const migrationDir = file('supabase/migrations');
  if (!existsSync(migrationDir)) {
    warn('Dados', 'Migrations Supabase', 'Diretório supabase/migrations não encontrado');
    return;
  }

  const files = readdirSync(migrationDir).filter((f) => f.endsWith('.sql'));
  if (files.length > 0) {
    pass('Dados', 'Migrations Supabase', `${files.length} migration(s) encontradas`);
  } else {
    warn('Dados', 'Migrations Supabase', 'Sem arquivos .sql em supabase/migrations');
  }
}

function checkHardcodedSecrets() {
  const scanDirs = ['api', 'components', 'context', 'hooks', 'lib', 'services', 'utils'];
  const scanExt = new Set(['.ts', '.tsx', '.js', '.mjs']);
  const suspiciousPatterns = [
    /AIza[0-9A-Za-z_-]{20,}/g,
    /phc_[A-Za-z0-9]{20,}/g,
    /SUPABASE_SERVICE_KEY\s*=\s*['\"][^'\"]+['\"]/g,
    /GEMINI_API_KEY\s*=\s*['\"][^'\"]+['\"]/g,
  ];

  const suspects = [];

  function walk(dir) {
    const abs = file(dir);
    if (!existsSync(abs)) return;

    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const full = path.join(abs, entry.name);
      if (entry.isDirectory()) {
        walk(path.relative(ROOT, full));
        continue;
      }

      if (!scanExt.has(path.extname(entry.name))) continue;

      const rel = path.relative(ROOT, full);
      const content = readFileSync(full, 'utf8');

      for (const pattern of suspiciousPatterns) {
        pattern.lastIndex = 0;
        const hit = pattern.exec(content);
        if (hit) {
          suspects.push(`${rel}: ${hit[0].slice(0, 40)}...`);
          break;
        }
      }
    }
  }

  for (const dir of scanDirs) walk(dir);

  if (suspects.length === 0) {
    pass('Segurança', 'Segredos hardcoded (scan básico)', 'Nenhum padrão suspeito encontrado');
  } else {
    fail('Segurança', 'Segredos hardcoded (scan básico)', suspects.slice(0, 5).join(' | '));
  }
}

function checkBuildAndBundle() {
  if (quick) {
    warn('Funcional', 'Build de produção', 'Pulado por --quick');
    return;
  }

  const build = runCommand('npm', ['run', 'build']);

  if (build.status === 0) {
    pass('Funcional', 'Build de produção', 'npm run build finalizado com sucesso');
  } else {
    fail('Funcional', 'Build de produção', (build.stderr || build.stdout || 'Falha no build').trim());
    return;
  }

  const distAssets = file('dist/assets');
  if (!existsSync(distAssets)) {
    warn('Performance', 'Bundle size', 'Diretório dist/assets não encontrado após build');
    return;
  }

  const indexChunk = readdirSync(distAssets).find((f) => /^index-.*\.js$/.test(f));
  if (!indexChunk) {
    warn('Performance', 'Bundle size', 'Chunk principal não encontrado');
    return;
  }

  const sizeKB = statSync(path.join(distAssets, indexChunk)).size / 1024;
  if (sizeKB <= 800) {
    pass('Performance', 'Bundle size (index chunk)', `${sizeKB.toFixed(1)} KB`);
  } else {
    warn('Performance', 'Bundle size (index chunk)', `${sizeKB.toFixed(1)} KB (acima de 800 KB)`);
  }
}

async function checkLiveEndpoints() {
  if (!live) {
    warn('Smoke', 'Health de endpoints /api', 'Pulado (use --live para ativar)');
    return;
  }

  try {
    const newsRes = await fetch(`${apiBase}/api/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region: 'Bahia', term: 'eleicoes' }),
    });

    if (newsRes.status === 401 || newsRes.status === 429 || newsRes.status === 200) {
      pass('Smoke', 'Endpoint /api/news responde', `status=${newsRes.status}`);
    } else {
      warn('Smoke', 'Endpoint /api/news responde', `status=${newsRes.status}`);
    }
  } catch (err) {
    const details = `${err.message} (host indisponível em ${apiBase})`;
    if (strictLive) {
      fail('Smoke', 'Endpoint /api/news responde', details);
    } else {
      warn('Smoke', 'Endpoint /api/news responde', details);
    }
  }

  try {
    const geminiRes = await fetch(`${apiBase}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'politicalInsight', data: { handle: 'teste' } }),
    });

    if (geminiRes.status === 401 || geminiRes.status === 429 || geminiRes.status === 200) {
      pass('Smoke', 'Endpoint /api/gemini responde', `status=${geminiRes.status}`);
    } else {
      warn('Smoke', 'Endpoint /api/gemini responde', `status=${geminiRes.status}`);
    }
  } catch (err) {
    const details = `${err.message} (host indisponível em ${apiBase})`;
    if (strictLive) {
      fail('Smoke', 'Endpoint /api/gemini responde', details);
    } else {
      warn('Smoke', 'Endpoint /api/gemini responde', details);
    }
  }
}

function printResults() {
  const order = ['Segurança', 'Dados', 'Funcional', 'Observabilidade', 'Performance', 'Smoke'];
  const sorted = [...results].sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));

  console.log('\nPolitika Release Check\n');
  for (const r of sorted) {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'WARN' ? '[WARN]' : '[FAIL]';
    console.log(`${icon} ${r.section} :: ${r.item}`);
    if (r.details) console.log(`       ${r.details}`);
  }

  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;
  const passCount = results.filter((r) => r.status === 'PASS').length;

  console.log(`\nResumo: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

  if (failCount > 0) {
    console.log('Go/No-Go: NO-GO (existem itens críticos em FAIL)');
    process.exit(1);
  }

  if (warnCount > 0) {
    console.log('Go/No-Go: GO COM RISCO (avaliar WARNs antes de publicar)');
  } else {
    console.log('Go/No-Go: GO');
  }
}

async function main() {
  checkFilesExist();
  checkAppRoutes();
  checkAnalyticsCoverage();
  checkMigrations();
  checkHardcodedSecrets();
  checkBuildAndBundle();
  await checkLiveEndpoints();
  printResults();
}

main().catch((err) => {
  console.error('Erro inesperado no release-check:', err);
  process.exit(1);
});
