# PRD Comercial - Politika
## Inteligencia Politica Estrategica com IA Generativa

**Versao**: 1.0
**Data**: 25 de Fevereiro de 2026
**Status**: MVP em Producao
**URL**: https://politika-plum.vercel.app

---

## 1. Sumario Executivo

**Politika** e uma plataforma SaaS de inteligencia politica alimentada por IA generativa que transforma dados publicos dispersos em inteligencia estrategica acionavel para campanhas eleitorais no Brasil.

A plataforma resolve o problema critico de fragmentacao de informacao e tempo de reacao lento que estrategistas politicos enfrentam em ciclos eleitorais cada vez mais volateis, onde crises se propagam em minutos pelo WhatsApp e redes sociais.

**Diferencial central**: Politika nao e uma ferramenta generica de monitoramento. E um **estrategista politico digital** que entende as nuances regionais da politica brasileira, gera analises comparativas profundas entre candidatos e oferece resposta a crises em tempo real com scripts prontos para uso.

### Numeros-Chave do Mercado
- **5.570** municipios brasileiros com eleicoes regulares
- **500.000+** candidatos registrados nas eleicoes municipais de 2024
- **R$ 4,9 bilhoes** em gastos declarados de campanha (TSE, 2024)
- **Zero** plataformas de inteligencia politica com IA generativa no mercado brasileiro

---

## 2. Problema e Oportunidade

### 2.1 Dor do Mercado

Estrategistas e assessores politicos operam em um ambiente de alta pressao com ferramentas inadequadas:

| Dor | Impacto | Como Resolvem Hoje |
|-----|---------|-------------------|
| **Informacao fragmentada** | Horas gastas consolidando dados de dezenas de fontes | Planilhas manuais, recortes de jornal, alertas do Google |
| **Crises virais em minutos** | Perda de controle narrativo irreversivel | Grupos de WhatsApp, ligacoes telefonicas, improviso |
| **Sem analise comparativa estruturada** | Decisoes baseadas em intuicao, nao em dados | Reunioes longas, opiniao de "especialistas" |
| **Desconexao regional** | Campanhas com discurso generico que nao ressoa localmente | Pesquisas qualitativas caras e demoradas |
| **Monitoramento manual** | Custo alto de equipe + atraso na deteccao | Estagiarios lendo noticias, clipping terceirizado |

### 2.2 Tamanho da Oportunidade

#### Mercado Enderecavel (Brasil)

| Segmento | Quantidade Estimada | Ticket Medio Potencial (mensal) | TAM Anual |
|----------|--------------------|---------------------------------|-----------|
| Assessorias de comunicacao politica | ~3.000 | R$ 997 | R$ 35,9M |
| Candidatos com verba de campanha | ~50.000 (municipais) | R$ 297 | R$ 178,2M |
| Partidos politicos (diretorios) | ~600 | R$ 1.997 | R$ 14,4M |
| Institutos de pesquisa e think tanks | ~200 | R$ 1.997 | R$ 4,8M |
| Jornalistas e analistas politicos | ~5.000 | R$ 97 | R$ 5,8M |
| **Total TAM** | | | **R$ 239,1M/ano** |

#### Timing Favoravel

- **Ciclo eleitoral 2026**: Eleicoes para governador, senador e deputados em outubro de 2026
- **Janela de pre-campanha**: Decisoes estrategicas e posicionamento ocorrem 12-18 meses antes (ja estamos nessa janela)
- **IA generativa em pico de adocao**: Profissionais buscando ferramentas de IA para vantagem competitiva
- **Vazio competitivo**: Nenhuma solucao brasileira combina IA generativa + inteligencia politica

---

## 3. Proposta de Valor

### 3.1 Posicionamento

> **Para** estrategistas politicos e assessores de comunicacao no Brasil
> **Que** precisam de inteligencia estrategica em tempo real para tomar decisoes rapidas
> **Politika** e uma plataforma de inteligencia politica com IA
> **Que** transforma dados publicos em analises acionaveis, gestao de crises e monitoramento de sentimento
> **Diferente de** clipping manual, pesquisas tradicionais e ferramentas genericas de monitoramento
> **Porque** entrega analise estrategica profunda com contexto regional brasileiro em segundos, nao dias.

### 3.2 Proposta de Valor por Persona

| Persona | Promessa Central | Metrica de Valor |
|---------|-----------------|------------------|
| **Estrategista Politico** | "Identifique vazios estrategicos e oportunidades que seus adversarios ignoram" | Tempo de analise: de dias para 30 segundos |
| **Assessor de Comunicacao** | "Responda a crises antes que viralizem, com scripts prontos e testados pela IA" | Tempo de reacao: de horas para minutos |
| **Candidato** | "Entenda exatamente como voce e seus adversarios sao percebidos pelo eleitorado" | Decisoes baseadas em dados, nao achismo |
| **Gestor de Campanha** | "Centralize inteligencia, alertas e acoes em um unico painel de controle" | Reducao de equipe necessaria para monitoramento |

### 3.3 Diferenciais Competitivos (Moats)

| Diferencial | Descricao | Dificuldade de Replica |
|-------------|-----------|----------------------|
| **Contexto regional brasileiro** | IA treinada com nuances politicas de cada estado/regiao, comunicacao via WhatsApp, dinamica de redes sociais | Alta - requer expertise politica + engenharia de prompt |
| **War Room multimodal** | Analise de crise com upload de video, audio e imagem + Google Search grounding | Media - requer integracao multimodal com grounding |
| **Battle Cards estrategicos** | Comparacao estruturada de candidatos com pilares de confronto, vazios e movimentos | Alta - formato proprietario com deep political context |
| **Motor de alertas inteligente** | Deteccao automatica de mudancas de sentimento, crises e oportunidades | Media - requer pipeline de dados + IA |
| **PLG com "aha moment"** | Analise automatica na criacao do workspace: usuario ve valor em < 60 segundos | Media - requer orquestracao de UX + IA |

---

## 4. Produto

### 4.1 Modulos

#### Modulo 1: Command Center (Central de Comando)
**Valor**: Visao 360 graus em tempo real do cenario politico

- Dashboard com alertas inteligentes classificados por severidade
- Metricas consolidadas: mencoes, sentimento medio, termo quente, tendencia
- Briefing situacional gerado por IA (Calmo / Alerta / Crise)
- Auto-refresh a cada 60 segundos
- Acoes rapidas: analisar, monitorar, responder

#### Modulo 2: Analise Estrategica de Candidatos
**Valor**: Perfil estrategico profundo em 30 segundos

- Headline do perfil politico
- Tom comunicacional dominante
- Grupos compativeis e ignorados
- Gatilhos psicologicos com aplicacoes praticas
- Risco estrategico e vulnerabilidades
- Proximo melhor movimento (recomendacao acionavel)
- Chat contextual para aprofundamento com IA

#### Modulo 3: Battle Card (Analise Comparativa)
**Valor**: Mapa de confronto claro entre 2-3 candidatos

- Cards lado a lado com forca regional e vulnerabilidades
- Pilares de confronto tema a tema (saude, educacao, seguranca, etc.)
- Dominancia por pilar: quem vence em cada tema
- Vazio estrategico: oportunidade inexplorada
- Movimento vencedor: recomendacao competitiva
- Alavanca psicologica: insight comportamental

#### Modulo 4: War Room (Gestao de Crises)
**Valor**: Resposta a crises em minutos, nao horas

- Input multimodal: texto + video/audio/imagem (ate 10MB)
- Classificacao automatica de severidade (Baixo/Medio/Alto/Critico)
- Multiplas estrategias de resposta com action points
- Scripts prontos para porta-voz
- Upload de rascunho para avaliacao de efetividade (nota 0-10)
- Versao otimizada gerada pela IA
- Fundamentacao em dados reais via Google Search grounding

#### Modulo 5: Pulse Monitor (Monitoramento de Sentimento)
**Valor**: Saber o que esta acontecendo antes de todo mundo

- Monitoramento de watchwords em noticias do Google News
- Analise de sentimento por IA (positivo/neutro/negativo)
- Waveform 24h com distribuicao horaria de mencoes
- Deteccao de breaking news (< 2 horas)
- Tendencia de 15 dias com velocidade de mencoes
- Cards por termo monitorado com resumo por IA

#### Modulo 6: Gestao de Workspaces (Multi-Campanha)
**Valor**: Gerenciar multiplas campanhas simultaneamente

- Workspaces isolados com regiao, watchwords e contexto proprio
- Troca rapida entre campanhas no header
- Dados completamente separados (Row Level Security)
- Contexto regional injetado automaticamente em todas as analises

### 4.2 Fluxo do Usuario (Jornada Critica)

```
                    [Landing Page]
                         |
                    [Cadastro/Login]
                         |
                  [Criar Workspace]
                    (nome, regiao, watchwords)
                         |
              [Analise automatica gerada] ← "Aha Moment" (PLG)
                         |
              [Command Center com alertas]
                    /    |    \
                   /     |     \
            [Analisar] [Pulse] [War Room]
                |        |        |
          [Insight]  [Sentimento] [Crise]
          [Battle]   [Waveform]   [Scripts]
          [Chat]     [Breaking]   [Avaliacao]
```

### 4.3 Metricas de Produto (KPIs)

| Categoria | Metrica | Meta MVP | Meta Escala |
|-----------|---------|----------|-------------|
| **Ativacao** | % de usuarios que criam workspace no primeiro acesso | > 60% | > 80% |
| **Engajamento** | Analises por usuario por semana | >= 10 | >= 25 |
| **Retencao** | Retorno semanal (D7) | > 40% | > 65% |
| **Valor** | Chat messages por analise | >= 3 | >= 5 |
| **Adocao War Room** | % de usuarios ativos que usam War Room em crise | > 50% | > 70% |
| **NPS** | Net Promoter Score | > 50 | > 70 |
| **Conversao Free > Paid** | % de usuarios free que convertem | > 5% | > 12% |

---

## 5. Modelo de Negocios

### 5.1 Estrategia: Product-Led Growth (PLG) + Sales-Assisted

**Fase 1 (Lancamento)**: PLG puro
- Cadastro self-service via landing page
- Free tier generoso para gerar word-of-mouth no meio politico
- Conversao via limite de uso + funcionalidades premium

**Fase 2 (Escala)**: PLG + Inside Sales
- Time de vendas para contas de alto valor (partidos, assessorias grandes)
- Demo personalizada para clientes enterprise
- Parcerias com agencias de marketing politico

### 5.2 Planos e Precificacao

#### Plano Gratuito: Observador
**Preco**: R$ 0/mes
**Objetivo**: Aquisicao e ativacao

| Recurso | Limite |
|---------|--------|
| Analises individuais | 15/mes |
| Analises comparativas | 5/mes |
| Gestao de crises (War Room) | 10/mes |
| Chat contextual | 50 mensagens/mes |
| Workspaces | 1 |
| Pulse Monitor | Basico (3 watchwords) |
| Alertas | Apenas info e warning |
| Historico | Ultimos 30 dias |

---

#### Plano Estrategista
**Preco**: R$ 297/mes (ou R$ 247/mes no plano anual)
**Objetivo**: Conversao de profissionais individuais

| Recurso | Limite |
|---------|--------|
| Analises individuais | 100/mes |
| Analises comparativas | 30/mes |
| Gestao de crises (War Room) | Ilimitado |
| Chat contextual | Ilimitado |
| Workspaces | 3 |
| Pulse Monitor | Completo (10 watchwords) |
| Alertas | Todos os niveis + notificacao por email |
| Historico | Ilimitado |
| Exportacao PDF | Incluido |
| Suporte | Email (resposta em 24h) |

---

#### Plano War Room
**Preco**: R$ 997/mes (ou R$ 797/mes no plano anual)
**Objetivo**: Times de campanha e assessorias

| Recurso | Limite |
|---------|--------|
| Tudo do Estrategista | + |
| Workspaces | 10 |
| Pulse Monitor | Avancado (25 watchwords) |
| Usuarios por conta | Ate 5 |
| Roles e permissoes | Admin, Analista, Viewer |
| Alertas criticos via WhatsApp | Incluido |
| Relatorio semanal automatico | PDF + Email |
| Suporte | Prioritario (resposta em 4h) |
| Onboarding dedicado | 1 sessao de 60min |

---

#### Plano Institucional (Enterprise)
**Preco**: Sob consulta (a partir de R$ 2.997/mes)
**Objetivo**: Partidos, institutos e agencias

| Recurso | Limite |
|---------|--------|
| Tudo do War Room | + |
| Workspaces | Ilimitados |
| Usuarios | Ilimitados |
| API de integracao | Acesso completo |
| Monitoramento de redes sociais | Twitter/X, Instagram |
| Heatmap regional interativo | Incluido |
| White-label | Disponivel |
| SLA | 99.9% uptime garantido |
| Suporte | Dedicado + Slack channel |
| Treinamento | Presencial + materiais |

### 5.3 Projecao de Receita (Cenario Conservador)

#### Premissas
- Lancamento comercial: Abril 2026
- Crescimento organico via PLG + indicacoes no meio politico
- Conversao free-to-paid: 5% (benchmark PLG brasileiro)
- Ticket medio: R$ 497/mes (mix de planos)
- Churn mensal: 8% (alta sazonalidade eleitoral)

#### Projecao 12 Meses

| Mes | Usuarios Free | Usuarios Pagos | MRR | ARR |
|-----|--------------|----------------|-----|-----|
| M1 (Abr/26) | 100 | 5 | R$ 2.485 | R$ 29.820 |
| M3 (Jun/26) | 500 | 35 | R$ 17.395 | R$ 208.740 |
| M6 (Set/26) | 2.000 | 150 | R$ 74.550 | R$ 894.600 |
| M9 (Dez/26) | 3.500 | 280 | R$ 139.160 | R$ 1.669.920 |
| M12 (Mar/27) | 5.000 | 400 | R$ 198.800 | R$ 2.385.600 |

> **Nota**: Pico esperado em Set-Out/2026 (periodo eleitoral). Retencao pos-eleitoral depende de expansao para monitoramento legislativo e governamental.

### 5.4 Unit Economics

| Metrica | Valor | Referencia |
|---------|-------|-----------|
| **CAC** (Custo de Aquisicao) | R$ 150 | PLG = baixo CAC via produto |
| **LTV** (Lifetime Value) | R$ 3.976 | Ticket R$ 497 x 8 meses media |
| **LTV/CAC** | 26.5x | Saudavel (benchmark: > 3x) |
| **Payback** | < 1 mes | Otimo para SaaS |
| **Custo por usuario (infra)** | ~R$ 15/mes | Gemini API + Supabase + Vercel |
| **Margem bruta** | ~85% | Tipica de SaaS com IA |

---

## 6. Cenario Competitivo

### 6.1 Alternativas Atuais

| Concorrente / Alternativa | Tipo | Preco | Limitacoes vs Politika |
|---------------------------|------|-------|----------------------|
| **Clipping manual / assessoria de imprensa** | Servico humano | R$ 2.000-10.000/mes | Lento (24-48h), sem IA, sem analise estrategica |
| **Google Alerts** | Ferramenta gratuita | Gratis | Sem analise, sem contexto politico, sem comparacao |
| **Stilingue / Brandwatch** | Social listening | R$ 3.000-15.000/mes | Generico (nao politico), sem IA estrategica, caro |
| **Atlas Intel / Quaest** | Instituto de pesquisa | R$ 50.000+/projeto | Pesquisas pontuais, sem tempo real, inacessivel |
| **ChatGPT / Gemini direto** | IA generica | R$ 100-200/mes | Sem contexto politico, sem monitoramento, sem alertas, sem historico |
| **Planilhas + WhatsApp** | Metodo artesanal | Gratis | Caos operacional, sem escala, sem inteligencia |

### 6.2 Mapa de Posicionamento

```
                    INTELIGENCIA ESTRATEGICA
                           ↑
                           |
    [Atlas Intel]          |          [POLITIKA]
    (pesquisa pontual)     |     (IA + tempo real + estrategia)
                           |
  ← LENTO ─────────────────┼────────────────── RAPIDO →
                           |
    [Clipping manual]      |          [Google Alerts]
    (humano + demora)      |      (rapido mas raso)
                           |
                           ↓
                    DADOS BRUTOS
```

### 6.3 Vantagem Competitiva Sustentavel

1. **Network effect politico**: Quanto mais usuarios em uma regiao, melhores os insights regionais e mais valiosa a plataforma
2. **Dados de uso acumulados**: Historico de analises gera inteligencia sobre padroes politicos regionais
3. **Custo de troca**: Workspaces, historico e insights acumulados criam lock-in
4. **Expertise de dominio**: Prompts e contextos politicos regionais sao dificeis de replicar sem conhecimento profundo
5. **Timing**: Primeiro mover no cruzamento IA generativa + politica no Brasil

---

## 7. Go-to-Market

### 7.1 Estrategia de Lancamento (Abr-Jun 2026)

#### Fase 1: Seed Users (Abril 2026)
**Objetivo**: 100 usuarios qualificados, 10 pagantes

| Canal | Acao | Meta |
|-------|------|------|
| **Rede pessoal** | Convite direto para estrategistas e assessores conhecidos | 30 usuarios |
| **LinkedIn** | Serie de posts demonstrando analises reais (anonimizadas) | 40 usuarios |
| **WhatsApp Groups** | Demo em grupos de marketing politico e assessores | 30 usuarios |

#### Fase 2: Traction (Maio-Junho 2026)
**Objetivo**: 500 usuarios, 35 pagantes

| Canal | Acao | Meta |
|-------|------|------|
| **Conteudo** | Blog com analises politicas usando Politika (SEO) | 100 usuarios/mes |
| **Parcerias** | Co-marketing com influenciadores de politica | 80 usuarios/mes |
| **Eventos** | Palestras em eventos de marketing politico | 50 usuarios/evento |
| **Indicacao** | Programa "Indique e ganhe 1 mes gratis" | 20% dos novos |

#### Fase 3: Pre-Eleitoral (Jul-Out 2026)
**Objetivo**: 2.000+ usuarios, 150+ pagantes

| Canal | Acao | Meta |
|-------|------|------|
| **PR** | Materia em portais de politica e tecnologia | Brand awareness |
| **Webinars** | "Como usar IA na campanha eleitoral de 2026" | Leads qualificados |
| **Inside Sales** | Prospecao ativa em partidos e assessorias | Contas enterprise |
| **Case studies** | Resultados reais de campanhas (com autorizacao) | Prova social |

### 7.2 Canais Prioritarios

| Canal | Custo | Velocidade | Qualidade do Lead |
|-------|-------|-----------|-------------------|
| **WhatsApp groups de assessores** | Zero | Imediata | Altissima |
| **LinkedIn (organico)** | Zero | Media | Alta |
| **Indicacao de usuarios** | Baixo (1 mes gratis) | Media | Altissima |
| **Eventos de marketing politico** | Medio | Lenta | Alta |
| **Google Ads "inteligencia politica"** | Alto | Imediata | Media |
| **Parcerias com agencias** | Revenue share | Media | Alta |

### 7.3 Messaging por Canal

**Headline principal**: "Seu adversario ja esta usando IA. E voce?"

**Variantes por contexto**:
- **Para estrategistas**: "Identifique o vazio estrategico que seus adversarios ignoram. Em 30 segundos."
- **Para assessores**: "Crise no WhatsApp? War Room com script pronto em 2 minutos."
- **Para candidatos**: "Saiba exatamente como voce e seus adversarios sao percebidos. Com dados, nao achismo."
- **Para partidos**: "Inteligencia centralizada para todas as campanhas do diretorio."

---

## 8. Roadmap Comercial

### Q2 2026 (Abr-Jun): Lancamento + Product-Market Fit

| Entrega | Tipo | Impacto Comercial |
|---------|------|-------------------|
| Sistema de planos e cobranca (Stripe) | Produto | Habilita monetizacao |
| Exportacao PDF profissional | Produto | Diferencial para plano pago |
| Landing page otimizada para conversao | Marketing | Aumenta signup rate |
| Dashboard colaborativo (multi-usuario) | Produto | Habilita plano War Room |
| Programa de indicacao | Growth | Reducao de CAC |
| 10 case studies iniciais | Marketing | Prova social |

### Q3 2026 (Jul-Set): Escala Pre-Eleitoral

| Entrega | Tipo | Impacto Comercial |
|---------|------|-------------------|
| Monitoramento de redes sociais (X, Instagram) | Produto | Valor percebido massivo |
| Alertas via WhatsApp (Web Push + API) | Produto | Retencao e diferencial |
| Heatmap regional interativo | Produto | Visual impactante para venda |
| Expansao para todos os 27 estados brasileiros | Produto | TAM 27x maior |
| Inside Sales team (2 pessoas) | Comercial | Contas enterprise |
| Webinar series pre-eleitoral | Marketing | Pipeline de leads |

### Q4 2026 (Out-Dez): Pos-Eleitoral + Retencao

| Entrega | Tipo | Impacto Comercial |
|---------|------|-------------------|
| Modulo "Mandato Monitor" (acompanhamento pos-eleicao) | Produto | Retencao pos-eleitoral |
| API publica para integracoes | Produto | Habilita plano Institucional |
| Relatorios automatizados semanais | Produto | Valor continuo (anti-churn) |
| White-label para agencias | Produto | Nova vertical de receita |
| Balanco anual e planejamento 2027 | Comercial | Renovacoes anuais |

### 2027: Expansao

| Direcao | Descricao |
|---------|-----------|
| **Eleicoes municipais 2028** | Preparacao de 18 meses, pre-venda de pacotes anuais |
| **Verticais adjacentes** | Lobby, relacoes governamentais, compliance politico |
| **America Latina** | Adaptacao para Argentina, Colombia, Mexico |
| **Mobile app** | PWA ou React Native para acesso em campo |

---

## 9. Riscos Comerciais e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| **Sazonalidade eleitoral** | Alta | Alto | Expandir para monitoramento legislativo e governamental pos-eleicao |
| **Concorrente bem-financiado** | Media | Alto | Velocidade de execucao + depth de contexto politico brasileiro |
| **Regulacao de IA em eleicoes** | Media | Alto | Compliance proativo, transparencia no uso de IA, termos claros |
| **Dependencia do Google Gemini** | Media | Medio | Arquitetura permite troca de provider (OpenAI, Anthropic como fallback) |
| **Resistencia a tecnologia** | Media | Medio | Onboarding guiado, interface simples, resultados imediatos (PLG) |
| **Custo de API escala** | Baixa | Medio | Cache agressivo, rate limiting, otimizacao de prompts |
| **Questoes eticas / deepfake** | Baixa | Alto | Politica de uso aceitavel, audit trail, moderacao de conteudo |
| **Churn pos-eleitoral** | Alta | Alto | Modulo Mandato Monitor, relatorios automaticos, monitoramento legislativo |

---

## 10. Metricas de Sucesso Comercial

### North Star Metric
**Analises estrategicas geradas por semana** - indica que usuarios estao extraindo valor real da plataforma.

### Metricas por Fase

| Fase | Metrica Principal | Meta | Prazo |
|------|------------------|------|-------|
| **Lancamento** | Usuarios cadastrados | 100 | Abr/26 |
| **PMF** | NPS | > 50 | Jun/26 |
| **Traction** | MRR | R$ 17.000 | Jun/26 |
| **Growth** | MRR | R$ 75.000 | Set/26 |
| **Scale** | ARR | R$ 2M+ | Mar/27 |

### Metricas Operacionais

| Metrica | Meta | Frequencia de Medicao |
|---------|------|----------------------|
| CAC | < R$ 200 | Mensal |
| LTV/CAC | > 10x | Mensal |
| Churn mensal | < 10% | Mensal |
| Tempo de ativacao (signup → 1a analise) | < 5 min | Semanal |
| Ticket de suporte por usuario/mes | < 0.5 | Mensal |
| Uptime | > 99.5% | Diario |

---

## 11. Equipe Necessaria (Proximo Ano)

### Fase 1: Lancamento (Q2 2026) - 3 pessoas
| Papel | Responsabilidade |
|-------|-----------------|
| **Founder/Product** | Produto, estrategia, primeiras vendas |
| **Full-stack Developer** | Desenvolvimento de features e infra |
| **Growth/Marketing** | Conteudo, comunidade, canais de aquisicao |

### Fase 2: Traction (Q3 2026) - 6 pessoas
| Papel | Responsabilidade |
|-------|-----------------|
| + **Inside Sales** (2) | Prospecao ativa, demos, fechamento |
| + **Customer Success** | Onboarding, retencao, expansao |

### Fase 3: Scale (Q4 2026+) - 10 pessoas
| Papel | Responsabilidade |
|-------|-----------------|
| + **Backend Engineer** | API, performance, escalabilidade |
| + **Data Engineer** | Pipeline de dados, analytics |
| + **Designer** | UX/UI, branding, materiais de marketing |
| + **Especialista Politico** | Conteudo, contextos regionais, qualidade de IA |

---

## 12. Investimento Necessario

### Custos Operacionais Mensais (Estimativa)

| Item | Atual (MVP) | M6 | M12 |
|------|------------|-----|-----|
| Infra (Vercel + Supabase) | R$ 200 | R$ 1.500 | R$ 5.000 |
| Google Gemini API | R$ 500 | R$ 8.000 | R$ 25.000 |
| Ferramentas (Sentry, PostHog, etc.) | R$ 300 | R$ 1.000 | R$ 2.000 |
| Equipe | R$ 0 (solo) | R$ 45.000 | R$ 120.000 |
| Marketing | R$ 0 | R$ 5.000 | R$ 15.000 |
| **Total** | **R$ 1.000** | **R$ 60.500** | **R$ 167.000** |

### Cenario de Investimento

| Cenario | Investimento | Runway | Break-even |
|---------|-------------|--------|------------|
| **Bootstrap** | R$ 0 (receita propria) | Indefinido | M4-M5 |
| **Pre-seed** | R$ 500K | 12 meses | M8 |
| **Seed** | R$ 2M | 18 meses | M10 |

> **Recomendacao**: Bootstrap ate PMF confirmado (NPS > 50, > 30 pagantes), depois buscar pre-seed para acelerar na janela eleitoral.

---

## 13. Casos de Uso Reais (Narrativas de Venda)

### Caso 1: "A crise das 6h da manha"
> Um video comprometedor de um candidato viraliza as 6h no WhatsApp. O assessor de comunicacao abre o Politika no celular, cola a descricao no War Room, faz upload do video. Em 3 minutos tem: classificacao de severidade (CRITICO), 3 estrategias de resposta com scripts prontos, e uma avaliacao do rascunho que ele preparou. As 6h30, o candidato ja tem a nota oficial publicada.
>
> **Sem Politika**: 3-4 horas de ligacoes, reunioes e improviso. O video ja tem 500K views.

### Caso 2: "O vazio que ninguem viu"
> Uma estrategista analisa 3 pre-candidatos a prefeito usando o Battle Card. A IA identifica que nenhum dos tres fala sobre transporte publico, tema que afeta 60% do eleitorado. Ela recomenda ao seu candidato adotar o tema como bandeira. Nas pesquisas seguintes, ele sobe 8 pontos.
>
> **Sem Politika**: O vazio passaria despercebido entre centenas de paginas de pesquisa qualitativa.

### Caso 3: "O alerta que salvou a campanha"
> O Pulse Monitor detecta uma queda de 25% no sentimento sobre o candidato em 4 horas. O Command Center gera um alerta DANGER. O gestor de campanha clica, descobre que uma fake news sobre desvio de verba esta circulando. Aciona o War Room, gera resposta com fontes verificaveis do Google Search. Em 1 hora, a resposta esta circulando nos mesmos grupos de WhatsApp.
>
> **Sem Politika**: A fake news circularia por 24-48h sem resposta estruturada. O dano seria irreversivel.

---

## 14. Conformidade e Etica

### 14.1 Principios de Uso
- **Transparencia**: Todas as analises sao baseadas em dados publicos
- **Privacidade**: Dados de usuarios isolados por RLS, sem compartilhamento
- **Etica**: Plataforma nao gera fake news, desinformacao ou conteudo difamatorio
- **Compliance**: Alinhamento com legislacao eleitoral brasileira (Lei 9.504/97)
- **IA Responsavel**: Audit trail de todas as interacoes com a IA

### 14.2 Politica de Uso Aceitavel
- Proibido usar para criar desinformacao ou fake news
- Proibido usar para gerar conteudo que viole a legislacao eleitoral
- Proibido compartilhar analises de forma que viole privacidade
- Monitoramento de uso abusivo via Sentry + PostHog

### 14.3 LGPD
- Coleta minima de dados pessoais (email, nome)
- Direito de exclusao implementado
- Politica de privacidade e termos de servico publicados
- Dados armazenados em servidores seguros (Supabase + Vercel)

---

## 15. Conclusao

Politika esta posicionada de forma unica no cruzamento de tres tendencias poderosas:

1. **IA generativa em pico de adocao** - profissionais buscam vantagem competitiva com IA
2. **Ciclo eleitoral 2026** - a maior eleicao estadual do Brasil em 4 anos
3. **Vazio competitivo** - nenhuma plataforma brasileira combina IA + inteligencia politica

Com um MVP funcional em producao, arquitetura segura e escalavel, e um modelo de negocios PLG com unit economics saudaveis, o momento de acelerar e agora.

**A janela eleitoral de 2026 nao espera.**

---

*Documento gerado em 25 de Fevereiro de 2026*
*Politika - Inteligencia Politica Estrategica*
