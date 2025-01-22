import { v4 as uuidv4 } from 'uuid';
import type { 
  MoodEntry, 
  MoodType, 
  MoodDiscrepancy, 
  RelationshipContext, 
  Insight, 
  ValidatedScales, 
  GPTAnalysis, 
  DailyAssessment, 
  ConsensusFormData,
  ValidationResult,
  CategoryRatings
} from '../types';
import { POSITIVE_MOODS, NEGATIVE_MOODS } from './moodConstants';
import { calculateOverallSatisfaction, crossValidateAssessments, CATEGORY_WEIGHTS } from './analysisUtils';
import type { MoodAnalysisConfig } from '../types/config';
import moodConfig from '../config/moodAnalysis.json';

// Import core functions from calculosRelacionamento
import {
  calculateEmotionalSync,
  calculateMoodStability,
  calculateEmotionalStability,
  calculateCommunicationQuality,
  calculateEmotionalSecurity,
  EMOTIONAL_SYNC_THRESHOLD,
  NEGATIVE_AFFECT_THRESHOLD,
  compatiblePairs
} from './calculos/calculosRelacionamento';

// Import utility functions from calculosRelacionamento2
import {
  calculateIndividualStability,
  determineAdaptiveTimeWindow,
  calculateResponseTimeGaps,
  isCompatibleMoodPair,
  calculateValenceScore,
  areMoodsSynchronous,
  calculateMoodVolatility,
  calculatePatternConsistency,
  calculateFrequencyCorrelation,
  calculateDataConsistency,
  calculateTimingConsistency
} from './calculos/calculosRelacionamento2';

// Import base utility functions
import {
  calculateMoodMatchScore,
  calculateTimeDecay,
  findClosestEntry,
  hasSharedContext,
  calculateMoodPatterns
} from './calculos/calculosBase';

// Import analysis functions from calculosRelacionamento3
import {
  determineEmotionalTrend,
  generateEmotionalInsights,
  calculateIntimacyBalance,
  calculateOverallEmotionalHealth,
  analyzeDominantMoods,
  calculateConfidenceScore,
  createDefaultRelationshipContext
} from './calculos/calculosRelacionamento3';

// Import createDefaultRelationshipAnalysis from Analysis page
import { createDefaultRelationshipAnalysis } from '../pages/Analysis';

// Re-export core functions
export {
  calculateEmotionalSync,
  calculateMoodStability,
  calculateEmotionalStability,
  calculateCommunicationQuality,
  calculateEmotionalSecurity,
  EMOTIONAL_SYNC_THRESHOLD,
  NEGATIVE_AFFECT_THRESHOLD,
  compatiblePairs,
  createDefaultRelationshipContext,
  calculateOverallEmotionalHealth,
  calculateMoodPatterns
};

interface RelationshipAnalysis {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: 'individual' | 'collective';
  overallHealth: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
  };
  categories: Record<string, {
    score: number;
    trend: string;
    insights: string[];
    impactScore: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  strengthsAndChallenges: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions: string[];
  actionItems: string[];
  relationshipDynamics: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
  emotionalDynamics: {
    synchronicity: number;
    stability: number;
    emotionalSecurity: number;
    intimacyBalance: {
      overall: number;
      areas: {
        emotional: number;
        physical: number;
        shared: number;
      };
    };
    conflictResolution: {
      style: string;
      effectiveness: number;
      patterns: string[];
      confidence: number;
    };
    patterns: {
      user: {
        dominant: MoodType;
        frequency: Record<MoodType, number>;
        transitions: { from: MoodType; to: MoodType; }[];
        alignedWithPartner: boolean;
      };
      partner: {
        dominant: MoodType;
        frequency: Record<MoodType, number>;
        transitions: { from: MoodType; to: MoodType; }[];
        alignedWithPartner: boolean;
      };
    };
    insights: {
      strengths: string[];
      challenges: string[];
      recommendations: string[];
    };
  };
  emotionalSync: number;
  moodDiscrepancies: MoodDiscrepancy[];
  insights: string[];
  riskFactors: string[];
  recommendations: string[];
  validatedScales: ValidatedScales;
  gptAnalysis: GPTAnalysis;
  metadata: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
    lastUpdate: string;
  };
}

// Load configurations with type assertion
const moodAnalysisConfig = moodConfig as unknown as MoodAnalysisConfig;

// Constants for analysis
const MOOD_CATEGORIES = moodAnalysisConfig.moodCategories;
const CATEGORY_SIMILARITY = moodAnalysisConfig.categorySimilarity;
const ANALYSIS_CONFIG = moodAnalysisConfig.analysis;

// Constants for insights
const DEFAULT_INSIGHT_CONFIDENCE = 0.8;
const DEFAULT_INSIGHT_IMPACT = 'medium' as const;
const MIN_ENTRIES_FOR_ANALYSIS = 2;

// Helper functions
export const generateCategoryInsights = (description: string, category: string, type: 'pattern' | 'observation' | 'recommendation' | 'warning'): Insight => ({
  id: uuidv4(),
  type,
  category,
  description,
  confidence: DEFAULT_INSIGHT_CONFIDENCE,
  impact: DEFAULT_INSIGHT_IMPACT,
  timestamp: new Date().toISOString()
});

// Types for emotional synchronicity calculation
export interface EmotionalSyncEntry extends MoodEntry {
  id: string;
  userId: string;
  createdAt: any;
}

// Hungarian Algorithm implementation
const hungarianAlgorithm = (costMatrix: number[][]): [number, number][] => {
  // Implementation of Hungarian Algorithm
  // Returns array of [row, col] pairs representing optimal assignments
  // This is a simplified version - you might want to use a library for production
  
  const n = Math.max(costMatrix.length, costMatrix[0]?.length || 0);
  const m = new Array(n).fill(0).map(() => new Array(n).fill(0));
  
  // Copy and pad the cost matrix if necessary
  for (let i = 0; i < costMatrix.length; i++) {
    for (let j = 0; j < costMatrix[0].length; j++) {
      m[i][j] = costMatrix[i][j];
    }
  }
  
  // Step 1: Subtract row minima
  for (let i = 0; i < n; i++) {
    const minVal = Math.min(...m[i]);
    for (let j = 0; j < n; j++) {
      m[i][j] -= minVal;
    }
  }
  
  // Step 2: Subtract column minima
  for (let j = 0; j < n; j++) {
    const minVal = Math.min(...m.map(row => row[j]));
    for (let i = 0; i < n; i++) {
      m[i][j] -= minVal;
    }
  }
  
  // Find a minimal set of lines to cover all zeros
  const matches: [number, number][] = [];
  const used = new Set<number>();
  
  // Greedy matching (simplified)
  for (let i = 0; i < costMatrix.length; i++) {
    let minVal = Infinity;
    let minJ = -1;
    
    for (let j = 0; j < costMatrix[0].length; j++) {
      if (!used.has(j) && m[i][j] < minVal) {
        minVal = m[i][j];
        minJ = j;
      }
    }
    
    if (minJ !== -1) {
      matches.push([i, minJ]);
      used.add(minJ);
    }
  }
  
  return matches;
};

export const analyzeRelationshipEmotions = async (
  userMoods: MoodEntry[],
  partnerMoods: MoodEntry[],
  context: RelationshipContext,
  validatedScales: ValidatedScales,
  gptAnalysis: GPTAnalysis,
  consensusForm: ConsensusFormData
): Promise<RelationshipAnalysis> => {
  // Error handling for empty mood arrays
 
  // Generate mood patterns
  const patterns = generateMoodPatterns(userMoods, partnerMoods);
  console.log('[Analysis] Generated mood patterns:', patterns);

  // Calculate confidence score first as it affects all metrics
  let confidenceScore = calculateConfidenceScore(userMoods, partnerMoods);
  console.log('[Analysis] Calculated confidence score:', confidenceScore);

  // Calculate synchronicity first as it's used in multiple places
  const synchronicity = calculateEmotionalSync(userMoods, partnerMoods);
  console.log('[Analysis] Calculated synchronicity:', synchronicity);

  // Calculate stability
  const stability = calculateEmotionalStability(userMoods, partnerMoods);
  console.log('[Analysis] Calculated stability:', stability);

  // Calculate communication quality
  const communicationQuality = calculateCommunicationQuality(userMoods, partnerMoods);
  console.log('[Analysis] Calculated communication quality:', communicationQuality);

  // Calculate emotional security using synchronicity and mood alignment
  const emotionalSecurity = calculateEmotionalSecurity(userMoods, partnerMoods);
  console.log('[Analysis] Calculated emotional security:', emotionalSecurity);

  // Calculate intimacy balance
  const intimacyBalance = calculateIntimacyBalance(userMoods, partnerMoods);
  console.log('[Analysis] Calculated intimacy balance:', intimacyBalance);

  // Calculate daily assessment
  const dailyAssessment: DailyAssessment = {
    id: '',
    userId: context.userId || '',
    partnerId: context.partnerId || '',
    timestamp: new Date().toISOString(),
    date: new Date().toISOString(),
    type: 'individual',
    createdAt: new Date().toISOString(),
    emotionalSecurity: emotionalSecurity * 7,
    intimacy: intimacyBalance.overall * 7,
    communication: communicationQuality * 7,
    trust: (synchronicity + emotionalSecurity) / 2 * 7,
    ratings: {
      satisfacaoGeral: (synchronicity + emotionalSecurity + stability) / 3 * 7,
      alinhamentoObjetivos: intimacyBalance.areas.shared * 7,
      conexaoEmocional: synchronicity * 7,
      apoioMutuo: intimacyBalance.areas.emotional * 7,
      segurancaRelacionamento: emotionalSecurity * 7,
      comunicacao: communicationQuality * 7,
      intimidade: intimacyBalance.overall * 7,
      resolucaoConflitos: stability * 7,
      intimidadeFisica: intimacyBalance.areas.physical * 7,
      transparenciaConfianca: (synchronicity + emotionalSecurity) / 2 * 7,
      saudeMental: stability * 7,
      autocuidado: stability * 7,
      gratidao: (synchronicity + emotionalSecurity) / 2 * 7,
      qualidadeTempo: intimacyBalance.areas.shared * 7
    },
    mood: {
      primary: 'neutral',
      intensity: 5,
      notes: ''
    },
    validatedScales,
    context: {
      communication: {
        hadMeaningfulTalk: false,
        feltUnderstood: false,
        topics: [] as Array<'daily' | 'future' | 'feelings' | 'concerns' | 'dreams' | 'other'>,
        quality: 0
      },
      conflict: {
        hadConflict: false,
        resolvedSameDay: false,
        impactOnMood: 0
      },
      support: {
        neededSupport: false,
        receivedSupport: false,
        supportType: [] as Array<'emotional' | 'practical' | 'informational'>
      },
      activities: {
        didActivity: false,
        type: [] as Array<'lazer' | 'tarefas' | 'conversa' | 'refeição' | 'outro'>,
        enjoyment: 0
      },
      crisis: {
        hadSignificantCrises: false,
        crisisType: 'communication',
        attemptedSolutions: false,
        solutionType: [],
        impactLevel: 'low',
        resolutionStatus: 'unresolved'
      }
    }
  };

  // Validate assessment data
  const validationResult = crossValidateAssessments([dailyAssessment], consensusForm, context);
  if (Object.keys(validationResult.consistency).length > 0) {
    console.log('[Analysis] Validation consistency issues found:', validationResult.consistency);
    // Adjust confidence score based on validation results
    const avgConsistencyScore = Object.values(validationResult.consistency)
      .reduce((sum, cat) => sum + cat.score, 0) / Object.keys(validationResult.consistency).length;
    confidenceScore *= avgConsistencyScore;
  }

  const satisfaction = calculateOverallSatisfaction(dailyAssessment);
  console.log('[Analysis] Calculated satisfaction:', satisfaction);

  // Generate insights using the sophisticated generateEmotionalInsights function
  const emotionalInsights = generateEmotionalInsights(userMoods, partnerMoods, {
    synchronicity,
    stability,
    communicationQuality,
    satisfaction
  });

  // Analyze conflict patterns
  const conflictAnalysis = analyzeConflictPatterns(userMoods, partnerMoods);
  console.log('[Analysis] Conflict patterns:', conflictAnalysis);

  // Generate emotional dynamics with the new insights
  const emotionalDynamics = {
    synchronicity,
    stability,
    emotionalSecurity,
    intimacyBalance: {
      overall: intimacyBalance.overall,
      areas: {
        emotional: intimacyBalance.areas.emotional,
        physical: intimacyBalance.areas.physical,
        shared: intimacyBalance.areas.shared
      }
    },
    conflictResolution: {
      style: conflictAnalysis.style,
      effectiveness: conflictAnalysis.effectiveness,
      patterns: conflictAnalysis.patterns,
      confidence: conflictAnalysis.confidence
    },
    patterns,
    insights: {
      strengths: emotionalInsights.strengths,
      challenges: emotionalInsights.challenges,
      recommendations: emotionalInsights.recommendations
    }
  };

  // Prepare final analysis with the new insights
  const analysis: RelationshipAnalysis = {
    id: uuidv4(),
    userId: context.userId || '',
    partnerId: context.partnerId || '',
    date: new Date().toISOString(),
    type: 'individual',
    overallHealth: {
      score: Math.round(satisfaction * 100),
      trend: determineEmotionalTrend(userMoods, partnerMoods),
      confidence: confidenceScore
    },
    categories: {
      synchronicity: {
        score: Math.round(synchronicity * 100),
        trend: determineEmotionalTrend(userMoods, partnerMoods),
        insights: emotionalInsights.strengths.filter(s => s.includes('sincronia')),
        impactScore: synchronicity,
        priority: synchronicity < 0.5 ? 'high' : synchronicity < 0.7 ? 'medium' : 'low'
      },
      communication: {
        score: Math.round(communicationQuality * 100),
        trend: 'stable',
        insights: emotionalInsights.strengths.filter(s => s.includes('comunicação')),
        impactScore: communicationQuality,
        priority: communicationQuality < 0.5 ? 'high' : communicationQuality < 0.7 ? 'medium' : 'low'
      },
      stability: {
        score: Math.round(stability * 100),
        trend: 'stable',
        insights: emotionalInsights.strengths.filter(s => s.includes('estabilidade')),
        impactScore: stability,
        priority: stability < 0.5 ? 'high' : stability < 0.7 ? 'medium' : 'low'
      }
    },
    strengthsAndChallenges: {
      strengths: emotionalInsights.strengths,
      challenges: emotionalInsights.challenges
    },
    communicationSuggestions: emotionalInsights.recommendations,
    actionItems: emotionalInsights.recommendations,
    relationshipDynamics: {
      strengths: emotionalInsights.strengths,
      challenges: emotionalInsights.challenges,
      recommendations: emotionalInsights.recommendations
    },
    emotionalDynamics,
    emotionalSync: synchronicity,
    moodDiscrepancies: [],
    insights: [...emotionalInsights.strengths, ...emotionalInsights.challenges],
    riskFactors: emotionalInsights.challenges.filter(c => c.includes('risco')),
    recommendations: emotionalInsights.recommendations,
    validatedScales,
    gptAnalysis,
    metadata: {
      assessmentCount: userMoods.length + partnerMoods.length,
      timeSpan: '24h',
      confidence: confidenceScore,
      lastUpdate: new Date().toISOString()
    }
  };

  return analysis;
};

export const initializeMoodFrequency = (): Record<MoodType, number> => ({
  feliz: 0,
  animado: 0,
  grato: 0,
  calmo: 0,
  satisfeito: 0,
  amado: 0,
  ansioso: 0,
  estressado: 0,
  triste: 0,
  irritado: 0,
  frustrado: 0,
  exausto: 0,
  confuso: 0,
  solitário: 0,
  neutral: 0,
  content: 0
});

const calculateSyncScore = (userMood: MoodEntry['mood'], partnerMood: MoodEntry['mood']): number => {
  // Base sync on mood matching
  const moodMatch = areMoodsSynchronous(userMood.primary, partnerMood.primary) ? 1 : 0;
  
  // Intensity matching (if both have intensity values)
  let intensityMatch = 1;
  if (userMood.intensity !== undefined && partnerMood.intensity !== undefined) {
    const intensityDiff = Math.abs(userMood.intensity - partnerMood.intensity);
    intensityMatch = 1 - (intensityDiff / 4); // Normalize to 0-1
  }
  
  // Weight mood matching more heavily than intensity
  return (moodMatch * 0.7) + (intensityMatch * 0.3);
};

export const calculateEmotionalSynchronicity = (userEntries: EmotionalSyncEntry[], partnerEntries: EmotionalSyncEntry[]): number => {
  if (!userEntries.length || !partnerEntries.length) return 0;

  // Create cost matrix for Hungarian Algorithm
  const costMatrix: number[][] = [];
  const timeWindows: number[] = [];
  
  userEntries.forEach((userEntry, userIdx) => {
    const timeWindow = determineAdaptiveTimeWindow(userEntry, partnerEntries);
    timeWindows.push(timeWindow);
    
    const row: number[] = [];
    partnerEntries.forEach((partnerEntry, partnerIdx) => {
      const timeDiff = Math.abs(
        new Date(partnerEntry.timestamp).getTime() - 
        new Date(userEntry.timestamp).getTime()
      );
      
      if (timeDiff <= timeWindow) {
        const syncScore = calculateSyncScore(userEntry.mood, partnerEntry.mood);
        const timeWeight = calculateTimeDecay(userEntry.timestamp, partnerEntry.timestamp);
        const cost = 1 - (syncScore * timeWeight); // Convert to cost (1 - score)
        row.push(cost);
        console.log(`[EmotionalSync] Match details for user entry ${userIdx} and partner entry ${partnerIdx}:`, {
          userMood: userEntry.mood.primary,
          partnerMood: partnerEntry.mood.primary,
          timeDiff: Math.round(timeDiff / (1000 * 60)), // Convert to minutes
          timeWindow: Math.round(timeWindow / (1000 * 60)), // Convert to minutes
          syncScore,
          timeWeight,
          cost
        });
      } else {
        row.push(1); // Maximum cost for entries outside time window
        console.log(`[EmotionalSync] Entry outside time window for user entry ${userIdx} and partner entry ${partnerIdx}:`, {
          timeDiff: Math.round(timeDiff / (1000 * 60)), // Convert to minutes
          timeWindow: Math.round(timeWindow / (1000 * 60)) // Convert to minutes
        });
      }
    });
    costMatrix.push(row);
  });

  console.log('[EmotionalSync] Cost Matrix:', costMatrix);

  // Apply Hungarian Algorithm
  const matches = hungarianAlgorithm(costMatrix);
  console.log('[EmotionalSync] Matches from Hungarian Algorithm:', matches);
  
  // Calculate final synchronicity score
  let totalScore = 0;
  let totalWeight = 0;
  
  matches.forEach(([userIdx, partnerIdx]) => {
    const timeDiff = Math.abs(
      new Date(partnerEntries[partnerIdx].timestamp).getTime() - 
      new Date(userEntries[userIdx].timestamp).getTime()
    );
    
    if (timeDiff <= timeWindows[userIdx]) {
      const syncScore = calculateMoodMatchScore(
        userEntries[userIdx].mood,
        partnerEntries[partnerIdx].mood
      );
      const timeWeight = calculateTimeDecay(
        userEntries[userIdx].timestamp,
        partnerEntries[partnerIdx].timestamp
      );
      
      totalScore += syncScore * timeWeight;
      totalWeight += timeWeight;

      console.log(`[EmotionalSync] Match score for pair ${userIdx}-${partnerIdx}:`, {
        userMood: userEntries[userIdx].mood.primary,
        partnerMood: partnerEntries[partnerIdx].mood.primary,
        syncScore,
        timeWeight,
        contribution: syncScore * timeWeight
      });
    }
  });

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  console.log('[EmotionalSync] Final calculation:', {
    totalScore,
    totalWeight,
    finalScore: Math.min(1, Math.max(0, finalScore))
  });
  
  return Math.min(1, Math.max(0, finalScore));
};

const analyzeConflictPatterns = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): {
  style: string;
  effectiveness: number;
  patterns: string[];
  confidence: number;
} => {
  const negativeTransitions = detectNegativeTransitions(userEntries, partnerEntries);
  const recoveryPatterns = detectRecoveryPatterns(userEntries, partnerEntries);

  const style = determineConflictStyle(negativeTransitions, recoveryPatterns);
  const effectiveness = calculateConflictEffectiveness(negativeTransitions, recoveryPatterns);

  return {
    style,
    effectiveness,
    patterns: [...negativeTransitions, ...recoveryPatterns],
    confidence: 0.8
  };
};

const detectNegativeTransitions = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): string[] => {
  const transitions: string[] = [];

  const detectTransitions = (entries: MoodEntry[]) => {
    for (let i = 1; i < entries.length; i++) {
      const prevMood = entries[i-1].mood.primary;
      const currentMood = entries[i].mood.primary;
      if (!NEGATIVE_MOODS.includes(prevMood) && NEGATIVE_MOODS.includes(currentMood)) {
        transitions.push(`${prevMood} → ${currentMood}`);
      }
    }
  };

  detectTransitions(userEntries);
  detectTransitions(partnerEntries);

  return [...new Set(transitions)];
};

const detectRecoveryPatterns = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): string[] => {
  const patterns: string[] = [];

  const detectPatterns = (entries: MoodEntry[]) => {
    for (let i = 1; i < entries.length; i++) {
      const prevMood = entries[i-1].mood.primary;
      const currentMood = entries[i].mood.primary;
      if (NEGATIVE_MOODS.includes(prevMood) && POSITIVE_MOODS.includes(currentMood)) {
        patterns.push(`${prevMood} → ${currentMood}`);
      }
    }
  };

  detectPatterns(userEntries);
  detectPatterns(partnerEntries);

  return [...new Set(patterns)];
};

const determineConflictStyle = (negativeTransitions: string[], recoveryPatterns: string[]): string => {
  const negativeRatio = negativeTransitions.length / (negativeTransitions.length + recoveryPatterns.length);
  
  if (negativeRatio > 0.7) return 'confrontational';
  if (negativeRatio > 0.4) return 'mixed';
  return 'collaborative';
};

const calculateConflictEffectiveness = (negativeTransitions: string[], recoveryPatterns: string[]): number => {
  if (negativeTransitions.length === 0 && recoveryPatterns.length === 0) return 3;
  
  const totalPatterns = negativeTransitions.length + recoveryPatterns.length;
  const recoveryRatio = recoveryPatterns.length / totalPatterns;
  
  return Math.min(5, Math.max(1, recoveryRatio * 5));
};

interface InteractionContext {
  // Conflict tracking
  conflict: {
    hadConflict: boolean;
    resolvedSameDay?: boolean;
    impactOnMood?: 'none' | 'slight' | 'moderate' | 'significant';
  };
  
  // Shared activities
  activities: string[];
  sharedActivities?: {
    didActivity: boolean;
    type?: Array<'lazer' | 'tarefas' | 'conversa' | 'refeição' | 'outro'>;
    enjoyment?: 'low' | 'medium' | 'high';
    list?: string[];
  };
  
  // Basic context
  triggers: string[];
  location: string;
  socialContext: string[];
  intensity: number;
  duration?: number;
  notes?: string;
  
  // Communication
  communication: {
    hadMeaningfulTalk: boolean;
    feltUnderstood?: boolean;
    topics?: Array<'daily' | 'future' | 'feelings' | 'concerns' | 'dreams' | 'other'>;
  };
  
  // Support exchange
  support: {
    neededSupport: boolean;
    receivedSupport?: boolean;
    supportType?: Array<'emotional' | 'practical' | 'informational'>;
  };
}

// Import base type with a different name
import type { MoodEntry as BaseMoodEntry } from '../types/index';

// Extend with our context
export type AnalysisMoodEntry = BaseMoodEntry & {
  context?: InteractionContext;
};

// Helper function to convert base entry to analysis entry
const toAnalysisMoodEntry = (entry: BaseMoodEntry): AnalysisMoodEntry => {
  return {
    ...entry,
    context: entry.context ? {
      ...entry.context,
      conflict: { hadConflict: false },
      communication: { hadMeaningfulTalk: false },
      support: { neededSupport: false }
    } : undefined
  };
};

const isSupportiveResponse = (userMood: { primary: MoodType; intensity: number }, partnerMood: { primary: MoodType; intensity: number }): boolean => {
  return compatiblePairs[userMood.primary]?.includes(partnerMood.primary) || false;
};

const calculateMoodSimilarity = (mood1: MoodType, mood2: MoodType): number => {
  if (mood1 === mood2) return 1;
  if (compatiblePairs[mood1]?.includes(mood2)) return 0.5;
  return 0;
}; 

const generateMoodPatterns = (userMoods: MoodEntry[], partnerMoods: MoodEntry[]) => {
  const moodFrequency = initializeMoodFrequency();
  const userMoodFrequency = { ...moodFrequency };
  const partnerMoodFrequency = { ...moodFrequency };

  // Update frequencies
  userMoods.forEach((entry: MoodEntry) => {
    userMoodFrequency[entry.mood.primary]++;
  });

  partnerMoods.forEach((entry: MoodEntry) => {
    partnerMoodFrequency[entry.mood.primary]++;
  });

  // Calculate transitions
  const userTransitions = userMoods.slice(1).map((entry: MoodEntry, i: number) => ({
    from: userMoods[i].mood.primary,
    to: entry.mood.primary
  }));

  const partnerTransitions = partnerMoods.slice(1).map((entry: MoodEntry, i: number) => ({
    from: partnerMoods[i].mood.primary,
    to: entry.mood.primary
  }));

  const userDominant = Object.entries(userMoodFrequency)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0] as MoodType;
  
  const partnerDominant = Object.entries(partnerMoodFrequency)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0] as MoodType;

  const areMoodsAligned = areMoodsSynchronous(userDominant, partnerDominant);

  return {
    user: {
      dominant: userDominant,
      frequency: userMoodFrequency,
      transitions: userTransitions,
      alignedWithPartner: areMoodsAligned
    },
    partner: {
      dominant: partnerDominant,
      frequency: partnerMoodFrequency,
      transitions: partnerTransitions,
      alignedWithPartner: areMoodsAligned
    }
  };
}; 