import { 
  DailyAssessment, 
  DiscrepancyAnalysis, 
  TemporalAnalysis,
  CategoryRatings
} from '../types';
import { detectConsistentDiscrepancy } from './analysisUtils';

export const calculateDiscrepancies = (
  userAssessments: DailyAssessment[],
  partnerAssessments: DailyAssessment[],
  timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
): DiscrepancyAnalysis[] => {
  if (!userAssessments.length || !partnerAssessments.length) return [];

  const categories = Object.keys(userAssessments[0].ratings);
  const discrepancies: DiscrepancyAnalysis[] = [];

  categories.forEach(category => {
    const userScores = userAssessments.map(a => a.ratings[category]);
    const partnerScores = partnerAssessments.map(a => a.ratings[category]);
    
    const userAvg = average(userScores);
    const partnerAvg = average(partnerScores);
    const difference = Math.abs(userAvg - partnerAvg);

    // Calculate pattern frequency and duration
    const frequency = calculatePatternFrequency(userScores, partnerScores);
    const duration = calculatePatternDuration(userScores, partnerScores);
    const intensity = calculatePatternIntensity(userScores, partnerScores);

    // Calculate trends
    const userTrendAnalysis = calculateTrendWithConfidence(userScores);
    const partnerTrendAnalysis = calculateTrendWithConfidence(partnerScores);

    const impactScore = calculateImpactScore(category, difference, timeframe, {
      frequency,
      duration,
      intensity,
      userTrend: userTrendAnalysis.trend,
      partnerTrend: partnerTrendAnalysis.trend
    });

    discrepancies.push({
      category,
      userScore: userAvg,
      partnerScore: partnerAvg,
      difference: Math.abs(userAvg - partnerAvg),
      weightedDifference: difference * getCategoryWeight(category),
      impactScore,
      insights: generateEnhancedInsights(category, userAvg, partnerAvg, timeframe),
      recommendations: generateEnhancedRecommendations(category, difference, timeframe),
      significance: difference >= 2 ? 'high' : difference >= 1 ? 'medium' : 'low',
      pattern: detectConsistentDiscrepancy(userScores, partnerScores)
    });
  });

  return discrepancies.sort((a, b) => b.weightedDifference - a.weightedDifference);
};

export const calculateImpactScore = (
  category: string,
  difference: number,
  timeframe: 'daily' | 'weekly' | 'monthly',
  options?: {
    frequency?: number;  // How often the pattern occurs (0-1)
    duration?: number;   // How long the pattern has persisted (in days)
    intensity?: number;  // Intensity of the pattern (0-1)
    userTrend?: 'improving' | 'stable' | 'declining';
    partnerTrend?: 'improving' | 'stable' | 'declining';
  }
): number => {
  const baseScore = difference * getCategoryWeight(category);
  const timeframeMultiplier = timeframe === 'monthly' ? 1.5 : 
                             timeframe === 'weekly' ? 1.2 : 1;

  let adjustedScore = baseScore * timeframeMultiplier;

  if (options) {
    // Adjust for frequency of occurrence
    if (options.frequency !== undefined) {
      adjustedScore *= (1 + options.frequency);
    }

    // Adjust for duration of pattern
    if (options.duration !== undefined) {
      const durationFactor = Math.min(1, options.duration / 30); // Normalize to max 30 days
      adjustedScore *= (1 + durationFactor);
    }

    // Adjust for intensity
    if (options.intensity !== undefined) {
      adjustedScore *= (1 + options.intensity);
    }

    // Adjust for trends
    if (options.userTrend === 'declining' || options.partnerTrend === 'declining') {
      adjustedScore *= 1.2; // Increase impact for declining trends
    } else if (options.userTrend === 'improving' && options.partnerTrend === 'improving') {
      adjustedScore *= 0.8; // Decrease impact for mutual improvement
    }
  }

  return Math.min(1, adjustedScore);
};

export const getCategoryWeight = (category: string): number => {
  const weights: Record<string, number> = {
    comunicacao: 0.2,
    conexaoEmocional: 0.2,
    apoioMutuo: 0.15,
    transparenciaConfianca: 0.15,
    intimidadeFisica: 0.1,
    resolucaoConflitos: 0.1,
    satisfacaoGeral: 0.1
  };
  return weights[category] || 0.1;
};

export const getDiscrepancySignificance = (difference: number): 'high' | 'medium' | 'low' => {
  if (difference >= 1.5) return 'high';
  if (difference >= 0.8) return 'medium';
  return 'low';
};

export const generateEnhancedInsights = (
  category: string,
  userScore: number,
  partnerScore: number,
  timeframe: 'daily' | 'weekly' | 'monthly'
): string[] => {
  const insights: string[] = [];
  const difference = Math.abs(userScore - partnerScore);
  const timeframeText = timeframe === 'daily' ? 'hoje' : 
                       timeframe === 'weekly' ? 'esta semana' : 'este mês';

  if (difference >= 1.5) {
    insights.push(`Diferença significativa em ${category} ${timeframeText}`);
    if (userScore > partnerScore) {
      insights.push(`Você tende a avaliar ${category} mais positivamente que seu parceiro`);
    } else {
      insights.push(`Seu parceiro tende a avaliar ${category} mais positivamente que você`);
    }
  }

  if (userScore < 3 && partnerScore < 3) {
    insights.push(`Ambos indicam desafios em ${category}`);
  } else if (userScore > 4 && partnerScore > 4) {
    insights.push(`Forte alinhamento positivo em ${category}`);
  }

  return insights;
};

export const generateEnhancedRecommendations = (
  category: string,
  difference: number,
  timeframe: 'daily' | 'weekly' | 'monthly'
): string[] => {
  const recommendations: string[] = [];
  const significance = getDiscrepancySignificance(difference);

  if (significance === 'high') {
    recommendations.push(
      `Dedique um momento para conversar sobre suas perspectivas em ${category}`,
      `Considere compartilhar suas expectativas específicas sobre ${category}`
    );
  } else if (significance === 'medium') {
    recommendations.push(
      `Mantenha o diálogo aberto sobre ${category}`,
      `Busque entender a perspectiva um do outro em ${category}`
    );
  } else {
    recommendations.push(
      `Continue mantendo a comunicação sobre ${category}`,
      `Celebre o alinhamento em ${category}`
    );
  }

  if (timeframe !== 'daily') {
    recommendations.push('Observe padrões ao longo do tempo e discuta mudanças percebidas');
  }

  return recommendations;
};

export const translatePatternsToActions = (
  patterns: TemporalAnalysis['patterns']
): { actions: string[]; priority: 'high' | 'medium' | 'low' }[] => {
  const actions: { actions: string[]; priority: 'high' | 'medium' | 'low' }[] = [];

  if (patterns.cyclical.length > 0) {
    actions.push({
      actions: [
        'Estabeleça uma rotina semanal para abordar discrepâncias detectadas',
        'Identifique gatilhos específicos nos dias problemáticos',
        'Crie rituais de reconexão para momentos difíceis'
      ],
      priority: 'medium'
    });
  }

  if (patterns.persistent.length > 0) {
    actions.push({
      actions: [
        'Considere intervenções de longo prazo para resolver padrões persistentes',
        'Desenvolva um plano de ação conjunto para cada área problemática',
        'Avalie a necessidade de suporte profissional'
      ],
      priority: 'high'
    });
  }

  if (patterns.emerging.length > 0) {
    actions.push({
      actions: [
        'Monitore de perto os padrões emergentes nas próximas semanas',
        'Estabeleça check-ins diários para áreas em mudança',
        'Documente gatilhos e situações relacionadas'
      ],
      priority: 'low'
    });
  }

  return actions;
};

export const calculateAverageRatings = (assessments: DailyAssessment[]): CategoryRatings => {
  if (!assessments.length) return {} as CategoryRatings;

  const categories = Object.keys(assessments[0].ratings);
  const result = {} as CategoryRatings;

  categories.forEach(category => {
    const sum = assessments.reduce((acc, assessment) => acc + assessment.ratings[category], 0);
    result[category] = sum / assessments.length;
  });

  return result;
};

export const calculateTrendWithConfidence = (scores: number[]): { trend: 'improving' | 'stable' | 'declining'; confidence: number } => {
  if (scores.length < 3) {
    return { trend: 'stable', confidence: 0 };
  }

  const recentScores = scores.slice(-3);
  const avgScore = average(recentScores);
  const oldScores = scores.slice(0, 3);
  const oldAvg = average(oldScores);
  const difference = avgScore - oldAvg;
  
  // Calculate variance to determine confidence
  const variance = recentScores.reduce((sum, score) => 
    sum + Math.pow(score - avgScore, 2), 0) / recentScores.length;
  const confidence = Math.max(0, Math.min(1, 1 - variance / 2));

  if (Math.abs(difference) < 0.3) {
    return { trend: 'stable', confidence };
  }
  return { 
    trend: difference > 0 ? 'improving' : 'declining',
    confidence
  };
};

export const calculateConvergence = (
  userScores: number[],
  partnerScores: number[]
): 'converging' | 'stable' | 'diverging' => {
  if (userScores.length < 2 || partnerScores.length < 2) return 'stable';

  const recentDifferences = userScores.slice(-7).map((score, i) => 
    Math.abs(score - (partnerScores[i] || 0))
  );

  const averageChangeDiff = recentDifferences.reduce((sum, diff, i) => {
    if (i === 0) return 0;
    return sum + (diff - recentDifferences[i - 1]);
  }, 0) / (recentDifferences.length - 1);

  if (averageChangeDiff < -0.2) return 'converging';
  if (averageChangeDiff > 0.2) return 'diverging';
  return 'stable';
};

export const calculateVolatility = (scores: number[]): number => {
  if (scores.length < 2) return 0;

  const changes = scores.slice(1).map((score, i) => 
    Math.abs(score - scores[i])
  );

  return Math.min(1, changes.reduce((sum, change) => sum + change, 0) / changes.length);
};

export const identifyPatterns = (
  userAssessments: DailyAssessment[],
  partnerAssessments: DailyAssessment[]
): TemporalAnalysis['patterns'] => {
  const patterns: TemporalAnalysis['patterns'] = {
    cyclical: [],
    persistent: [],
    emerging: []
  };

  // Identificar padrões cíclicos (semanais)
  const weeklyPatterns = findWeeklyPatterns(userAssessments, partnerAssessments);
  patterns.cyclical.push(...weeklyPatterns);

  // Identificar padrões persistentes
  const persistentPatterns = findPersistentPatterns(userAssessments, partnerAssessments);
  patterns.persistent.push(...persistentPatterns);

  // Identificar padrões emergentes
  const emergingPatterns = findEmergingPatterns(userAssessments, partnerAssessments);
  patterns.emerging.push(...emergingPatterns);

  return patterns;
};

export const average = (numbers: number[]): number => 
  numbers.reduce((sum, num) => sum + num, 0) / numbers.length; 

const calculatePatternFrequency = (userScores: number[], partnerScores: number[]): number => {
  const differences = userScores.map((score, i) => 
    Math.abs(score - (partnerScores[i] || 0))
  );

  const significantDifferences = differences.filter(diff => diff > 0.5);
  return Math.min(1, significantDifferences.length / differences.length);
};

const calculatePatternDuration = (userScores: number[], partnerScores: number[]): number => {
  let duration = 0;
  let currentStreak = 0;

  const differences = userScores.map((score, i) => 
    Math.abs(score - (partnerScores[i] || 0))
  );

  differences.forEach(diff => {
    if (diff > 0.5) {
      currentStreak++;
      duration = Math.max(duration, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return duration;
};

const calculatePatternIntensity = (userScores: number[], partnerScores: number[]): number => {
  const differences = userScores.map((score, i) => 
    Math.abs(score - (partnerScores[i] || 0))
  );

  const maxDifference = Math.max(...differences);
  const avgDifference = average(differences);

  return Math.min(1, (maxDifference + avgDifference) / 2);
};

const findWeeklyPatterns = (userAssessments: DailyAssessment[], partnerAssessments: DailyAssessment[]): string[] => {
  const patterns: string[] = [];
  if (userAssessments.length < 7 || partnerAssessments.length < 7) return patterns;

  const categories = Object.keys(userAssessments[0].ratings);
  
  categories.forEach(category => {
    const weeklyScores = userAssessments.slice(0, 7).map(a => a.ratings[category]);
    const avgScore = average(weeklyScores);
    const variance = weeklyScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / 7;

    if (variance > 0.5) {
      patterns.push(`Variação cíclica em ${category} detectada (variância: ${variance.toFixed(2)})`);
    }
  });

  return patterns;
};

const findPersistentPatterns = (userAssessments: DailyAssessment[], partnerAssessments: DailyAssessment[]): string[] => {
  const patterns: string[] = [];
  if (userAssessments.length < 14 || partnerAssessments.length < 14) return patterns;

  const categories = Object.keys(userAssessments[0].ratings);
  
  categories.forEach(category => {
    const userScores = userAssessments.map(a => a.ratings[category]);
    const partnerScores = partnerAssessments.map(a => a.ratings[category]);
    
    const userAvg = average(userScores);
    const partnerAvg = average(partnerScores);
    const difference = Math.abs(userAvg - partnerAvg);
    
    const isConsistent = userScores.every(score => Math.abs(score - userAvg) < 1) &&
                        partnerScores.every(score => Math.abs(score - partnerAvg) < 1);

    if (difference > 1 && isConsistent) {
      patterns.push(`Diferença persistente em ${category} (gap: ${difference.toFixed(2)})`);
    }
  });

  return patterns;
};

const findEmergingPatterns = (userAssessments: DailyAssessment[], partnerAssessments: DailyAssessment[]): string[] => {
  const patterns: string[] = [];
  if (userAssessments.length < 5 || partnerAssessments.length < 5) return patterns;

  const categories = Object.keys(userAssessments[0].ratings);
  
  categories.forEach(category => {
    const recentUserScores = userAssessments.slice(0, 5).map(a => a.ratings[category]);
    const recentPartnerScores = partnerAssessments.slice(0, 5).map(a => a.ratings[category]);
    
    const userTrend = calculateTrendWithConfidence(recentUserScores);
    const partnerTrend = calculateTrendWithConfidence(recentPartnerScores);

    if (userTrend.trend !== 'stable' && userTrend.confidence > 0.7) {
      patterns.push(`Tendência ${userTrend.trend} emergente em ${category} (usuário)`);
    }
    if (partnerTrend.trend !== 'stable' && partnerTrend.confidence > 0.7) {
      patterns.push(`Tendência ${partnerTrend.trend} emergente em ${category} (parceiro)`);
    }
  });

  return patterns;
}; 