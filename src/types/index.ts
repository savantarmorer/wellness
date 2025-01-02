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
  date: string;
  mood: number;
  notes: string;
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
    satisfacaoGeral: number;
  };
}

export interface RelationshipContext {
  relationshipDuration: number;
  relationshipStatus: 'dating' | 'engaged' | 'married' | 'other';
  livingTogether: boolean;
  hasChildren: boolean;
  previousCounseling: boolean;
  majorLifeEvents?: string[];
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
    trend: 'improving' | 'stable' | 'declining';
  };
  categories: Record<string, CategoryAnalysis>;
  strengthsAndChallenges: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions: string[];
  actionItems: string[];
  relationshipDynamics: RelationshipDynamics;
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
  discrepancyAnalysis?: {
    daily?: {
      insights: string[];
      recommendations: string[];
    };
    weekly?: {
      insights: string[];
      recommendations: string[];
      trends: string[];
    };
    monthly?: {
      insights: string[];
      recommendations: string[];
      trends: string[];
      longTermPatterns: string[];
    };
  };
}

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