export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  createdAt: string;
  updatedAt?: string;
  interests?: string[];
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
}

export interface DailyAssessment {
  id?: string;
  userId: string;
  partnerId?: string;
  date: string;
  ratings: CategoryRatings;
  comments: string;
  gratitude: string;
  createdAt: string;
  analysis?: RelationshipAnalysis | string;
}

export interface DailyAssessmentWithRatings extends DailyAssessment {
  ratings: {
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
  };
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
  relationshipStatus: 'dating' | 'engaged' | 'married' | 'other';
  livingTogether: boolean;
  hasChildren: boolean;
  previousCounseling: boolean;
  majorLifeEvents?: string[];
  partnerName?: string;
}

export interface AnalysisContent {
  type: 'daily_assessment' | 'consensus_form';
  content: RelationshipAnalysis | ConsensusFormData;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  partnerEmail?: string;
  partnerId?: string;
  relationshipContext?: RelationshipContext;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  dailyReminder: boolean;
  weeklyInsights: boolean;
  partnerActivities: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTime?: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ConsensusFormData {
  id?: string;
  userId: string;
  partnerId: string;
  date: string;
  responses: {
    [key: string]: {
      rating: number;
      notes?: string;
    };
  };
  analysis?: RelationshipAnalysis;
}

export interface CategoryAnalysis {
  score: number;
  partnerScore?: number;
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
}

export interface RelationshipDynamics {
  positivePatterns: string[];
  concerningPatterns: string[];
  growthAreas: string[];
  discrepancyInsights?: string;
}

export interface RelationshipAnalysis {
  overallHealth: {
    score: number;
    trend: string;
  };
  categories: Record<string, any>;
  strengthsAndChallenges: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions: string[];
  actionItems: string[];
  relationshipDynamics: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
  };
  emotionalDynamics: {
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
  emotionalSync?: number;
  moodDiscrepancies?: Array<{
    userMood: MoodEntry['mood'];
    partnerMood: MoodEntry['mood'];
    impact: 'alto' | 'médio' | 'baixo';
    timestamp: string;
  }>;
  insights?: Array<{
    type: 'warning' | 'improvement' | 'info';
    description: string;
    recommendation: string;
  }>;
  riskFactors?: string[];
  recommendations?: string[];
}

export type GPTRelationshipAnalysis = RelationshipAnalysis;

export interface GPTAnalysisContent {
  overallHealth?: { score: number; trend: string };
  strengths?: string[];
  challenges?: string[];
  recommendations?: string[];
  categories?: Record<string, any>;
  relationshipDynamics?: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
  };
  strengthsAndChallenges?: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions?: string[];
  actionItems?: string[];
  textReport?: string;
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
  analysis?: {
    strengthsAndChallenges?: {
      strengths: string[];
      challenges: string[];
    };
    communicationSuggestions?: string[];
    recommendations?: string[];
    actionItems?: string[];
  };
}

export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: GPTAnalysisContent | string;
  createdAt: any;
}

export type MoodType = 
  | 'feliz'
  | 'animado'
  | 'grato'
  | 'calmo'
  | 'satisfeito'
  | 'ansioso'
  | 'estressado'
  | 'triste'
  | 'irritado'
  | 'frustrado'
  | 'exausto'
  | 'esperançoso'
  | 'confuso'
  | 'solitário'
  | 'amado'; 

export interface MoodAnalysis {
  timeframe: 'daily' | 'weekly' | 'monthly';
  patterns: {
    dominantMoods: Array<{
      mood: MoodType;
      frequency: number;
      averageIntensity: number;
    }>;
    moodTransitions: Array<{
      from: MoodType;
      to: MoodType;
      frequency: number;
    }>;
    timePatterns: {
      [key in MoodType]?: {
        morningFrequency: number;
        afternoonFrequency: number;
        eveningFrequency: number;
      };
    };
  };
  correlations: {
    activities: Array<{
      activity: string;
      associatedMoods: Array<{
        mood: MoodType;
        correlation: number; // -1 to 1
      }>;
    }>;
    categories: Array<{
      category: keyof CategoryRatings;
      moodCorrelation: number; // -1 to 1
      significance: number; // 0 to 1
    }>;
    weather?: Array<{
      condition: string;
      moodImpact: number; // -1 to 1
    }>;
  };
  insights: Array<{
    type: 'pattern' | 'trigger' | 'improvement' | 'warning';
    description: string;
    confidence: number; // 0 to 1
    recommendation?: string;
  }>;
  metrics: {
    emotionalVariability: number; // 0 to 1
    positiveNegativeRatio: number;
    recoveryResilience: number; // 0 to 1
    moodStability: number; // 0 to 1
  };
} 

export interface UnifiedAnalysis {
  gptAnalysis: GPTAnalysis | null;
  relationshipAnalysis: RelationshipAnalysis | null;
  moodAnalysis: MoodAnalysis | null;
}

export type DailyAssessmentType = DailyAssessment; 

export interface MoodEntry {
  id?: string;
  userId: string;
  timestamp: string;
  mood: {
    primary: MoodType;
    intensity: number;
    secondary?: MoodType[];
  };
  context?: {
    activities?: string[];
    triggers?: string[];
    location?: string;
    socialContext?: string[];
  };
  correlations?: {
    activities?: Array<{
      activity: string;
      impact: number;
    }>;
    weather?: {
      condition: string;
      impact: number;
    };
    time?: {
      period: string;
      impact: number;
    };
    social?: Array<{
      context: string;
      impact: number;
    }>;
    sleep?: {
      duration: number;
      quality: number;
    };
    exercise?: {
      type: string;
      duration: number;
      intensity: number;
    };
    nutrition?: {
      quality: number;
      meals: number;
    };
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
} 