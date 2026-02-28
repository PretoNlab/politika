#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
  echo "Defina GITHUB_REPOSITORY no formato owner/repo."
  echo "Exemplo: export GITHUB_REPOSITORY=PretoNlab/politika"
  exit 1
fi

OWNER="${GITHUB_REPOSITORY%/*}"
REPO="${GITHUB_REPOSITORY#*/}"

if command -v gh >/dev/null 2>&1; then
  JSON="$(gh api -H 'Accept: application/vnd.github+json' "/repos/${OWNER}/${REPO}/branches/main/protection")"
elif [[ -n "${GH_TOKEN:-}" || -n "${GITHUB_TOKEN:-}" ]]; then
  TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
  JSON="$(curl -sS \
    -H 'Accept: application/vnd.github+json' \
    -H "Authorization: Bearer ${TOKEN}" \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    "https://api.github.com/repos/${OWNER}/${REPO}/branches/main/protection")"
else
  echo "Nem gh CLI nem GH_TOKEN/GITHUB_TOKEN disponíveis."
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  API_ERROR="$(echo "$JSON" | jq -r '.message // empty')"
  if [[ -n "${API_ERROR}" ]]; then
    echo "Erro retornado pela API do GitHub: ${API_ERROR}"
    echo "$JSON" | jq -r '.documentation_url // empty' | sed 's/^/Doc: /'
    exit 1
  fi

  CONTEXTS_FROM_CHECKS="$(echo "$JSON" | jq -r '.required_status_checks.checks[]?.context' 2>/dev/null || true)"
  CONTEXTS_FROM_CONTEXTS="$(echo "$JSON" | jq -r '.required_status_checks.contexts[]?' 2>/dev/null || true)"
  CONTEXTS="$(printf "%s\n%s\n" "$CONTEXTS_FROM_CHECKS" "$CONTEXTS_FROM_CONTEXTS" | sed '/^$/d' | sort -u)"
  STRICT="$(echo "$JSON" | jq -r '.required_status_checks.strict' 2>/dev/null || true)"
  REVIEWS="$(echo "$JSON" | jq -r '.required_pull_request_reviews.required_approving_review_count' 2>/dev/null || true)"
  FORCE_PUSH="$(echo "$JSON" | jq -r '.allow_force_pushes.enabled' 2>/dev/null || true)"
  DELETIONS="$(echo "$JSON" | jq -r '.allow_deletions.enabled' 2>/dev/null || true)"

  echo "Branch protection (main)"
  echo "- strict checks: ${STRICT}"
  echo "- required checks:"
  if [[ -n "$CONTEXTS" ]]; then
    echo "$CONTEXTS" | sed 's/^/  - /'
  else
    echo "  - (nenhum)"
  fi
  echo "- approvals required: ${REVIEWS}"
  echo "- force push allowed: ${FORCE_PUSH}"
  echo "- deletions allowed: ${DELETIONS}"

  if echo "$CONTEXTS" | grep -q '^CI / Quality Gate$'; then
    echo "OK: status check 'CI / Quality Gate' está configurado."
  else
    echo "ERRO: status check 'CI / Quality Gate' não encontrado."
    exit 1
  fi
else
  echo "jq não encontrado. Retornando JSON bruto:"
  echo "$JSON"
fi
