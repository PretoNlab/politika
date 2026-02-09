# Product Requirements Document (PRD) - Politika

## 1. Visao Geral do Produto

**Nome**: Politika
**Tagline**: Inteligencia politica estrategica para campanhas na Bahia
**URL**: https://politika-plum.vercel.app
**Versao**: 0.1.0 (MVP)

### O que e o Politika?

Politika e uma plataforma de inteligencia politica alimentada por IA generativa (Google Gemini 2.5 Flash) projetada para estrategistas, assessores e candidatos politicos na Bahia, Brasil. A ferramenta transforma dados publicos e contexto regional em analises estrategicas acionaveis, gestao de crises multimodal em tempo real e monitoramento de sentimento politico com alertas inteligentes.

### Problema que Resolve

Estrategistas politicos na Bahia enfrentam:
- **Fragmentacao de informacoes**: dados sobre adversarios, crises e sentimento dispersos em dezenas de fontes
- **Tempo de reacao lento**: crises politicas no WhatsApp e redes sociais se espalham em minutos, nao horas
- **Falta de analise comparativa estruturada**: dificuldade em mapear vulnerabilidades e oportunidades entre candidatos
- **Desconexao regional**: campanhas ignoram nuances culturais entre Salvador, Reconcavo, Oeste e Sul da Bahia
- **Monitoramento manual**: acompanhar sentimento publico e noticias demanda horas diarias

### Publico-Alvo

| Persona | Descricao | Uso Principal |
|---------|-----------|---------------|
| Estrategista Politico | Coordena campanhas eleitorais | Analise comparativa, identificacao de vazios estrategicos |
| Assessor de Comunicacao | Gerencia imagem e crises | War Room, scripts de resposta, avaliacao de comunicados |
| Candidato | Disputando cargo eletivo | Dashboard de inteligencia, monitoramento de adversarios |
| Analista Politico | Comenta/publica analises | Pulso de sentimento, tendencias regionais |
| Gestor de Campanha | Coordena equipe e acoes | Command Center, alertas, historico de acoes |

---

## 2. Objetivos do Produto

### Objetivo Principal
Fornecer inteligencia politica estrategica em tempo real que reduza o tempo de decisao de horas para minutos, com contexto especifico da Bahia.

### Metricas de Sucesso (KPIs)

| Metrica | Meta (MVP) | Como Medir |
|---------|------------|------------|
| Tempo medio de analise | < 30 segundos | Timestamp request/response |
| Analises por usuario/dia | >= 5 | Tabela `analyses` no Supabase |
| Taxa de uso do War Room em crise | > 70% dos usuarios ativos | Analytics |
| Retencao semanal | > 40% | Login recorrente via Supabase Auth |
| NPS | > 50 | Pesquisa in-app |
| Alertas acionados vs ignorados | > 60% acionados | localStorage metrics |
| Chat messages por analise | >= 3 | Session storage |

---

## 3. Arquitetura Tecnica

### Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | React + TypeScript | 19.2.3 |
| Build Tool | Vite | 6.2.0 |
| Roteamento | react-router-dom (HashRouter) | 7.13.0 |
| IA | Google Gemini 2.5 Flash (@google/genai) | 1.38.0 |
| Backend | Vercel Serverless Functions | Node.js |
| Banco de Dados | Supabase (PostgreSQL) | @supabase/supabase-js 2.95.3 |
| Autenticacao | Supabase Auth (JWT) | Integrado |
| Error Tracking | Sentry | @sentry/react 10.38.0 |
| Notificacoes | react-hot-toast | 2.6.0 |
| Deploy | Vercel | - |
| Estilizacao | TailwindCSS (CDN) + CSS customizado | - |

### Padrao de Seguranca: Backend Proxy

```
[Frontend] --HTTP+JWT--> [Vercel Serverless /api/gemini] --SDK--> [Google Gemini API]
                                    ^
                                    |
                           process.env.GEMINI_API_KEY
                           (nunca exposta ao client)
```

**Garantias de seguranca**:
1. API key existe apenas em variaveis de ambiente do servidor
2. JWT do Supabase autentica todas as requisicoes ao backend
3. Row Level Security (RLS) isola dados por usuario no PostgreSQL
4. Toda input do usuario e sanitizada antes do envio
5. Deteccao de prompt injection (15+ padroes)
6. Validacao de arquivos (tamanho, MIME type, filename)
7. Rate limiting por feature no client
8. Protecao XSS (escape/strip HTML)
9. Validacao de URLs (bloqueia javascript: e data: URIs)
10. Security headers HTTP (CSP, HSTS, X-Frame-Options, Referrer-Policy)

### Banco de Dados (Supabase)

| Tabela | Campos Principais | RLS |
|--------|-------------------|-----|
| users | id (uuid), email, user_metadata.full_name | Gerido pelo Supabase Auth |
| workspaces | id, user_id, name, region, watchwords[], status, created_at | Por user_id |
| analyses | id, user_id, workspace_id?, type, handle, result (jsonb), created_at | Por user_id |

### Padroes de Codigo

| Padrao | Aplicacao |
|--------|-----------|
| Custom Hooks | Separacao de logica (usePoliticalAnalysis, useCrisisAnalysis, usePulseMonitor, useAlertEngine, useSentiment, useNews, useTrends, useRateLimit) |
| Context API | Estado global (AuthContext, WorkspaceContext) |
| Error Boundary | Fallback gracioso para erros de React + Sentry |
| Toast Notifications | Feedback ao usuario via react-hot-toast |
| Loading States | Indicadores animados com etapas |
| Rate Limiting | Throttling por feature com countdown |
| Backend Proxy | Todas as chamadas de IA via serverless function |

### Contexto Baiano Injetado na IA

Todas as chamadas ao Gemini incluem contexto especifico:
- Comunicacao via WhatsApp e extremamente rapida e volatil
- Redes sociais (Instagram/TikTok) ditam agenda politica
- Eleitores baianos valorizam autenticidade e respostas rapidas
- Regioes (Oeste, Reconcavo, Salvador, Sul) possuem culturas politicas distintas

---

## 4. Estrutura de Rotas

### Rotas Publicas
| Rota | Componente | Descricao |
|------|-----------|-----------|
| /login | Login | Autenticacao (login/cadastro) |
| /privacy | PrivacyPolicy | Politica de Privacidade |
| /terms | TermsOfService | Termos de Servico |

### Rotas Protegidas (requerem autenticacao)
| Rota | Componente | Descricao |
|------|-----------|-----------|
| / | CommandCenter | Central de comando com alertas e metricas |
| /analyze | Dashboard | Criar analise individual ou comparativa |
| /insight-detail | InsightsDetail | Relatorio detalhado de candidato + chat |
| /comparison-detail | ComparisonDetail | Battle Card comparativo |
| /crisis | CrisisManagement | War Room para gestao de crises |
| /pulse | PulseMonitor | Monitoramento de sentimento em tempo real |
| /history | History | Timeline de analises e eventos |
| /workspaces | Workspaces | Gerenciamento de workspaces |

---

## 5. Features - Detalhamento

### 5.1 Autenticacao e Controle de Acesso

**Prioridade**: P0 (Critica)
**Status**: Implementado

#### Descricao
Sistema completo de autenticacao com login, cadastro e protecao de rotas via Supabase Auth.

#### Capacidades
- Login com email e senha
- Cadastro com nome completo, email e senha
- Protecao automatica de rotas (redirect para /login)
- Sessao persistente via JWT
- Tracking de usuario no Sentry
- Links para Politica de Privacidade e Termos de Servico

---

### 5.2 Command Center (Central de Comando)

**Rota**: `/`
**Prioridade**: P0 (Critica)
**Status**: Implementado

#### Descricao
Dashboard principal da plataforma com alertas inteligentes, metricas consolidadas e acoes rapidas. E o primeiro contato do usuario apos login.

#### Capacidades
- **Alertas em tempo real**: classificados por severidade (danger, warning, opportunity, info)
- **Metricas consolidadas**: total de mencoes, sentimento medio, alertas ativos, termo quente
- **Acoes rapidas**: botoes diretos para Analisar, Pulse e War Room
- **Preview de noticias**: 3 artigos mais recentes
- **Auto-refresh**: atualizacao a cada 60 segundos
- **Contador de nao-lidos**: badge animado com pulse

#### Motor de Alertas (useAlertEngine)
| Tipo de Alerta | Threshold | Severidade |
|----------------|-----------|------------|
| Queda de sentimento | > 20% | danger |
| Queda de sentimento | > 10% | warning |
| Alta de sentimento | > 15% | opportunity |
| Mencoes acima da media | > 2x media | trending_topic (info) |
| Crise detectada | automatico | danger |

- Alertas armazenados em localStorage com TTL de 24 horas
- Acoes: marcar como lido, acionar, dispensar, limpar todos

---

### 5.3 Dashboard de Analise

**Rota**: `/analyze`
**Prioridade**: P0 (Critica)
**Status**: Implementado

#### Descricao
Tela de criacao de analises. Permite ao usuario iniciar analises individuais ou comparativas e visualizar noticias recentes e historico.

#### Capacidades
- **Analise Individual**: inserir handle de um candidato para gerar perfil estrategico
- **Analise Comparativa**: inserir 2-3 handles para gerar battle card
- **Inputs dinamicos**: adicionar/remover competidores
- **Feed de Noticias**: 3 artigos filtrados pelas watchwords do workspace ativo
- **Historico Recente**: ultimas 5 analises do Supabase com acesso rapido

#### Fluxo do Usuario
1. Insere handle(s) do(s) candidato(s)
2. Clica em "Analisar Perfil" ou "Comparar Candidatos"
3. Visualiza loading animado com 4 etapas:
   - Mapeando campo de batalha
   - Identificando intersecoes
   - Calculando vacuos
   - Gerando Battle Card
4. Resultado salvo automaticamente no Supabase
5. Redirecionado para pagina de detalhes

#### Requisitos Tecnicos
- Rate limit: 10 analises/minuto
- Sanitizacao de input (XSS, prompt injection)
- Persistencia no Supabase (tabela analyses)

---

### 5.4 Analise Detalhada de Candidato (Insights Detail)

**Rota**: `/insight-detail`
**Prioridade**: P0 (Critica)
**Status**: Implementado

#### Descricao
Relatorio estrategico completo de um unico candidato, gerado pela IA com contexto baiano, acompanhado de chat contextual.

#### Campos da Analise
| Campo | Descricao |
|-------|-----------|
| Headline | Resumo em uma frase do perfil politico |
| Tom Dominante | Classificacao do tom comunicacional |
| Palavras-Chave | Termos mais associados ao candidato |
| Ressonancia | Nivel de engajamento/alcance |
| Grupos Compativeis | Segmentos aliados naturais |
| Grupos Ignorados | Segmentos com barreira de comunicacao |
| Gatilhos Psicologicos | Mecanismos de persuasao com aplicacoes praticas |
| Risco Estrategico | Vulnerabilidades identificadas |
| Projecao | Tendencia futura com base nos dados |
| Proximo Melhor Movimento | Recomendacao estrategica acionavel |

#### Chat Contextual
- Sidebar de chat integrada ao relatorio
- Sugestoes de perguntas pre-formatadas (chips clicaveis)
- IA responde com contexto da analise + politica baiana
- Historico de conversa persistido via session storage (por candidato)
- Rate limit: 20 mensagens/minuto

---

### 5.5 Analise Comparativa (Battle Card)

**Rota**: `/comparison-detail`
**Prioridade**: P0 (Critica)
**Status**: Implementado

#### Descricao
"Battle Card" visual comparando 2-3 candidatos lado a lado, com foco em confronto estrategico.

#### Campos da Analise Comparativa
| Campo | Descricao |
|-------|-----------|
| Cards de Candidatos | Tipo de perfil, tendencia de sentimento, forca regional, vulnerabilidade |
| Candidato Principal | Destacado com badge dourado e fundo azul |
| Pilares de Confronto | Comparacao tema-a-tema (saude, educacao, seguranca, etc.) com dominio por candidato |
| Vazio Estrategico | Oportunidade nao explorada por nenhum candidato |
| Movimento Vencedor | Recomendacao estrategica para o candidato principal |
| Alavanca Psicologica | Insight comportamental para explorar |

#### Requisitos de UX
- Cards com hover animation
- Candidato principal com visual diferenciado (azul + badge)
- Exportar/imprimir via window.print() (CSS print-friendly)
- Navegacao de volta ao Dashboard

---

### 5.6 War Room (Gestao de Crises)

**Rota**: `/crisis`
**Prioridade**: P0 (Critica)
**Status**: Implementado

#### Descricao
Modulo de resposta rapida a crises politicas. Aceita input multimodal (texto + midia) e gera estrategias de resposta fundamentadas em dados reais via Google Search e Maps grounding.

#### Capacidades
- **Input Multimodal**: texto descritivo + upload de video, audio ou imagem (max 10MB)
- **Grounding em Tempo Real**: fontes do Google Search e Maps injetadas na analise
- **Geolocalizacao**: detecta localizacao do usuario para contexto regional automatico
- **Classificacao de Severidade**: 4 niveis (Baixo, Medio, Alto, Critico) com badges coloridos
- **Multiplas Estrategias**: diversas opcoes de resposta com action points e scripts prontos
- **Avaliacao de Resposta**: usuario propoe rascunho e IA avalia efetividade (0-10) com pros, contras e versao otimizada

#### Tipos de Midia Aceitos
| Tipo | Formatos |
|------|----------|
| Video | MP4, MPEG, QuickTime, WebM |
| Audio | MP3, WAV, OGG, MPEG |
| Imagem | JPEG, PNG, GIF, WebP |

#### Fluxo do Usuario
1. Descreve o incidente em texto livre
2. (Opcional) Anexa midia relacionada (max 10MB)
3. Clica em "Ativar Contra-Medida Estrategica"
4. Recebe analise com severidade, resumo e estrategias com scripts
5. (Opcional) Propoe rascunho de resposta para avaliacao
6. Recebe score (0-10) + pros/contras + versao otimizada

#### Requisitos Tecnicos
- Rate limit: 5 analises/minuto (crises sao mais custosas)
- Validacao de MIME type e tamanho de arquivo
- Conversao de midia para base64 antes do envio
- Timeout estendido (60s) para chamadas com grounding

---

### 5.7 Pulso de Sentimento (Pulse Monitor)

**Rota**: `/pulse`
**Prioridade**: P0 (Critica)
**Status**: Implementado (dados reais)

#### Descricao
Painel de monitoramento em tempo real do sentimento politico, com noticias reais do Google News, analise de sentimento por IA e visualizacao em waveform.

#### Componentes
| Componente | Descricao |
|------------|-----------|
| Barra de Filtros | Chips para filtrar por watchword ou "Todos" |
| Cards de Metricas | Total de mencoes, sentimento medio, termo quente, total de artigos |
| Waveform 24h | Barras SVG com distribuicao horaria de mencoes |
| Feed de Noticias | Artigos do Google News RSS com termos destacados |
| Cards por Termo | Mencoes, classificacao de sentimento, resumo por IA |
| Onboarding | Modal de 5 passos explicando cada feature |

#### Dados e Fontes
- **Noticias**: Google News RSS via CORS proxy (allorigins.win, codetabs.com)
- **Sentimento**: analise por IA (Gemini) de titulos de artigos por termo
- **Cache**: noticias (12 horas), sentimento (30 minutos)
- **Filtro**: por regiao e watchwords do workspace ativo

#### Onboarding (5 passos)
1. O Motor de Busca
2. Waveform de Ressonancia
3. Ponte da Verdade
4. Velocidade de Crise
5. Ressonancia Regional

---

### 5.8 Gerenciamento de Workspaces

**Rota**: `/workspaces`
**Prioridade**: P1 (Importante)
**Status**: Implementado

#### Descricao
Sistema de workspaces para gerenciar multiplas campanhas simultaneas. Cada workspace define regiao, watchwords e contexto separado. Dados persistidos no Supabase.

#### Capacidades
- Criar workspace com nome, regiao e watchwords
- Editar workspace existente
- Ativar/desativar workspaces
- Excluir workspace (com modal de confirmacao)
- Troca rapida de workspace via dropdown no header
- Workspace ativo persistido em localStorage

#### Campos do Workspace
| Campo | Tipo | Descricao |
|-------|------|-----------|
| name | string | Nome da campanha (ex: "Salvador 2026") |
| region | enum | Salvador, Reconcavo, Centro-Norte, Oeste, Sul |
| watchwords | string[] | Termos para filtrar noticias e sentimento |
| status | string | active / archived |
| created_at | timestamp | Data de criacao |

---

### 5.9 Historico de Campanha (Memoria de Guerra)

**Rota**: `/history`
**Prioridade**: P1 (Importante)
**Status**: Implementado

#### Descricao
Timeline visual de eventos da campanha carregados do Supabase, com navegacao para detalhes de cada analise.

#### Tipos de Evento
| Tipo | Badge | Descricao |
|------|-------|-----------|
| CRISE | Vermelho | Incidentes e crises gerenciadas |
| INSIGHT | Verde | Analises e descobertas estrategicas |
| NOTICIA | Azul | Noticias relevantes capturadas |
| MARCO | Dourado | Marcos importantes da campanha |

#### Capacidades
- Timeline vertical com indicadores coloridos por tipo
- Click para navegar ao detalhe da analise (insight ou comparison)
- Dados reais carregados da tabela `analyses` no Supabase

#### Limitacoes Atuais
- Botao "Exportar inteligencia" nao implementado

---

## 6. API Backend (/api/gemini.ts)

### Endpoint Unico
**Tipo**: Vercel Serverless Function
**Rota**: POST /api/gemini
**Autenticacao**: Bearer token JWT (Supabase)

### Acoes Disponiveis

| Action | Descricao | Input |
|--------|-----------|-------|
| politicalInsight | Analise individual de candidato | handle (string) |
| comparativeInsight | Analise comparativa (2-5 candidatos) | handles (string[]) |
| crisisResponse | Analise de crise com grounding | incident, mediaData?, location? |
| evaluateResponse | Avaliacao de rascunho de resposta | incident, proposedResponse |
| sentiment | Analise de sentimento de artigos | term, articleTitles[] |
| chat | Chat contextual sobre analise | handle, analysis, message, history[] |

### Seguranca do Endpoint
- Validacao de JWT em todas as requisicoes
- Validacao de input (tipo, tamanho)
- Safe JSON parsing com campos obrigatorios
- CORS configurado para producao + localhost
- Respostas estruturadas com schema enforcement

---

## 7. Servicos e Hooks

### Servicos (services/)

| Servico | Responsabilidade |
|---------|-----------------|
| geminiClient.ts | HTTP client para comunicacao com backend proxy. Retry automatico (2x com backoff exponencial), timeout 60s, sanitizacao de input, deteccao de prompt injection |
| newsService.ts | Fetch de Google News RSS com CORS proxy fallback, tagging de artigos com watchwords, distribuicao temporal (24 slots) |
| trendsService.ts | Computacao de tendencias a partir de artigos reais, direcao de tendencia (up/down/steady) |

### Hooks (hooks/)

| Hook | Responsabilidade | Rate Limit |
|------|-----------------|------------|
| usePoliticalAnalysis | Analise individual e comparativa | 10/min |
| useCrisisAnalysis | Analise de crise + avaliacao de resposta | 5/min |
| usePulseMonitor | Agregacao de metricas de sentimento, waveform, artigos | - |
| useAlertEngine | Geracao de alertas baseados em mudancas de sentimento | - |
| useSentiment | Analise de sentimento em batch com cache de 30min | 10/2min |
| useNews | Fetch de Google News RSS com cache de 12h | - |
| useTrends | Computacao de tendencias a partir de artigos | - |
| useRateLimit | Utilitario de rate limiting client-side | Configuravel |

---

## 8. Mapa de Dados

### Armazenamento

| Dado | Local | Persistencia |
|------|-------|-------------|
| Usuarios e sessoes | Supabase Auth | Permanente |
| Workspaces | Supabase (PostgreSQL) | Permanente |
| Analises (insights/comparisons) | Supabase (PostgreSQL) | Permanente |
| Workspace ativo | localStorage | Permanente (device) |
| Alertas | localStorage | 24 horas (TTL) |
| Chat contextual | sessionStorage | Sessao (por candidato) |
| Cache de noticias | localStorage | 12 horas |
| Cache de sentimento | memoria (hook) | 30 minutos |

### Integracoes Externas

| API | Uso | Autenticacao |
|-----|-----|-------------|
| Google Gemini 2.5 Flash | Analise politica, crises, sentimento, chat | API Key (server-side) |
| Google News RSS | Feed de noticias em tempo real | Nenhuma (publico via CORS proxy) |
| Google Search Grounding | Fundamentacao de crises | Via Gemini API |
| Google Maps Grounding | Contexto geografico | Via Gemini API |
| Supabase | Auth, banco de dados, RLS | Anon Key (client) + Service Key (server) |
| Sentry | Error tracking e monitoramento | DSN |

---

## 9. Design System

### Identidade Visual

| Token | Valor |
|-------|-------|
| Cor Primaria | #136dec (Azul Vibrante) |
| Tipografia Principal | Space Grotesk (sans-serif) |
| Tipografia Secundaria | Noto Sans |
| Background | #0d131b (Dark mode) |
| Texto | #f6f7f8 |
| Border Radius | 0.25rem a 3rem |
| Grid | 4px / 8px |
| Icones | Material Symbols (outlined) |

### Linguagem Visual
- Dark mode como padrao com suporte a light mode
- Glassmorphism (backdrop-blur) em paineis
- Cantos arredondados (1-3rem)
- Gradientes como acentos
- Animacoes: fade-in, slide-in, pulse, spin
- Sombras para hierarquia de profundidade

### Layout
- **Header fixo**: logo, workspace switcher, nav links, user menu
- **Nav links**: Command Center, Analisar, Pulse (com indicador live), War Room, Historico
- **Footer**: branding, links legais, badge "Acesso Restrito"
- **Navegacao protegida**: redirect automatico para /login

---

## 10. Mapa de Completude

### Implementado (Production-Ready)
- [x] Autenticacao completa (login/signup/logout via Supabase Auth)
- [x] Protecao de rotas com JWT
- [x] Multi-workspace com isolamento de dados (RLS)
- [x] Command Center com alertas inteligentes e metricas
- [x] Analise individual de candidatos com chat contextual
- [x] Battle Card comparativo (2-3 candidatos)
- [x] War Room multimodal com grounding e avaliacao de resposta
- [x] Pulse Monitor com noticias reais e sentimento por IA
- [x] Waveform de 24h com distribuicao horaria real
- [x] Motor de alertas com deteccao de mudancas de sentimento
- [x] Historico de analises persistido no Supabase
- [x] Seguranca multicamada (proxy, JWT, RLS, sanitizacao, CSP)
- [x] Error tracking via Sentry
- [x] Paginas legais (Privacidade, Termos)
- [x] Deploy automatizado no Vercel com security headers

### Parcialmente Implementado
- [ ] Exportacao de relatorios (apenas window.print() com CSS print-friendly)
- [ ] Responsividade mobile (layout funcional mas nav nao colapsa)

### Nao Implementado (Oportunidades Futuras)
- [ ] Exportacao PDF real com formatacao profissional
- [ ] Heatmap regional interativo da Bahia
- [ ] Push notifications (Web Push API)
- [ ] Monitoramento de redes sociais (apenas RSS de noticias)
- [ ] Dashboard colaborativo (multi-usuario com roles)
- [ ] API publica para integracoes externas
- [ ] Menu mobile (hamburger)
- [ ] Testes automatizados (unit/integration/e2e)
- [ ] CI/CD pipeline
- [ ] Internacionalizacao (apenas pt-BR)

---

## 11. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao Atual |
|-------|---------|-----------------|
| Custo da API Gemini | Alto | Rate limiting client-side + cache de sentimento (30min) |
| API key exposta no bundle | Critico | Backend proxy implementado + verificacao pos-deploy |
| Alucinacao da IA | Alto | Grounding com Google Search, contexto regional no prompt |
| CORS proxy instavel | Medio | Fallback para 2 proxies (allorigins.win, codetabs.com) |
| Dados desatualizados no Pulse | Medio | Cache de noticias 12h + refresh manual |
| Sem testes automatizados | Alto | Priorizar antes de escalar |
| Single point of failure (Gemini) | Alto | Considerar fallback para outro provider |
| Prompt injection | Alto | Deteccao de 15+ padroes + sanitizacao de input |
| Perda de sessao | Baixo | JWT persistente via Supabase + localStorage |

---

## 12. Roadmap

### Fase 1 - Hardening (Proximo)
- [ ] Testes automatizados (Vitest + Testing Library + Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Responsividade mobile completa (hamburger menu)
- [ ] Exportacao PDF real (html2canvas ou similar)
- [ ] Rate limiting server-side no endpoint /api/gemini
- [ ] Analytics de uso (PostHog ou Mixpanel)

### Fase 2 - Expansao de Inteligencia
- [ ] Monitoramento de redes sociais (Twitter/X, Instagram)
- [ ] Heatmap regional interativo da Bahia
- [ ] Integracao com Google Trends real (Serper/SerpApi)
- [ ] Push notifications para alertas criticos
- [ ] Comparativo temporal (evolucao do candidato ao longo do tempo)
- [ ] Exportacao de relatorios em multiplos formatos

### Fase 3 - Colaboracao e Escala
- [ ] Dashboard colaborativo (roles: admin, analyst, viewer)
- [ ] Multi-tenant (agencias com multiplos clientes)
- [ ] API publica para integracoes externas
- [ ] Expansao para outros estados brasileiros
- [ ] App mobile (React Native ou PWA)

### Fase 4 - Monetizacao
- [ ] Planos de assinatura (SaaS)
- [ ] Integracao com WhatsApp Business API
- [ ] Suporte a eleicoes federais
- [ ] White-label para agencias

---

## 13. Glossario

| Termo | Definicao |
|-------|-----------|
| Handle | Identificador publico de um candidato (nome ou @ de rede social) |
| Watchwords | Palavras-chave monitoradas em noticias e sentimento |
| Workspace | Contexto de campanha com regiao e watchwords proprias |
| War Room | Modulo de gestao de crises em tempo real |
| Battle Card | Relatorio visual comparando candidatos lado a lado |
| Grounding | Fundamentacao da IA em dados reais (Google Search/Maps) |
| Vazio Estrategico | Oportunidade politica nao explorada por nenhum candidato |
| Pulso | Monitoramento em tempo real do sentimento politico |
| Gatilho Psicologico | Mecanismo de persuasao identificado na comunicacao |
| Command Center | Central de comando com alertas e metricas consolidadas |
| RLS | Row Level Security - isolamento de dados por usuario no PostgreSQL |
| Waveform | Visualizacao em barras SVG da distribuicao horaria de mencoes |
| Motor de Alertas | Sistema automatico que detecta mudancas significativas de sentimento |
