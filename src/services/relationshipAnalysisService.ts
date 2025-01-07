import { MoodEntry, MoodType, RelationshipAnalysis, MoodDiscrepancy, RelationshipContext } from '../types/index';
import { POSITIVE_MOODS, NEGATIVE_MOODS } from './moodService';
import { v4 as uuidv4 } from 'uuid';

// Constantes baseadas em estudos psicológicos
const EMOTIONAL_SYNC_THRESHOLD = 0.6; // Gottman's research sobre estabilidade emocional
const NEGATIVE_AFFECT_THRESHOLD = 0.7; // Baseado em estudos de John Gottman sobre razão de afeto positivo/negativo

const initializeMoodFrequency = (): Record<MoodType, number> => ({
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

export const analyzeRelationshipEmotions = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): RelationshipAnalysis => {
  const analysis: RelationshipAnalysis = {
    id: uuidv4(),
    userId: userEntries[0]?.userId || '',
    partnerId: partnerEntries[0]?.userId || '',
    date: new Date().toISOString(),
    type: 'individual',
    overallHealth: {
      score: 0,
      trend: 'stable',
      confidence: 0.8
    },
    categories: {},
    strengthsAndChallenges: {
      strengths: [],
      challenges: []
    },
    communicationSuggestions: [],
    actionItems: [],
    relationshipDynamics: {
      strengths: [],
      challenges: [],
      recommendations: []
    },
    emotionalDynamics: {
      synchronicity: 0.8,
      stability: 0.7,
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
        patterns: [],
        confidence: 0.8
      },
      patterns: {
        user: {
          dominant: 'feliz' as MoodType,
          frequency: initializeMoodFrequency(),
          transitions: {}
        },
        partner: {
          dominant: 'feliz' as MoodType,
          frequency: initializeMoodFrequency(),
          transitions: {}
        }
      },
      insights: {
        strengths: [],
        challenges: [],
        recommendations: []
      }
    },
    emotionalSync: 0,
    moodDiscrepancies: [],
    insights: [],
    riskFactors: [],
    recommendations: [],
    validatedScales: {
      das: {
        consenso: 0,
        satisfacao: 0,
        coesao: 0,
        expressaoAfetiva: 0,
        total: 0
      },
      csi: {
        satisfacaoGlobal: 0,
        estabilidade: 0,
        comprometimento: 0,
        comunicacao: 0,
        gestaoConflitos: 0,
        atividadesCompartilhadas: 0,
        total: 0
      },
      gottman: {
        fourHorsemen: {
          critica: 0,
          defensividade: 0,
          desprezo: 0,
          stonewalling: 0
        },
        bidsForConnection: {
          tentativas: 0,
          respostasPositivas: 0,
          respostasNegativas: 0,
          respostasNeutras: 0
        },
        resolucaoConflitos: 0,
        significadoCompartilhado: 0,
        reparacao: 0,
        influenciaPositiva: 0
      },
      attachment: {
        ecr: {
          ansiedade: 0,
          evitacao: 0,
          anxiety: 0,
          avoidance: 0
        },
        securityLevel: 0,
        attachmentStyle: {
          primary: 'secure',
          description: 'Secure attachment style',
          recommendations: ['Continue fostering trust and open communication']
        },
        padraoApego: {
          primary: 'secure',
          description: 'Padrão de apego seguro',
          recommendations: ['Manter comunicação aberta e confiança']
        },
        compatibilidadeApego: 0
      },
      consistency: {
        default: {
          score: 0,
          confidence: 0,
          flags: []
        }
      },
      reliability: 0,
      completeness: 0,
      recommendations: [],
      isValid: true,
      errors: []
    },
    gptAnalysis: {
      id: uuidv4(),
      userId: userEntries[0]?.userId || '',
      partnerId: partnerEntries[0]?.userId || '',
      date: new Date().toISOString(),
      type: 'individual',
      analysis: {
        moodPatterns: {
          user: {
            dominant: 'feliz',
            frequency: initializeMoodFrequency(),
            transitions: {}
          },
          partner: {
            dominant: 'feliz',
            frequency: initializeMoodFrequency(),
            transitions: {}
          },
          overall: {
            synchronicity: 0,
            stability: 0,
            variability: 0
          }
        },
        communicationMetrics: {
          quality: 0,
          frequency: 0,
          depth: 0,
          patterns: []
        },
        relationshipDynamics: {
          strengths: [],
          challenges: [],
          recommendations: []
        },
        attachmentInsights: {
          style: '',
          behaviors: [],
          triggers: [],
          suggestions: []
        }
      },
      timestamp: new Date().toISOString(),
      version: '1.0',
      metadata: {
        assessmentCount: 0,
        timeSpan: '',
        confidence: 0
      }
    },
    metadata: {
      assessmentCount: 0,
      timeSpan: '',
      confidence: 0,
      lastUpdate: new Date().toISOString()
    }
  };

  // Calcular sincronização emocional
  analysis.emotionalSync = calculateEmotionalSync(userEntries, partnerEntries);

  // Analisar discrepâncias de humor
  const discrepancies = analyzeMoodDiscrepancies(userEntries, partnerEntries);
  analysis.moodDiscrepancies = discrepancies.map(d => ({
    userMood: d.userMood,
    partnerMood: d.partnerMood,
    difference: Math.abs(d.impact === 'alto' ? 3 : d.impact === 'médio' ? 2 : 1),
    pattern: 'divergent',
    type: 'divergent',
    description: 'Mood discrepancy detected',
    severity: d.impact === 'alto' ? 'high' : d.impact === 'médio' ? 'medium' : 'low',
    impact: d.impact,
    timestamp: d.timestamp
  }));

  // Gerar insights baseados em pesquisas psicológicas
  generateRelationshipInsights(analysis, userEntries, partnerEntries);

  return analysis;
};

export const calculateEmotionalSync = (userEntries: MoodEntry[], partnerEntries: MoodEntry[]): number => {
  if (!userEntries.length || !partnerEntries.length) return 0;

  let syncScore = 0;
  let comparisons = 0;

  userEntries.forEach(userEntry => {
    const matchingEntry = findClosestEntry(userEntry, partnerEntries);
    if (matchingEntry) {
      syncScore += calculateMoodSimilarity(userEntry.mood, matchingEntry.mood);
      comparisons++;
    }
  });

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

  return sameCategory ? (1 - intensityDiff) : (0.3 - intensityDiff);
};

const analyzeMoodDiscrepancies = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): Array<{
  userMood: MoodType;
  partnerMood: MoodType;
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
          userMood: userEntry.mood.primary,
          partnerMood: matchingEntry.mood.primary,
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
        id: uuidv4(),
        type: 'warning',
        category: 'emotional_sync',
        description: 'Baixa sincronização emocional detectada',
        confidence: 0.8,
        impact: 'high',
        timestamp: new Date().toISOString()
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

  if (analysis.moodDiscrepancies && analysis.moodDiscrepancies.some(d => d.severity === 'high')) {
    if (analysis.recommendations) {
      analysis.recommendations.push(
        'Desenvolva rituais de reconexão após momentos de discrepância emocional',
        'Pratique exercícios de empatia e compreensão mútua'
      );
    }
  }
};

export const createDefaultRelationshipContext = (): RelationshipContext => ({
  type: '',
  duration: '',
  status: 'dating',
  relationshipStyle: '',
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
  qualityTime: 'no',
  qualityTimeDescription: '',
  physicalIntimacy: 'no',
  intimacyImprovements: [],
  additionalInfo: '',
  areasNeedingAttention: []
});

export const calculateMoodStability = (entries: MoodEntry[]): number => {
  if (entries.length < 2) return 1;
  
  const moodChanges = entries.slice(1).filter((entry, i) => 
    entry.mood.primary !== entries[i].mood.primary
  ).length;
  
  return 1 - (moodChanges / (entries.length - 1));
}; 