#!/usr/bin/env python3
"""
setup-ci-secrets.py
Configura automaticamente os GitHub Secrets para deploy automático no Vercel.

Uso (recomendado):
  GITHUB_TOKEN=ghp_xxx VERCEL_TOKEN=xxx python3 scripts/setup-ci-secrets.py

Ou interativo:
  python3 scripts/setup-ci-secrets.py
"""

import sys
import os
import base64
import urllib.request
import urllib.error
import json
import getpass

# ─── Configurações fixas do projeto ──────────────────────────────────────────
REPO               = "PretoNlab/politika"
VERCEL_ORG_ID      = "team_FdrCBlFibJIvLQkXhAEj2vyR"
VERCEL_PROJECT_ID  = "prj_Cf0MId66am7utHouwucKfTyuhIU4"
# ─────────────────────────────────────────────────────────────────────────────

def encrypt_secret(public_key_b64: str, secret_value: str) -> str:
    try:
        from nacl import public as nacl_public
        pub_key = nacl_public.PublicKey(base64.b64decode(public_key_b64))
        sealed_box = nacl_public.SealedBox(pub_key)
        encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
        return base64.b64encode(encrypted).decode("utf-8")
    except ImportError:
        print("❌ PyNaCl não encontrado. Instale com: pip3 install PyNaCl")
        sys.exit(1)

def github_put(path: str, token: str, data: dict):
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "politika-ci-setup/1.0",
    }
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="PUT")
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode()
        print(f"  ❌ Erro {e.code}: {resp_body}")
        sys.exit(1)

def get_repo_public_key(repo: str, token: str):
    url = f"https://api.github.com/repos/{repo}/actions/secrets/public-key"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "politika-ci-setup/1.0",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode()
        if e.code == 401:
            print("  ❌ Token inválido ou sem permissão.")
            print("     → Crie um novo em: https://github.com/settings/tokens/new")
            print("     → Marque: ✅ repo (Full control of private repositories)")
        elif e.code == 404:
            print(f"  ❌ Repositório não encontrado: {repo}")
        else:
            print(f"  ❌ Erro {e.code}: {resp_body}")
        sys.exit(1)

def set_secret(repo, name, value, token, key_id, pub_key):
    encrypted = encrypt_secret(pub_key, value)
    github_put(
        f"/repos/{repo}/actions/secrets/{name}",
        token,
        {"encrypted_value": encrypted, "key_id": key_id}
    )
    print(f"  ✅ {name}")

if __name__ == "__main__":
    print("")
    print("╔══════════════════════════════════════════════════════╗")
    print("║   Politika — Setup Automático de CI/CD Secrets       ║")
    print("╚══════════════════════════════════════════════════════╝")
    print("")

    # Aceita via env var OU prompt interativo
    github_token = os.environ.get("GITHUB_TOKEN", "").strip()
    vercel_token = os.environ.get("VERCEL_TOKEN", "").strip()

    if not github_token:
        print("📌 GitHub Personal Access Token")
        print("   Crie em: https://github.com/settings/tokens/new")
        print("   → Marque: ✅ repo")
        print("")
        github_token = getpass.getpass("   Cole o GitHub PAT: ").strip()
        print("")

    if not vercel_token:
        print("📌 Vercel Token")
        print("   Crie em: https://vercel.com/account/tokens")
        print("   → Nome: github-actions-politika | Scope: Full Account")
        print("")
        vercel_token = getpass.getpass("   Cole o Vercel Token: ").strip()
        print("")

    print(f"⚙️  Configurando 3 secrets em {REPO}...")
    print("")
    print("  🔑 Obtendo chave pública do repositório...")
    key_data = get_repo_public_key(REPO, github_token)
    key_id   = key_data["key_id"]
    pub_key  = key_data["key"]
    print(f"  ✅ Chave obtida\n")

    print("  📤 Criando secrets:")
    set_secret(REPO, "VERCEL_TOKEN",      vercel_token,     github_token, key_id, pub_key)
    set_secret(REPO, "VERCEL_ORG_ID",     VERCEL_ORG_ID,    github_token, key_id, pub_key)
    set_secret(REPO, "VERCEL_PROJECT_ID", VERCEL_PROJECT_ID,github_token, key_id, pub_key)

    print("")
    print("╔══════════════════════════════════════════════════════╗")
    print("║  🚀 Tudo pronto! Deploy automático ativado.         ║")
    print("║                                                      ║")
    print("║  Acompanhe: github.com/PretoNlab/politika/actions   ║")
    print("╚══════════════════════════════════════════════════════╝")
    print("")
