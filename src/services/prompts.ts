import { DailyAssessment, RelationshipContext, GPTAnalysis } from '../types';

// Core system message - sent once per conversation
export const SYSTEM_PROMPT = `Você é um terapeuta especializado em casais. Forneça análises em JSON seguindo o schema fornecido. Mantenha foco terapêutico e baseie-se em evidências.`;

// For backwards compatibility
export const THERAPIST_SYSTEM_PROMPT = SYSTEM_PROMPT;

// Schema definition - used for validation and documentation
export const ANALYSIS_SCHEMA = {
  overallHealth: { score: "0-100", trend: ["improving", "stable", "concerning"], confidence: "0-1" },
  categories: {
    "[categoria]": { score: "0-10", trend: ["improving", "stable", "concerning"], insights: "string[]", priority: ["high", "medium", "low"] }
  },
  strengthsAndChallenges: { strengths: "string[]", challenges: "string[]" },
  communicationSuggestions: "string[]",
  actionItems: "string[]",
  relationshipDynamics: { strengths: "string[]", challenges: "string[]", recommendations: "string[]" }
};

// For backwards compatibility
export const CONSENSUS_FORM_ANALYSIS_PROMPT = `You are a relationship therapist analyzing a consensus form. Provide analysis in the following JSON structure:
{
  "overallAnalysis": {
    "score": number (0-100),
    "trend": "improving" | "stable" | "declining",
    "summary": string,
    "riskLevel": "low" | "medium" | "high"
  },
  "categoryAnalysis": {
    [category: string]: {
      "score": number (0-100),
      "trend": "improving" | "stable" | "declining",
      "insights": string[],
      "recommendations": string[]
    }
  },
  "progressionAnalysis": {
    "improvements": string[],
    "concerns": string[],
    "trends": {
      [category: string]: {
        "direction": "improving" | "stable" | "declining",
        "significance": "low" | "medium" | "high"
      }
    }
  },
  "therapeuticInsights": {
    "immediateActions": string[],
    "longTermStrategies": string[],
    "underlyingIssues": string[]
  },
  "consistencyAnalysis": {
    "alignedAreas": string[],
    "discrepancies": string[],
    "possibleMotivations": string[]
  },
  "recommendations": {
    "communication": string[],
    "exercises": string[],
    "professionalSupport": string[]
  }
}

Analyze the form data and provide insights based on psychological principles and evidence-based relationship therapy practices. Focus on patterns, trends, and actionable recommendations.`;

export interface HistoricalContext {
  previousAnalyses: GPTAnalysis[];
  recentTrends: {
    category: string;
    trend: string;
    significance: string;
    timestamp: string;
    confidence: number;
  }[];
  interventionEffectiveness: {
    intervention: string;
    outcome: string;
    timestamp: string;
    effectiveness: number;
    followUpNeeded: boolean;
  }[];
  relationshipMetrics: {
    satisfactionTrend: number[];
    communicationQuality: number[];
    emotionalConnection: number[];
    conflictResolution: number[];
    timestamps: string[];
  };
  significantEvents: {
    event: string;
    impact: string;
    date: string;
    resolutionStatus: string;
  }[];
}

export interface CategoryWithInsights {
  score?: number;
  trend?: 'improving' | 'stable' | 'concerning';
  insights?: string[];
  priority?: 'high' | 'medium' | 'low';
  recommendations?: string[];
}

export interface GPTAnalysisContent {
  overallHealth?: {
    score: number;
    trend: string;
  };
  categories?: Record<string, CategoryWithInsights>;
  strengthsAndChallenges?: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions?: string[];
  actionItems?: string[];
  relationshipDynamics?: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
}

const isGPTContent = (val: any): val is GPTAnalysisContent => {
  return (
    typeof val === 'object' && 
    val !== null && 
    (
      ('overallHealth' in val && typeof val.overallHealth === 'object') ||
      ('categories' in val && typeof val.categories === 'object') ||
      ('strengthsAndChallenges' in val && typeof val.strengthsAndChallenges === 'object') ||
      ('relationshipDynamics' in val && typeof val.relationshipDynamics === 'object')
    )
  );
};

const ensureArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  if (value && typeof value === 'string') {
    return [value];
  }
  return [];
};

const analyzeMetricTrend = (values: number[]): { trend: string; value: number; change: number } => {
  if (values.length < 2) return { trend: 'stable', value: values[0] || 0, change: 0 };
  
  const lastValue = values[values.length - 1];
  const previousValue = values[values.length - 2];
  const change = lastValue - previousValue;
  const trend = change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable';
  
  return { trend, value: lastValue, change };
};

const formatHistoricalContext = (context: HistoricalContext): any => {
  return {
    analyses: context.previousAnalyses.map(({date, analysis}) => {
      if (typeof analysis === 'string') return { date, summary: analysis };
      
      const analysisContent = analysis as unknown as GPTAnalysisContent;
      if (isGPTContent(analysisContent)) {
        return {
          date,
          health: {
            score: analysisContent.overallHealth?.score,
            trend: analysisContent.overallHealth?.trend
          },
          insights: analysisContent.categories ? 
            Object.values(analysisContent.categories)
              .map(cat => cat.insights || [])
              .flat()
              .slice(0, 3) : []
        };
      }
      return { date, summary: 'formato não suportado' };
    }),
    trends: context.recentTrends.map(t => ({
      cat: t.category,
      trend: t.trend,
      sig: t.significance,
      conf: t.confidence
    })),
    interventions: context.interventionEffectiveness.map(i => ({
      int: i.intervention,
      out: i.outcome,
      eff: i.effectiveness
    })),
    metrics: {
      satisfaction: analyzeMetricTrend(context.relationshipMetrics.satisfactionTrend),
      communication: analyzeMetricTrend(context.relationshipMetrics.communicationQuality),
      emotional: analyzeMetricTrend(context.relationshipMetrics.emotionalConnection),
      conflict: analyzeMetricTrend(context.relationshipMetrics.conflictResolution)
    },
    events: context.significantEvents.map(e => ({
      date: e.date,
      event: e.event,
      impact: e.impact,
      status: e.resolutionStatus
    }))
  };
};

export const generateAnalysisPrompt = (
  assessment: DailyAssessment,
  relationshipContext?: RelationshipContext,
  historicalContext?: HistoricalContext
): string => {
  const data = {
    schema: ANALYSIS_SCHEMA,
    assessment: {
      ratings: assessment.ratings,
      ...(assessment.metadata?.description && { comments: assessment.metadata.description }),
      ...(assessment.metadata?.category === 'gratitude' && { gratitude: assessment.metadata.description })
    },
    context: relationshipContext && {
      duration: relationshipContext.duration,
      status: relationshipContext.status,
      type: relationshipContext.type,
      goals: ensureArray(relationshipContext.goals),
      challenges: ensureArray(relationshipContext.challenges),
      values: ensureArray(relationshipContext.values),
      dynamics: relationshipContext.currentDynamics,
      strengths: ensureArray(relationshipContext.strengths),
      emotional: {
        user: relationshipContext.userEmotionalState,
        partner: relationshipContext.partnerEmotionalState
      },
      crises: relationshipContext.hadSignificantCrises ? relationshipContext.crisisDescription : null,
      solutions: relationshipContext.attemptedSolutions ? relationshipContext.solutionsDescription : null,
      routine: relationshipContext.routineImpact,
      intimacy: relationshipContext.physicalIntimacy
    },
    history: historicalContext && formatHistoricalContext(historicalContext)
  };

  return JSON.stringify(data);
};

export const generateAnalysisSummaryPrompt = (
  historicalContext: HistoricalContext,
  timeframe: 'weekly' | 'monthly' | 'quarterly'
): string => {
  return JSON.stringify({
    timeframe,
    history: formatHistoricalContext(historicalContext),
    schema: {
      trends: "string[]",
      effectiveness: "string[]",
      progress: "string[]",
      adjustments: "string[]",
      objectives: "string[]",
      patterns: "string[]"
    }
  });
};

// For backwards compatibility
export const generateDailyInsightPrompt = generateAnalysisPrompt; 