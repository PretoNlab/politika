# 🔒 Guia de Migração: API Key para Backend

## ⚠️ Problema Atual

A API key do Google Gemini está **EXPOSTA NO BUNDLE JAVASCRIPT** do cliente, permitindo que qualquer pessoa:
- Abra o DevTools e encontre a chave
- Use a chave para fazer requisições ilimitadas
- Consuma toda a sua cota da API
- Gere custos inesperados

**Localização do problema:** `vite.config.ts:14-15`

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // ❌ EXPOSTO
}
```

---

## ✅ Solução: Backend Proxy

Criar um backend intermediário que:
1. Armazena a API key com segurança no servidor
2. Recebe requisições do frontend
3. Faz chamadas à API Gemini em nome do frontend
4. Retorna apenas os resultados necessários

---

## 📋 Opções de Implementação

### Opção 1: Vercel Serverless Functions (Recomendado) ⚡

**Prós:**
- Deploy automático com git push
- Gratuito até 100GB/mês
- Zero configuração de infraestrutura
- Escalabilidade automática

**Contras:**
- Requer conta Vercel
- Limite de execução: 10s (hobby), 60s (pro)

### Opção 2: Netlify Functions

**Prós:**
- Similar ao Vercel
- Integração com GitHub
- Gratuito até 125k requisições/mês

**Contras:**
- Limite de execução: 10s (gratuito)

### Opção 3: Express.js + Render/Railway

**Prós:**
- Controle total
- Sem limites de execução
- Mais flexível

**Contras:**
- Requer manutenção de servidor
- Pode ter custo mensal

---

## 🚀 Implementação: Vercel Serverless (Passo a Passo)

### 1. Estrutura de Pastas

```
politika/
├── api/                    # Nova pasta
│   ├── gemini.ts          # Endpoint principal
│   └── types.ts           # Tipos compartilhados
├── components/
├── services/
│   └── geminiClient.ts    # Cliente HTTP (substituirá geminiService.ts)
└── vite.config.ts
```

### 2. Criar Endpoint Backend

**Arquivo:** `api/gemini.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// API key segura no servidor (variável de ambiente)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    switch (action) {
      case 'politicalInsight':
        return await handlePoliticalInsight(data, res);

      case 'comparativeInsight':
        return await handleComparativeInsight(data, res);

      case 'crisisResponse':
        return await handleCrisisResponse(data, res);

      case 'evaluateResponse':
        return await handleEvaluateResponse(data, res);

      case 'chat':
        return await handleChat(data, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

async function handlePoliticalInsight(
  data: { handle: string },
  res: VercelResponse
) {
  const { handle } = data;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: `Analise o perfil @${handle}...`,
    config: {
      responseMimeType: 'application/json',
      // ... resto da config
    }
  });

  return res.status(200).json({
    success: true,
    data: JSON.parse(response.text)
  });
}

// ... implementar outras funções (handleComparativeInsight, etc)
```

### 3. Cliente HTTP no Frontend

**Arquivo:** `services/geminiClient.ts`

```typescript
const API_URL = import.meta.env.PROD
  ? 'https://seu-app.vercel.app/api/gemini'
  : 'http://localhost:3000/api/gemini';

interface ApiRequest {
  action: string;
  data: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callApi<T>(request: ApiRequest): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }

  return result.data!;
}

export const generatePoliticalInsight = async (handle: string) => {
  return callApi({
    action: 'politicalInsight',
    data: { handle }
  });
};

export const generateComparativeInsight = async (handles: string[]) => {
  return callApi({
    action: 'comparativeInsight',
    data: { handles }
  });
};

export const generateCrisisResponse = async (
  incident: string,
  mediaData?: { data: string; mimeType: string },
  location?: { latitude: number; longitude: number }
) => {
  return callApi({
    action: 'crisisResponse',
    data: { incident, mediaData, location }
  });
};

// ... resto das funções
```

### 4. Atualizar Componentes

**Antes:**
```typescript
import { generatePoliticalInsight } from '../services/geminiService';
```

**Depois:**
```typescript
import { generatePoliticalInsight } from '../services/geminiClient';
```

### 5. Configurar Vercel

**Arquivo:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 6. Variáveis de Ambiente

**No Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Adicionar: `GEMINI_API_KEY` = `sua-chave-aqui`
3. Escopo: Production, Preview, Development

**Localmente (.env.local):**
```bash
GEMINI_API_KEY=sua-chave-aqui
```

### 7. Deploy

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar domínio (opcional)
vercel --prod
```

### 8. Remover API Key do Cliente

**Arquivo:** `vite.config.ts`

```typescript
// ❌ REMOVER ESTAS LINHAS:
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

---

## 🔐 Segurança Adicional

### Rate Limiting no Backend

```typescript
// api/gemini.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requisições por IP
  message: 'Too many requests'
});

export default limiter(handler);
```

### Autenticação (Opcional)

```typescript
// Validar token JWT
const token = req.headers.authorization?.split(' ')[1];

if (!token || !verifyToken(token)) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Validação de Input

```typescript
import { z } from 'zod';

const politicalInsightSchema = z.object({
  handle: z.string().min(1).max(50)
});

const { handle } = politicalInsightSchema.parse(data);
```

---

## 📊 Custos Estimados

### Vercel (Recomendado)
- **Hobby (Gratuito):**
  - 100GB bandwidth
  - Serverless function: 100 horas/mês
  - Suficiente para ~10k análises/mês

- **Pro ($20/mês):**
  - 1TB bandwidth
  - Serverless function: 1000 horas/mês

### Gemini API
- **Gratuito:**
  - 15 requisições/minuto
  - 1500 requisições/dia

- **Pago (Pay-as-you-go):**
  - $0.00025 por 1k caracteres (input)
  - $0.00075 por 1k caracteres (output)

**Exemplo:** 1000 análises/mês ≈ $2-5

---

## ✅ Checklist de Migração

- [ ] Criar pasta `api/`
- [ ] Implementar `api/gemini.ts`
- [ ] Criar `services/geminiClient.ts`
- [ ] Atualizar imports nos componentes
- [ ] Testar localmente
- [ ] Configurar Vercel
- [ ] Adicionar variáveis de ambiente
- [ ] Deploy
- [ ] Remover API key do `vite.config.ts`
- [ ] Verificar que a chave não está no bundle (DevTools → Sources)
- [ ] Testar em produção

---

## 🆘 Troubleshooting

### Erro: "GEMINI_API_KEY is not defined"
- Verificar variáveis de ambiente no Vercel Dashboard
- Rebuild após adicionar variáveis

### Erro: CORS
- Adicionar headers CORS no `api/gemini.ts`
- Verificar domínio permitido

### Timeout
- Gemini pode demorar >10s
- Upgrade para Vercel Pro (60s timeout)
- Ou usar backend dedicado (Express)

### 504 Gateway Timeout
- Reduzir tamanho da requisição
- Implementar retry logic
- Considerar processamento assíncrono

---

## 📚 Recursos Adicionais

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Google Gemini API](https://ai.google.dev/docs)
- [Express Rate Limiting](https://www.npmjs.com/package/express-rate-limit)
- [Zod Validation](https://zod.dev/)

---

## 🎯 Resultado Esperado

**Antes:**
```javascript
// Bundle do cliente
const API_KEY = "AIzaSyCm7zaUKhgSf4CxoEdMbowz96bcL6VxAuA"; // ❌ VISÍVEL
```

**Depois:**
```javascript
// Bundle do cliente
fetch('/api/gemini', { ... }); // ✅ SEGURO
```

**No servidor (Vercel):**
```javascript
// Código não exposto
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY // ✅ SEGURO
});
```

---

## ⏱️ Tempo Estimado

- Implementação: 2-3 horas
- Testes: 30 minutos
- Deploy: 15 minutos
- **Total: ~3-4 horas**

---

**✨ Resultado:** API key 100% segura, sem exposição no cliente!
