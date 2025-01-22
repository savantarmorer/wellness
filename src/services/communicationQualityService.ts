import { 
  DailyAssessment, 
  MoodEntry, 
  type CommunicationPatterns,
  CommunicationQualityAnalysis,
  RelationshipContext
} from '../types';

import { analyzeCommunicationPatterns } from './communicationService';
import { calculateCommunicationQuality } from './relationshipAnalysisService';
import { 
  analyzeCommunicationQuality,
  calculateWeightedDifference,
  calculateOverallCommunicationScore
} from './analysisUtils';
import { calculateEmotionalSync } from './calculos/calculosRelacionamento';

interface CommunicationQualityMetrics {
  overallScore: number;
  contextualScore: number;
  patternScore: number;
  moodImpact: number;
  confidence: number;
}

export const calculateComprehensiveCommunicationQuality = async (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  userMoodHistory: MoodEntry[],
  partnerMoodHistory: MoodEntry[],
  relationshipContext: RelationshipContext
): Promise<CommunicationQualityMetrics> => {
  // 1. Base Communication Quality (30%)
  const baseQuality = calculateBaseCommunicationQuality(userAssessment, partnerAssessment);

  // 2. Context-Aware Quality (25%)
  const contextQuality = calculateContextualQuality(
    userAssessment,
    partnerAssessment,
    relationshipContext
  );

  // 3. Pattern-Based Quality (25%)
  const patternQuality = await calculatePatternQuality(
    userAssessment,
    partnerAssessment,
    userMoodHistory,
    partnerMoodHistory
  );

  // 4. Mood Impact (20%)
  const moodImpact = calculateMoodImpact(userMoodHistory, partnerMoodHistory);

  // Calculate confidence level
  const confidence = calculateConfidenceLevel(
    baseQuality,
    contextQuality,
    patternQuality,
    moodImpact
  );

  // Combine all metrics with their respective weights
  const overallScore = (
    (baseQuality * 0.3) +
    (contextQuality * 0.25) +
    (patternQuality * 0.25) +
    (moodImpact * 0.2)
  );

  return {
    overallScore: normalizeScore(overallScore),
    contextualScore: normalizeScore(contextQuality),
    patternScore: normalizeScore(patternQuality),
    moodImpact: normalizeScore(moodImpact),
    confidence
  };
};

const calculateBaseCommunicationQuality = (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment
): number => {
  // Check if we have valid assessments
  if (!userAssessment?.ratings || !partnerAssessment?.ratings) {
    return 0;
  }

  // Calculate overall communication score
  const overallScore = calculateOverallCommunicationScore([{
    content: {
      quality: (userAssessment.ratings.comunicacao + partnerAssessment.ratings.comunicacao) / 2,
      resolution: (userAssessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2,
      emotionalTone: (userAssessment.ratings.conexaoEmocional + partnerAssessment.ratings.conexaoEmocional) / 2
    }
  }]);

  return overallScore;
};

const calculateContextualQuality = (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  relationshipContext: RelationshipContext
): number => {
  // Consider relationship context factors
  const contextFactors = {
    hadSignificantCrises: relationshipContext.hadSignificantCrises ? 0.8 : 1,
    communicationStyle: getCommunicationStyleFactor(relationshipContext.communicationStyle),
    relationshipDuration: getRelationshipDurationFactor(relationshipContext.duration)
  };

  // Calculate base quality
  const baseQuality = calculateBaseCommunicationQuality(userAssessment, partnerAssessment);

  // Apply context modifiers
  return baseQuality * 
         contextFactors.hadSignificantCrises * 
         contextFactors.communicationStyle * 
         contextFactors.relationshipDuration;
};

const calculatePatternQuality = async (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  userMoodHistory: MoodEntry[],
  partnerMoodHistory: MoodEntry[]
): Promise<number> => {
  // Analyze communication patterns
  const patterns = await analyzeCommunicationPatterns(userAssessment, partnerAssessment);
  
  // Get detailed quality analysis
  const qualityAnalysis: CommunicationQualityAnalysis = analyzeCommunicationQuality(
    [{
      category: 'communication',
      difference: Math.abs(userAssessment.ratings.comunicacao - partnerAssessment.ratings.comunicacao),
      userScore: userAssessment.ratings.comunicacao,
      partnerScore: partnerAssessment.ratings.comunicacao,
      weightedDifference: calculateWeightedDifference(
        userAssessment.ratings.comunicacao,
        partnerAssessment.ratings.comunicacao,
        'comunicacao'
      ),
      impactScore: calculateWeightedDifference(
        userAssessment.ratings.comunicacao,
        partnerAssessment.ratings.comunicacao,
        'comunicacao'
      ) * 1.5,
      insights: [],
      recommendations: [],
      significance: Math.abs(userAssessment.ratings.comunicacao - partnerAssessment.ratings.comunicacao) >= 2 ? 'high' : Math.abs(userAssessment.ratings.comunicacao - partnerAssessment.ratings.comunicacao) >= 1 ? 'medium' : 'low',
      pattern: null
    }],
    [] // No historical communication records yet
  );
  
  // Calculate quality based on mood entries
  const moodBasedQuality = calculateCommunicationQuality(userMoodHistory, partnerMoodHistory);

  // Combine all metrics
  return (patterns.effectiveness * 0.4) + 
         (qualityAnalysis.overall.score * 0.3) + 
         (moodBasedQuality * 0.3);
};

const calculateMoodImpact = (
  userMoodHistory: MoodEntry[],
  partnerMoodHistory: MoodEntry[]
): number => {
  const recentUserMoods = userMoodHistory.slice(-5);
  const recentPartnerMoods = partnerMoodHistory.slice(-5);

  // Calculate mood synchronization
  const moodSync = calculateMoodSynchronization(recentUserMoods, recentPartnerMoods);

  // Calculate mood stability
  const userStability = calculateMoodStability(recentUserMoods);
  const partnerStability = calculateMoodStability(recentPartnerMoods);

  return (moodSync * 0.6) + ((userStability + partnerStability) / 2 * 0.4);
};

const calculateConfidenceLevel = (
  baseQuality: number,
  contextQuality: number,
  patternQuality: number,
  moodImpact: number
): number => {
  // Check data completeness
  const hasAllMetrics = [baseQuality, contextQuality, patternQuality, moodImpact]
    .every(metric => metric !== undefined && metric !== null);

  // Check consistency between metrics
  const metrics = [baseQuality, contextQuality, patternQuality, moodImpact];
  const variance = calculateVariance(metrics);

  // Higher confidence if metrics are consistent and complete
  const completenessScore = hasAllMetrics ? 1 : 0.7;
  const consistencyScore = 1 - (variance / 10);

  return Math.min(1, (completenessScore * 0.6) + (consistencyScore * 0.4));
};

// Helper functions
const normalizeScore = (score: number): number => {
  return Math.min(1, Math.max(0, score));
};

const getCommunicationStyleFactor = (style: string): number => {
  const factors = {
    'assertive': 1,
    'passive': 0.8,
    'aggressive': 0.7,
    'passive-aggressive': 0.6
  };
  return factors[style as keyof typeof factors] || 0.8;
};

const getRelationshipDurationFactor = (duration: string): number => {
  // Convert duration to months and apply appropriate factor
  const months = parseDurationToMonths(duration);
  if (months < 3) return 0.8;  // New relationships
  if (months < 12) return 0.9; // Less than a year
  return 1;                    // Established relationships
};

const calculateMoodSynchronization = (
  userMoods: MoodEntry[],
  partnerMoods: MoodEntry[]
): number => {
  return calculateEmotionalSync(userMoods, partnerMoods);
};

const calculateMoodStability = (moods: MoodEntry[]): number => {
  if (moods.length < 2) return 1;

  let volatility = 0;
  for (let i = 1; i < moods.length; i++) {
    const difference = Math.abs(
      moods[i].mood.intensity - moods[i-1].mood.intensity
    );
    volatility += difference;
  }

  return 1 - (volatility / (moods.length - 1) / 5);
};

const calculateVariance = (numbers: number[]): number => {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squareDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return Math.sqrt(squareDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length);
};

const parseDurationToMonths = (duration: string): number => {
  // Simple duration parser - can be expanded based on format
  const match = duration.match(/(\d+)\s*(month|year|dia|mes|ano)/i);
  if (!match) return 12; // Default to 1 year if format unknown
  
  const [_, value, unit] = match;
  const months = parseInt(value);
  
  if (unit.toLowerCase().includes('year') || unit.toLowerCase().includes('ano')) {
    return months * 12;
  }
  if (unit.toLowerCase().includes('dia')) {
    return Math.floor(months / 30);
  }
  return months;
}; 