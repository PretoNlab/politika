
export interface Insight {
  id: string;
  date: string;
  campaign: string;
  mainInsight: string;
  status: 'Aplicado' | 'Em análise' | 'Pendente' | 'Arquivado';
}

export interface DetailedAnalysis {
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

export interface Candidate {
  handle: string;
  profileType: string;
  sentimentTrend: string;
  regionalStrength: string;
  mainVulnerability: string;
}

export interface ConfrontationPillar {
  pillar: string;
  winner_handle: string;
  candidateA_status: string;
  analysis: string;
}

export interface ComparativeAnalysis {
  candidates: Candidate[];
  confrontationPillars: ConfrontationPillar[];
  strategicVoid: string;
  winningMove: string;
  regionalBattleground: string;
  psychologicalLeverage: string;
}

export interface CrisisAnalysis {
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

// Pulse Monitor types

export interface TaggedNewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  matchedTerms: string[];
  description?: string;   // Snippet/resume do artigo (extraído do RSS)
  isBreaking?: boolean;  // true se publicado há menos de 2h
  relevanceScore?: number; // Pontuação de relevância (maior = mais relevante)
}

export interface SentimentResult {
  score: number; // -1 to 1
  classification: 'Positivo' | 'Neutro' | 'Negativo';
  summary: string;
}

export interface TermMetrics {
  term: string;
  mentions: number;
  sentiment: SentimentResult | null;
  sentimentLoading: boolean;
  articles: TaggedNewsArticle[];
  timeDistribution: number[]; // 24 slots (hourly)
}

export interface PulseState {
  terms: string[];
  activeTerm: string | null; // null = "Todos"
  metrics: Record<string, TermMetrics>;
  allArticles: TaggedNewsArticle[];
  filteredArticles: TaggedNewsArticle[];
  isLoading: boolean;
  isNewsLoading: boolean;
}

// ============================================
// Command Center & Alert System Types
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'opportunity';
export type AlertCategory =
  | 'sentiment_drop'
  | 'sentiment_rise'
  | 'crisis_detected'
  | 'opportunity_detected'
  | 'trending_topic';

export interface AlertAction {
  id: string;
  label: string;
  type: 'analyze' | 'respond' | 'ignore' | 'generate_content';
  route?: string;
  payload?: Record<string, unknown>;
}

export interface PolitikaAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  term?: string;
  sentimentDelta?: number;
  previousScore?: number;
  currentScore?: number;
  suggestedActions: AlertAction[];
  relatedArticles: TaggedNewsArticle[];
  createdAt: string;
  isRead: boolean;
  isActioned: boolean;
}

export interface ActionRecommendation {
  id: string;
  type: 'respond' | 'wait' | 'counter_attack' | 'capitalize';
  title: string;
  description: string;
  urgency: 'immediate' | 'today' | 'this_week';
  estimatedImpact: 'low' | 'medium' | 'high';
  draftContent?: string;
}

export interface CommandCenterState {
  alerts: PolitikaAlert[];
  unreadCount: number;
  recommendations: ActionRecommendation[];
  lastRefresh: string;
  isLoading: boolean;
}

// Historical sentiment for alert comparison
export interface SentimentHistory {
  term: string;
  score: number;
  timestamp: string;
}

// ============================================
// Briefing Types (QG Page)
// ============================================

export type BriefingStatus = 'calm' | 'alert' | 'crisis';

export interface BriefingResult {
  status: BriefingStatus;
  summary: string;
  recommendations: string[];
}


export interface AnalysisHistoryItem {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: 'insight' | 'comparison';
  handle: string;
  result: DetailedAnalysis | ComparativeAnalysis;
  created_at: string;
}
