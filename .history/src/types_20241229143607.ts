export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'combined';
  analysis: {
    overallHealth: number;
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    actionItems: string[];
    categoryAnalysis: {
      [key: string]: {
        score: number;
        trend: string;
        insights: string[];
      };
    };
    relationshipDynamics?: {
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