import { MoodEntry, MoodType, RelationshipAnalysis } from '../types/index';
import { POSITIVE_MOODS, NEGATIVE_MOODS } from './moodService';

// Constantes baseadas em estudos psicológicos
const EMOTIONAL_SYNC_THRESHOLD = 0.6; // Gottman's research sobre estabilidade emocional
const NEGATIVE_AFFECT_THRESHOLD = 0.7; // Baseado em estudos de John Gottman sobre razão de afeto positivo/negativo

export const analyzeRelationshipEmotions = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): RelationshipAnalysis => {
  const analysis: RelationshipAnalysis = {
    overallHealth: {
      score: 0,
      trend: 'stable'
    },
    categories: {},
    strengthsAndChallenges: {
      strengths: [],
      challenges: []
    },
    communicationSuggestions: [],
    actionItems: [],
    relationshipDynamics: {
      positivePatterns: [],
      concerningPatterns: [],
      growthAreas: []
    },
    emotionalDynamics: {
      emotionalSecurity: 0,
      intimacyBalance: {
        score: 0,
        areas: {
          emotional: 0,
          physical: 0,
          intellectual: 0,
          shared: 0
        }
      },
      conflictResolution: {
        style: 'collaborative',
        effectiveness: 0,
        patterns: []
      }
    },
    emotionalSync: 0,
    moodDiscrepancies: [],
    insights: [],
    riskFactors: [],
    recommendations: []
  };

  // Calcular sincronização emocional
  analysis.emotionalSync = calculateEmotionalSync(userEntries, partnerEntries);

  // Analisar discrepâncias de humor
  analysis.moodDiscrepancies = analyzeMoodDiscrepancies(userEntries, partnerEntries);

  // Gerar insights baseados em pesquisas psicológicas
  generateRelationshipInsights(analysis, userEntries, partnerEntries);

  return analysis;
};

const calculateEmotionalSync = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): number => {
  let syncScore = 0;
  let comparisons = 0;

  // Alinhar entradas por timestamp próximo
  for (const userEntry of userEntries) {
    const matchingEntry = findClosestEntry(userEntry, partnerEntries);
    if (matchingEntry) {
      // Calcular similaridade de humor
      const moodSync = calculateMoodSimilarity(userEntry.mood, matchingEntry.mood);
      syncScore += moodSync;
      comparisons++;
    }
  }

  return comparisons > 0 ? syncScore / comparisons : 0;
};

const findClosestEntry = (entry: MoodEntry, entries: MoodEntry[]): MoodEntry | null => {
  const entryTime = new Date(entry.timestamp).getTime();
  let closest = entries[0];
  let minDiff = Infinity;

  for (const e of entries) {
    const diff = Math.abs(new Date(e.timestamp).getTime() - entryTime);
    if (diff < minDiff && diff < 24 * 60 * 60 * 1000) { // Dentro de 24 horas
      minDiff = diff;
      closest = e;
    }
  }

  return minDiff === Infinity ? null : closest;
};

const calculateMoodSimilarity = (mood1: MoodEntry['mood'], mood2: MoodEntry['mood']): number => {
  // Base na mesma categoria de humor (positivo/negativo)
  const sameCategory = (
    (POSITIVE_MOODS.includes(mood1.primary) && POSITIVE_MOODS.includes(mood2.primary)) ||
    (NEGATIVE_MOODS.includes(mood1.primary) && NEGATIVE_MOODS.includes(mood2.primary))
  );

  // Similaridade de intensidade
  const intensityDiff = Math.abs(mood1.intensity - mood2.intensity) / 5;

  // Consider secondary moods if they exist
  let secondaryMoodScore = 0;
  if (mood1.secondary && mood2.secondary) {
    const commonSecondaryMoods = mood1.secondary.filter(m => mood2.secondary?.includes(m));
    secondaryMoodScore = commonSecondaryMoods.length / Math.max(mood1.secondary.length, mood2.secondary.length);
  }

  return sameCategory ? (1 - intensityDiff + secondaryMoodScore * 0.2) : (0.3 - intensityDiff + secondaryMoodScore * 0.1);
};

const analyzeMoodDiscrepancies = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): Array<{
  userMood: MoodEntry['mood'];
  partnerMood: MoodEntry['mood'];
  impact: 'alto' | 'médio' | 'baixo';
  timestamp: string;
}> => {
  const discrepancies = [];

  for (const userEntry of userEntries) {
    const matchingEntry = findClosestEntry(userEntry, partnerEntries);
    if (matchingEntry) {
      const discrepancyLevel = 1 - calculateMoodSimilarity(userEntry.mood, matchingEntry.mood);
      
      if (discrepancyLevel > 0.3) { // Threshold significativo
        const impact: 'alto' | 'médio' | 'baixo' = discrepancyLevel > 0.7 ? 'alto' : discrepancyLevel > 0.5 ? 'médio' : 'baixo';
        discrepancies.push({
          timestamp: userEntry.timestamp,
          userMood: userEntry.mood,
          partnerMood: matchingEntry.mood,
          impact
        });
      }
    }
  }

  return discrepancies;
};

const generateRelationshipInsights = (
  analysis: RelationshipAnalysis,
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
) => {
  // Análise baseada na teoria de Gottman
  if (analysis.emotionalSync && analysis.emotionalSync < EMOTIONAL_SYNC_THRESHOLD) {
    if (analysis.insights) {
      analysis.insights.push({
        type: 'warning',
        description: 'Baixa sincronização emocional detectada',
        recommendation: 'Considere aumentar momentos de conexão e comunicação emocional'
      });
    }
  }

  // Análise de padrões negativos
  const negativePatterns = detectNegativePatterns(userEntries, partnerEntries);
  if (negativePatterns.length > 0 && analysis.riskFactors) {
    analysis.riskFactors.push(...negativePatterns);
  }

  // Recomendações baseadas em pesquisas
  generateRecommendations(analysis);
};

const detectNegativePatterns = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): string[] => {
  const patterns: string[] = [];

  // Detectar ciclos de negatividade (baseado em Gottman's Four Horsemen)
  const negativityRatio = calculateNegativityRatio(userEntries, partnerEntries);
  if (negativityRatio > NEGATIVE_AFFECT_THRESHOLD) {
    patterns.push('Alto índice de interações negativas detectado');
  }

  // Detectar padrões de desconexão emocional
  if (detectEmotionalDisconnection(userEntries, partnerEntries)) {
    patterns.push('Padrão de desconexão emocional identificado');
  }

  return patterns;
};

const calculateNegativityRatio = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): number => {
  const allEntries = [...userEntries, ...partnerEntries];
  const negativeCount = allEntries.filter(e => NEGATIVE_MOODS.includes(e.mood.primary)).length;
  return negativeCount / allEntries.length;
};

const detectEmotionalDisconnection = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): boolean => {
  let disconnectionCount = 0;
  const threshold = 3; // Número de ocorrências consecutivas

  for (const userEntry of userEntries) {
    const matchingEntry = findClosestEntry(userEntry, partnerEntries);
    if (matchingEntry && calculateMoodSimilarity(userEntry.mood, matchingEntry.mood) < 0.2) {
      disconnectionCount++;
      if (disconnectionCount >= threshold) return true;
    } else {
      disconnectionCount = 0;
    }
  }

  return false;
};

const generateRecommendations = (analysis: RelationshipAnalysis) => {
  // Recomendações baseadas em pesquisas de terapia de casal
  if (analysis.emotionalSync && analysis.emotionalSync < 0.4) {
    if (analysis.recommendations) {
      analysis.recommendations.push(
        'Pratique escuta ativa e validação emocional',
        'Estabeleça momentos diários de conexão emocional',
        'Considere terapia de casal para melhorar a comunicação emocional'
      );
    }
  }

  if (analysis.moodDiscrepancies && analysis.moodDiscrepancies.some(d => d.impact === 'alto')) {
    if (analysis.recommendations) {
      analysis.recommendations.push(
        'Desenvolva rituais de reconexão após momentos de discrepância emocional',
        'Pratique exercícios de empatia e compreensão mútua'
      );
    }
  }
}; 