import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { MoodEntry, MoodAnalysis, MoodType, CategoryRatings } from '../types/index';

// Constants for mood analysis
export const POSITIVE_MOODS: MoodType[] = ['feliz', 'animado', 'grato', 'calmo', 'satisfeito', 'amado'];
export const NEGATIVE_MOODS: MoodType[] = ['ansioso', 'estressado', 'triste', 'irritado', 'frustrado', 'exausto', 'confuso', 'solitário'];

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
          ...(activities?.length ? { activities } : {}),
          ...(triggers?.length ? { triggers } : {}),
          ...(location ? { location } : {}),
          ...(socialContext?.length ? { socialContext } : {})
        }
      } : {}),
      ...(notes ? { notes } : {}),
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'moodEntries'), newEntry);
  } catch (error) {
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
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MoodEntry));
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    // Se o erro for relacionado ao índice, vamos logar a URL para criar o índice
    if (error instanceof Error && error.message.includes('index')) {
      console.error('Please create the required index using the following URL:', 
        error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0]);
    }
    throw error;
  }
};

export const analyzeMoodPatterns = async (entries: MoodEntry[], timeframe: 'daily' | 'weekly' | 'monthly'): Promise<MoodAnalysis | null> => {
  if (!entries.length) return null;

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

  // Rest of the analysis logic...
  return {
    timeframe,
    patterns: {
      dominantMoods: [],
      moodTransitions: [],
      timePatterns: {}
    },
    correlations: {
      activities: [],
      categories: []
    },
    insights: [],
    metrics: {
      emotionalVariability: 0,
      positiveNegativeRatio: 0,
      recoveryResilience: 0,
      moodStability: 0
    }
  };
};

const calculateEmotionalVariability = (entries: MoodEntry[]): number => {
  if (entries.length < 2) return 0;
  
  let variabilitySum = 0;
  for (let i = 1; i < entries.length; i++) {
    const intensityDiff = Math.abs(entries[i].mood.intensity - entries[i - 1].mood.intensity);
    variabilitySum += intensityDiff;
  }
  
  return Math.min(variabilitySum / (entries.length - 1) / 5, 1);
};

const calculateMoodStability = (entries: MoodEntry[]): number => {
  if (entries.length < 2) return 1;
  
  const moodChanges = entries.slice(1).filter((entry, i) => 
    entry.mood.primary !== entries[i].mood.primary
  ).length;
  
  return 1 - (moodChanges / (entries.length - 1));
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
      type: 'pattern',
      description: 'Alta variabilidade emocional detectada',
      confidence: 0.8,
      recommendation: 'Considere práticas de estabilização emocional como meditação ou mindfulness'
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
        type: 'improvement',
        description: `A atividade "${activity}" está frequentemente associada a humor positivo`,
        confidence: 0.7,
        recommendation: `Considere aumentar a frequência de "${activity}" para melhorar seu bem-estar`
      });
    }
  });

  // Recovery patterns
  if (analysis.metrics.recoveryResilience < 0.3) {
    insights.push({
      type: 'warning',
      description: 'Baixa resiliência emocional detectada',
      confidence: 0.75,
      recommendation: 'Desenvolva estratégias de recuperação emocional e considere suporte profissional'
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