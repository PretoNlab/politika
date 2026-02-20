# PRD Técnico — Politika v0.2.0

## Sumário Executivo

**Politika** é uma plataforma SaaS de inteligência política alimentada por IA generativa (Google Gemini 2.5 Flash), projetada para estrategistas, assessores e candidatos políticos no Brasil. A ferramenta transforma dados públicos (Google News RSS, Google Search Grounding) e contexto regional personalizado em análises estratégicas acionáveis, gestão de crises multimodal e monitoramento de sentimento com alertas inteligentes.

| Atributo | Valor |
|----------|-------|
| **URL de Produção** | https://politika-plum.vercel.app |
| **Stack** | React 19 + TypeScript + Vite 6 + Vercel Serverless |
| **IA** | Google Gemini 2.5 Flash via `@google/genai` 1.38+ |
| **Banco de Dados** | Supabase (PostgreSQL + Auth + RLS) |
| **State Management** | React Context API + Zustand 5 |
| **Error Tracking** | Sentry (`@sentry/react` 10.38) |
| **Deploy** | Vercel (auto-deploy via Git) |

---

## 1. Arquitetura do Sistema

### 1.1 Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA)                               │
│  React 19 + TypeScript + Vite 6 + HashRouter                       │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Command  │ │Dashboard │ │  Pulse   │ │  Crisis  │ │ History  │ │
│  │ Center   │ │(Análise) │ │ Monitor  │ │ WarRoom  │ │          │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │            │            │            │            │        │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴────┐   │
│  │                    Custom Hooks Layer                        │   │
│  │  usePulseMonitor │ useAlertEngine │ useBriefing │ useHistory │   │
│  │  usePoliticalAnalysis │ useCrisisAnalysis │ useSentiment     │   │
│  └────────────────────────────┬────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────┴────────────────────────────────┐   │
│  │                     Services Layer                          │   │
│  │  geminiClient.ts │ newsService.ts │ trendsService.ts        │   │
│  └────────────────────────────┬────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────┴────────────────────────────────┐   │
│  │              State Management                               │   │
│  │  AuthContext │ WorkspaceContext │ generationStore (Zustand)  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS + JWT
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   BACKEND (Vercel Serverless)                        │
│                                                                      │
│  ┌───────────────────┐    ┌───────────────────┐                      │
│  │  POST /api/gemini  │    │  POST /api/news    │                    │
│  │  (7 actions)       │    │  (RSS proxy)       │                    │
│  └────────┬──────────┘    └────────┬───────────┘                    │
│           │                        │                                 │
│           ▼                        ▼                                 │
│  ┌─────────────────┐    ┌──────────────────────┐                    │
│  │ Google Gemini    │    │ Google News RSS      │                    │
│  │ 2.5 Flash API   │    │ (pt-BR, sem CORS)    │                    │
│  │ + Search Ground. │    └──────────────────────┘                    │
│  │ + Maps Grounding │                                                │
│  └─────────────────┘                                                 │
│                                                                      │
│  process.env.GEMINI_API_KEY (nunca exposta ao client)                │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │ auth.users  │  │ workspaces │  │ analyses   │  │ alerts         │ │
│  │ (Auth+JWT)  │  │ (RLS)      │  │ (RLS)      │  │ (RLS)          │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────┘ │
│                                   ┌────────────────┐                 │
│                                   │sentiment_history│                 │
│                                   │ (RLS)           │                 │
│                                   └────────────────┘                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Padrão de Segurança: Backend Proxy

A API key do Gemini **nunca** é exposta ao frontend. O fluxo é:

1. Frontend obtém JWT via `supabase.auth.getSession()`
2. Frontend envia request para `/api/gemini` com `Authorization: Bearer <JWT>`
3. Serverless function valida JWT via `supabase.auth.getUser(token)`
4. Serverless function faz chamada autenticada ao Gemini com `process.env.GEMINI_API_KEY`
5. Resposta parseada e validada é retornada ao frontend

### 1.3 CORS e Security Headers

Configurados em `vercel.json`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` com whitelist explícita
- CORS restrito a `politika-plum.vercel.app` e `localhost:3000`

---

## 2. Estrutura de Diretórios

```
politika/
├── api/                          # Vercel Serverless Functions
│   ├── gemini.ts                 # Endpoint principal de IA (7 actions)
│   └── news.ts                   # Proxy RSS do Google News
├── components/                   # Componentes React (páginas + UI)
│   ├── CommandCenter.tsx          # Página inicial: alertas + briefing + métricas
│   ├── Dashboard.tsx              # Criação de análises + feed de notícias
│   ├── PulseMonitor.tsx           # Monitoramento de sentimento em tempo real
│   ├── CrisisManagement.tsx       # War Room para gestão de crises
│   ├── InsightsDetail.tsx         # Relatório detalhado de candidato + chat
│   ├── ComparisonDetail.tsx       # Battle Card comparativo
│   ├── History.tsx                # Timeline de análises passadas
│   ├── Workspaces.tsx             # Gerenciamento de workspaces/campanhas
│   ├── WorkspaceForm.tsx          # Modal de criação/edição de workspace
│   ├── Layout.tsx                 # Header + nav + footer
│   ├── Login.tsx                  # Autenticação (login/cadastro)
│   ├── ProtectedRoute.tsx         # Guard de rotas autenticadas
│   └── ErrorBoundary.tsx          # Error boundary com Sentry
├── context/                       # React Context Providers
│   ├── AuthContext.tsx             # Autenticação (Supabase Auth)
│   └── WorkspaceContext.tsx        # Workspaces (CRUD + ativação)
├── hooks/                         # Custom Hooks (lógica de negócio)
│   ├── usePulseMonitor.ts         # Agregador: news + sentiment + trends
│   ├── useAlertEngine.ts          # Motor de alertas baseado em sentimento
│   ├── useBriefing.ts             # Briefing executivo por IA com fallback
│   ├── usePoliticalAnalysis.ts    # Análise individual e comparativa
│   ├── useCrisisAnalysis.ts       # Análise de crise + avaliação de resposta
│   ├── useSentiment.ts            # Análise de sentimento com cache
│   ├── useNews.ts                 # Fetch de notícias com cache
│   ├── useHistory.ts              # CRUD de histórico de análises
│   ├── useRateLimit.ts            # Rate limiting genérico client-side
│   └── useTrends.ts               # Cálculo de tendências
├── services/                      # Camada de comunicação
│   ├── geminiClient.ts            # HTTP client para /api/gemini (retry, timeout, sanitização)
│   ├── newsService.ts             # Fetch Google News RSS (backend + CORS fallback)
│   └── trendsService.ts           # Computação de trends (hourly + daily)
├── store/                         # State Management (Zustand)
│   └── generationStore.ts         # Estado da geração automática PLG
├── lib/                           # Bibliotecas compartilhadas
│   └── supabase.ts                # Cliente Supabase (anon key)
├── utils/                         # Utilitários
│   └── security.ts                # Sanitização, XSS, prompt injection detection
├── constants/                     # Constantes centralizadas
│   └── index.ts                   # Rate limits, MIME types, design tokens, URLs
├── pages/                         # Páginas estáticas
│   ├── PrivacyPolicy.tsx          # Política de Privacidade
│   └── TermsOfService.tsx         # Termos de Serviço
├── types.ts                       # Interfaces TypeScript globais
├── App.tsx                        # Router + providers + layout
├── index.tsx                      # Entry point (React root)
├── index.html                     # HTML base (fontes, TailwindCSS CDN)
├── vercel.json                    # Config Vercel (rewrites, headers, CSP)
├── vite.config.ts                 # Config Vite
├── tsconfig.json                  # Config TypeScript
├── supabase-schema.sql            # DDL completo do banco (4 tabelas + RLS)
└── supabase/                      # Config Supabase local (em setup)
```

---

## 3. Modelo de Dados

### 3.1 Schema PostgreSQL (Supabase)

#### `workspaces`
| Coluna | Tipo | Constraint | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PK, default `gen_random_uuid()` | ID único |
| `user_id` | UUID | FK → `auth.users(id)` ON DELETE CASCADE | Proprietário |
| `name` | TEXT | NOT NULL | Nome da campanha |
| `state` | TEXT | DEFAULT '' | Estado brasileiro (27 UFs) |
| `region` | TEXT | DEFAULT '' | Região/cidade específica |
| `custom_context` | TEXT | nullable | Contexto político personalizado |
| `watchwords` | TEXT[] | DEFAULT '{}' | Termos de monitoramento |
| `status` | TEXT | CHECK IN ('active', 'archived') | Status |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Criação |
| `updated_at` | TIMESTAMPTZ | DEFAULT `now()` + trigger | Última atualização |

#### `analyses`
| Coluna | Tipo | Constraint | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PK | ID único |
| `user_id` | UUID | FK → `auth.users(id)` ON DELETE CASCADE | Proprietário |
| `workspace_id` | UUID | FK → `workspaces(id)` ON DELETE SET NULL | Workspace associado |
| `type` | TEXT | CHECK IN ('insight', 'comparison') | Tipo de análise |
| `handle` | TEXT | NOT NULL | Handle(s) analisado(s) |
| `result` | JSONB | NOT NULL, DEFAULT '{}' | Resultado completo da IA |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Data da análise |

#### `alerts`
| Coluna | Tipo | Constraint | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PK | ID único |
| `user_id` | UUID | FK → `auth.users(id)` | Proprietário |
| `workspace_id` | UUID | FK → `workspaces(id)` | Workspace |
| `category` | TEXT | NOT NULL | sentiment_drop, crisis_detected, etc. |
| `severity` | TEXT | CHECK IN ('info', 'warning', 'danger', 'opportunity') | Nível |
| `title` | TEXT | NOT NULL | Título do alerta |
| `description` | TEXT | DEFAULT '' | Descrição |
| `term` | TEXT | nullable | Watchword relacionada |
| `sentiment_delta` | NUMERIC | nullable | Variação de sentimento |
| `related_articles` | JSONB | DEFAULT '[]' | Artigos relacionados |
| `suggested_actions` | JSONB | DEFAULT '[]' | Ações sugeridas |
| `is_read` | BOOLEAN | DEFAULT false | Lido |
| `is_actioned` | BOOLEAN | DEFAULT false | Ação tomada |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Criação |

#### `sentiment_history`
| Coluna | Tipo | Constraint | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PK | ID único |
| `user_id` | UUID | FK → `auth.users(id)` | Proprietário |
| `workspace_id` | UUID | FK → `workspaces(id)` | Workspace |
| `term` | TEXT | NOT NULL | Watchword |
| `score` | NUMERIC | NOT NULL | Score -1.0 a 1.0 |
| `classification` | TEXT | nullable | Positivo/Neutro/Negativo |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Timestamp |

### 3.2 Row Level Security (RLS)

Todas as 4 tabelas possuem RLS habilitado com policies idênticas:
- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `auth.uid() = user_id`
- `UPDATE`: `auth.uid() = user_id` (workspaces e alerts)
- `DELETE`: `auth.uid() = user_id`

### 3.3 Índices de Performance

```sql
idx_workspaces_user_id ON workspaces(user_id)
idx_analyses_user_id ON analyses(user_id)
idx_analyses_workspace_id ON analyses(workspace_id)
idx_analyses_created_at ON analyses(created_at DESC)
idx_alerts_user_id ON alerts(user_id)
idx_alerts_workspace_id ON alerts(workspace_id)
idx_alerts_is_read ON alerts(is_read)
idx_sentiment_history_user_id ON sentiment_history(user_id)
idx_sentiment_history_term ON sentiment_history(term)
```

### 3.4 Armazenamento Client-Side

| Dado | Storage | TTL | Chave |
|------|---------|-----|-------|
| Workspace ativo | localStorage | Permanente | `politika_active_workspace_id` |
| Alertas | localStorage | 24h | `politika_alerts` |
| Histórico de sentimento | localStorage | Permanente | `politika_sentiment_history` |
| Cache de notícias | localStorage | 2h | `politika_news_cache_{region}_{term}` |
| Cache de sentimento | localStorage | 30min | `politika_pulse_sentiment_{term}_{hash}` |
| Cache de briefing | localStorage | 10min | `politika_briefing_cache` |
| Onboarding Pulse | localStorage | Permanente | `politika_onboarding_completed` |
| Chat contextual | sessionStorage | Sessão | Por candidato |

---

## 4. API Backend

### 4.1 POST `/api/gemini`

**Serverless Function** — Arquivo: `api/gemini.ts`

#### Autenticação
Toda request requer `Authorization: Bearer <JWT>` validado via `supabase.auth.getUser(token)`.

#### Actions Disponíveis

| Action | Input | Output | Schema Enforcement |
|--------|-------|--------|--------------------|
| `politicalInsight` | `{ handle: string }` | `DetailedAnalysis` | Sim (responseSchema) |
| `comparativeInsight` | `{ handles: string[] }` | `ComparativeAnalysis` | Sim (responseSchema) |
| `crisisResponse` | `{ incident, mediaData?, location? }` | `CrisisAnalysis` + sources | Não (regex parse + grounding) |
| `evaluateResponse` | `{ incident, proposedResponse }` | `{ score, verdict, pros, cons, optimizedVersion }` | Sim (responseSchema) |
| `sentiment` | `{ term, articleTitles[] }` | `SentimentResult` | Sim (responseSchema) |
| `chat` | `{ handle, analysis, message, history[] }` | `string` (texto livre) | Não (texto livre) |
| `briefing` | `{ metrics, alerts, topArticles[] }` | `BriefingResult` | Sim (responseSchema) |

#### Contexto Regional Dinâmico

A função `buildRegionalContext()` injeta contexto político específico para cada um dos 27 estados brasileiros + DF. O workspace envia `{ state, region, customContext }` que personaliza o prompt.

```typescript
// Exemplo de contexto injetado para Bahia:
"Comunicação via WhatsApp extremamente rápida e volátil. Instagram/TikTok ditam
o ritmo da pauta política. O eleitor baiano valoriza autenticidade..."
```

#### Validações do Endpoint

| Validação | Limite |
|-----------|--------|
| Handle | max 100 chars |
| Handles (comparativo) | max 5 |
| Incident (crise) | max 5000 chars |
| Proposed response | max 10000 chars |
| Term (sentimento) | max 100 chars |
| Article titles | max 20 |
| Chat message | max 3000 chars |
| Chat history | max 50 mensagens |

#### Grounding (Crises)

A action `crisisResponse` usa Google Search Grounding e Google Maps Grounding para fundamentar respostas em dados reais. Fontes são extraídas de `groundingMetadata.groundingChunks` e retornadas ao frontend.

### 4.2 POST `/api/news`

**Serverless Function** — Arquivo: `api/news.ts`

Proxy server-side para Google News RSS, eliminando problemas de CORS:

1. Recebe `{ region, term }`
2. Sanitiza inputs (max 100 chars, strip HTML entities)
3. Faz fetch para `news.google.com/rss/search?q=...&hl=pt-BR`
4. Parseia XML via regex (sem DOMParser no Node)
5. Filtra artigos pelo ano atual
6. Retorna max 25 artigos por termo

---

## 5. Frontend: Services Layer

### 5.1 geminiClient.ts — HTTP Client

Central de comunicação com o backend. Características:

| Feature | Implementação |
|---------|---------------|
| **Retry automático** | 2 retries com exponential backoff (1s, 2s) |
| **Timeout** | 60s com AbortController |
| **Auth** | JWT automático via `supabase.auth.getSession()` |
| **Sanitização** | Input sanitizado antes do envio |
| **Prompt injection** | Detecção de 15+ padrões (chat) |
| **URL automática** | `/api/gemini` (prod) ou `localhost:3000/api/gemini` (dev) |

**Funções exportadas:**
- `generatePoliticalInsight(handle, workspaceContext?)`
- `generateComparativeInsight(handles[], workspaceContext?)`
- `generateCrisisResponse(incident, mediaData?, location?, workspaceContext?)`
- `evaluateResponse(incident, proposedResponse, workspaceContext?)`
- `analyzeSentiment(term, articleTitles[], workspaceContext?)`
- `generateBriefing(metrics, alerts, topArticles[], workspaceContext?)`
- `chatWithAnalysis(handle, analysis, message, history[], workspaceContext?)`

### 5.2 newsService.ts — Google News RSS

Pipeline de ingestão de notícias com fallback:

```
Backend proxy (/api/news) → CORS proxy 1 (allorigins.win) → CORS proxy 2 (codetabs.com)
```

| Feature | Valor |
|---------|-------|
| Cache | localStorage, 2h TTL |
| Deduplicação | Por título normalizado |
| Limite | 25 artigos/termo |
| Busca paralela | `Promise.allSettled` para todos os watchwords |
| Tagging | Artigos tagueados com watchwords que aparecem no título |
| Distribuição temporal | 24 slots horários para waveform |

### 5.3 trendsService.ts — Computação de Tendências

| Função | Descrição |
|--------|-----------|
| `buildTrendFromArticles()` | 24 pontos horários normalizados (0-100%) |
| `computeTrendDirection()` | Compara 1ª e 2ª metade → `up/down/steady` |
| `buildDailyTrendFromArticles()` | 15 pontos diários com labels ("Hoje", "Ontem", "9 fev") |
| `groupArticlesByDay()` | Agrupa artigos por dia (mais recente primeiro) |

---

## 6. Frontend: Hooks Layer

### 6.1 usePulseMonitor — Agregador Principal

Orquestra news + sentiment + trends em um único estado coerente:

```
useNews → tagArticlesWithTerms → useSentiment (por termo) → metrics por termo
                                                          → globalMetrics
                                                          → waveform (hourly + daily)
                                                          → filteredArticles
```

**Saída:**
- `metrics: Record<string, TermMetrics>` — Métricas por watchword
- `globalMetrics` — Total de menções, sentimento médio, termo quente, tendência
- `pulseData/trendPoints` — Waveform 24h
- `dailyTrendPoints/dailyPulseData` — Waveform 15 dias
- `articlesByDay` — Artigos agrupados por dia
- `filteredArticles` — Artigos filtrados pelo termo ativo

### 6.2 useAlertEngine — Motor de Alertas

Monitora mudanças de sentimento e gera alertas acionáveis:

| Threshold | Condição | Severidade | Categoria |
|-----------|----------|------------|-----------|
| Queda ≥ 20% | `delta ≤ -0.20` | danger | `sentiment_drop` |
| Queda ≥ 10% | `delta ≤ -0.10` | warning | `sentiment_drop` |
| Alta ≥ 15% | `delta ≥ +0.15` | opportunity | `opportunity_detected` |
| Menções ≥ 2x média | `mentions ≥ avgMentions * 2` | info | `trending_topic` |
| Crise detectada | Automático | danger | `crisis_detected` |

**Comportamento:**
- Alertas persistidos em localStorage com TTL de 24h
- Deduplicação via `processedRef` (Set de chaves processadas)
- Toast notifications com estilo por severidade (danger=vermelho, opportunity=verde)
- Ações: marcar como lido, marcar como acionado, dispensar, limpar todos

### 6.3 useBriefing — Briefing Executivo

Gera briefing por IA com fallback inteligente:

```
1. Dados mudam → deriveFallbackBriefing() (resposta imediata, sem IA)
2. Debounce 5s → verificar cache (localStorage, 10min TTL)
3. Cache miss → chamada IA (/api/gemini action=briefing)
4. Resultado cacheado e exibido
```

**Status:** `calm` | `alert` | `crisis`

### 6.4 useSentiment — Análise de Sentimento

- Cache: localStorage com TTL de 30min, chave = `term + hash(títulos)`
- Rate limit: 10 análises / 2 minutos
- Deduplicação de requests in-flight via `inFlightRef`
- Retorna `{ score: -1..1, classification, summary }`

### 6.5 usePoliticalAnalysis — Análise Política

- Rate limit: 10 análises / minuto
- `analyzeCandidate(handle)` → `DetailedAnalysis`
- `compareCandidates(handles[])` → `ComparativeAnalysis`
- Workspace context injetado automaticamente

### 6.6 useCrisisAnalysis — Gestão de Crises

- Rate limit: 5 análises / minuto
- `analyzeCrisis(incident, mediaData?, location?)` → `CrisisAnalysis`
- `evaluateResponse(incident, response)` → `{ score, verdict, pros, cons, optimizedVersion }`
- Suporte a geolocalização para grounding regional

### 6.7 useHistory — Histórico de Análises

- CRUD completo via Supabase (`analyses` table)
- Filtrado por `activeWorkspace`
- Funções: `saveAnalysis()`, `deleteAnalysis()`, `refresh()`

---

## 7. Frontend: Pages & Components

### 7.1 Mapa de Rotas

| Rota | Componente | Acesso | Descrição |
|------|-----------|--------|-----------|
| `/login` | Login | Público | Auth (login + cadastro via Supabase) |
| `/privacy` | PrivacyPolicy | Público | Política de Privacidade |
| `/terms` | TermsOfService | Público | Termos de Serviço |
| `/` | CommandCenter | Protegido | QG: alertas + briefing + métricas + notícias |
| `/analyze` | Dashboard | Protegido | Criar análise individual ou comparativa |
| `/insight-detail` | InsightsDetail | Protegido | Relatório de candidato + chat contextual |
| `/comparison-detail` | ComparisonDetail | Protegido | Battle Card comparativo |
| `/crisis` | CrisisManagement | Protegido | War Room multimodal |
| `/pulse` | PulseMonitor | Protegido | Sentimento em tempo real (waveform + notícias) |
| `/history` | History | Protegido | Timeline de análises passadas |
| `/workspaces` | Workspaces | Protegido | CRUD de workspaces/campanhas |

### 7.2 CommandCenter (QG)

Página principal pós-login. Compõe:
- **Briefing por IA** com status visual (calm=verde, alert=âmbar, crisis=vermelho)
- **Cards de métricas** (menções, sentimento, alertas, termo quente)
- **Lista de alertas** com ações (analisar, responder, dispensar)
- **Preview de notícias** (top 3 artigos)
- **Auto-refresh** a cada 60 segundos

### 7.3 PulseMonitor

Monitoramento em tempo real com:
- **Barra de filtros** (chips por watchword)
- **Waveform SVG** (24h horário ou 15 dias diário)
- **Feed de notícias** com termos destacados
- **Cards por termo** (menções, sentimento, resumo IA)
- **Onboarding** modal de 5 passos (primeira visita)

### 7.4 Dashboard (Análise)

- Input de 1-3 handles para análise
- Loading stepper animado (4 etapas temáticas)
- Feed de 3 notícias recentes do workspace
- Histórico de 5 análises recentes com navegação
- **PLG Aha Moment**: auto-redirect quando geração em background completa

### 7.5 CrisisManagement (War Room)

- Input multimodal (texto + vídeo/áudio/imagem, max 10MB)
- Grounding via Google Search + Maps
- Classificação de severidade (Baixo → Crítico)
- Múltiplas estratégias com scripts prontos
- Avaliação de resposta (score 0-10 + versão otimizada)

### 7.6 InsightsDetail

Relatório completo com 10+ campos:
- Headline, tom dominante, palavras-chave, ressonância
- Grupos compatíveis/ignorados
- Gatilhos psicológicos com aplicações
- Risco estratégico, projeção, próximo melhor movimento
- **Chat contextual** sidebar com sugestões pré-formatadas

### 7.7 ComparisonDetail (Battle Card)

- Cards de candidatos lado a lado
- Pilares de confronto tema-a-tema
- Vazio estratégico + movimento vencedor
- Alavanca psicológica
- Export via `window.print()` (CSS print-friendly)

---

## 8. State Management

### 8.1 React Context

| Context | Escopo | Dados |
|---------|--------|-------|
| `AuthContext` | App inteiro | `user`, `session`, `loading`, `signIn`, `signUp`, `signOut` |
| `WorkspaceContext` | Rotas protegidas | `workspaces[]`, `activeWorkspace`, `addWorkspace`, `updateWorkspace`, `deleteWorkspace` |

### 8.2 Zustand Store

| Store | Propósito | Estado |
|-------|-----------|--------|
| `generationStore` | PLG: geração automática de dossiê na criação de workspace | `isGenerating`, `generatingHandle`, `initialData`, `error` |

**Fluxo PLG Aha Moment:**
1. Usuário cria workspace com `candidateHandle`
2. `WorkspaceContext.addWorkspace()` chama `startGeneration()`
3. `generatePoliticalInsight()` roda em background
4. Ao completar, `finishGeneration(data)` atualiza store
5. `Dashboard` detecta `initialData` via `useEffect` e faz auto-redirect para `InsightsDetail`

---

## 9. Segurança

### 9.1 Camadas de Proteção

| Camada | Implementação | Arquivo |
|--------|---------------|---------|
| **Autenticação** | Supabase Auth (JWT) | `context/AuthContext.tsx` |
| **Autorização** | RLS no PostgreSQL | `supabase-schema.sql` |
| **API Key Protection** | Backend proxy (env vars) | `api/gemini.ts` |
| **Input Sanitization** | XSS escape, strip HTML, max length | `utils/security.ts` |
| **Prompt Injection** | 15+ regex patterns | `utils/security.ts` |
| **File Validation** | MIME type + size (10MB) | `constants/index.ts` |
| **URL Validation** | Block `javascript:` e `data:` URIs | `utils/security.ts` |
| **Rate Limiting** | Client-side per-feature throttling | `hooks/useRateLimit.ts` |
| **Security Headers** | CSP, HSTS, X-Frame-Options, etc. | `vercel.json` |
| **CORS** | Whitelist de origens | `api/gemini.ts`, `api/news.ts` |

### 9.2 Detecção de Prompt Injection

15+ padrões regex detectados em `utils/security.ts`:
- Quebra de contexto: "ignore previous instructions", "forget everything"
- Roleplay/jailbreak: "you are now a", "pretend to be"
- Extração de sistema: "show me your prompt", "what are your instructions"
- Injeção de código: `<script>`, `javascript:`, event handlers
- Marcadores de prompt: `[INST]`, `<|...|>`, markdown system blocks

---

## 10. Integrações Externas

| Serviço | Uso | Autenticação | Rate Limit |
|---------|-----|-------------|------------|
| Google Gemini 2.5 Flash | Análise política, crises, sentimento, chat, briefing | API Key (server-side) | Client-side (variável por feature) |
| Google Search Grounding | Fundamentação de crises em dados reais | Via Gemini API | N/A |
| Google Maps Grounding | Contexto geográfico para crises | Via Gemini API | N/A |
| Google News RSS | Feed de notícias em tempo real | Público (sem auth) | Cache 2h |
| Supabase | Auth + banco + RLS | Anon Key (client) + Service Key (server) | N/A |
| Sentry | Error tracking e monitoramento | DSN | N/A |
| allorigins.win | CORS proxy fallback para RSS | Público | N/A |
| codetabs.com | CORS proxy fallback #2 | Público | N/A |

---

## 11. Tipos TypeScript Globais

### Análise Individual
```typescript
interface DetailedAnalysis {
  headline: string;
  tone: string;
  keywords: string[];
  resonance: string;
  compatibleGroups: { name: string; description: string }[];
  ignoredGroups: { name: string; description: string }[];
  strategicRisk: string;
  projection: string;
  suggestedQuestions: string[];
  nextBestMove: string;
  psychologicalTriggers: { trigger: string; application: string }[];
}
```

### Análise Comparativa
```typescript
interface ComparativeAnalysis {
  candidates: Candidate[];               // Perfil de cada candidato
  confrontationPillars: ConfrontationPillar[]; // Confronto tema-a-tema
  strategicVoid: string;                  // Oportunidade não explorada
  winningMove: string;                    // Recomendação estratégica
  regionalBattleground: string;           // Campo de batalha regional
  psychologicalLeverage: string;          // Alavanca psicológica
}
```

### Crise
```typescript
interface CrisisAnalysis {
  incidentSummary: string;
  severityLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  targetAudienceImpact: string;
  narrativeRisk: string;
  responses: {
    strategyName: string;
    description: string;
    actionPoints: string[];
    suggestedScript: string;
  }[];
  immediateAdvice: string;
  sources?: { uri: string; title: string }[];
}
```

### Sistema de Alertas
```typescript
type AlertSeverity = 'info' | 'warning' | 'danger' | 'opportunity';
type AlertCategory = 'sentiment_drop' | 'sentiment_rise' | 'crisis_detected' | 'opportunity_detected' | 'trending_topic';

interface PolitikaAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  term?: string;
  sentimentDelta?: number;
  suggestedActions: AlertAction[];
  relatedArticles: TaggedNewsArticle[];
  createdAt: string;
  isRead: boolean;
  isActioned: boolean;
}
```

### Pulse Monitor
```typescript
interface TermMetrics {
  term: string;
  mentions: number;
  sentiment: SentimentResult | null;
  sentimentLoading: boolean;
  articles: TaggedNewsArticle[];
  timeDistribution: number[]; // 24 slots horários
}

interface SentimentResult {
  score: number;         // -1.0 a 1.0
  classification: 'Positivo' | 'Neutro' | 'Negativo';
  summary: string;
}
```

---

## 12. Configuração e Deploy

### 12.1 Variáveis de Ambiente

#### Server-side (Vercel)
| Variável | Descrição |
|----------|-----------|
| `GEMINI_API_KEY` | API key do Google Gemini |
| `SUPABASE_SERVICE_KEY` | Service role key do Supabase (para validar JWTs) |
| `VITE_SUPABASE_URL` ou `SUPABASE_URL` | URL do projeto Supabase |

#### Client-side (prefixo `VITE_`)
| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key do Supabase (seguro para exposição) |
| `VITE_SENTRY_DSN` | DSN do Sentry |

### 12.2 Build & Deploy

```bash
# Desenvolvimento local
npm run dev              # Vite dev server (HMR)
vercel dev               # Dev server com serverless functions

# Build
npm run build            # Vite build → dist/

# Deploy
git push origin main     # Auto-deploy via Vercel
```

### 12.3 Verificação Pós-Deploy

```bash
# API key NÃO deve estar no bundle
curl -s https://politika-plum.vercel.app/assets/index-*.js | grep -E "(AIza|GEMINI_API_KEY)"
# Deve retornar vazio

# Testar endpoint de IA (requer JWT válido)
curl -X POST https://politika-plum.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"action":"sentiment","data":{"term":"teste","articleTitles":["Teste de sentimento"]}}'
```

---

## 13. Rate Limiting

| Feature | Max Calls | Window | Hook |
|---------|-----------|--------|------|
| Análise política | 10 | 1 min | `usePoliticalAnalysis` |
| Análise de crise | 5 | 1 min | `useCrisisAnalysis` |
| Chat contextual | 20 | 1 min | `InsightsDetail` |
| Análise de sentimento | 10 | 2 min | `useSentiment` |
| Briefing | 3 | 5 min | `useBriefing` |

---

## 14. Caching Strategy

```
                    ┌────────────────────┐
                    │    User Request     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  localStorage       │
                    │  cache hit?          │
                    └─────────┬──────────┘
                         yes / \  no
                         /     \
                  ┌─────▼──┐  ┌▼─────────────┐
                  │ Return  │  │ In-flight     │
                  │ cached  │  │ dedup check   │
                  └─────────┘  └──────┬────────┘
                                      │
                               ┌──────▼────────┐
                               │ Rate limit     │
                               │ check          │
                               └──────┬────────┘
                                      │
                               ┌──────▼────────┐
                               │ API call       │
                               │ (with retry)   │
                               └──────┬────────┘
                                      │
                               ┌──────▼────────┐
                               │ Cache result   │
                               │ + return       │
                               └───────────────┘
```

| Dado | Storage | TTL | Invalidação |
|------|---------|-----|-------------|
| Notícias (por região+termo) | localStorage | 2h | Manual (refresh) |
| Sentimento (por termo+artigos) | localStorage | 30min | Novos artigos (hash muda) |
| Briefing | localStorage | 10min | Manual ou métricas mudam |
| Alertas | localStorage | 24h | Limpeza manual |

---

## 15. Design System

### 15.1 Identidade Visual

| Token | Valor |
|-------|-------|
| Cor Primária | `#136dec` (Azul Vibrante) |
| Cor Primária Soft | `rgba(19, 109, 236, 0.1)` |
| Background (dark) | `#0d131b` → `#101822` |
| Background (light) | `#f6f7f8` |
| Texto Heading | `#0d131b` |
| Texto Sutil | `#4c6c9a` |
| Tipografia Principal | Space Grotesk (sans-serif) |
| Tipografia Secundária | Noto Sans |
| Ícones | Material Symbols (outlined) |
| Estilização | TailwindCSS (CDN) + CSS custom |

### 15.2 Linguagem Visual

- **Dark mode** como padrão com suporte a light mode
- **Glassmorphism** (backdrop-blur) em painéis
- **Border radius** arredondado (1-3rem)
- **Gradientes** como acentos
- **Animações**: fade-in, slide-in, pulse, spin, progress-indeterminate
- **Sombras** para hierarquia de profundidade

### 15.3 Paleta de Cores para Termos

```
#136dec (azul)   #10b981 (esmeralda)  #f59e0b (âmbar)  #ef4444 (vermelho)
#8b5cf6 (violeta) #ec4899 (rosa)      #06b6d4 (ciano)  #84cc16 (lima)
```

---

## 16. Pontos de Atenção Técnica

### 16.1 Estado Atual: Mudanças Não Commitadas

Existem **~1500 linhas de alterações** em 23 arquivos + 6 novos arquivos não rastreados. As mudanças incluem:
- Zustand store (`generationStore`)
- Hook `useHistory`
- Expansão do `WorkspaceForm` (campo candidato + contexto + 27 estados)
- Expansão do `api/gemini.ts` (contexto por estado + action briefing)
- Refatoração do `PulseMonitor` (waveform diário de 15 dias)
- Pasta `supabase/` e `scripts/`

### 16.2 Débitos Técnicos

| Item | Prioridade | Impacto |
|------|-----------|---------|
| Sem testes automatizados | Alta | Regressões não detectadas |
| Rate limiting apenas client-side | Alta | Abuso possível via curl |
| TailwindCSS via CDN (não tree-shaken) | Média | Bundle size desnecessário |
| Alertas em localStorage (não Supabase) | Média | Perda ao trocar device |
| Sentimento em localStorage (não Supabase) | Média | Histórico não persistente |
| `sanitizeHandle` remove acentos (nomes brasileiros) | Média | Handles com acentos falham |
| Sem CI/CD pipeline | Média | Deploy manual sem gates |
| Sem menu mobile (hamburger) | Média | UX ruim em mobile |
| Chat history em sessionStorage | Baixa | Perda ao fechar aba |
| Tabelas `alerts` e `sentiment_history` no schema mas não usadas pelo código | Baixa | Schema diverge da implementação |

### 16.3 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Custo API Gemini escala | Alta | Alto | Rate limit + cache agressivo |
| CORS proxies ficam instáveis | Média | Médio | Backend proxy como primário |
| Alucinação da IA | Média | Alto | Grounding + contexto regional |
| Prompt injection | Baixa | Alto | 15+ regex + sanitização |
| API key comprometida | Baixa | Crítico | Rotação imediata no Vercel Dashboard |

---

## 17. Roadmap Técnico

### Fase 1 — Hardening
- [ ] Testes automatizados (Vitest + Testing Library + Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Rate limiting server-side no `/api/gemini`
- [ ] Migrar alertas e sentimento para Supabase (schema já existe)
- [ ] Responsividade mobile completa
- [ ] TailwindCSS via PostCSS (tree-shaking)
- [ ] Analytics (PostHog ou Mixpanel)

### Fase 2 — Expansão de Inteligência
- [ ] Monitoramento de redes sociais (Twitter/X, Instagram)
- [ ] Heatmap regional interativo
- [ ] Google Trends real (Serper/SerpApi)
- [ ] Push notifications (Web Push API)
- [ ] Comparativo temporal (evolução ao longo do tempo)
- [ ] Exportação PDF profissional

### Fase 3 — Colaboração e Escala
- [ ] Multi-usuario com roles (admin, analyst, viewer)
- [ ] Multi-tenant (agências)
- [ ] API pública para integrações
- [ ] Expansão para outros países
- [ ] App mobile (React Native ou PWA)

### Fase 4 — Monetização
- [ ] Planos de assinatura (SaaS)
- [ ] WhatsApp Business API
- [ ] White-label para agências
