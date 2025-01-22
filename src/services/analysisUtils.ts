import { DailyAssessment, CategoryRatings, RelationshipContext, CommunicationRecord, TemporalAnalysis, ValidationResult, CommunicationQualityAnalysis, DiscrepancyAnalysis } from '../types';
import { ConsensusFormData } from './gptService';

// Weights based on meta-analysis of relationship satisfaction predictors
export const CATEGORY_WEIGHTS = {
  // Core Relationship Factors (65% total)
  consensus: 0.15,     // Agreement on major issues
  affection: 0.20,     // Emotional and physical intimacy
  cohesion: 0.15,      // Shared activities and time
  satisfaction: 0.15,  // Overall relationship satisfaction

  // Relationship Maintenance Factors (35% total)
  conflict: 0.15,      // Conflict resolution patterns
  general: 0.20        // Daily stressors and external factors
};

export interface CategoryAverages {
  consensus: number;
  affection: number;
  cohesion: number;
  satisfaction: number;
  conflict: number;
  general: number;
}

export interface DiscrepancyResult {
  category: string;
  difference: number;
  significance: 'high' | 'medium' | 'low';
  pattern: string | null;
}

export const identifyCyclicalPatterns = (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): string[] => {
  const patterns: string[] = [];
  const categories = Object.keys(userHistory[0]?.ratings || {});

  categories.forEach(category => {
    const userScores = userHistory.map(h => (h.ratings as CategoryRatings)[category]);
    const partnerScores = partnerHistory.map(h => (h.ratings as CategoryRatings)[category]);

    // Detecta padrões semanais
    const weeklyPattern = detectWeeklyPattern([...userScores, ...partnerScores]);
    if (weeklyPattern) {
      patterns.push(`Padrão semanal em ${category}: ${weeklyPattern}`);
    }

    // Detecta padrões mensais
    const monthlyPattern = detectMonthlyPattern([...userScores, ...partnerScores]);
    if (monthlyPattern) {
      patterns.push(`Padrão mensal em ${category}: ${monthlyPattern}`);
    }
  });

  return patterns;
};

export const identifyPersistentPatterns = (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): string[] => {
  const patterns: string[] = [];
  const categories = Object.keys(userHistory[0]?.ratings || {});

  categories.forEach(category => {
    const userScores = userHistory.map(h => (h.ratings as CategoryRatings)[category]);
    const partnerScores = partnerHistory.map(h => (h.ratings as CategoryRatings)[category]);

    // Detecta tendências consistentes
    const userTrend = detectConsistentTrend(userScores);
    const partnerTrend = detectConsistentTrend(partnerScores);

    if (userTrend && partnerTrend && userTrend === partnerTrend) {
      patterns.push(`Tendência persistente em ${category}: ${userTrend}`);
    }
  });

  return patterns;
};

export const identifyEmergingPatterns = (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): string[] => {
  const patterns: string[] = [];
  const categories = Object.keys(userHistory[0]?.ratings || {});

  // Considera apenas os últimos 14 dias
  const recentUserHistory = userHistory.slice(-14);
  const recentPartnerHistory = partnerHistory.slice(-14);

  categories.forEach(category => {
    const userScores = recentUserHistory.map(h => (h.ratings as CategoryRatings)[category]);
    const partnerScores = recentPartnerHistory.map(h => (h.ratings as CategoryRatings)[category]);

    // Detecta mudanças recentes significativas
    const userChange = detectRecentChange(userScores);
    const partnerChange = detectRecentChange(partnerScores);

    if (userChange && partnerChange) {
      patterns.push(`Mudança emergente em ${category}: ${userChange}, ${partnerChange}`);
    } else if (userChange) {
      patterns.push(`Mudança emergente em ${category} (usuário): ${userChange}`);
    } else if (partnerChange) {
      patterns.push(`Mudança emergente em ${category} (parceiro): ${partnerChange}`);
    }
  });

  return patterns;
};

export const generateTimeframeSummary = async (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[],
  days: number
): Promise<any> => {
  // Filtra dados pelo período
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentUserHistory = userHistory.filter(h => 
    new Date(h.date) >= cutoffDate
  );
  const recentPartnerHistory = partnerHistory.filter(h =>
    new Date(h.date) >= cutoffDate
  );

  // Calcula médias
  const averageScores = calculateAverageScores(recentUserHistory, recentPartnerHistory);

  // Analisa discrepâncias
  const discrepancies = analyzeDiscrepancies(recentUserHistory, recentPartnerHistory);

  // Gera insights
  const insights = generateTimeframeInsights(averageScores, discrepancies, days);

  return {
    averageScores,
    discrepancies,
    insights
  };
};

export const extractContextualFactors = (
  context: RelationshipContext,
  _category: string
): any => {
  const relevantFactors = {
    stressors: context.areasNeedingAttention?.[_category as keyof RelationshipContext['areasNeedingAttention']] ? [_category] : [],
    events: context.hadSignificantCrises ? [context.crisisDescription] : [],
    changes: context.routineImpact ? [context.routineImpact] : []
  };

  return {
    ...relevantFactors,
    intensity: calculateContextIntensity(relevantFactors)
  };
};

export const calculateConsistencyScore = (
  dailyScores: number[],
  consensusScore: number | undefined,
  contextualFactors: any
): number => {
  if (!dailyScores.length) return 0;

  const avgDailyScore = average(dailyScores);
  const variance = standardDeviation(dailyScores);
  const contextAdjustment = calculateContextAdjustment(contextualFactors);

  let score = 1 - (variance / 5); // Normaliza variância para escala 0-1
  
  // Ajusta com base no consenso se disponível
  if (consensusScore !== undefined) {
    const consensusDiff = Math.abs(avgDailyScore - consensusScore);
    score *= (1 - (consensusDiff / 5));
  }

  // Ajusta com base no contexto
  score *= (1 - contextAdjustment);

  return Math.max(0, Math.min(1, score));
};

export const calculateConfidenceLevel = (numDataPoints: number, hasConsensus: boolean): number => {
  let confidence = Math.min(numDataPoints / 14, 1); // 2 semanas de dados = confiança máxima
  if (hasConsensus) confidence = (confidence + 1) / 2; // Média com consenso
  return confidence;
};

export const identifyInconsistencies = (
  dailyScores: number[],
  consensusScore: number | undefined,
  contextualFactors: any
): string[] => {
  const flags: string[] = [];
  
  // Verifica variância alta
  if (standardDeviation(dailyScores) > 1.5) {
    flags.push('Alta variabilidade nas avaliações diárias');
  }

  // Verifica discrepância com consenso
  if (consensusScore !== undefined) {
    const avgDailyScore = average(dailyScores);
    if (Math.abs(avgDailyScore - consensusScore) > 2) {
      flags.push('Discrepância significativa entre avaliações diárias e consenso');
    }
  }

  // Verifica impacto do contexto
  if (calculateContextIntensity(contextualFactors) > 0.7) {
    flags.push('Fatores contextuais podem estar influenciando as avaliações');
  }

  return flags;
};

const calculateContextIntensity = (factors: any): number => {
  const weights = {
    stressors: 0.4,
    events: 0.3,
    changes: 0.3
  };

  return Object.entries(weights).reduce((total, [key, weight]) => {
    const items = factors[key] || [];
    return total + (items.length * weight);
  }, 0) / 5; // Normaliza para escala 0-1
};

const calculateContextAdjustment = (factors: any): number => {
  const intensity = calculateContextIntensity(factors);
  return Math.min(intensity * 0.5, 0.3); // Máximo 30% de ajuste
};

// Funções auxiliares
const detectWeeklyPattern = (scores: number[]): string | null => {
  if (scores.length < 14) return null; // Precisa de pelo menos 2 semanas de dados

  // Agrupa scores por dia da semana (0-6)
  const byWeekday = Array.from({ length: 7 }, () => [] as number[]);
  scores.forEach((score, i) => {
    const weekday = i % 7;
    byWeekday[weekday].push(score);
  });

  // Calcula médias por dia da semana
  const averages = byWeekday.map(dayScores => 
    dayScores.length ? average(dayScores) : null
  );

  // Identifica dias com scores consistentemente diferentes
  const significantDays: string[] = [];
  const overallAvg = average(scores);
  
  ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].forEach((day, i) => {
    if (averages[i] !== null) {
      const diff = averages[i]! - overallAvg;
      if (Math.abs(diff) > 0.5) {
        significantDays.push(`${day} (${diff > 0 ? 'maior' : 'menor'})`);
      }
    }
  });

  return significantDays.length > 0
    ? `Scores tendem a ser diferentes em: ${significantDays.join(', ')}`
    : null;
};

const detectMonthlyPattern = (scores: number[]): string | null => {
  if (!scores?.length || scores.length < 30) return null; // Precisa de pelo menos 1 mês de dados

  // Agrupa scores por semana do mês (0-3)
  const byWeek = Array.from({ length: 4 }, () => [] as number[]);
  
  scores.forEach((score, i) => {
    const weekOfMonth = Math.min(Math.floor((i % 30) / 7), 3); // Ensure index is within bounds
    if (byWeek[weekOfMonth]) {
      byWeek[weekOfMonth].push(score);
    }
  });

  // Calcula médias por semana
  const averages = byWeek.map(weekScores => 
    weekScores?.length ? average(weekScores) : null
  );

  // Identifica semanas com scores consistentemente diferentes
  const significantWeeks: string[] = [];
  const validScores = scores.filter(score => typeof score === 'number' && !isNaN(score));
  if (!validScores.length) return null;
  
  const overallAvg = average(validScores);
  
  ['Primeira', 'Segunda', 'Terceira', 'Quarta'].forEach((week, i) => {
    if (averages[i] !== null && typeof averages[i] === 'number') {
      const diff = averages[i]! - overallAvg;
      if (Math.abs(diff) > 0.5) {
        significantWeeks.push(`${week} semana (${diff > 0 ? 'maior' : 'menor'})`);
      }
    }
  });

  return significantWeeks.length > 0
    ? `Scores tendem a ser diferentes em: ${significantWeeks.join(', ')}`
    : null;
};

const detectConsistentTrend = (scores: number[]): string | null => {
  if (scores.length < 14) return null; // Precisa de pelo menos 2 semanas

  // Divide em períodos de 3 dias e calcula médias
  const periods = Math.floor(scores.length / 3);
  const periodAverages = Array.from({ length: periods }, (_, i) => {
    const start = i * 3;
    return average(scores.slice(start, start + 3));
  });

  // Calcula diferenças entre períodos consecutivos
  const differences = periodAverages.slice(1).map((avg, i) => avg - periodAverages[i]);
  
  // Verifica se há uma tendência consistente
  const isIncreasing = differences.every(diff => diff > 0.2);
  const isDecreasing = differences.every(diff => diff < -0.2);
  
  if (isIncreasing) return 'melhoria consistente';
  if (isDecreasing) return 'declínio consistente';
  return null;
};

const detectRecentChange = (scores: number[]): string | null => {
  if (scores.length < 7) return null;

  const recent = average(scores.slice(-3));
  const previous = average(scores.slice(-7, -3));
  const diff = recent - previous;

  if (Math.abs(diff) > 1) {
    return diff > 0 ? 'melhoria significativa recente' : 'declínio significativo recente';
  }

  return null;
};

export const detectConsistentDiscrepancy = (userScores: number[], partnerScores: number[]): string | null => {
  if (userScores.length !== partnerScores.length || userScores.length === 0) return null;

  const differences = userScores.map((score, i) => score - partnerScores[i]);
  const avgDifference = average(differences);
  
  // Check if all differences are in the same direction (all positive or all negative)
  // and the magnitude is significant (> 0.5)
  const isConsistent = Math.abs(avgDifference) > 0.5 && 
    differences.every(diff => Math.sign(diff) === Math.sign(avgDifference));

  if (!isConsistent) return null;

  return avgDifference > 0 
    ? 'consistentemente mais alto'
    : 'consistentemente mais baixo';
};

export const detectRecentChanges = (scores: number[]): string | null => {
  if (scores.length < 5) return null;
  
  const recentScores = scores.slice(-3);
  const previousScores = scores.slice(-5, -3);
  
  const recentAvg = average(recentScores);
  const previousAvg = average(previousScores);
  const difference = recentAvg - previousAvg;
  
  if (Math.abs(difference) > 1) {
    return difference > 0 
      ? 'Melhoria significativa recente'
      : 'Declínio significativo recente';
  }
  
  const volatility = standardDeviation(recentScores);
  if (volatility > 1.5) {
    return 'Avaliações recentes apresentam alta variabilidade';
  }
  
  return null;
};

export const detectNewInteractionPattern = (userScores: number[], partnerScores: number[]): string => {
  if (userScores.length !== partnerScores.length || userScores.length === 0) return 'padrão indefinido';

  const avgUserScore = average(userScores);
  const avgPartnerScore = average(partnerScores);
  const combinedAvg = (avgUserScore + avgPartnerScore) / 2;

  if (combinedAvg >= 4) return 'padrão positivo';
  if (combinedAvg <= 2) return 'padrão negativo';
  return 'padrão misto';
};

export const calculateAverageScores = (
  userHistory: DailyAssessment[], 
  partnerHistory: DailyAssessment[]
): CategoryAverages => {
  const categories = Object.keys(CATEGORY_WEIGHTS);
  const result = {} as CategoryAverages;
  
  // If both histories are empty, return default values
  if (userHistory.length === 0 && partnerHistory.length === 0) {
    categories.forEach(category => {
      result[category as keyof CategoryAverages] = 0;
    });
    return result;
  }

  categories.forEach(category => {
    const userScores = userHistory.map(h => (h.ratings as CategoryRatings)[category]);
    const partnerScores = partnerHistory.map(h => (h.ratings as CategoryRatings)[category]);
    
    result[category as keyof CategoryAverages] = average([...userScores, ...partnerScores]);
  });
  
  return result;
};

export const analyzeDiscrepancies = (
  userHistory: DailyAssessment[], 
  partnerHistory: DailyAssessment[]
): DiscrepancyResult[] => {
  const categories = Object.keys(userHistory[0]?.ratings || {});
  const results: DiscrepancyResult[] = [];
  
  categories.forEach(category => {
    const userScores = userHistory.map(h => (h.ratings as CategoryRatings)[category]);
    const partnerScores = partnerHistory.map(h => (h.ratings as CategoryRatings)[category]);
    
    const avgDiff = Math.abs(average(userScores) - average(partnerScores));
    const pattern = detectConsistentDiscrepancy(userScores, partnerScores);
    
    results.push({
      category,
      difference: avgDiff,
      significance: avgDiff >= 2 ? 'high' : avgDiff >= 1 ? 'medium' : 'low',
      pattern
    });
  });
  
  return results.sort((a, b) => b.difference - a.difference);
};

export const generateTimeframeInsights = (
  averageScores: CategoryAverages, 
  discrepancies: DiscrepancyResult[], 
  days: number
): string[] => {
  const insights: string[] = [];
  
  // Insights baseados em médias
  Object.entries(averageScores).forEach(([category, score]) => {
    if (score < 2) {
      insights.push(`Atenção necessária na área de ${category} (média baixa: ${score.toFixed(1)})`);
    } else if (score > 4) {
      insights.push(`Ponto forte do relacionamento: ${category} (média alta: ${score.toFixed(1)})`);
    }
  });
  
  // Insights baseados em discrepâncias
  discrepancies
    .filter(d => d.significance === 'high')
    .forEach(d => {
      insights.push(`Diferença significativa em ${d.category}: ${d.pattern || 'necessita alinhamento'}`);
    });
  
  // Insights baseados no período
  if (days <= 7) {
    insights.push('Análise de curto prazo - continue monitorando para tendências mais claras');
  } else if (days >= 30) {
    insights.push('Análise de longo prazo - padrões identificados são mais confiáveis');
  }
  
  return insights;
};

export const calculateOverallCommunicationScore = (history: CommunicationRecord[]): number => {
  if (!history.length) return 0;
  
  const scores = history.map(record => 
    (record.content.quality + record.content.resolution + record.content.emotionalTone) / 3
  );
  
  // Dá mais peso para registros recentes
  const recentScores = scores.slice(-5);
  return average(recentScores);
};

export const identifyCommunicationTrend = (history: CommunicationRecord[]): string => {
  if (history.length < 2) return 'stable';
  
  const scores = history.map(record => 
    (record.content.quality + record.content.resolution + record.content.emotionalTone) / 3
  );

  const recentAvg = average(scores.slice(-3));
  const oldAvg = average(scores.slice(-6, -3));

  if (recentAvg > oldAvg + 0.5) return 'improving';
  if (recentAvg < oldAvg - 0.5) return 'declining';
  return 'stable';
};

export const identifyCommunicationPatterns = (history: CommunicationRecord[]): string[] => {
  const patterns: string[] = [];

  // Analisa padrões de qualidade
  const qualityPattern = analyzeQualityPattern(history);
  if (qualityPattern) patterns.push(qualityPattern);

  // Analisa padrões de resolução
  const resolutionPattern = analyzeResolutionPattern(history);
  if (resolutionPattern) patterns.push(resolutionPattern);

  // Analisa padrões emocionais
  const emotionalPattern = analyzeEmotionalPattern(history);
  if (emotionalPattern) patterns.push(emotionalPattern);

  return patterns;
};

const analyzeQualityPattern = (history: CommunicationRecord[]): string | null => {
  if (history.length < 5) return null;

  // Analisa qualidade da comunicação ao longo do tempo
  const qualityScores = history.map(record => record.content.quality);
  const recentAvg = average(qualityScores.slice(-3));
  const previousAvg = average(qualityScores.slice(-6, -3));

  // Identifica padrões de qualidade
  if (recentAvg > previousAvg + 0.5) {
    return 'Melhoria recente na qualidade da comunicação';
  } else if (recentAvg < previousAvg - 0.5) {
    return 'Declínio recente na qualidade da comunicação';
  }

  // Verifica consistência
  const volatility = standardDeviation(qualityScores);
  if (volatility > 1.5) {
    return 'Qualidade da comunicação tem sido inconsistente';
  } else if (volatility < 0.5 && recentAvg > 3.5) {
    return 'Comunicação mantém qualidade consistentemente boa';
  }

  return null;
};

const analyzeResolutionPattern = (history: CommunicationRecord[]): string | null => {
  if (history.length < 5) return null;

  // Analisa padrões de resolução de conflitos
  const resolutionScores = history.map(record => record.content.resolution);
  if (resolutionScores.length < 3) return null;

  const recentAvg = average(resolutionScores.slice(-3));
  const previousAvg = average(resolutionScores.slice(-6, -3));

  // Identifica tendências na resolução
  if (recentAvg < previousAvg * 0.7) {
    return 'Conflitos têm sido resolvidos mais rapidamente';
  } else if (recentAvg > previousAvg * 1.3) {
    return 'Resolução de conflitos tem levado mais tempo';
  }

  // Analisa efetividade da resolução
  const recentResolutions = history.slice(-3).filter(r => r.content.resolution > 3);
  if (recentResolutions.length === 3) {
    return 'Últimas resoluções foram efetivas';
  }

  return null;
};

const analyzeEmotionalPattern = (history: CommunicationRecord[]): string | null => {
  if (history.length < 5) return null;

  // Analisa padrões emocionais durante comunicação
  const emotionalScores = history.map(record => record.content.emotionalTone);
  const recentScores = emotionalScores.slice(-3);
  const previousScores = emotionalScores.slice(-6, -3);

  // Identifica mudanças no estado emocional
  const recentPositive = recentScores.filter(score => score > 3).length;
  const previousPositive = previousScores.filter(score => score > 3).length;

  if (recentPositive > previousPositive + 1) {
    return 'Aumento recente em interações emocionalmente positivas';
  } else if (recentPositive < previousPositive - 1) {
    return 'Redução recente em interações emocionalmente positivas';
  }

  // Verifica padrões de escalada emocional
  const hasEscalation = history.slice(-3).some(record => 
    record.content.emotionalTone < 2
  );
  if (hasEscalation) {
    return 'Padrão recente de escalada emocional em conflitos';
  }

  return null;
};

// Funções exportadas
export const calculateWeightedDifference = (
  userRating: number,
  partnerRating: number,
  category: string
): number => {
  // Pesos baseados na importância da categoria para a saúde do relacionamento
  const categoryWeights = {
    comunicacao: 1.2,        // Comunicação é fundamental
    transparenciaConfianca: 1.2, // Confiança é base do relacionamento
    conexaoEmocional: 1.1,   // Conexão emocional é muito importante
    apoioMutuo: 1.1,         // Apoio mútuo fortalece o vínculo
    resolucaoConflitos: 1.0, // Gestão de conflitos é importante
    intimidadeFisica: 0.9,   // Intimidade física varia com o contexto
    saudeMental: 0.9,        // Saúde mental individual
    satisfacaoGeral: 0.8     // Medida geral
  };

  const weight = categoryWeights[category as keyof typeof categoryWeights] || 1.0;
  return Math.abs(userRating - partnerRating) * weight;
};

export const analyzeTemporalPatterns = async (
  userHistory: DailyAssessment[],
  partnerHistory: DailyAssessment[]
): Promise<TemporalAnalysis> => {
  // Early return with default values if no history
  if (!userHistory?.length || !partnerHistory?.length) {
    return {
      correlation: 0,
      trends: {},
      patterns: {
        cyclical: [],
        persistent: [],
        emerging: []
      },
      timeframes: {
        daily: await generateTimeframeSummary([], [], 1),
        weekly: await generateTimeframeSummary([], [], 7),
        monthly: await generateTimeframeSummary([], [], 30)
      },
      seasonality: 0,
      volatility: 0,
      confidence: 0,
      analysisDate: new Date().toISOString()
    };
  }

  const trends: Record<string, any> = {};
  const firstValidAssessment = userHistory.find(h => h?.ratings && Object.keys(h.ratings).length > 0);
  
  if (!firstValidAssessment?.ratings) {
    console.error('[analyzeTemporalPatterns] No valid assessment found with ratings');
    return {
      correlation: 0,
      trends: {},
      patterns: {
        cyclical: [],
        persistent: [],
        emerging: []
      },
      timeframes: {
        daily: await generateTimeframeSummary([], [], 1),
        weekly: await generateTimeframeSummary([], [], 7),
        monthly: await generateTimeframeSummary([], [], 30)
      },
      seasonality: 0,
      volatility: 0,
      confidence: 0,
      analysisDate: new Date().toISOString()
    };
  }

  const categories = Object.keys(firstValidAssessment.ratings);

  try {
    categories.forEach(category => {
      const userScores = userHistory
        .filter(h => h?.ratings?.[category] !== undefined)
        .map(h => (h.ratings as CategoryRatings)[category]);
      
      const partnerScores = partnerHistory
        .filter(h => h?.ratings?.[category] !== undefined)
        .map(h => (h.ratings as CategoryRatings)[category]);

      if (!userScores.length || !partnerScores.length) {
        trends[category] = {
          userTrend: { slope: 0, rSquared: 0, trend: 'stable' },
          partnerTrend: { slope: 0, rSquared: 0, trend: 'stable' },
          convergence: 0,
          volatility: 0
        };
        return;
      }

      const userTrendResult = calculateTrend(userScores);
      const partnerTrendResult = calculateTrend(partnerScores);
      const convergenceResult = analyzeConvergence(userScores, partnerScores);
      const volatilityResult = calculateVolatility([...userScores, ...partnerScores]);

      trends[category] = {
        userTrend: {
          slope: calculateSlope(userScores),
          rSquared: calculateRSquared(userScores),
          trend: userTrendResult
        },
        partnerTrend: {
          slope: calculateSlope(partnerScores),
          rSquared: calculateRSquared(partnerScores),
          trend: partnerTrendResult
        },
        convergence: convergenceResult === 'converging' ? 1 : convergenceResult === 'diverging' ? -1 : 0,
        volatility: volatilityResult
      };
    });

    return {
      correlation: calculateCorrelation(userHistory, partnerHistory),
      trends,
      patterns: {
        cyclical: identifyCyclicalPatterns(userHistory, partnerHistory),
        persistent: identifyPersistentPatterns(userHistory, partnerHistory),
        emerging: identifyEmergingPatterns(userHistory, partnerHistory)
      },
      timeframes: {
        daily: await generateTimeframeSummary(userHistory, partnerHistory, 1),
        weekly: await generateTimeframeSummary(userHistory, partnerHistory, 7),
        monthly: await generateTimeframeSummary(userHistory, partnerHistory, 30)
      },
      seasonality: calculateSeasonality(userHistory, partnerHistory),
      volatility: calculateOverallVolatility(userHistory, partnerHistory),
      confidence: calculateConfidenceLevel(userHistory.length + partnerHistory.length, true),
      analysisDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('[analyzeTemporalPatterns] Error analyzing temporal patterns:', error);
    return {
      correlation: 0,
      trends: {},
      patterns: {
        cyclical: [],
        persistent: [],
        emerging: []
      },
      timeframes: {
        daily: await generateTimeframeSummary([], [], 1),
        weekly: await generateTimeframeSummary([], [], 7),
        monthly: await generateTimeframeSummary([], [], 30)
      },
      seasonality: 0,
      volatility: 0,
      confidence: 0,
      analysisDate: new Date().toISOString()
    };
  }
};

const calculateSlope = (scores: number[]): number => {
  if (scores.length < 2) return 0;
  const xValues = Array.from({ length: scores.length }, (_, i) => i);
  const xMean = average(xValues);
  const yMean = average(scores);
  
  const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (scores[i] - yMean), 0);
  const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
  
  return denominator === 0 ? 0 : numerator / denominator;
};

const calculateRSquared = (scores: number[]): number => {
  if (scores.length < 2) return 0;
  const slope = calculateSlope(scores);
  const xValues = Array.from({ length: scores.length }, (_, i) => i);
  const yMean = average(scores);
  
  const predicted = xValues.map(x => slope * x + yMean);
  const residualSS = scores.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
  const totalSS = scores.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  
  return totalSS === 0 ? 0 : 1 - (residualSS / totalSS);
};

const calculateCorrelation = (userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): number => {
  // Implementation for correlation calculation
  return 0.5; // Placeholder
};

const calculateSeasonality = (userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): number => {
  // Implementation for seasonality calculation
  return 0.3; // Placeholder
};

const calculateOverallVolatility = (userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): number => {
  // Implementation for overall volatility calculation
  return 0.4; // Placeholder
};

export const crossValidateAssessments = (
  assessments: DailyAssessment[],
  consensusForm: ConsensusFormData,
  relationshipContext: RelationshipContext
): ValidationResult => {
  const consistency: ValidationResult['consistency'] = {};
  const allCategories = Object.keys(CATEGORY_WEIGHTS);

  // Analisa consistência por categoria
  allCategories.forEach(category => {
    const dailyScores = assessments
      .map(a => (a.ratings as CategoryRatings)[category])
      .filter(Boolean);
    
    const consensusScore = consensusForm.scores?.[category as keyof ConsensusFormData['scores']] as number | undefined;
    const contextualFactors = extractContextualFactors(relationshipContext, category);

    consistency[category] = {
      score: calculateConsistencyScore(dailyScores, consensusScore, contextualFactors),
      confidence: calculateConfidenceLevel(dailyScores.length, Boolean(consensusScore)),
      flags: identifyInconsistencies(dailyScores, consensusScore, contextualFactors)
    };
  });

  // Calcula métricas gerais
  const reliability = calculateOverallReliability(consistency);
  const completeness = calculateDataCompleteness(assessments, consensusForm);

  return {
    consistency,
    reliability,
    completeness,
    recommendations: generateValidationRecommendations(consistency, reliability, completeness)
  } as ValidationResult;
};

export const analyzeCommunicationQuality = (
  discrepancies: DiscrepancyAnalysis[],
  communicationHistory: CommunicationRecord[]
): CommunicationQualityAnalysis => {
  // Análise geral
  const overall = {
    score: calculateOverallCommunicationScore(communicationHistory),
    trend: identifyCommunicationTrend(communicationHistory),
    patterns: identifyCommunicationPatterns(communicationHistory)
  };

  // Análise por tópico
  const byTopic = analyzeCommunicationByTopic(communicationHistory);

  // Gera recomendações baseadas nas discrepâncias e qualidade da comunicação
  const recommendations = generateCommunicationRecommendations(discrepancies, overall, byTopic);

  return {
    overall,
    byTopic,
    recommendations
  };
};

export const analyzeCommunicationByTopic = (
  history: CommunicationRecord[]
): CommunicationQualityAnalysis['byTopic'] => {
  const topicAnalysis: CommunicationQualityAnalysis['byTopic'] = {};

  // Agrupa registros por tópico
  history.forEach(record => {
    const topics = record.content.topics;
    if (!topics?.length) return;

    topics.forEach(topic => {
      if (!topicAnalysis[topic]) {
        topicAnalysis[topic] = {
          frequency: 0,
          quality: 0,
          resolution: 0,
          emotionalTone: 0
        };
      }

      const analysis = topicAnalysis[topic];
      analysis.frequency++;
      analysis.quality += record.content.quality;
      analysis.resolution += record.content.resolution;
      analysis.emotionalTone += record.content.emotionalTone;
    });
  });

  // Calcula médias
  Object.values(topicAnalysis).forEach(analysis => {
    const freq = analysis.frequency;
    if (freq > 0) {
      analysis.quality /= freq;
      analysis.resolution /= freq;
      analysis.emotionalTone /= freq;
    }
  });

  return topicAnalysis;
};

export const generateCommunicationRecommendations = (
  discrepancies: DiscrepancyAnalysis[],
  overall: CommunicationQualityAnalysis['overall'],
  byTopic: CommunicationQualityAnalysis['byTopic']
): CommunicationQualityAnalysis['recommendations'] => {
  const recommendations: CommunicationQualityAnalysis['recommendations'] = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };

  // Recomendações baseadas em discrepâncias
  discrepancies.forEach(discrepancy => {
    if (discrepancy.weightedDifference > 1) {
      recommendations.immediate.push(
        `Considere discutir percepções diferentes sobre ${discrepancy.category}`
      );
    }
  });

  // Recomendações baseadas na qualidade geral
  if (overall.score < 3) {
    recommendations.shortTerm.push(
      'Foque em melhorar a qualidade geral da comunicação através de escuta ativa e empatia'
    );
  }

  // Recomendações por tópico
  Object.entries(byTopic).forEach(([topic, data]) => {
    if (data.frequency > 0) {
      if (data.quality < 2.5) {
        recommendations.immediate.push(
          `Busque abordagens diferentes ao discutir ${topic}`
        );
      }
      if (data.resolution < 3) {
        recommendations.shortTerm.push(
          `Desenvolva estratégias para melhorar a resolução ao discutir ${topic}`
        );
      }
      if (data.emotionalTone < 2.5) {
        recommendations.longTerm.push(
          `Trabalhe no aspecto emocional das discussões sobre ${topic}`
        );
      }
    }
  });

  return recommendations;
};

export const calculateOverallQuality = (history: CommunicationRecord[]): number => {
  if (!history.length) return 0;
  
  const qualityScores = history.map(record => record.content.quality);
  const recentScores = qualityScores.slice(-5);
  
  // Dá mais peso para registros recentes
  return average(recentScores);
};

export const analyzeEffectiveness = (history: CommunicationRecord[]): number => {
  if (!history.length) return 0;

  const recentHistory = history.slice(-5);
  const effectiveCount = recentHistory.filter(
    record => record.content.resolution > 3
  ).length;

  return effectiveCount / recentHistory.length;
};

export const calculateOverallReliability = (consistency: ValidationResult['consistency']): number => {
  const categories = Object.keys(consistency);
  if (!categories.length) return 0;

  // Calcula média ponderada da confiabilidade por categoria
  const weightedSum = categories.reduce((sum, category) => {
    const weight = CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS] || 1;
    return sum + (consistency[category].score * consistency[category].confidence * weight);
  }, 0);

  const totalWeight = categories.reduce((sum, category) => {
    return sum + (CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS] || 1);
  }, 0);

  return weightedSum / totalWeight;
};

export const calculateDataCompleteness = (
  assessments: DailyAssessment[],
  consensusForm: ConsensusFormData
): number => {
  // Verifica completude dos dados diários
  const dailyCompleteness = assessments.reduce((sum, assessment) => {
    const filledCategories = Object.values(assessment.ratings).filter(Boolean).length;
    const totalCategories = Object.keys(CATEGORY_WEIGHTS).length;
    return sum + (filledCategories / totalCategories);
  }, 0) / Math.max(assessments.length, 1);

  // Verifica completude do formulário de consenso
  const consensusCompleteness = consensusForm.scores
    ? Object.values(consensusForm.scores).filter(Boolean).length / Object.keys(CATEGORY_WEIGHTS).length
    : 0;

  // Peso maior para dados diários (70%) vs consenso (30%)
  return (dailyCompleteness * 0.7) + (consensusCompleteness * 0.3);
};

export const generateValidationRecommendations = (
  consistency: ValidationResult['consistency'],
  reliability: number,
  completeness: number
): string[] => {
  const recommendations: string[] = [];

  // Recomendações baseadas na confiabilidade
  if (reliability < 0.5) {
    recommendations.push('Considere preencher avaliações com mais regularidade para aumentar a confiabilidade da análise.');
  }

  // Recomendações baseadas na completude
  if (completeness < 0.7) {
    recommendations.push('Procure responder todas as categorias nas avaliações para uma análise mais precisa.');
  }

  // Recomendações baseadas na consistência por categoria
  Object.entries(consistency).forEach(([category, data]) => {
    if (data.score < 0.6) {
      recommendations.push(`Avaliações na categoria "${category}" apresentam inconsistências significativas. Considere refletir mais profundamente sobre esta área.`);
    }
    if (data.flags.length > 0) {
      recommendations.push(`Atenção para a categoria "${category}": ${data.flags.join(', ')}`);
    }
  });

  return recommendations;
};

// Helper functions
export const calculateTrend = (scores: number[]): 'improving' | 'stable' | 'declining' => {
  if (scores.length < 2) return 'stable';
  
  const recentAvg = average(scores.slice(-3));
  const previousAvg = average(scores.slice(-6, -3));
  
  if (recentAvg > previousAvg + 0.5) return 'improving';
  if (recentAvg < previousAvg - 0.5) return 'declining';
  return 'stable';
};

export const analyzeConvergence = (userScores: number[], partnerScores: number[]): 'converging' | 'stable' | 'diverging' => {
  if (userScores.length < 2 || partnerScores.length < 2) return 'stable';
  
  const recentDiff = Math.abs(userScores[userScores.length - 1] - partnerScores[partnerScores.length - 1]);
  const previousDiff = Math.abs(userScores[userScores.length - 2] - partnerScores[partnerScores.length - 2]);
  
  if (recentDiff < previousDiff - 0.3) return 'converging';
  if (recentDiff > previousDiff + 0.3) return 'diverging';
  return 'stable';
};

export const calculateVolatility = (scores: number[]): number => {
  if (scores.length < 2) return 0;
  return standardDeviation(scores);
};

export const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return Math.min(5, numbers.reduce((sum, num) => sum + Math.min(5, num), 0) / numbers.length);
};

export const standardDeviation = (numbers: number[]): number => {
  const avg = average(numbers);
  const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
  return Math.sqrt(average(squareDiffs));
};

export const last = <T>(array: T[]): T => array[array.length - 1]; 

export const calculateOverallSatisfaction = (
  assessment: DailyAssessment,
  addDebugLog?: (category: 'CommunicationQuality' | 'OverallSatisfaction', message: string, data?: any) => void
): number => {
  // Log initial data
  addDebugLog?.('OverallSatisfaction', 'Starting calculation with assessment', {
    id: assessment.id,
    timestamp: assessment.timestamp,
    ratings: assessment.ratings,
    validatedScales: assessment.validatedScales
  });

  if (!assessment.ratings) {
    addDebugLog?.('OverallSatisfaction', 'No ratings available');
    return 0;
  }

  // Helper to distinguish between unset and zero values
  const getValue = (value: number | undefined | null) => {
    return value === undefined || value === null ? 0 : value;
  };

  // Map the Portuguese field names to their English counterparts and normalize from 0-7 to 0-1
  const normalize = (value: number) => value / 7; // Convert from 0-7 scale to 0-1 scale
  
  const {
    // Core emotional metrics (30%)
    segurancaRelacionamento = undefined,
    conexaoEmocional = undefined,
    saudeMental = undefined,
    
    // Intimacy metrics (20%)
    intimidade = undefined,
    intimidadeFisica = undefined,
    
    // Communication metrics (20%)
    comunicacao = undefined,
    transparenciaConfianca = undefined,
    resolucaoConflitos = undefined,
    
    // Support & Growth metrics (30%)
    apoioMutuo = undefined,
    qualidadeTempo = undefined,
    autocuidado = undefined,
    alinhamentoObjetivos = undefined,
    gratidao = undefined
  } = assessment.ratings;

  // Get values, marking explicitly which are unset vs zero
  const values = {
    emotionalSecurity: getValue(segurancaRelacionamento),
    emotionalConnection: getValue(conexaoEmocional),
    mentalHealth: getValue(saudeMental),
    intimacy: getValue(intimidade),
    physicalIntimacy: getValue(intimidadeFisica),
    communication: getValue(comunicacao),
    trust: getValue(transparenciaConfianca),
    conflictResolution: getValue(resolucaoConflitos),
    mutualSupport: getValue(apoioMutuo),
    timeQuality: getValue(qualidadeTempo),
    selfCare: getValue(autocuidado),
    goalAlignment: getValue(alinhamentoObjetivos),
    gratitude: getValue(gratidao)
  };

  // Log raw values
  addDebugLog?.('OverallSatisfaction', 'Raw values before normalization', values);

  // Count how many fields are set in each component
  const counts = {
    emotional: [values.emotionalSecurity, values.emotionalConnection, values.mentalHealth].filter(v => v !== undefined).length,
    intimacy: [values.intimacy, values.physicalIntimacy].filter(v => v !== undefined).length,
    communication: [values.communication, values.trust, values.conflictResolution].filter(v => v !== undefined).length,
    support: [values.mutualSupport, values.timeQuality, values.selfCare, values.goalAlignment, values.gratitude].filter(v => v !== undefined).length
  };

  // Log field counts
  addDebugLog?.('OverallSatisfaction', 'Field counts per component', counts);

  // Calculate component scores, only averaging set values
  const emotionalScore = normalize(
    [values.emotionalSecurity, values.emotionalConnection, values.mentalHealth]
      .reduce((sum, val) => sum + val, 0) / Math.max(counts.emotional, 1)
  );
  
  const intimacyScore = normalize(
    [values.intimacy, values.physicalIntimacy]
      .reduce((sum, val) => sum + val, 0) / Math.max(counts.intimacy, 1)
  );
  
  const communicationScore = normalize(
    [values.communication, values.trust, values.conflictResolution]
      .reduce((sum, val) => sum + val, 0) / Math.max(counts.communication, 1)
  );
  
  const supportScore = normalize(
    [values.mutualSupport, values.timeQuality, values.selfCare, values.goalAlignment, values.gratitude]
      .reduce((sum, val) => sum + val, 0) / Math.max(counts.support, 1)
  );

  addDebugLog?.('OverallSatisfaction', 'Component scores after normalization', {
    raw: {
      emotional: { 
        emotionalSecurity: values.emotionalSecurity, 
        emotionalConnection: values.emotionalConnection,
        mentalHealth: values.mentalHealth
      },
      intimacy: { 
        intimacy: values.intimacy, 
        physicalIntimacy: values.physicalIntimacy
      },
      communication: { 
        communication: values.communication, 
        trust: values.trust,
        conflictResolution: values.conflictResolution
      },
      support: { 
        mutualSupport: values.mutualSupport, 
        timeQuality: values.timeQuality,
        selfCare: values.selfCare,
        goalAlignment: values.goalAlignment,
        gratitude: values.gratitude
      }
    },
    normalized: {
      emotionalScore,
      intimacyScore,
      communicationScore,
      supportScore
    },
    counts,
    rawRatings: assessment.ratings
  });

  // Get validated scales scores if available and normalize them
  const validatedScores = {
    das: assessment.validatedScales?.das?.total ?? 0,
    csi: assessment.validatedScales?.csi?.total ?? 0
  };

  addDebugLog?.('OverallSatisfaction', 'Validated scales', {
    raw: validatedScores,
    normalized: {
      das: validatedScores.das / 151, // DAS max score is 151
      csi: validatedScores.csi / 81   // CSI max score is 81
    }
  });

  // Calculate weighted average of component scores
  const baseScore = (
    (emotionalScore * 0.3) +      // Emotional aspects 30%
    (intimacyScore * 0.2) +       // Intimacy 20%
    (communicationScore * 0.2) +   // Communication 20%
    (supportScore * 0.3)          // Support & Growth 30%
  );

  // Adjust with validated scales if available
  const adjustedScore = validatedScores.das > 0 || validatedScores.csi > 0
    ? (baseScore * 0.6) +
      (((validatedScores.das / 151) * 0.2) + // DAS max score is 151
       ((validatedScores.csi / 81) * 0.2))   // CSI max score is 81
    : baseScore;

  addDebugLog?.('OverallSatisfaction', 'Score calculation', {
    baseScore,
    adjustedScore,
    weightedComponents: {
      emotional: emotionalScore * 0.3,
      intimacy: intimacyScore * 0.2,
      communication: communicationScore * 0.2,
      support: supportScore * 0.3,
      das: validatedScores.das > 0 ? (validatedScores.das / 151) * 0.2 : 0,
      csi: validatedScores.csi > 0 ? (validatedScores.csi / 81) * 0.2 : 0
    }
  });

  // Convert to percentage and ensure it's between 0 and 100
  const finalScore = Math.min(1, Math.max(0, adjustedScore)) * 100;
  
  addDebugLog?.('OverallSatisfaction', 'Final score', {
    adjustedScore,
    finalScore,
    asPercentage: `${Math.round(finalScore)}%`
  });

  return finalScore;
}; 