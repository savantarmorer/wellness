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
    strengths: string[];
    challenges: string[];
    recommendations: string[];
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
// ... existing code ...