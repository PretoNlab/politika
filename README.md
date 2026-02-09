<div align="center">

# Politika

**Inteligencia politica estrategica para campanhas na Bahia**

[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://politika-plum.vercel.app)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)

Plataforma de inteligencia politica alimentada por IA generativa, projetada para estrategistas, assessores e candidatos politicos na Bahia. Transforma dados publicos e contexto regional em analises estrategicas acionaveis, gestao de crises em tempo real e monitoramento de sentimento politico.

</div>

---

## Funcionalidades

### Command Center
Central de comando com alertas inteligentes classificados por severidade, metricas consolidadas e acoes rapidas. Auto-refresh a cada 60 segundos.

### Analise de Candidatos
Perfil estrategico completo com headline, tom dominante, gatilhos psicologicos, risco estrategico e proximo melhor movimento. Inclui chat contextual com IA para aprofundamento.

### Battle Card Comparativo
Comparacao visual de 2-3 candidatos lado a lado com pilares de confronto tema-a-tema, vazio estrategico e recomendacao de movimento vencedor.

### War Room (Gestao de Crises)
Resposta rapida a crises com input multimodal (texto + video/audio/imagem). Gera estrategias com scripts prontos e avalia rascunhos de resposta com score de efetividade.

### Pulse Monitor
Monitoramento de sentimento em tempo real com noticias do Google News, waveform de 24h e analise de sentimento por IA. Cache inteligente para performance.

### Motor de Alertas
Deteccao automatica de mudancas de sentimento, crises e trending topics com classificacao por severidade (danger, warning, opportunity, info).

### Workspaces
Gerenciamento de multiplas campanhas simultaneas com regiao, watchwords e contexto isolado por workspace.

### Historico
Timeline visual de eventos da campanha com navegacao para detalhes de cada analise.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Roteamento | react-router-dom 7 (HashRouter) |
| IA | Google Gemini 2.5 Flash |
| Backend | Vercel Serverless Functions |
| Banco de Dados | Supabase (PostgreSQL) com RLS |
| Autenticacao | Supabase Auth (JWT) |
| Monitoramento | Sentry |
| Estilizacao | TailwindCSS + CSS customizado |
| Deploy | Vercel |

---

## Arquitetura

```
┌─────────────┐     HTTPS + JWT      ┌──────────────────────┐     SDK      ┌──────────────┐
│   Frontend   │ ──────────────────►  │  Vercel Serverless   │ ──────────►  │  Gemini API  │
│   (React)    │                      │   /api/gemini        │              └──────────────┘
└─────────────┘                      │                      │
       │                              │  process.env         │
       │         HTTPS                │  .GEMINI_API_KEY     │
       └─────────────────────────►    └──────────────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │   Supabase   │
                                      │  (PostgreSQL)│
                                      └──────────────┘
```

**Seguranca**: API keys existem apenas no servidor. JWT autentica todas as requisicoes. Row Level Security isola dados por usuario. Input sanitizado com deteccao de prompt injection.

---

## Setup Local

### Pre-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) com projeto criado
- Chave da [Google Gemini API](https://ai.google.dev/)

### Instalacao

```bash
# Clone o repositorio
git clone https://github.com/PretoNlab/politika.git
cd politika

# Instale as dependencias
npm install

# Configure as variaveis de ambiente
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
GEMINI_API_KEY=sua-chave-gemini
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key
VITE_SENTRY_DSN=seu-dsn-sentry
```

### Banco de Dados

Execute o schema no Supabase SQL Editor:

```bash
# O arquivo supabase-schema.sql contém todas as tabelas e políticas RLS
```

### Executar

```bash
npm run dev
```

A aplicacao estara disponivel em `http://localhost:3000`.

### Build

```bash
npm run build
npm run preview
```

---

## Deploy (Vercel)

1. Conecte o repositorio no [Vercel Dashboard](https://vercel.com)
2. Configure as environment variables:
   - `GEMINI_API_KEY` - Chave da API Gemini (server-side)
   - `VITE_SUPABASE_URL` - URL do projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` - Chave anonima do Supabase
   - `SUPABASE_SERVICE_KEY` - Chave de servico do Supabase (server-side)
   - `VITE_SENTRY_DSN` - DSN do Sentry
3. Deploy automatico a cada push na `main`

---

## Estrutura do Projeto

```
politika/
├── api/
│   └── gemini.ts              # Serverless function (backend proxy)
├── components/
│   ├── CommandCenter.tsx       # Central de comando
│   ├── Dashboard.tsx           # Tela de analise
│   ├── InsightsDetail.tsx      # Detalhe de candidato + chat
│   ├── ComparisonDetail.tsx    # Battle Card comparativo
│   ├── CrisisManagement.tsx    # War Room
│   ├── PulseMonitor.tsx        # Monitoramento de sentimento
│   ├── History.tsx             # Timeline de eventos
│   ├── Workspaces.tsx          # Gerenciamento de workspaces
│   ├── Layout.tsx              # Header, nav e footer
│   ├── Login.tsx               # Autenticacao
│   └── ErrorBoundary.tsx       # Fallback de erros
├── hooks/
│   ├── usePoliticalAnalysis.ts # Analise individual e comparativa
│   ├── useCrisisAnalysis.ts    # Gestao de crises
│   ├── usePulseMonitor.ts      # Metricas de sentimento
│   ├── useAlertEngine.ts       # Motor de alertas
│   ├── useSentiment.ts         # Analise de sentimento por IA
│   ├── useNews.ts              # Google News RSS
│   ├── useTrends.ts            # Tendencias
│   └── useRateLimit.ts         # Rate limiting client-side
├── services/
│   ├── geminiClient.ts         # HTTP client para backend proxy
│   ├── newsService.ts          # Fetch de noticias
│   └── trendsService.ts        # Computacao de tendencias
├── context/
│   ├── AuthContext.tsx          # Estado de autenticacao
│   └── WorkspaceContext.tsx     # Workspace ativo
├── pages/
│   ├── PrivacyPolicy.tsx       # Politica de Privacidade
│   └── TermsOfService.tsx      # Termos de Servico
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   └── sentry.ts               # Configuracao Sentry
├── utils/
│   └── security.ts             # Sanitizacao e validacao
├── types.ts                    # Tipos TypeScript
├── App.tsx                     # Rotas e providers
├── index.tsx                   # Entry point
├── vercel.json                 # Config Vercel + security headers
└── vite.config.ts              # Config Vite
```

---

## API

Endpoint unico via Vercel Serverless Function:

**`POST /api/gemini`**

| Action | Descricao |
|--------|-----------|
| `politicalInsight` | Analise individual de candidato |
| `comparativeInsight` | Battle Card comparativo (2-5 candidatos) |
| `crisisResponse` | Analise de crise com grounding |
| `evaluateResponse` | Avaliacao de rascunho de resposta |
| `sentiment` | Analise de sentimento de artigos |
| `chat` | Chat contextual sobre analise |

Todas as requisicoes exigem header `Authorization: Bearer <jwt>`.

---

## Roadmap

- [ ] Testes automatizados (Vitest + Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Responsividade mobile completa
- [ ] Exportacao PDF
- [ ] Rate limiting server-side
- [ ] Monitoramento de redes sociais
- [ ] Heatmap regional da Bahia
- [ ] Push notifications
- [ ] Dashboard colaborativo com roles
- [ ] App mobile (PWA)

---

## Licenca

Projeto privado. Todos os direitos reservados.
