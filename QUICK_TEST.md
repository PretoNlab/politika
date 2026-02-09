# ⚡ Teste Rápido - Politika

## 🎯 Opção 1: Testar com Vercel Dev (Recomendado)

Esta é a forma mais realista de testar o backend localmente:

```bash
# 1. Iniciar Vercel Dev
npx vercel dev

# Primeira vez vai perguntar:
# - Login na Vercel (se não estiver logado)
# - Link com projeto (escolha "Create new project")
# - Nome do projeto: politika
# - Diretório: . (raiz)

# 2. Aguardar iniciar
# Vai abrir em: http://localhost:3000

# 3. Testar no navegador!
# Abra: http://localhost:3000
```

### O que o `vercel dev` faz:

- ✅ Roda o frontend (Vite)
- ✅ Roda as funções serverless (`api/gemini.ts`)
- ✅ Simula exatamente o ambiente de produção
- ✅ Hot reload automático

---

## 🎯 Opção 2: Teste Rápido (Sem Backend Local)

Se quiser testar apenas o frontend:

```bash
# 1. Comentar temporariamente as chamadas de API
# OU usar dados mock

# 2. Iniciar apenas o frontend
npm run dev

# 3. Testar a UI
# Abra: http://localhost:3000
```

**Limitações:**
- ❌ Análises não vão funcionar (sem backend)
- ✅ UI, navegação, workspaces funcionam
- ✅ Bom para testar layout e responsividade

---

## 🎯 Opção 3: Deploy Preview (Mais Rápido!)

A forma MAIS rápida de testar tudo:

```bash
# 1. Fazer commit
git add .
git commit -m "test: backend migration"

# 2. Deploy preview
npx vercel

# Vai perguntar:
# - Link with project? N (não)
# - Project name: politika
# - Directory: . (enter)

# 3. Aguardar deploy (~2 min)
# Vai gerar URL: https://politika-xxx.vercel.app

# 4. Configurar API key
npx vercel env add GEMINI_API_KEY
# Cole sua chave
# Selecione: Development, Preview, Production

# 5. Redeploy
npx vercel

# 6. Abrir URL e testar!
```

**Vantagens:**
- ✅ Testa exatamente como vai funcionar em produção
- ✅ Não precisa configurar nada localmente
- ✅ URL compartilhável para testar em outros dispositivos

---

## ✅ Checklist de Teste (Qualquer Opção)

### 1. Dashboard
- [ ] Digite um handle e clique "Analisar Perfil"
- [ ] Deve carregar e mostrar análise
- [ ] Toast de sucesso aparece

### 2. Comparação
- [ ] Adicione 2-3 candidatos
- [ ] Clique "Comparar Candidatos"
- [ ] Deve mostrar battle card

### 3. War Room
- [ ] Digite um incidente de crise
- [ ] Clique "Ativar Contra-Medida"
- [ ] Deve mostrar estratégias

### 4. Segurança (IMPORTANTE!)
- [ ] Abra DevTools (F12)
- [ ] Vá em Network
- [ ] Faça uma análise
- [ ] Clique na requisição `gemini`
- [ ] **VERIFIQUE**: API key NÃO aparece em lugar nenhum

---

## 🐛 Problemas Comuns

### "Cannot find module @vercel/node"

```bash
npm install
```

### "GEMINI_API_KEY não configurada"

**Local:**
```bash
# Verificar .env.local
cat .env.local

# Deve ter:
GEMINI_API_KEY=AIzaSy...
```

**Vercel:**
```bash
npx vercel env add GEMINI_API_KEY
# Cole a chave
```

### Frontend carrega mas análises não funcionam

- Verifique se está usando `vercel dev` (não `npm run dev`)
- OU faça deploy preview

---

## 🚀 Recomendação

Para testar rapidamente antes do deploy definitivo:

```bash
# 1. Deploy preview
npx vercel

# 2. Adicionar API key
npx vercel env add GEMINI_API_KEY

# 3. Redeploy
npx vercel

# 4. Testar na URL gerada

# 5. Se tudo OK, deploy para produção
npx vercel --prod
```

Isso é **MUITO** mais rápido que configurar tudo localmente!

---

## ⏭️ Próximo Passo

Escolha uma opção acima e teste! Se tudo funcionar:

```bash
# Deploy final para produção
npx vercel --prod

# Pronto! 🎉
```
