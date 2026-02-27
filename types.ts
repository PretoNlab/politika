
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

// ============================================
// Radar Preditivo — TSE Data Types
// ============================================

export interface TseElectionResult {
  id: string;
  election_year: number;
  election_type: string;
  state: string;
  municipality: string;
  zone: number;
  candidate_name: string;
  candidate_number: number;
  party: string;
  coalition: string | null;
  votes: number;
  turnout_pct: number | null;
  null_votes: number;
  blank_votes: number;
  total_voters: number | null;
  fetched_at: string;
}

export interface TseCampaignFinance {
  id: string;
  election_year: number;
  state: string;
  municipality: string;
  candidate_name: string;
  candidate_number: number;
  party: string;
  total_revenue: number;
  total_spending: number;
  spending_category: Record<string, number>;
  funding_sources: { source: string; amount: number }[];
  fetched_at: string;
}

export interface TseVoterDemographics {
  id: string;
  election_year: number;
  state: string;
  municipality: string;
  zone: number;
  total_voters: number;
  age_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  education_distribution: Record<string, number>;
  fetched_at: string;
}

// ============================================
// Radar Preditivo — Prediction Types
// ============================================

export type RadarTool = 'thermometer' | 'battlemap' | 'simulator' | 'earlywarning';

export interface ThermometerZone {
  zone: number;
  score: number;
  historicalAvg: number;
  trend: 'rising' | 'stable' | 'falling';
  keyInsight: string;
}

export interface ThermometerResult {
  overallScore: number;
  candidateName: string;
  party: string;
  zones: ThermometerZone[];
  spendingEfficiency: number;
  historicalComparison: string;
  strengths: string[];
  vulnerabilities: string[];
  recommendation: string;
}

export type ZoneClassification = 'allied' | 'adversary' | 'disputed' | 'opportunity';

export interface BattleMapZone {
  zone: number;
  classification: ZoneClassification;
  dominantCandidate: string;
  margin: number;
  swingPotential: number;
  voterProfile: string;
  strategicNote: string;
}

export interface BattleMapResult {
  zones: BattleMapZone[];
  summary: string;
  priorityTargets: number[];
  defensePriorities: number[];
  overallBalance: string;
}

export type ScenarioType = 'position' | 'alliance' | 'crisis' | 'abstention' | 'spending' | 'custom';

export interface ScenarioInput {
  type: ScenarioType;
  description: string;
  targetZones?: number[];
}

export interface SimulatorResult {
  scenario: string;
  impactPoints: number;
  affectedZones: { zone: number; delta: number; explanation: string }[];
  historicalAnalogy: string;
  probability: number;
  recommendation: string;
  risks: string[];
}

export interface EarlyWarning {
  id: string;
  patternType: string;
  probability: number;
  horizonHours: number;
  description: string;
  historicalPrecedent: string | null;
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

export interface EarlyWarningResult {
  warnings: EarlyWarning[];
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  nextCheckIn: string;
}

export interface RadarPrediction {
  id: string;
  user_id: string;
  workspace_id: string | null;
  tool: RadarTool;
  input_params: Record<string, unknown>;
  result: ThermometerResult | BattleMapResult | SimulatorResult | EarlyWarningResult;
  confidence_level: number | null;
  created_at: string;
}

export interface TseSyncStatus {
  lastSync: string | null;
  recordCount: number;
  availableYears: number[];
  state: string;
  municipality: string;
}
