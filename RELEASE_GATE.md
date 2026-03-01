# Release Gate (Go/No-Go)

Este projeto possui um gate automatizado para reduzir regressão antes de deploy.

## Comandos locais

```bash
# Smoke rápido (sem build)
npm run smoke

# Release check completo (inclui build + validações)
npm run release:check

# Release check completo + verificação live de /api (exige servidor rodando)
npm run release:check:live

# Modo estrito (falha se /api não estiver acessível)
STRICT_LIVE_CHECK=true npm run release:check:live
```

## O que o script valida

- Arquivos críticos e rotas principais.
- Eventos de analytics essenciais (funil de produto).
- Presença de migrations no Supabase.
- Scan básico de segredos hardcoded.
- Build de produção e tamanho do chunk principal.
- Health de endpoints `/api/news` e `/api/gemini` (modo `--live`).

## Leitura do resultado

- `PASS`: item validado.
- `WARN`: item não bloqueante, mas com risco.
- `FAIL`: item crítico falhou.

Status final:

- `GO`: sem `FAIL` e sem `WARN`.
- `GO COM RISCO`: sem `FAIL`, com `WARN`.
- `NO-GO`: existe pelo menos um `FAIL`.

Observação:
- Sem `STRICT_LIVE_CHECK=true`, falha de conexão no host live gera `WARN`.
- Com `STRICT_LIVE_CHECK=true`, falha de conexão live gera `FAIL`.

## CI/CD

### CI (qualidade)

Workflow: [ci.yml](/Users/diegomachado/politika/.github/workflows/ci.yml)

- Executa em `pull_request` e `push` para `main`.
- Roda `npm ci` + `npm run release:check`.

### Deploy

Workflow: [deploy.yml](/Users/diegomachado/politika/.github/workflows/deploy.yml)

- PR: deploy preview na Vercel.
- Pós-deploy preview: live check estrito no URL de preview com:
  `STRICT_LIVE_CHECK=true node scripts/release-check.mjs --quick --live`.
- `main`: deploy de produção.

## Proteção da branch `main`

Política versionada em:
- [.github/branch-protection-main.json](/Users/diegomachado/politika/.github/branch-protection-main.json)

Aplicação e verificação:

```bash
export GITHUB_REPOSITORY=SEU_OWNER/SEU_REPO

# aplica política
npm run branch:protect

# verifica política aplicada
npm run branch:protect:verify
```

Requisitos da política:
- status check obrigatório: `CI / Quality Gate`;
- branch atualizada antes do merge (`strict: true`);
- 1 aprovação mínima em PR;
- bloquear force-push e deleção;
- exigir resolução de conversa.

Observação:
- `branch:protect` funciona com `gh` OU com `GH_TOKEN/GITHUB_TOKEN`.
