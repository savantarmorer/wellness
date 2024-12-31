import { RelationshipAnalysis } from '../services/gptService';

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

export interface RelationshipAnalysis {
  summary: string;
  relationshipDynamics: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
  };
  recommendations: string[];
  moodTrend: 'improving' | 'stable' | 'declining';
  communicationQuality: 'strong' | 'moderate' | 'needs_improvement';
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
  actionItems?: string[];
  textReport?: string;
}

export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: GPTAnalysisContent;
  createdAt: any;
} 