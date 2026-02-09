# 🚀 Guia de Deploy - Politika

## ✅ Migração Backend Completa!

A API key agora está **100% segura** no backend. Siga este guia para fazer o deploy.

---

## 📋 Pré-requisitos

- [x] Conta no [Vercel](https://vercel.com) (gratuito)
- [x] [Vercel CLI](https://vercel.com/cli) instalado (opcional, mas recomendado)
- [x] Chave da API Gemini ([obtenha aqui](https://ai.google.dev/))

---

## 🎯 Passo 1: Preparar o Repositório

### 1.1 Verificar Arquivos

Certifique-se de que estes arquivos existem:

```bash
✅ api/gemini.ts                  # Backend endpoint
✅ services/geminiClient.ts       # Cliente HTTP
✅ vercel.json                    # Configuração Vercel
✅ .env.example                   # Template de variáveis
✅ .gitignore                     # .env.local ignorado
```

### 1.2 Verificar que a API Key NÃO está exposta

```bash
# Este comando não deve retornar nada:
grep -r "GEMINI_API_KEY" vite.config.ts

# Se retornar algo, a key ainda está exposta!
```

### 1.3 Commit das Mudanças

```bash
git add .
git commit -m "feat: migrar API key para backend seguro"
git push origin main
```

---

## 🚀 Passo 2: Deploy no Vercel

### Opção A: Deploy via Dashboard (Mais Fácil)

1. **Acesse**: https://vercel.com/new

2. **Import Git Repository**
   - Conecte sua conta GitHub/GitLab
   - Selecione o repositório `politika`
   - Clique em "Import"

3. **Configure o Projeto**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Adicione Variáveis de Ambiente**
   - Clique em "Environment Variables"
   - Adicione:
     ```
     Name:  GEMINI_API_KEY
     Value: sua-chave-aqui
     ```
   - **Importante**: Marque todos os ambientes (Production, Preview, Development)

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde ~2 minutos
   - ✅ Seu app estará no ar!

### Opção B: Deploy via CLI (Mais Rápido)

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Adicionar variável de ambiente
vercel env add GEMINI_API_KEY

# Cole sua chave quando solicitado
# Selecione: Production, Preview, Development (todos)

# 5. Deploy para produção
vercel --prod
```

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### No Vercel Dashboard:

1. Vá para: **Settings → Environment Variables**

2. Adicione:
   ```
   GEMINI_API_KEY = AIzaSyC...
   ```

3. **Ambientes**: Marque todos
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Clique em **Save**

5. **Redeploy** o projeto para aplicar as mudanças:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deploy
   - Clique em **Redeploy**

---

## ✅ Passo 4: Verificar Deploy

### 4.1 Testar a Aplicação

Acesse a URL do deploy (exemplo: `politika.vercel.app`)

1. **Teste 1**: Análise Política
   - Digite um handle: `@politico_bahia`
   - Clique em "Analisar Perfil"
   - ✅ Deve funcionar normalmente

2. **Teste 2**: Análise de Crise
   - Vá em "War Room"
   - Digite um incidente
   - ✅ Deve retornar análise

3. **Teste 3**: Notícias
   - Configure um Workspace
   - ✅ Notícias devem carregar

### 4.2 Verificar Segurança

Abra o DevTools (F12) e verifique:

```bash
# 1. Vá em Sources → Network
# 2. Faça uma análise
# 3. Clique na requisição para /api/gemini
# 4. Verifique Headers e Payload

✅ Não deve aparecer "GEMINI_API_KEY" em lugar nenhum
✅ Apenas dados da requisição (handle, action, etc)
```

---

## 🛠️ Desenvolvimento Local

### Configurar Backend Local

1. **Copie o .env.example**
   ```bash
   cp .env.example .env.local
   ```

2. **Adicione sua chave**
   ```bash
   GEMINI_API_KEY=sua-chave-aqui
   ```

3. **Inicie o servidor dev**
   ```bash
   npm run dev
   ```

4. **Backend local**
   - O backend roda em: `http://localhost:3000/api/gemini`
   - O cliente detecta automaticamente (dev vs prod)

### Testar Backend Local

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Testar API
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"action":"politicalInsight","data":{"handle":"teste"}}'
```

---

## 🔧 Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"

**Causa**: Variável de ambiente não foi adicionada

**Solução**:
1. Vá em Settings → Environment Variables
2. Adicione `GEMINI_API_KEY`
3. Redeploy

### Erro: "API request failed with status 500"

**Causa**: Erro no backend (possivelmente quota excedida)

**Solução**:
1. Verifique logs: `vercel logs`
2. Verifique sua quota do Gemini API
3. Verifique se a chave está correta

### Erro: "Failed to fetch"

**Causa**: CORS ou URL incorreta

**Solução**:
1. Verifique se `vercel.json` está correto
2. Redeploy
3. Limpe cache do browser (Ctrl+Shift+R)

### Frontend funciona mas backend não

**Solução**:
```bash
# Verificar se a API está respondendo
curl https://seu-app.vercel.app/api/gemini

# Deve retornar erro 405 (Method Not Allowed)
# Se retornar 404, o endpoint não está configurado
```

---

## 📊 Monitoramento

### Logs do Vercel

```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs de uma função específica
vercel logs api/gemini
```

### Métricas

- **Dashboard**: https://vercel.com/[seu-usuario]/politika
- **Analytics**: Aba "Analytics"
- **Invocations**: Aba "Functions"

### Limites Gratuitos

- ✅ 100GB bandwidth/mês
- ✅ 100 horas de function execution/mês
- ✅ Suficiente para ~10k análises/mês

---

## 🎉 Pronto!

Sua aplicação agora está:

- ✅ **Segura**: API key protegida no backend
- ✅ **Escalável**: Deploy automático com git push
- ✅ **Monitorada**: Logs e métricas disponíveis
- ✅ **Rápida**: Edge functions globalmente distribuídas

---

## 📚 Recursos Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Troubleshooting](https://vercel.com/docs/functions/troubleshooting)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `vercel logs`
2. Leia este guia novamente
3. Verifique a [documentação do Vercel](https://vercel.com/docs)
4. Abra uma issue no repositório

---

**✨ Parabéns!** Você migrou com sucesso para uma arquitetura segura! 🎊
