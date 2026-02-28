# PRD Completo — Politika

**Produto**: Politika  
**Versão do PRD**: 1.1  
**Data**: 28 de fevereiro de 2026  
**Status**: MVP em produção, consolidação e escala planejadas  
**Ambiente de produção**: https://politika-plum.vercel.app

---

## 1. Resumo Executivo

Politika é uma plataforma SaaS de inteligência política para campanhas eleitorais no Brasil. O produto unifica análise estratégica de candidatos, monitoramento de sentimento, detecção de sinais de crise e geração de resposta operacional com IA, reduzindo o tempo de decisão de horas para minutos.

Esta versão do PRD formaliza metas mensuráveis, escopo por release, critérios de aceite testáveis e governança de segurança/compliance para execução previsível.

---

## 2. Problema e Oportunidade

### 2.1 Problemas que o produto resolve

- Fragmentação de informação crítica em múltiplos canais.
- Reação lenta a crises que viralizam rapidamente.
- Falta de estrutura comparativa entre candidatos.
- Monitoramento manual caro e inconsistente.
- Narrativa de campanha pouco adaptada ao contexto regional.

### 2.2 Oportunidade

- Ciclo eleitoral exige inteligência contínua e responsiva.
- Adoção de IA em funções estratégicas está em aceleração.
- Espaço para solução vertical de política brasileira com contexto local.

---

## 3. Visão, Objetivos e Métricas

### 3.1 Visão de produto

Ser o sistema operacional de inteligência de campanha para times políticos no Brasil.

### 3.2 Objetivos 2026

- Consolidar adoção recorrente no núcleo de campanha.
- Aumentar conversão de usuários ativos para planos pagos.
- Tornar War Room + Pulse os módulos mais usados no ciclo de crise.

### 3.3 KPIs oficiais (baseline e metas)

| KPI | Baseline estimado (Fev/2026) | Meta Q2/2026 | Meta Q3/2026 | Meta Q4/2026 |
|-----|------------------------------|--------------|--------------|--------------|
| Ativação (cadastro → workspace criado em 24h) | 52% | 62% | 68% | 72% |
| Time-to-First-Value (min) | 14 min | 10 min | 8 min | 6 min |
| Análises por usuário ativo/semana | 6 | 10 | 14 | 18 |
| Retenção D7 | 34% | 42% | 48% | 54% |
| Retenção D30 | 19% | 26% | 31% | 36% |
| Adoção War Room (WAU que usam módulo) | 28% | 40% | 50% | 58% |
| Conversão Free → Paid (90 dias) | 3.2% | 5% | 7% | 9% |
| Taxa de ação em alertas (actioned/read) | 37% | 50% | 58% | 65% |
| NPS | 41 | 50 | 56 | 62 |

**Notas**
- Baseline deve ser recalculado na primeira semana pós-instrumentação v1.1.
- “Usuário ativo” = ao menos 1 sessão válida na semana.

---

## 4. Personas e Jobs To Be Done

### 4.1 Estrategista Político
- **JTBD**: “Quero decidir rápido onde atacar e defender.”
- **Valor**: análise comparativa acionável e priorização de risco.

### 4.2 Assessor de Comunicação
- **JTBD**: “Quero responder crises com velocidade e coerência narrativa.”
- **Valor**: scripts e avaliação objetiva de resposta.

### 4.3 Gestor de Campanha
- **JTBD**: “Quero centralizar visão operacional do dia.”
- **Valor**: alertas, métricas e histórico confiável.

### 4.4 Candidato/Porta-voz
- **JTBD**: “Quero saber meu próximo melhor movimento.”
- **Valor**: orientação clara, sem jargão técnico.

---

## 5. Escopo por Versão (Release Matrix)

### 5.1 v1.1 (Consolidação Operacional) — alvo: Abril/2026

**In-scope**
- KPIs oficiais instrumentados (ativação, retenção, conversão, adoção módulos).
- Critérios de aceite formalizados para todos os módulos P0.
- Plano de analytics e funis operacionais.
- Hardening de segurança e protocolo de incidentes documentado.
- Go/no-go checklist de release.

**Out-of-scope**
- Billing completo em produção.
- RBAC multiusuário avançado.
- Automações externas (WhatsApp oficial, redes sociais).

### 5.2 v1.2 (Monetização e Escala Inicial) — alvo: Junho/2026

**In-scope**
- Gating por plano (feature flags por assinatura).
- Eventos de billing e limites operacionais aplicados.
- Exportações e relatórios premium.
- Melhorias de confiabilidade para fontes externas.

**Out-of-scope**
- Gestão avançada de equipes enterprise.
- SSO corporativo.

### 5.3 v2.0 (Enterprise e Colaboração) — alvo: Q4/2026

**In-scope**
- Multiusuário robusto com papéis e permissões.
- Trilhas de auditoria avançadas por ação.
- SLA por plano e suporte operacional ampliado.

---

## 6. Requisitos Funcionais + Critérios de Aceite

### RF-01 Autenticação e Sessão

- Login/cadastro com Supabase Auth.
- Sessão persistida com JWT.
- Rotas protegidas.
- Callback de autenticação com redirecionamento.

**Critérios Given/When/Then**
- **Given** usuário não autenticado, **when** acessa rota protegida, **then** é redirecionado para `/login`.
- **Given** usuário autenticado no callback, **when** sessão válida é recuperada, **then** redireciona para `/dashboard`.

### RF-02 Gestão de Workspaces

- Criar/editar/arquivar workspace.
- Definir estado, região, contexto customizado e watchwords.
- Troca de workspace ativo no app.

**Critérios Given/When/Then**
- **Given** workspace ativo alterado, **when** usuário navega para Pulse/Análise, **then** dados carregam com o novo contexto.
- **Given** usuário A, **when** tenta acessar dados do usuário B, **then** acesso é negado via RLS.

### RF-03 Command Center

- Exibir alertas por severidade e métricas rápidas.
- Mostrar briefing estratégico resumido.
- Permitir ação rápida para módulos centrais.

**Critérios Given/When/Then**
- **Given** novos sinais relevantes no período, **when** motor de alertas executa, **then** alerta aparece com severidade e ação sugerida.
- **Given** alerta aberto, **when** usuário marca ação, **then** estado persiste como `actioned`.

### RF-04 Análise Individual

- Receber input de candidato/handle.
- Gerar perfil estratégico estruturado.
- Persistir resultado no histórico.

**Critérios Given/When/Then**
- **Given** input válido, **when** análise é solicitada, **then** retorno contém campos mínimos (headline, risco, movimento).
- **Given** falha de IA/rede, **when** requisição falha, **then** usuário recebe erro acionável e pode tentar novamente.

### RF-05 Análise Comparativa

- Comparar 2-3 candidatos.
- Exibir pilares de confronto, dominância e vazio estratégico.

**Critérios Given/When/Then**
- **Given** 2+ candidatos válidos, **when** comparação conclui, **then** matriz de confronto é renderizada sem campos vazios críticos.
- **Given** comparação salva, **when** usuário acessa histórico, **then** consegue reabrir o resultado sem regenerar.

### RF-06 War Room (Crise)

- Receber contexto textual e suportar mídia.
- Classificar severidade e sugerir estratégias.
- Avaliar rascunho e gerar versão otimizada.

**Critérios Given/When/Then**
- **Given** contexto de crise informado, **when** análise conclui, **then** resposta inclui severidade, plano e próximo passo.
- **Given** rascunho submetido, **when** avaliação conclui, **then** sistema retorna score e pontos de melhoria objetivos.

### RF-07 Pulse Monitor

- Coletar notícias por watchword/região.
- Calcular sentimento e tendências.
- Sinalizar variações relevantes.

**Critérios Given/When/Then**
- **Given** watchword ativa, **when** monitor executa, **then** card mostra sentimento atual e variação.
- **Given** ausência temporária de fonte externa, **when** fallback é acionado, **then** módulo permanece funcional com indicação de limitação.

### RF-08 Histórico

- Listar análises por data.
- Reabrir detalhes de insights/comparativos.

**Critérios Given/When/Then**
- **Given** usuário com análises salvas, **when** abre histórico, **then** itens aparecem ordenados por data desc.
- **Given** item selecionado, **when** abre detalhe, **then** conteúdo corresponde ao snapshot salvo.

### RF-09 Observabilidade e Feedback

- Captura de exceções em Sentry.
- Eventos de uso no analytics.
- Toasters e estados de erro claros.

**Critérios Given/When/Then**
- **Given** erro não tratado no frontend, **when** ocorre em produção, **then** evento chega ao Sentry com contexto mínimo.
- **Given** ação crítica de funil, **when** usuário executa, **then** evento analítico é registrado com propriedades obrigatórias.

---

## 7. Requisitos Não Funcionais

### RNF-01 Segurança
- Segredos sensíveis apenas server-side.
- JWT obrigatório para APIs privadas.
- RLS por `user_id` em dados de domínio.
- Sanitização de input e validações de payload.
- Security headers/CSP no deploy.

### RNF-02 Performance
- Resposta de análises em faixa operacional para uso em campanha (objetivo p50 < 12s; p95 < 30s).
- Lazy loading de rotas protegidas.
- Cache com TTL para reduzir latência em módulos de monitoramento.

### RNF-03 Confiabilidade
- Fallback para indisponibilidade parcial de APIs externas.
- Retry/timeout em integrações críticas.

### RNF-04 Escalabilidade
- Arquitetura serverless para picos de tráfego.
- Rate limit por endpoint/usuário.

### RNF-05 Privacidade e Compliance
- Política de privacidade e termos publicados.
- Princípio de minimização de dados.

---

## 8. Arquitetura e Integrações

### 8.1 Frontend
- React 19 + TypeScript + Vite.
- `BrowserRouter` com rotas públicas e protegidas.
- Context API + Zustand para estado.

### 8.2 Backend
- Vercel Functions em `/api`.
- Endpoints: `/api/gemini`, `/api/news`, `/api/trends`, `/api/tse`.
- Autenticação com JWT do Supabase.

### 8.3 Dados
- Supabase PostgreSQL com RLS.
- Tabelas centrais: `workspaces`, `analyses`, `alerts`, `sentiment_history`, `api_rate_limits`, tabelas TSE.

### 8.4 Terceiros
- Google Gemini API.
- Google News RSS.
- Google Trends.
- Sentry.
- PostHog.

---

## 9. Backlog Priorizado (Épicos e Histórias)

### Épico E1 — Ativação e Onboarding

| ID | História | Prioridade | Esforço | Dependências |
|----|----------|------------|---------|--------------|
| E1-H1 | Como novo usuário, quero criar workspace em até 2 minutos para ver valor rápido | P0 | M | Auth + Workspace |
| E1-H2 | Como usuário novo, quero sugestão de watchwords para iniciar monitoramento | P1 | M | E1-H1 |
| E1-H3 | Como usuário novo, quero checklist de onboarding progressivo | P1 | S | E1-H1 |

### Épico E2 — Inteligência Estratégica

| ID | História | Prioridade | Esforço | Dependências |
|----|----------|------------|---------|--------------|
| E2-H1 | Como estrategista, quero análise individual consistente para ação imediata | P0 | M | API Gemini |
| E2-H2 | Como estrategista, quero comparação entre 2-3 candidatos com recomendação | P0 | M | E2-H1 |
| E2-H3 | Como estrategista, quero chat contextual sobre análise salva | P1 | M | E2-H1 |

### Épico E3 — Crise e Resposta

| ID | História | Prioridade | Esforço | Dependências |
|----|----------|------------|---------|--------------|
| E3-H1 | Como assessor, quero classificar severidade de crise para priorizar resposta | P0 | M | API Gemini |
| E3-H2 | Como assessor, quero avaliar rascunho com score e melhoria sugerida | P0 | M | E3-H1 |
| E3-H3 | Como assessor, quero templates de script por canal de comunicação | P1 | M | E3-H1 |

### Épico E4 — Monitoramento e Alertas

| ID | História | Prioridade | Esforço | Dependências |
|----|----------|------------|---------|--------------|
| E4-H1 | Como gestor, quero ver sentimento por watchword em tempo quase real | P0 | M | News + Sentiment |
| E4-H2 | Como gestor, quero alertas acionáveis com priorização de severidade | P0 | M | E4-H1 |
| E4-H3 | Como gestor, quero briefing consolidado diário | P1 | S | E4-H2 |

### Épico E5 — Monetização e Planos

| ID | História | Prioridade | Esforço | Dependências |
|----|----------|------------|---------|--------------|
| E5-H1 | Como usuário free, quero saber meu consumo e limite atual | P0 | S | Analytics + Usage |
| E5-H2 | Como usuário pro, quero desbloqueio automático de recursos pagos | P1 | M | Billing |
| E5-H3 | Como time interno, quero eventos de conversão rastreáveis | P0 | S | Analytics |

### Épico E6 — Segurança e Governança

| ID | História | Prioridade | Esforço | Dependências |
|----|----------|------------|---------|--------------|
| E6-H1 | Como time de produto, quero trilha de auditoria mínima em ações sensíveis | P0 | M | Data model |
| E6-H2 | Como operação, quero protocolo claro de incidentes | P0 | S | Observability |
| E6-H3 | Como compliance, quero política de retenção de dados definida | P1 | S | Jurídico |

---

## 10. Monetização Operacional

### 10.1 Planos e limites funcionais

| Recurso | Free (Observador) | Pro (Estrategista) | Team (War Room) |
|---------|-------------------|--------------------|-----------------|
| Análises individuais/mês | 15 | 120 | 500 |
| Comparativos/mês | 5 | 40 | 200 |
| War Room/mês | 10 | Ilimitado | Ilimitado |
| Mensagens de chat/mês | 50 | 1000 | 5000 |
| Workspaces | 1 | 3 | 15 |
| Watchwords por workspace | 3 | 12 | 30 |
| Histórico | 30 dias | Ilimitado | Ilimitado |
| Exportação | Não | PDF | PDF + lote |

### 10.2 Gatilhos de upgrade

- Exibir paywall contextual ao atingir 80% do limite e novamente em 100%.
- Exibir comparativo de valor por plano no momento do bloqueio.
- Permitir 1 “burst” de cortesia por recurso crítico em Free.

### 10.3 Regras de billing events (produto)

- `paywall_viewed`
- `upgrade_cta_clicked`
- `checkout_started`
- `checkout_completed`
- `plan_downgraded`
- `plan_canceled`

---

## 11. Segurança, Governança e Incidentes

### 11.1 Controles mínimos

- Segregação de segredos no backend.
- RLS e autenticação obrigatória em endpoints privados.
- Sanitização de payloads e limitação de tamanho.
- Rate limiting por usuário/endpoint.

### 11.2 Política de uso responsável

- Proibir uso para produção/propagação de desinformação deliberada.
- Proibir instruções de ataque pessoal, ameaça ou ilegalidade.
- Exigir revisão humana antes de execução pública de respostas críticas.

### 11.3 Trilha de auditoria mínima

Registrar para ações sensíveis:
- `user_id`, `workspace_id`, `action`, `timestamp`, `resource_id`, `before/after` (quando aplicável).

### 11.4 Protocolo de incidente (S0-S3)

| Severidade | Definição | SLA de resposta | Ação inicial |
|------------|-----------|-----------------|--------------|
| S0 | indisponibilidade total / vazamento | 15 min | congelar deploy + war room interno |
| S1 | falha grave em módulo crítico | 30 min | rollback parcial + comunicação interna |
| S2 | degradação relevante sem indisponibilidade total | 4 h | correção incremental |
| S3 | problema menor / UX | 48 h | priorizar no próximo ciclo |

---

## 12. Plano de Analytics (Eventos e Funis)

### 12.1 Dicionário de eventos essenciais

| Evento | Onde dispara | Propriedades mínimas | Objetivo |
|--------|--------------|----------------------|----------|
| `signup_completed` | conclusão de cadastro | `user_id`, `source` | medir aquisição |
| `workspace_created` | criação de workspace | `workspace_id`, `state`, `watchwords_count` | medir ativação |
| `first_analysis_completed` | primeira análise concluída | `analysis_type`, `duration_ms` | medir TTFV |
| `analysis_requested` | submit análise | `analysis_type`, `workspace_id` | volume de uso |
| `analysis_completed` | retorno análise | `analysis_type`, `duration_ms`, `success` | qualidade/performance |
| `alert_actioned` | ação em alerta | `alert_id`, `severity` | valor operacional |
| `crisis_evaluation_completed` | score de rascunho | `score`, `severity` | adoção War Room |
| `pulse_viewed` | abertura Pulse | `workspace_id` | adoção módulo |
| `paywall_viewed` | bloqueio por limite | `plan`, `feature` | conversão |
| `checkout_completed` | confirmação de compra | `plan`, `amount` | receita |

### 12.2 Funis oficiais

- **Funil de ativação**: `signup_completed` → `workspace_created` → `first_analysis_completed`.
- **Funil de engajamento**: `analysis_completed` + `pulse_viewed` + `alert_actioned` (janela semanal).
- **Funil de conversão**: `paywall_viewed` → `upgrade_cta_clicked` → `checkout_started` → `checkout_completed`.
- **Funil de retenção**: retorno D7/D30 com ao menos 1 evento crítico por semana.

### 12.3 Responsáveis

- Produto: definição e qualidade semântica dos eventos.
- Engenharia: implementação e entrega de payloads.
- Growth/Comercial: leitura de funis e ações de otimização.

---

## 13. Plano de Validação e Qualidade

### 13.1 Critérios mínimos por release

- Todos os itens P0 com aceite validado.
- Sem erro bloqueador aberto (S0/S1) no escopo da release.
- Cobertura de smoke tests dos fluxos críticos.
- Monitoramento (Sentry + analytics) ativo para novos fluxos.

### 13.2 Smoke tests obrigatórios

1. Login e callback de autenticação.
2. Criação e troca de workspace.
3. Análise individual e comparativa.
4. War Room (análise + avaliação de rascunho).
5. Pulse Monitor com watchword ativa.
6. Histórico e reabertura de análise.
7. Gating de limite e CTA de upgrade (quando aplicável).

### 13.3 Go/No-Go checklist

| Item | Critério | Status |
|------|----------|--------|
| Segurança | segredos e auth validados | [ ] |
| Dados | RLS e migrações consistentes | [ ] |
| Funcional | smoke tests aprovados | [ ] |
| Observabilidade | erros e eventos chegando | [ ] |
| Performance | p95 dentro do limite definido | [ ] |
| Comercial | regras de plano coerentes | [ ] |

---

## 14. Fluxos Críticos

### 14.1 Ativação
1. Cadastro/login.
2. Criação de workspace com contexto.
3. Primeira análise concluída.
4. Exibição de recomendação acionável.

### 14.2 Operação diária
1. Abertura do Command Center.
2. Triagem de alertas.
3. Execução de análise ou resposta de crise.
4. Ajuste de ação com base no Pulse Monitor.

### 14.3 Crise
1. Entrada de contexto de crise.
2. Classificação e plano recomendado.
3. Avaliação de rascunho.
4. Execução e monitoramento pós-resposta.

---

## 15. Rotas do Produto

### Públicas
- `/`
- `/onboarding`
- `/login`
- `/auth/callback`
- `/privacy`
- `/terms`

### Protegidas
- `/dashboard`
- `/analyze`
- `/radar`
- `/insight-detail/:id?`
- `/comparison-detail/:id?`
- `/crisis`
- `/pulse`
- `/workspaces`

---

## 16. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Dependência de fontes externas (News/Trends) | Alto | Média | fallback + cache + retry |
| Variabilidade na saída da IA | Alto | Média | schema validation + prompt hardening |
| Uso indevido do produto | Alto | Baixa/Média | política de uso + auditoria + revisão humana |
| Queda de conversão em paywall | Médio | Média | testes de UX e ofertas graduais |
| Saturação em picos eleitorais | Alto | Média | rate limit + tuning serverless + priorização P0 |

---

## 17. Governança de Execução

- Revisão quinzenal do PRD (produto + engenharia + comercial).
- Atualização mensal de KPIs e health report.
- Repriorização de backlog por impacto em ativação, retenção e conversão.

---

## 18. Open Questions (para fechamento v1.2)

- Qual stack final de billing será adotada e em qual data entra em produção?
- Qual política final de retenção de dados por plano (incluindo exclusão segura)?
- Qual modelo definitivo de colaboração multiusuário no plano Team?
- Qual SLA comercial por plano será publicamente assumido?

---

## 19. Definition of Done (Produto)

Um item só é considerado pronto quando:

- Atende critérios Given/When/Then do RF correspondente.
- Possui evento analítico obrigatório instrumentado.
- Não cria regressão em smoke tests críticos.
- Cumpre controles de segurança e dados do escopo.
- Está documentado no changelog interno da release.

