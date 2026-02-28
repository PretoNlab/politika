#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
  echo "Defina GITHUB_REPOSITORY no formato owner/repo."
  echo "Exemplo: export GITHUB_REPOSITORY=PretoNlab/politika"
  exit 1
fi

OWNER="${GITHUB_REPOSITORY%/*}"
REPO="${GITHUB_REPOSITORY#*/}"

if [[ ! -f ".github/branch-protection-main.json" ]]; then
  echo "Arquivo .github/branch-protection-main.json não encontrado"
  exit 1
fi

echo "Aplicando proteção da branch main em ${OWNER}/${REPO}..."

if command -v gh >/dev/null 2>&1; then
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${OWNER}/${REPO}/branches/main/protection" \
    --input .github/branch-protection-main.json >/dev/null
elif [[ -n "${GH_TOKEN:-}" || -n "${GITHUB_TOKEN:-}" ]]; then
  TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
  RESPONSE_FILE="$(mktemp)"
  HTTP_CODE="$(curl -sS -o "${RESPONSE_FILE}" -w "%{http_code}" -X PUT \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${OWNER}/${REPO}/branches/main/protection" \
    --data-binary @.github/branch-protection-main.json)"

  if [[ "${HTTP_CODE}" -lt 200 || "${HTTP_CODE}" -ge 300 ]]; then
    echo "Erro ao aplicar proteção (HTTP ${HTTP_CODE}). Resposta da API:"
    cat "${RESPONSE_FILE}"
    rm -f "${RESPONSE_FILE}"
    exit 1
  fi

  rm -f "${RESPONSE_FILE}"
else
  echo "Nem gh CLI nem GH_TOKEN/GITHUB_TOKEN disponíveis."
  echo "Opção 1: instale gh CLI (https://cli.github.com/) e rode novamente."
  echo "Opção 2: exporte GH_TOKEN com permissão de admin no repositório."
  exit 1
fi

echo "Proteção aplicada com sucesso."

if [[ -x "./scripts/verify-branch-protection.sh" ]]; then
  echo "Validando configuração aplicada..."
  GITHUB_REPOSITORY="${GITHUB_REPOSITORY}" ./scripts/verify-branch-protection.sh
fi
