import { DailyAssessment } from '../types';

interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  magnitude: number;
  confidence: number;
  description: string;
}

interface Pattern {
  type: 'cyclic' | 'progressive' | 'reactive';
  period?: number; // for cyclic patterns
  description: string;
  significance: number;
}

interface CyclicalBehavior {
  category: string;
  cycle: {
    period: number;
    amplitude: number;
    phase: number;
  };
  description: string;
  triggers?: string[];
}

export const analyzeTrends = (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): Record<string, TrendAnalysis> => {
  const trends: Record<string, TrendAnalysis> = {};
  const categories = Object.keys(userHistory[0]?.ratings || {});

  categories.forEach(category => {
    const userScores = userHistory.map(h => h.ratings[category]);
    const partnerScores = partnerHistory.map(h => h.ratings[category]);
    const allScores = [...userScores, ...partnerScores];

    const recentAvg = average(allScores.slice(-7)); // Last week
    const oldAvg = average(allScores.slice(0, 7)); // First week
    const change = recentAvg - oldAvg;
    const variance = calculateVariance(allScores);

    trends[category] = {
      direction: change > 0.5 ? 'improving' : 
                change < -0.5 ? 'declining' : 'stable',
      magnitude: Math.abs(change),
      confidence: 1 - (variance / 5), // Normalized to 0-1
      description: generateTrendDescription(category, change, variance)
    };
  });

  return trends;
};

export const identifyPatterns = (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): Pattern[] => {
  const patterns: Pattern[] = [];
  const categories = Object.keys(userHistory[0]?.ratings || {});

  categories.forEach(category => {
    const userScores = userHistory.map(h => h.ratings[category]);
    const partnerScores = partnerHistory.map(h => h.ratings[category]);

    // Check for cyclic patterns
    const cyclePeriod = detectCyclePeriod(userScores.concat(partnerScores));
    if (cyclePeriod > 0) {
      patterns.push({
        type: 'cyclic',
        period: cyclePeriod,
        description: `Padrão cíclico identificado em ${category} com período de ${cyclePeriod} dias`,
        significance: cyclePeriod > 14 ? 0.8 : 0.6
      });
    }

    // Check for progressive patterns
    const trend = calculateTrend(userScores.concat(partnerScores));
    if (trend !== 'stable') {
      patterns.push({
        type: 'progressive',
        description: `Tendência ${trend === 'improving' ? 'positiva' : 'negativa'} em ${category}`,
        significance: 0.7
      });
    }

    // Check for reactive patterns
    if (userScores.length >= 3 && partnerScores.length >= 3) {
      const userAvg = average(userScores);
      const partnerAvg = average(partnerScores);
      const correlation = calculateCorrelation(userScores, partnerScores);
      
      if (Math.abs(correlation) > 0.5 || Math.abs(userAvg - partnerAvg) > 0.5) {
        patterns.push({
          type: 'reactive',
          description: `Forte correlação ${correlation > 0 ? 'positiva' : 'negativa'} entre avaliações em ${category}`,
          significance: Math.abs(correlation)
        });
      }
    }
  });

  return patterns;
};

export const detectCyclicalBehaviors = (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): CyclicalBehavior[] => {
  const behaviors: CyclicalBehavior[] = [];
  const categories = Object.keys(userHistory[0]?.ratings || {});

  categories.forEach(category => {
    const userScores = userHistory.map(h => h.ratings[category]);
    const partnerScores = partnerHistory.map(h => h.ratings[category]);
    const allScores = userScores.concat(partnerScores);

    // Detect weekly cycles
    if (allScores.length >= 14) {
      const weeklyAmplitude = calculateCycleAmplitude(allScores, 7);
      if (weeklyAmplitude > 0.2) {
        behaviors.push({
          category,
          cycle: {
            period: 7,
            amplitude: weeklyAmplitude,
            phase: calculateCyclePhase(allScores, 7)
          },
          description: `Ciclo semanal em ${category}`,
          triggers: detectTriggers(userHistory, category, 7)
        });
      }
    }

    // Detect monthly cycles
    if (allScores.length >= 60) {
      // Try different periods around a month
      const monthlyPeriods = [28, 29, 30, 31];
      let bestPeriod = 30;
      let maxAmplitude = 0;

      monthlyPeriods.forEach(period => {
        const amplitude = calculateCycleAmplitude(allScores, period);
        if (amplitude > maxAmplitude) {
          maxAmplitude = amplitude;
          bestPeriod = period;
        }
      });

      if (maxAmplitude > 0.2) {
        behaviors.push({
          category,
          cycle: {
            period: bestPeriod,
            amplitude: maxAmplitude,
            phase: calculateCyclePhase(allScores, bestPeriod)
          },
          description: `Ciclo mensal em ${category}`,
          triggers: detectTriggers(userHistory, category, bestPeriod)
        });
      }
    }

    // Also check for bi-weekly cycles
    if (allScores.length >= 28) {
      const biweeklyAmplitude = calculateCycleAmplitude(allScores, 14);
      if (biweeklyAmplitude > 0.2) {
        behaviors.push({
          category,
          cycle: {
            period: 14,
            amplitude: biweeklyAmplitude,
            phase: calculateCyclePhase(allScores, 14)
          },
          description: `Ciclo quinzenal em ${category}`,
          triggers: detectTriggers(userHistory, category, 14)
        });
      }
    }
  });

  return behaviors;
};

// Helper functions

const average = (numbers: number[]): number => {
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

const calculateVariance = (numbers: number[]): number => {
  const avg = average(numbers);
  const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
  return average(squareDiffs);
};

const generateTrendDescription = (
  category: string,
  change: number,
  variance: number
): string => {
  const magnitude = Math.abs(change) > 1 ? 'significativa' : 'sutil';
  const stability = variance < 1 ? 'consistente' : 'variável';
  const direction = change > 0 ? 'melhoria' : change < 0 ? 'declínio' : 'estabilidade';

  return `${magnitude} ${direction} em ${category}, com tendência ${stability}`;
};

const detectCyclePeriod = (scores: number[]): number => {
  if (scores.length < 14) return 0;

  const potentialPeriods = [7, 14, 30];
  let bestPeriod = 0;
  let maxAmplitude = 0;

  potentialPeriods.forEach(period => {
    if (scores.length >= period * 2) {
      const amplitude = calculateCycleAmplitude(scores, period);
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
        bestPeriod = period;
      }
    }
  });

  return maxAmplitude > 0.3 ? bestPeriod : 0;
};

const calculateCycleAmplitude = (scores: number[], period: number): number => {
  if (scores.length < period) return 0;

  const foldedScores = new Array(period).fill(0);
  let counts = new Array(period).fill(0);

  scores.forEach((score, i) => {
    const phase = i % period;
    foldedScores[phase] += score;
    counts[phase]++;
  });

  const averages = foldedScores.map((sum, i) => sum / counts[i]);
  const max = Math.max(...averages);
  const min = Math.min(...averages);

  return (max - min) / 2;
};

const calculateCyclePhase = (scores: number[], period: number): number => {
  if (scores.length < period) return 0;

  const foldedScores = new Array(period).fill(0);
  let counts = new Array(period).fill(0);

  scores.forEach((score, i) => {
    const phase = i % period;
    foldedScores[phase] += score;
    counts[phase]++;
  });

  const averages = foldedScores.map((sum, i) => sum / counts[i]);
  return averages.indexOf(Math.max(...averages));
};

const calculateCorrelation = (scores1: number[], scores2: number[]): number => {
  if (scores1.length !== scores2.length || scores1.length < 2) return 0;

  const mean1 = average(scores1);
  const mean2 = average(scores2);

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < scores1.length; i++) {
    const diff1 = scores1[i] - mean1;
    const diff2 = scores2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  return numerator / Math.sqrt(denom1 * denom2);
};

const detectTriggers = (history: DailyAssessment[], category: string, period: number): string[] => {
  const triggers: string[] = [];
  const recentHistory = history.slice(-period * 2); // Look at twice the period length
  
  const significantChanges = recentHistory.filter((h, i) => {
    if (i === 0) return false;
    const prevScore = recentHistory[i - 1].ratings[category];
    const currentScore = h.ratings[category];
    return Math.abs(currentScore - prevScore) > 0.2;
  });

  significantChanges.forEach(assessment => {
    if (assessment.comments && assessment.comments.trim()) {
      triggers.push(assessment.comments.trim());
    }
  });

  return [...new Set(triggers)];
};

const calculateTrend = (scores: number[]): 'improving' | 'stable' | 'declining' => {
  if (scores.length < 4) return 'stable';

  const recentScores = scores.slice(-4);
  const oldScores = scores.slice(-8, -4);

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;

  if (recentAvg > oldAvg + 0.5) return 'improving';
  if (recentAvg < oldAvg - 0.5) return 'declining';
  return 'stable';
}; 