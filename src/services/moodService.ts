import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { MoodEntry, MoodAnalysis, MoodType, CategoryRatings } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import { POSITIVE_MOODS, NEGATIVE_MOODS } from './moodConstants';
import { 
  DEFAULT_MOOD_INTENSITY, 
  MAX_MOOD_INTENSITY,
  MAX_TIME_GAP,
  MIN_CONFIDENCE,
  DEFAULT_CONFIDENCE
} from './calculos/calculosBase';

export { POSITIVE_MOODS, NEGATIVE_MOODS };

// Função auxiliar para logging
const logMoodService = (action: string, data?: any) => {
  console.log(`[MoodService] ${action}`, data ? data : '');
};

export const saveMoodEntry = async (
  userId: string,
  mood: MoodType,
  intensity: number,
  activities?: string[],
  notes?: string,
  secondaryMoods?: MoodType[],
  triggers?: string[],
  location?: string,
  socialContext?: string[]
): Promise<void> => {
  try {
    logMoodService('Iniciando salvamento de entrada de humor', { userId, mood, intensity });

    const newEntry: Omit<MoodEntry, 'id'> = {
      userId,
      timestamp: new Date().toISOString(),
      mood: {
        primary: mood,
        intensity,
        ...(secondaryMoods?.length ? { secondary: secondaryMoods } : {})
      },
      ...(activities || triggers || location || socialContext ? {
        context: {
          activities: activities || [],
          triggers: triggers || [],
          location: location || '',
          socialContext: socialContext || [],
          intensity: intensity || 0,
          duration: undefined
        }
      } : {}),
      ...(notes ? { notes } : {}),
      createdAt: new Date().toISOString()
    };

    logMoodService('Entrada formatada', newEntry);
    
    const docRef = await addDoc(collection(db, 'moodEntries'), newEntry);
    logMoodService('Entrada salva com sucesso', { docId: docRef.id });
  } catch (error) {
    logMoodService('Erro ao salvar entrada', error);
    console.error('Error saving mood entry:', error);
    throw error;
  }
};

export const getUserMoodEntries = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<MoodEntry[]> => {
  try {
    logMoodService('Buscando entradas de humor', { userId, startDate, endDate });

    const moodEntriesRef = collection(db, 'moodEntries');
    let queryConstraints: any[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    ];

    if (startDate) {
      queryConstraints.push(where('timestamp', '>=', startDate));
    }
    if (endDate) {
      queryConstraints.push(where('timestamp', '<=', endDate));
    }

    const q = query(moodEntriesRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MoodEntry));

    logMoodService('Entradas recuperadas', { count: entries.length });
    return entries;
  } catch (error) {
    logMoodService('Erro ao buscar entradas', error);
    if (error instanceof Error && error.message.includes('index')) {
      console.error('Please create the required index using the following URL:', 
        error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0]);
    }
    throw error;
  }
};

interface TimePattern {
  moods: Record<string, number>;
  count: number;
}

interface TimePatterns {
  hourly: Record<number, TimePattern>;
  daily: Record<number, TimePattern>;
  weekly: Record<number, TimePattern>;
  monthly: Record<number, TimePattern>;
}

interface MoodPatternData {
  activityMoodMap: Record<string, { moods: Record<string, number>; count: number }>;
  timePatterns: TimePatterns;
  moodTransitions: Record<string, number>;
  sortedEntries: MoodEntry[];
}

function incrementTimePattern(
  patternObj: Record<number, TimePattern>,
  index: number,
  mood: string
) {
  if (!patternObj[index]) {
    patternObj[index] = { moods: {}, count: 0 };
  }
  patternObj[index].moods[mood] = (patternObj[index].moods[mood] || 0) + 1;
  patternObj[index].count++;
}

function analyzeMoodPatternData(entries: MoodEntry[]): MoodPatternData {
  // Sort entries once
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const activityMoodMap: Record<string, { moods: Record<string, number>; count: number }> = {};
  const moodTransitions: Record<string, number> = {};
  const timePatterns: TimePatterns = {
    hourly: {},
    daily: {},
    weekly: {},
    monthly: {}
  };

  // Process entries in a single pass
  sortedEntries.forEach((entry, index) => {
    const date = new Date(entry.timestamp);
    const mood = entry.mood.primary;
    
    // Activity-mood correlations
    if (entry.context?.activities) {
      entry.context.activities.forEach(activity => {
        if (!activityMoodMap[activity]) {
          activityMoodMap[activity] = { moods: {}, count: 0 };
        }
        activityMoodMap[activity].moods[mood] = 
          (activityMoodMap[activity].moods[mood] || 0) + 1;
        activityMoodMap[activity].count++;
      });
    }

    // Time patterns
    incrementTimePattern(timePatterns.hourly, date.getHours(), mood);
    incrementTimePattern(timePatterns.daily, date.getDay(), mood);
    incrementTimePattern(timePatterns.weekly, Math.floor(date.getDate() / 7), mood);
    incrementTimePattern(timePatterns.monthly, date.getMonth(), mood);

    // Mood transitions
    if (index > 0) {
      const prevMood = sortedEntries[index - 1].mood.primary;
      const transitionKey = `${prevMood} → ${mood}`;
      moodTransitions[transitionKey] = (moodTransitions[transitionKey] || 0) + 1;
    }
  });

  return {
    activityMoodMap,
    timePatterns,
    moodTransitions,
    sortedEntries
  };
}

export const calculateEmotionalVariability = (entries: MoodEntry[]): number => {
  if (entries.length < 2) return 0;
  
  const { sortedEntries } = analyzeMoodPatternData(entries);
  
  let variabilitySum = 0;
  for (let i = 1; i < sortedEntries.length; i++) {
    const intensityDiff = Math.abs(
      (sortedEntries[i].mood.intensity || DEFAULT_MOOD_INTENSITY) - 
      (sortedEntries[i - 1].mood.intensity || DEFAULT_MOOD_INTENSITY)
    );
    variabilitySum += intensityDiff;
  }
  
  return Math.min(variabilitySum / (sortedEntries.length - 1) / MAX_MOOD_INTENSITY, 1);
};

const MOOD_VALENCE: Record<MoodType, number> = {
  feliz: 1,
  animado: 0.8,
  grato: 0.7,
  calmo: 0.6,
  satisfeito: 0.5,
  amado: 0.9,
  neutral: 0,
  content: 0.3,
  ansioso: -0.4,
  estressado: -0.6,
  triste: -0.8,
  irritado: -0.7,
  frustrado: -0.5,
  exausto: -0.3,
  confuso: -0.2,
  solitário: -0.6
};

const calculateMoodStabilityLegacy = (entries: MoodEntry[]): number => {
  console.log('[MoodStability] Starting calculation with entries:', {
    totalEntries: entries.length,
    timestamps: entries.map(e => new Date(e.timestamp).toISOString()),
    moods: entries.map(e => e.mood.primary)
  });

  if (entries.length < 2) {
    console.log('[MoodStability] Not enough entries, returning MIN_CONFIDENCE');
    return MIN_CONFIDENCE;
  }
  
  // Sort entries chronologically (oldest first)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  let totalWeightedChange = 0;
  let totalWeight = 0;
  
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevEntry = sortedEntries[i - 1];
    const currentEntry = sortedEntries[i];
    
    // Calculate valence change
    const prevValence = MOOD_VALENCE[prevEntry.mood.primary];
    const currentValence = MOOD_VALENCE[currentEntry.mood.primary];
    const valenceChange = Math.abs(currentValence - prevValence);
    
    // Calculate intensity change
    const prevIntensity = prevEntry.mood.intensity || DEFAULT_MOOD_INTENSITY;
    const currentIntensity = currentEntry.mood.intensity || DEFAULT_MOOD_INTENSITY;
    const intensityChange = Math.abs(currentIntensity - prevIntensity) / MAX_MOOD_INTENSITY;
    
    // Calculate time weight
    const timeDiff = new Date(currentEntry.timestamp).getTime() - new Date(prevEntry.timestamp).getTime();
    const timeWeight = Math.max(0, 1 - (timeDiff / MAX_TIME_GAP));
    
    // Combine valence and intensity changes
    const moodChange = (valenceChange * 0.7) + (intensityChange * 0.3);
    
    // Apply time weight
    const weightedChange = moodChange * timeWeight;
    
    console.log('[MoodStability] Comparing entries:', {
      prevMood: {
        type: prevEntry.mood.primary,
        valence: prevValence,
        intensity: prevIntensity,
        timestamp: new Date(prevEntry.timestamp).toISOString()
      },
      currentMood: {
        type: currentEntry.mood.primary,
        valence: currentValence,
        intensity: currentIntensity,
        timestamp: new Date(currentEntry.timestamp).toISOString()
      },
      changes: {
        valenceChange,
        intensityChange,
        timeDiffDays: timeDiff / (24 * 60 * 60 * 1000),
        timeWeight,
        moodChange,
        weightedChange
      }
    });
    
    totalWeightedChange += weightedChange;
    totalWeight += timeWeight;
  }
  
  // Calculate final stability score
  const averageChange = totalWeight > 0 ? totalWeightedChange / totalWeight : 0;
  const stabilityScore = Math.max(0, Math.min(1, 1 - averageChange));
  
  console.log('[MoodStability] Final calculation:', {
    totalWeightedChange,
    totalWeight,
    averageChange,
    stabilityScore
  });

  return stabilityScore;
};

const calculateRecoveryResilience = (entries: MoodEntry[]): number => {
  if (entries.length < 2) return 1;
  
  let recoveryCount = 0;
  let negativeSequences = 0;
  
  for (let i = 1; i < entries.length; i++) {
    const prevMood = entries[i - 1].mood.primary;
    const currentMood = entries[i].mood.primary;
    
    if (NEGATIVE_MOODS.includes(prevMood) && POSITIVE_MOODS.includes(currentMood)) {
      recoveryCount++;
    }
    if (NEGATIVE_MOODS.includes(prevMood)) {
      negativeSequences++;
    }
  }
  
  return negativeSequences > 0 ? recoveryCount / negativeSequences : 1;
};

const generateMoodInsights = (entries: MoodEntry[], analysis: MoodAnalysis): MoodAnalysis['insights'] => {
  const insights: MoodAnalysis['insights'] = [];

  // Pattern insights
  if (analysis.metrics.emotionalVariability > 0.7) {
    insights.push({
      id: uuidv4(),
      type: 'pattern',
      description: 'Padrão de humor recorrente detectado',
      confidence: DEFAULT_CONFIDENCE,
      impact: 'high',
      category: 'mood_pattern',
      timestamp: new Date().toISOString()
    });
  }

  // Activity correlations
  const activityMoodMap = new Map<string, Map<MoodType, number>>();
  entries.forEach(entry => {
    if (entry.context?.activities) {
      entry.context.activities.forEach((activity: string) => {
        if (!activityMoodMap.has(activity)) {
          activityMoodMap.set(activity, new Map());
        }
        const moodCount = activityMoodMap.get(activity)!.get(entry.mood.primary) || 0;
        activityMoodMap.get(activity)!.set(entry.mood.primary, moodCount + 1);
      });
    }
  });

  activityMoodMap.forEach((moodCounts, activity) => {
    const dominantMood = Array.from(moodCounts.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    if (POSITIVE_MOODS.includes(dominantMood)) {
      insights.push({
        id: uuidv4(),
        type: 'observation',
        description: `A atividade "${activity}" está frequentemente associada a humor positivo`,
        confidence: DEFAULT_CONFIDENCE,
        impact: 'medium',
        category: 'activities',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Recovery patterns
  if (analysis.metrics.recoveryResilience < 0.3) {
    insights.push({
      id: uuidv4(),
      type: 'warning',
      description: 'Baixa resiliência emocional detectada',
      confidence: DEFAULT_CONFIDENCE,
      impact: 'high',
      category: 'resilience',
      timestamp: new Date().toISOString()
    });
  }

  return insights;
};

export const correlateWithCategories = async (
  moodEntries: MoodEntry[],
  categoryRatings: CategoryRatings[]
): Promise<Array<{category: keyof CategoryRatings; correlation: number}>> => {
  const correlations: Array<{category: keyof CategoryRatings; correlation: number}> = [];
  
  // Get all categories
  const categories = Object.keys(categoryRatings[0]) as Array<keyof CategoryRatings>;
  
  categories.forEach(category => {
    const moodScores = moodEntries.map(entry => 
      POSITIVE_MOODS.includes(entry.mood.primary) ? entry.mood.intensity : -entry.mood.intensity
    );
    
    const categoryScores = categoryRatings.map(rating => rating[category]);
    
    const correlation = calculatePearsonCorrelation(moodScores, categoryScores);
    correlations.push({ category, correlation });
  });
  
  return correlations;
};

const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const sum1 = x.reduce((a, b) => a + b, 0);
  const sum2 = y.reduce((a, b) => a + b, 0);
  const sum1Sq = x.reduce((a, b) => a + b * b, 0);
  const sum2Sq = y.reduce((a, b) => a + b * b, 0);
  const pSum = x.reduce((a, b, i) => a + b * y[i], 0);

  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

  return den === 0 ? 0 : num / den;
};

// Constants for positive/negative ratio
const DEFAULT_POSITIVE_RATIO = 2;
const NEUTRAL_POSITIVE_RATIO = 1;

const calculatePositiveNegativeRatio = (entries: MoodEntry[]): number => {
  if (!entries.length) return 0;

  const positiveCount = entries.filter(entry => 
    POSITIVE_MOODS.includes(entry.mood.primary)
  ).length;

  const negativeCount = entries.filter(entry => 
    NEGATIVE_MOODS.includes(entry.mood.primary)
  ).length;

  return negativeCount > 0 ? positiveCount / negativeCount : 
         positiveCount > 0 ? DEFAULT_POSITIVE_RATIO : NEUTRAL_POSITIVE_RATIO;
};

interface TimeBasedPattern {
  time: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
  dominantMood: string;
  distribution: Array<{
    mood: string;
    percentage: number;
  }>;
}

interface TrendResult {
  direction: 'improving' | 'stable' | 'declining';
  significance: 'low' | 'medium' | 'high';
}

interface MoodTrends {
  [key: string]: TrendResult;
}

const generateTimeBasedPatterns = (
  patterns: Record<number, TimePattern>,
  timeframe: 'daily' | 'weekly' | 'monthly'
): TimeBasedPattern[] => {
  return Object.entries(patterns).map(([time, data]) => {
    const moodDistribution = Object.entries(data.moods).map(([mood, count]) => ({
      mood,
      percentage: (count / data.count) * 100
    }));

    const dominantMood = moodDistribution
      .reduce((a, b) => a.percentage > b.percentage ? a : b).mood;

    return {
      time: parseInt(time),
      timeframe,
      dominantMood,
      distribution: moodDistribution
    };
  });
};

const calculateMoodTrends = (entries: MoodEntry[]): MoodTrends => {
  if (entries.length < 2) {
    return {
      overall: { direction: 'stable', significance: 'low' },
      positiveNegativeRatio: { direction: 'stable', significance: 'low' }
    };
  }

  const intensities = entries.map(entry => entry.mood.intensity || DEFAULT_MOOD_INTENSITY);
  const trend = calculateLinearRegression(
    entries.map(entry => new Date(entry.timestamp).getTime()),
    intensities
  );

  // Calculate significance based on relative change
  const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const relativeChange = Math.abs(trend / avgIntensity);

  let significance: 'low' | 'medium' | 'high';
  if (relativeChange < 0.1) {
    significance = 'low';
  } else if (relativeChange < 0.3) {
    significance = 'medium';
  } else {
    significance = 'high';
  }

  const direction: 'improving' | 'stable' | 'declining' = 
    Math.abs(trend) < 0.1 ? 'stable' :
    trend > 0 ? 'improving' : 'declining';

  const result: TrendResult = { direction, significance };

  return {
    overall: result,
    positiveNegativeRatio: result
  };
};

const calculateLinearRegression = (x: number[], y: number[]): number => {
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};

export const analyzeMoodPatterns = async (entries: MoodEntry[], timeframe: 'daily' | 'weekly' | 'monthly'): Promise<MoodAnalysis | null> => {
  if (!entries.length) return null;

  const { activityMoodMap, timePatterns, moodTransitions, sortedEntries } = analyzeMoodPatternData(entries);

  // Calculate mood frequencies
  const moodFrequencyMap = new Map<MoodType, { count: number, totalIntensity: number }>();
  sortedEntries.forEach(entry => {
    const mood = entry.mood.primary;
    const current = moodFrequencyMap.get(mood) || { count: 0, totalIntensity: 0 };
    moodFrequencyMap.set(mood, {
      count: current.count + 1,
      totalIntensity: current.totalIntensity + (entry.mood.intensity || 3)
    });
  });

  // Calculate dominant moods
  const dominantMoods = Array.from(moodFrequencyMap.entries())
    .map(([mood, stats]) => ({
      mood,
      frequency: stats.count,
      averageIntensity: stats.totalIntensity / stats.count
    }))
    .sort((a, b) => b.frequency - a.frequency);

  // Generate time-based patterns
  const dailyPatterns = generateTimeBasedPatterns(timePatterns.daily, 'daily');
  const weeklyPatterns = generateTimeBasedPatterns(timePatterns.weekly, 'weekly');
  const monthlyPatterns = generateTimeBasedPatterns(timePatterns.monthly, 'monthly');

  // Format patterns as strings for backwards compatibility
  const daily = dailyPatterns.map(pattern => 
    `${Math.round(pattern.distribution.find(d => d.mood === pattern.dominantMood)?.percentage || 0)}% ${pattern.dominantMood} durante ${getDayName(pattern.time)}`
  );
  const weekly = weeklyPatterns.map(pattern =>
    `${Math.round(pattern.distribution.find(d => d.mood === pattern.dominantMood)?.percentage || 0)}% ${pattern.dominantMood} durante semana ${pattern.time + 1}`
  );
  const monthly = monthlyPatterns.map(pattern =>
    `${Math.round(pattern.distribution.find(d => d.mood === pattern.dominantMood)?.percentage || 0)}% ${pattern.dominantMood} durante ${getMonthName(pattern.time)}`
  );

  // Calculate trends
  const trends = calculateMoodTrends(sortedEntries);

  // Calculate metrics
  const metrics = {
    emotionalVariability: calculateEmotionalVariability(entries),
    positiveNegativeRatio: calculatePositiveNegativeRatio(entries),
    recoveryResilience: calculateRecoveryResilience(entries),
    moodStability: calculateMoodStabilityLegacy(entries)
  };

  return {
    patterns: {
      dominantMoods,
      moodTransitions: Object.entries(moodTransitions)
        .sort(([, a], [, b]) => b - a)
        .map(([transition]) => transition),
      timePatterns: {
        daily: dailyPatterns,
        weekly: weeklyPatterns,
        monthly: monthlyPatterns
      },
      daily,
      weekly,
      monthly
    },
    insights: generateMoodInsights(entries, {
      patterns: {
        dominantMoods,
        moodTransitions: Object.entries(moodTransitions)
          .sort(([, a], [, b]) => b - a)
          .map(([transition]) => transition),
        timePatterns: {
          daily: dailyPatterns,
          weekly: weeklyPatterns,
          monthly: monthlyPatterns
        },
        daily,
        weekly,
        monthly
      },
      insights: [],
      trends,
      metrics
    }),
    trends,
    metrics
  };
};

const getDayName = (day: number): string => {
  const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return days[day];
};

const getMonthName = (month: number): string => {
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return months[month];
}; 