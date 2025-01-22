import { TemporalAnalysis, EmotionalDynamics, ClinicalSignificance, ValidatedScales, Mood, MoodAnalysis, MoodSynchronyAnalysis, AttachmentAnalysis, Insight, CommunicationPatterns, RelationshipAnalysis } from ".";

export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: {
    moodPatterns: {
      user: {
        dominant: MoodType;
        frequency: Record<MoodType, number>;
        transitions: Record<string, number>;
      };
      partner: {
        dominant: MoodType;
        frequency: Record<MoodType, number>;
        transitions: Record<string, number>;
      };
      overall: {
        synchronicity: number;
        stability: number;
        variability: number;
      };
    };
    communicationMetrics: {
      quality: number;
      frequency: number;
      depth: number;
      patterns: string[];
    };
    relationshipDynamics: {
      strengths: string[];
      challenges: string[];
      recommendations: string[];
    };
    attachmentInsights: {
      style: string;
      behaviors: string[];
      triggers: string[];
      suggestions: string[];
    };
    overallHealth?: {
      score: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    categories?: Record<string, {
      score: number;
      trend: string;
      insights: string[];
      impactScore: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    emotionalDynamics?: EmotionalDynamics;
  };
  timestamp: string;
  version: string;
  metadata: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
  };
  createdAt?: string;
}

export interface ValidatedScalesAnalysis extends ValidatedScales {
  insights: Insight[];
  recommendations: string[];
}

export interface UnifiedAnalysis {
  gptAnalysis: GPTAnalysis;
  relationshipAnalysis?: RelationshipAnalysis;
  moodAnalysis?: MoodAnalysis | MoodSynchronyAnalysis;
  temporalAnalysis: TemporalAnalysis;
  attachmentAnalysis?: AttachmentAnalysis;
  clinicalSignificance: ClinicalSignificance;
  emotionalDynamics: EmotionalDynamics;
  communicationPatterns: CommunicationPatterns;
  dailyInsight: string;
  stage: {
    current: string;
    nextSteps: string[];
    timelineEstimate: string;
  };
  compositeIndex: {
    score: number;
    weights: Record<string, number>;
    breakdown: Record<string, {
      contribution: number;
      significance: number;
    }>;
  };
}

export interface MoodEntry {
  userId: string;
  timestamp: string;
  createdAt: string;
  mood: Mood;
  context: {
    activities: string[];
    triggers: string[];
    location: string;
    socialContext: string[];
    type?: string;
    details?: any;
  };
}

export type MoodType = 
  | 'feliz'
  | 'animado'
  | 'grato'
  | 'calmo'
  | 'satisfeito'
  | 'amado'
  | 'ansioso'
  | 'estressado'
  | 'triste'
  | 'irritado'
  | 'frustrado'
  | 'exausto'
  | 'confuso'
  | 'solitário'
  | 'neutral'
  | 'content'; 