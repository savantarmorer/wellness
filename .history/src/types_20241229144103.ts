export interface CategoryAnalysis {
  score: number;
  trend: string;
  insights: string[];
}

export interface AnalysisData {
  overallHealth: number;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  actionItems: string[];
  categoryAnalysis: Record<string, CategoryAnalysis>;
  relationshipDynamics?: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
  };
}

export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'combined';
  analysis: AnalysisData;
  createdAt: string;
}

export interface AnalysisHistoryItem {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'combined';
  analysis: AnalysisData;
  userAssessmentId?: string;
  partnerAssessmentId?: string;
  assessmentId?: string;
  insight?: string;
  createdAt: string;
} 