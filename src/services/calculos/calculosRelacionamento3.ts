import type { MoodEntry, MoodType, Insight, RelationshipContext } from '../../types/index';
import { POSITIVE_MOODS, NEGATIVE_MOODS } from '../moodConstants';
import { v4 as uuidv4 } from 'uuid';
import { EMOTIONAL_SYNC_THRESHOLD } from './calculosRelacionamento';
import { compatiblePairs, DEFAULT_MOOD_INTENSITY } from './calculosBase';
import { calculateDataConsistency, calculateResponseTimeGaps } from './calculosRelacionamento2';

export const analyzeDominantMoods = (
  userPatterns: { dominant: MoodType },
  partnerPatterns: { dominant: MoodType }
) => {
  return {
    positive: POSITIVE_MOODS.includes(userPatterns.dominant) && POSITIVE_MOODS.includes(partnerPatterns.dominant),
    negative: NEGATIVE_MOODS.includes(userPatterns.dominant) && NEGATIVE_MOODS.includes(partnerPatterns.dominant)
  };
};

export const calculateIntimacyBalance = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]) => {
  const userScores = calculateIntimacyScores(userEntries);
  const partnerScores = calculateIntimacyScores(partnerEntries);

  return {
    overall: (userScores.overall + partnerScores.overall) / 2,
    areas: {
      emotional: (userScores.emotional + partnerScores.emotional) / 2,
      physical: (userScores.physical + partnerScores.physical) / 2,
      shared: (userScores.shared + partnerScores.shared) / 2
    }
  };
};

export const generateEmotionalInsights = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[],
  metrics: {
    synchronicity: number;
    stability: number;
    communicationQuality: number;
    satisfaction: number;
  }
): { strengths: string[]; challenges: string[]; recommendations: string[] } => {
  const { synchronicity, stability, communicationQuality, satisfaction } = metrics;
  
  const confidenceScore = calculateConfidenceScore(userEntries, partnerEntries);
  const MIN_CONFIDENCE_FOR_INSIGHTS = 0.6;
  
  // If confidence is too low, return limited insights
  if (confidenceScore < MIN_CONFIDENCE_FOR_INSIGHTS) {
    return {
      strengths: [],
      challenges: ['Necessário mais dados para análise completa'],
      recommendations: ['Continue registrando suas interações diárias']
    };
  }
  
  const strengths: Insight[] = [];
  const challenges: Insight[] = [];
  const recommendations: Insight[] = [];

  // Add insights based on synchronicity
  if (synchronicity > EMOTIONAL_SYNC_THRESHOLD) {
    strengths.push({
      id: uuidv4(),
      type: 'pattern',
      category: 'sincronia',
      description: 'Alta sincronia emocional',
      confidence: confidenceScore,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
  } else if (synchronicity < EMOTIONAL_SYNC_THRESHOLD * 0.5) {
    challenges.push({
      id: uuidv4(),
      type: 'warning',
      category: 'sincronia',
      description: 'Baixa sincronia emocional',
      confidence: confidenceScore,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
    recommendations.push({
      id: uuidv4(),
      type: 'recommendation',
      category: 'sincronia',
      description: 'Praticar exercícios de comunicação emocional',
      confidence: confidenceScore * 0.9,
      impact: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  // Add insights based on stability
  if (stability > 0.7) {
    strengths.push({
      id: uuidv4(),
      type: 'pattern',
      category: 'estabilidade',
      description: 'Alta estabilidade emocional',
      confidence: 0.8,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
  } else if (stability < 0.3) {
    challenges.push({
      id: uuidv4(),
      type: 'warning',
      category: 'estabilidade',
      description: 'Baixa estabilidade emocional',
      confidence: 0.8,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
    recommendations.push({
      id: uuidv4(),
      type: 'recommendation',
      category: 'estabilidade',
      description: 'Desenvolver estratégias de regulação emocional',
      confidence: 0.7,
      impact: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  // Add insights based on communication quality
  if (communicationQuality > 0.7) {
    strengths.push({
      id: uuidv4(),
      type: 'pattern',
      category: 'comunicacao',
      description: 'Comunicação efetiva',
      confidence: 0.8,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
  } else if (communicationQuality < 0.3) {
    challenges.push({
      id: uuidv4(),
      type: 'warning',
      category: 'comunicacao',
      description: 'Dificuldades na comunicação',
      confidence: 0.8,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
    recommendations.push({
      id: uuidv4(),
      type: 'recommendation',
      category: 'comunicacao',
      description: 'Estabelecer momentos regulares para diálogo',
      confidence: 0.7,
      impact: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  // Add insights based on overall satisfaction
  if (satisfaction > 0.7) {
    strengths.push({
      id: uuidv4(),
      type: 'pattern',
      category: 'satisfacao',
      description: 'Alto nível de satisfação',
      confidence: 0.8,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
  } else if (satisfaction < 0.3) {
    challenges.push({
      id: uuidv4(),
      type: 'warning',
      category: 'satisfacao',
      description: 'Baixo nível de satisfação',
      confidence: 0.8,
      impact: 'high',
      timestamp: new Date().toISOString()
    });
    recommendations.push({
      id: uuidv4(),
      type: 'recommendation',
      category: 'satisfacao',
      description: 'Identificar áreas específicas de insatisfação',
      confidence: 0.7,
      impact: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  // Organize insights by category
  const communicationStrengths = filterInsightsByCategory(strengths, 'comunicacao');
  const satisfactionStrengths = filterInsightsByCategory(strengths, 'satisfacao');
  const communicationChallenges = filterInsightsByCategory(challenges, 'comunicacao');
  const satisfactionChallenges = filterInsightsByCategory(challenges, 'satisfacao');
  const communicationRecommendations = filterInsightsByCategory(recommendations, 'comunicacao');
  const satisfactionRecommendations = filterInsightsByCategory(recommendations, 'satisfacao');

  // Filter critical insights
  const criticalChallenges = filterInsightsByDescription(challenges, 'baixo nível')
    .concat(filterInsightsByDescription(challenges, 'dificuldades'));

  return {
    strengths: getInsightDescriptions([...communicationStrengths, ...satisfactionStrengths]),
    challenges: getInsightDescriptions([...communicationChallenges, ...satisfactionChallenges, ...criticalChallenges]),
    recommendations: getInsightDescriptions([...communicationRecommendations, ...satisfactionRecommendations])
  };
};

export const determineEmotionalTrend = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): 'improving' | 'stable' | 'declining' => {
  if (userEntries.length < 3 || partnerEntries.length < 3) return 'stable';

  const recentUserMoods = userEntries.slice(-3);
  const recentPartnerMoods = partnerEntries.slice(-3);
  const oldUserMoods = userEntries.slice(-6, -3);
  const oldPartnerMoods = partnerEntries.slice(-6, -3);

  const recentPositivity = calculatePositivityRatio([...recentUserMoods, ...recentPartnerMoods]);
  const oldPositivity = calculatePositivityRatio([...oldUserMoods, ...oldPartnerMoods]);

  if (recentPositivity > oldPositivity + 0.2) return 'improving';
  if (recentPositivity < oldPositivity - 0.2) return 'declining';
  return 'stable';
};

export const calculatePositivityRatio = (entries: MoodEntry[]): number => {
  const positiveCount = entries.filter(e => POSITIVE_MOODS.includes(e.mood.primary)).length;
  return entries.length > 0 ? positiveCount / entries.length : 0;
};

export const calculateIntimacyScores = (entries: MoodEntry[]) => {
  const intimacyScores = entries.reduce((acc, entry) => {
    const mood = entry.mood.primary;
    const intensity = entry.mood.intensity || DEFAULT_MOOD_INTENSITY;

    if (['amado', 'grato', 'feliz'].includes(mood)) {
      acc.emotional += intensity;
    }
    if (['calmo', 'satisfeito'].includes(mood)) {
      acc.physical += intensity;
    }
    if (['animado', 'content'].includes(mood)) {
      acc.intellectual += intensity;
    }
    if (['feliz', 'grato', 'content'].includes(mood)) {
      acc.shared += intensity;
    }

    acc.count++;
    return acc;
  }, { emotional: 0, physical: 0, intellectual: 0, shared: 0, count: 0 });

  const count = Math.max(1, intimacyScores.count);
  return {
    emotional: intimacyScores.emotional / count,
    physical: intimacyScores.physical / count,
    intellectual: intimacyScores.intellectual / count,
    shared: intimacyScores.shared / count,
    overall: (
      intimacyScores.emotional +
      intimacyScores.physical +
      intimacyScores.intellectual +
      intimacyScores.shared
    ) / (4 * count)
  };
};

export const createDefaultRelationshipContext = (): RelationshipContext => ({
  type: '',
  duration: '',
  status: 'dating',
  relationshipStyle: '',
  relationshipStyleOther: '',
  currentDynamics: '',
  userEmotionalState: '',
  partnerEmotionalState: '',
  hadSignificantCrises: false,
  crisisDescription: '',
  attemptedSolutions: false,
  solutionsDescription: '',
  routineImpact: '',
  relationshipStatus: '',
  livingArrangement: '',
  communicationStyle: '',
  sharedActivities: [],
  supportSystem: [],
  futureExpectations: '',
  challengeAreas: [],
  strengthAreas: [],
  values: [],
  goals: [],
  challenges: [],
  strengths: [],
  appGoals: [],
  timeSpentTogether: '',
  qualityTime: 'no' as const,
  qualityTimeDescription: '',
  physicalIntimacy: 'no' as const,
  intimacyImprovements: [],
  additionalInfo: '',
  areasNeedingAttention: []
});

export function calculateOverallEmotionalHealth(
  synchronicity: number,
  stability: number,
  intimacyBalance: {
    overall: number;
    areas: {
      emotional: number;
      physical: number;
      shared: number;
    }
  }
): number {
  // Weight the components
  const weights = {
    synchronicity: 0.3,
    stability: 0.3,
    intimacy: 0.4
  };

  // Calculate weighted score
  return (
    synchronicity * weights.synchronicity +
    stability * weights.stability +
    intimacyBalance.overall * weights.intimacy
  );
}

export const filterInsightsByCategory = (insights: Insight[], category: string): Insight[] => {
  return insights.filter(insight => insight.category === category);
};

export const filterInsightsByDescription = (insights: Insight[], text: string): Insight[] => {
  return insights.filter(insight => 
    insight.description.toLowerCase().includes(text.toLowerCase())
  );
};

export const getInsightDescriptions = (insights: Insight[]): string[] => {
  return insights.map(insight => insight.description);
};

export const calculateConfidenceScore = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number => {
  if (!userEntries.length || !partnerEntries.length) return 0;

  const totalEntries = userEntries.length + partnerEntries.length;
  const consistencyScore: number = calculateDataConsistency(userEntries, partnerEntries);
  const timeGaps = calculateResponseTimeGaps(userEntries, partnerEntries);
  const responseTimeScore = timeGaps.length > 0 
    ? timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length 
    : 0;

  // Weight factors
  const entriesWeight = Number(totalEntries) / 30; // Convert to number explicitly
  const weightCapped = Math.min(entriesWeight, 1); // Cap at 1
  const consistencyWeight = 0.4;
  const responseTimeWeight = 0.3;

  return (
    weightCapped * 0.3 +
    consistencyScore * consistencyWeight +
    responseTimeScore * responseTimeWeight
  );
}; 