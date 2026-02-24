#!/bin/bash
# setup-ci-secrets.sh
# Configura automaticamente os GitHub Secrets para o deploy automático no Vercel
# Uso: bash scripts/setup-ci-secrets.sh

set -e

REPO="PretoNlab/politika"
VERCEL_ORG_ID="team_FdrCBlFibJIvLQkXhAEj2vyR"
VERCEL_PROJECT_ID="prj_Cf0MId66am7utHouwucKfTyuhIU4"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     Politika — Setup Automático de CI/CD Secrets     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── PASSO 1: GitHub Personal Access Token ───────────────────────────────────
echo "📌 PASSO 1: GitHub Personal Access Token"
echo ""
echo "  Você precisa de um token com permissão 'repo' (para setar secrets)."
echo "  Crie um em: https://github.com/settings/tokens/new"
echo "  → Scope necessário: ✅ repo"
echo ""
read -rp "  Cole seu GitHub PAT aqui: " GITHUB_TOKEN
echo ""

# ─── PASSO 2: Vercel Token ───────────────────────────────────────────────────
echo "📌 PASSO 2: Vercel Token"
echo ""
echo "  Você precisa de um Vercel token."
echo "  Crie um em: https://vercel.com/account/tokens"
echo "  → Clique em 'Create Token', nome: github-actions-politika, Scope: Full Account"
echo ""
read -rp "  Cole seu Vercel Token aqui: " VERCEL_TOKEN
echo ""

# ─── PASSO 3: Configurar secrets via GitHub API ──────────────────────────────
echo "⚙️  Configurando secrets no repositório $REPO..."
echo ""

# Função para obter a chave pública do repositório (necessária para criptografar secrets)
echo "  🔑 Obtendo chave pública do repositório..."
PUB_KEY_RESPONSE=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/actions/secrets/public-key")

KEY_ID=$(echo "$PUB_KEY_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['key_id'])" 2>/dev/null)
PUB_KEY=$(echo "$PUB_KEY_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['key'])" 2>/dev/null)

if [ -z "$KEY_ID" ] || [ -z "$PUB_KEY" ]; then
  echo "  ❌ Erro ao obter chave pública. Verifique se o GITHUB_TOKEN tem permissão 'repo'."
  echo "  Resposta: $PUB_KEY_RESPONSE"
  exit 1
fi

echo "  ✅ Chave pública obtida (key_id: $KEY_ID)"
echo ""

# Função para criptografar e setar secret usando Python
set_secret() {
  local SECRET_NAME="$1"
  local SECRET_VALUE="$2"

  ENCRYPTED=$(python3 -c "
import base64, sys
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PublicKey
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

# GitHub usa libsodium (X25519 + XSalsa20-Poly1305)
# Usamos PyNaCl para isso
try:
    from nacl import encoding, public
    public_key = public.PublicKey(base64.b64decode('$PUB_KEY'))
    sealed_box = public.SealedBox(public_key)
    encrypted = sealed_box.encrypt(b'$SECRET_VALUE')
    print(base64.b64encode(encrypted).decode())
except ImportError:
    print('NACL_NOT_FOUND')
")

  if [ "$ENCRYPTED" = "NACL_NOT_FOUND" ]; then
    # Fallback: usar gh CLI se disponível
    if command -v gh &>/dev/null; then
      echo "$SECRET_VALUE" | gh secret set "$SECRET_NAME" --repo "$REPO"
    else
      echo "  ⚠️  PyNaCl não instalado. Instale com: pip3 install PyNaCl"
      return 1
    fi
  else
    curl -s -X PUT \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/$REPO/actions/secrets/$SECRET_NAME" \
      -d "{\"encrypted_value\":\"$ENCRYPTED\",\"key_id\":\"$KEY_ID\"}" > /dev/null
  fi
}

# Setar os 3 secrets
echo "  📤 Configurando VERCEL_TOKEN..."
set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN"
echo "  ✅ VERCEL_TOKEN configurado"

echo "  📤 Configurando VERCEL_ORG_ID..."
set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"
echo "  ✅ VERCEL_ORG_ID configurado"

echo "  📤 Configurando VERCEL_PROJECT_ID..."
set_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID"
echo "  ✅ VERCEL_PROJECT_ID configurado"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Tudo pronto! Deploy automático configurado.      ║"
echo "║                                                      ║"
echo "║  Qualquer push na main vai fazer deploy automático.  ║"
echo "║  Acompanhe em: github.com/$REPO/actions  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
