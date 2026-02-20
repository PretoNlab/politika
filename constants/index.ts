/**
 * Constantes centralizadas do projeto
 */

// Passos de loading para análises
export const LOADING_STEPS = [
  { label: 'Mapeando campo de batalha', hint: 'Cruzando perfis e discursos...' },
  { label: 'Identificando interseções', hint: 'Onde as pautas se chocam...' },
  { label: 'Calculando vácuos', hint: 'Oportunidades ignoradas por todos...' },
  { label: 'Gerando Battle Card', hint: 'Finalizando estratégia de confronto...' }
];

// Tipos MIME permitidos para upload
export const ALLOWED_MEDIA_TYPES = {
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export const ALL_ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_MEDIA_TYPES.video,
  ...ALLOWED_MEDIA_TYPES.audio,
  ...ALLOWED_MEDIA_TYPES.image
];

// Limites de arquivo
export const FILE_SIZE_LIMITS = {
  maxSizeMB: 10,
  maxSizeBytes: 10 * 1024 * 1024
};

// Rate limiting
export const RATE_LIMITS = {
  politicalAnalysis: {
    maxCalls: 10,
    windowMs: 60000 // 1 minuto
  },
  crisisAnalysis: {
    maxCalls: 5,
    windowMs: 60000
  },
  chat: {
    maxCalls: 20,
    windowMs: 60000
  },
  sentimentAnalysis: {
    maxCalls: 10,
    windowMs: 120000 // 2 minutos
  },
  briefing: {
    maxCalls: 3,
    windowMs: 300000 // 5 minutos
  }
};

// Storage keys
export const STORAGE_KEYS = {
  history: 'politika_history',
  workspace: 'politika_workspace',
  newsCache: (region: string, keywords: string[]) =>
    `politika_news_cache_${region}_${keywords.join('_')}`,
  onboardingCompleted: 'politika_onboarding_completed',
  pulseCache: (term: string, articlesHash: string) =>
    `politika_pulse_sentiment_${term}_${articlesHash}`,
  briefingCache: 'politika_briefing_cache'
};

// Timeouts
export const TIMEOUTS = {
  geolocation: 5000,
  apiRequest: 30000,
  debounce: 500
};

// Validação
export const VALIDATION = {
  handleMaxLength: 50,
  inputMaxLength: 5000,
  messageMaxLength: 2000,
  filenameMaxLength: 255
};

// URLs e endpoints
export const URLS = {
  corsProxy: 'https://api.allorigins.win/get?url=',
  googleNews: (region: string, keywords: string) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(keywords)}+${encodeURIComponent(region)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
};

// Design tokens (para referência rápida)
export const DESIGN_TOKENS = {
  colors: {
    primary: '#136dec',
    primarySoft: 'rgba(19, 109, 236, 0.1)',
    textHeading: '#0d131b',
    textSubtle: '#4c6c9a',
    backgroundLight: '#f6f7f8',
    backgroundDark: '#101822'
  },
  borderRadius: {
    default: '0.25rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  }
};

// Status de insights
export const INSIGHT_STATUSES = [
  'Aplicado',
  'Em análise',
  'Pendente',
  'Arquivado'
] as const;

// Níveis de severidade de crise
export const CRISIS_SEVERITY_LEVELS = [
  'Baixo',
  'Médio',
  'Alto',
  'Crítico'
] as const;

// Cache TTL
export const CACHE_TTL = {
  sentiment: 30 * 60 * 1000, // 30 minutos
  briefing: 10 * 60 * 1000 // 10 minutos
};

// Paleta de cores para termos no Pulse Monitor
export const TERM_COLORS = [
  '#136dec', // azul primário
  '#10b981', // esmeralda
  '#f59e0b', // âmbar
  '#ef4444', // vermelho
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#06b6d4', // ciano
  '#84cc16', // lima
];

// Free tier limits (mensal)
export const FREE_TIER_LIMITS = {
  analyses: 15,
  comparisons: 5,
  crises: 10,
  chats: 50,
} as const;

export type UsageCategory = keyof typeof FREE_TIER_LIMITS;

// Onboarding / Lifecycle
export const ONBOARDING_STEPS = [
  { id: 'create_workspace', label: 'Criar um Workspace', icon: 'folder_shared' },
  { id: 'first_analysis', label: 'Fazer primeira análise', icon: 'analytics' },
  { id: 'visit_radar', label: 'Visitar o Radar', icon: 'radar' },
  { id: 'visit_warroom', label: 'Abrir o War Room', icon: 'warning' },
  { id: 'use_chat', label: 'Usar o Chat Estratégico', icon: 'forum' },
] as const;

export const MILESTONE_THRESHOLDS = [
  { count: 1, id: 'first_analysis', title: 'Primeira Análise!', description: 'Você completou sua primeira análise estratégica.' },
  { count: 5, id: 'fifth_analysis', title: '5 Análises!', description: 'Você está se tornando um estrategista experiente.' },
  { count: 10, id: 'tenth_analysis', title: '10 Análises!', description: 'Nível expert. Sua visão política está afiada.' },
  { count: 25, id: 'twentyfifth_analysis', title: '25 Análises!', description: 'Mestre estrategista. Ninguém escapa do seu radar.' },
] as const;

// Onboarding steps para PulseMonitor
export const PULSE_ONBOARDING_STEPS = [
  {
    title: 'O Motor de Busca',
    description: 'As "Watchwords" do seu Workspace alimentam este monitor. O sistema escaneia a web em busca de termos como "saúde", "prefeitura" ou o nome do seu candidato para calcular o interesse em tempo real.',
    icon: 'manage_search',
    color: 'text-primary'
  },
  {
    title: 'Waveform de Ressonância',
    description: 'Imagine o "batimento cardíaco" da internet. Este gráfico não mostra apenas volume, mas a intensidade do interesse comparada à normalidade. Picos significam que as pessoas estão buscando ativamente suas palavras-chave agora, saindo da rotina.',
    icon: 'insights',
    color: 'text-primary'
  },
  {
    title: 'Ponte da Verdade',
    description: 'Aqui confirmamos se o interesse é orgânico ou gerado por um fato real. Cruzamos o gráfico com notícias do Google News. Se há um pico e uma notícia ao lado, você tem um "Momento de Campanha" real.',
    icon: 'verified_user',
    color: 'text-emerald-500'
  },
  {
    title: 'Velocidade de Crise',
    description: 'Monitoramos a aceleração das menções negativas. Se a velocidade passar de "Baixa" para "Aguda" em menos de 1 hora, o Politika recomenda a abertura imediata do War Room.',
    icon: 'speed',
    color: 'text-amber-500'
  },
  {
    title: 'Ressonância Regional',
    description: 'A Bahia é diversa. Veja qual município está respondendo melhor à sua narrativa. Use esses dados para decidir onde o candidato deve estar fisicamente amanhã.',
    icon: 'map',
    color: 'text-blue-500'
  }
];
