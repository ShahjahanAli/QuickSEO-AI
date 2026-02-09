
export interface AuditMetric {
  label: string;
  score: number;
  status: 'good' | 'average' | 'poor';
  description: string;
}

export interface KeywordRanking {
  keyword: string;
  position: number;
  volume: string;
  difficulty: number; // 0-100
  change: number;
  history: number[]; // Last 7 data points for trend
}

export interface Backlink {
  sourceUrl: string;
  anchorText: string;
  authority: number;
  toxicity: number; // 0-100
  type: 'dofollow' | 'nofollow';
  isRecommendedDisavow?: boolean;
}

export interface InternalLinkOpportunity {
  targetPage: string;
  currentLinks: number;
  suggestedSource: string;
  recommendedAnchor: string;
  reason: string;
}

export interface SecurityFinding {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  status: 'vulnerable' | 'secure';
  description: string;
  remediation: string;
}

export interface AuditResult {
  performance: AuditMetric;
  seo: AuditMetric;
  accessibility: AuditMetric;
  bestPractices: AuditMetric;
  security: AuditMetric;
  domainAuthority: number;
  backlinks: {
    total: number;
    referringDomains: number;
    overallToxicity: number;
    list: Backlink[];
  };
  keywords: KeywordRanking[];
  internalLinkOpportunities: InternalLinkOpportunity[];
  securityFindings: SecurityFinding[];
  details: {
    title: string;
    description: string;
    items: {
      title: string;
      status: 'pass' | 'fail' | 'warn';
      details: string;
    }[];
  }[];
}

export interface AiInsight {
  title: string;
  category: 'Performance' | 'SEO' | 'Accessibility' | 'Backlinks' | 'Keywords' | 'Security';
  impact: 'High' | 'Medium' | 'Low';
  description: string;
  recommendation: string;
}

export interface LongTailKeyword {
  phrase: string;
  intent: string;
  opportunity: string;
}

export interface ContentIdea {
  title: string;
  format: string;
  outline: string;
}

export interface ResearchResult {
  mainKeywords: {
    keyword: string;
    volume: string;
    difficulty: number;
    strategy: string;
  }[];
  longTailKeywords: LongTailKeyword[];
  contentIdeas: ContentIdea[];
}

export interface HistoryItem {
  url: string;
  timestamp: number;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    security?: number;
    da: number;
  };
}

export interface AnalysisState {
  url: string;
  loading: boolean;
  error: string | null;
  results: AuditResult | null;
  insights: AiInsight[] | null;
  research: ResearchResult | null;
  securityInsights: AiInsight[] | null;
}

export type TabType = 'overview' | 'keywords' | 'backlinks' | 'security' | 'research';
