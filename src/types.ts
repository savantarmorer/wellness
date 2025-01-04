export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: {
    overallHealth: {
      score: number;
      trend: string;
    };
    strengths?: string[];
    challenges?: string[];
    recommendations?: string[];
    strengthsAndChallenges?: {
      strengths: string[];
      challenges: string[];
    };
    communicationSuggestions?: string[];
    actionItems: string[];
    categories: Record<string, {
      score: number;
      trend: string;
      insights: string[];
    }>;
    relationshipDynamics: {
      positivePatterns: string[];
      concerningPatterns: string[];
      growthAreas: string[];
    };
    emotionalDynamics?: {
      emotionalSecurity: number;
      intimacyBalance: {
        score: number;
        areas: {
          emotional: number;
          physical: number;
          intellectual: number;
          shared: number;
        };
      };
      conflictResolution: {
        style: string;
        effectiveness: number;
        patterns: string[];
      };
    };
    textReport?: string;
  };
  createdAt: string;
}

export interface AnalysisHistoryItem {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'combined';
  analysis: any;
  userAssessmentId?: string;
  partnerAssessmentId?: string;
  assessmentId?: string;
  insight?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryRatings {
  comunicacao: number;
  conexaoEmocional: number;
  apoioMutuo: number;
  transparenciaConfianca: number;
  intimidadeFisica: number;
  saudeMental: number;
  resolucaoConflitos: number;
  segurancaRelacionamento: number;
  alinhamentoObjetivos: number;
  satisfacaoGeral: number;
  autocuidado: number;
  gratidao: number;
  qualidadeTempo: number;
  [key: string]: number;
}

export interface DailyAssessment {
  id?: string;
  userId: string;
  date: string;
  ratings: CategoryRatings;
  comments?: string;
  partnerId?: string;
  gratitude?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyAssessmentWithRatings extends DailyAssessment {
  ratings: CategoryRatings;
}

export interface RelationshipContext {
  id: string;
  userId: string;
  partnerId: string;
  duration: string;
  status: string;
  type: string;
  goals: string[];
  challenges: string[];
  values: string[];
  relationshipDuration: string;
  relationshipStyle: string;
  relationshipStyleOther: string;
  currentDynamics: string;
  strengths: string;
  areasNeedingAttention: {
    comunicacao: boolean;
    confianca: boolean;
    intimidade: boolean;
    resolucaoConflitos: boolean;
    apoioEmocional: boolean;
    outros: boolean;
  };
  areasNeedingAttentionOther: string;
  recurringProblems: string;
  appGoals: string;
  hadSignificantCrises: boolean;
  crisisDescription: string;
  attemptedSolutions: boolean;
  solutionsDescription: string;
  userEmotionalState: string;
  partnerEmotionalState: string;
  timeSpentTogether: string;
  qualityTime: boolean;
  qualityTimeDescription: string;
  routineImpact: string;
  physicalIntimacy: string;
  intimacyImprovements: string;
  additionalInfo: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RelationshipContextFormData extends Omit<RelationshipContext, 'id' | 'userId' | 'partnerId' | 'createdAt' | 'updatedAt'> {}

export interface TemporalAnalysis {
  trends: {
    [category: string]: {
      userTrend: 'improving' | 'stable' | 'declining';
      partnerTrend: 'improving' | 'stable' | 'declining';
      convergence: 'converging' | 'stable' | 'diverging';
      volatility: number;
    };
  };
  patterns: {
    cyclical: string[];
    persistent: string[];
    emerging: string[];
  };
  timeframes: {
    daily: AnalysisSummary;
    weekly: AnalysisSummary;
    monthly: AnalysisSummary;
  };
}

export interface AnalysisSummary {
  averageScores: CategoryRatings;
  discrepancies: DiscrepancyAnalysis[];
  insights: string[];
}

export interface ValidationResult {
  consistency: {
    [category: string]: {
      score: number; // 0-1
      confidence: number; // 0-1
      flags: string[];
    };
  };
  reliability: number; // 0-1
  completeness: number; // 0-1
  recommendations: string[];
}

export interface CommunicationRecord {
  date: string;
  type: 'daily' | 'consensus' | 'discussion';
  content: {
    topics: string[];
    quality: number; // 1-5
    resolution: number; // 1-5
    emotionalTone: number; // 1-5
  };
  participants: {
    user: boolean;
    partner: boolean;
  };
}

export interface CommunicationQualityAnalysis {
  overall: {
    score: number;
    trend: string;
    patterns: string[];
  };
  byTopic: {
    [topic: string]: {
      frequency: number;
      quality: number;
      resolution: number;
      emotionalTone: number;
    };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface DiscrepancyAnalysis {
  category: string;
  userScore: number;
  partnerScore: number;
  difference: number;
  weightedDifference: number;
  significance: 'high' | 'medium' | 'low';
  insights: string[];
  recommendations: string[];
}