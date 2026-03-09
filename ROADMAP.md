# Roadmap & Ideias Futuras - Politika

Este documento armazena ideias, conceitos e features planejadas para o futuro do produto, após a consolidação do MVP atual.

## 1. Vault de Inteligência (Powered by NotebookLM / Gemini)
**Status:** Ideia Validada para Pitch (Futuro)
**Objetivo:** Criar uma experiência "NotebookLM-like" nativa no Politika para análise de dossiês e documentos complexos.

### O que é?
Uma feature onde o usuário (Chefe de Inteligência) faz upload de PDFs extensos (projetos de lei, pesquisas qualitativas, dossiês de opositores) e usa inteligência artificial para interrogar esses documentos em um chat restrito ao contexto dos arquivos.

### Casos de Uso:
- **Análise de Dossiês e Legislações:** Interrogar centenas de páginas para achar contradições do adversário ("Em quais momentos o candidato X entrou em contradição sobre privatizações? Cite as páginas.").
- **Simulador de Sabatinas:** Alimentar a IA com o plano de governo do candidato e pedir para ela agir como um jornalista investigativo fazendo as perguntas mais difíceis.
- **Micro-Segmentação (Cérebro da Campanha):** Criar pastas (ex: "Evangélicos Zona Sul") com todas as pesquisas qualitativas daquele grupo para gerar _talking points_ super direcionados antes de comícios.
- **Briefing em Áudio (Deep Dive):** (Opcional) Gerar podcasts de 5 minutos sobre o relatório diário para o candidato ouvir no carro.

### Visão Técnica (MVP Futuro):
- **Ingestão:** Upload de até 3 PDFs (max 50MB) por "Caso/Pasta".
- **Motor de IA:** Utilizar a File API da Gemini e o **Context Caching** do Gemini 1.5 Pro. Em vez de criar um pipeline complexo de RAG vetorial, usar a janela massiva de contexto (2M tokens) para passar o documento inteiro "na memória" e cobrar por _cache_.
- **Interface:** Tela dividida -> Esquerda (Visualizador de PDF nativo para validação da fonte) | Direita (Chat da IA).
- **Segurança (Crucial):** Prompt blindado ("Só responda com base no PDF") e isolamento dos dados do cliente (Vertex AI).

### Custo/Benefício Estipulado:
- Custo via Context Caching estimado em ~$1.50 por "incidente/sessão" pesada.
- **ROI:** Altíssimo. Esse é um recurso "UAU" (killer feature) que garante retenção (lock-in) gigantesca em um produto B2B/Gov de ticket alto, justificando completamente os custos da API.
