import type { MoodEntry, MoodType, AnalysisMoodEntry } from '../../types/index';

// === Constants ===
// Mood Intensity
export const DEFAULT_MOOD_INTENSITY = 3;
export const MAX_MOOD_INTENSITY = 5;

// Thresholds
export const EMOTIONAL_SYNC_THRESHOLD = 0.7;
export const NEGATIVE_AFFECT_THRESHOLD = 0.3;
export const MIN_ENTRIES_FOR_STABILITY = 3;

// Time Windows
export const MAX_TIME_GAP = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const DEFAULT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const MIN_TIME_WINDOW = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Confidence Levels
export const DEFAULT_CONFIDENCE = 0.8;
export const MIN_CONFIDENCE = 0.5;
export const MIN_CONFIDENCE_FOR_INSIGHTS = 0.6;

// Weights
export const MOOD_MATCH_WEIGHT = 0.7;
export const INTENSITY_MATCH_WEIGHT = 0.3;
export const STABILITY_WEIGHT = 0.4;
export const COMMUNICATION_WEIGHT = 0.3;
export const SYNC_WEIGHT = 0.3;

export const compatiblePairs: Record<MoodType, MoodType[]> = {
  'feliz': ['animado', 'grato', 'calmo', 'satisfeito', 'amado', 'content'],
  'animado': ['feliz', 'grato', 'satisfeito'],
  'grato': ['feliz', 'animado', 'calmo', 'satisfeito', 'amado', 'content'],
  'calmo': ['feliz', 'grato', 'satisfeito', 'content'],
  'satisfeito': ['feliz', 'animado', 'grato', 'calmo', 'amado', 'content'],
  'amado': ['feliz', 'grato', 'satisfeito', 'content'],
  'content': ['feliz', 'grato', 'calmo', 'satisfeito', 'amado'],
  'ansioso': ['calmo', 'amado', 'grato'],
  'estressado': ['calmo', 'satisfeito'],
  'triste': ['animado', 'feliz', 'amado'],
  'irritado': ['calmo', 'grato', 'satisfeito'],
  'frustrado': ['calmo', 'satisfeito', 'grato'],
  'exausto': ['calmo', 'satisfeito'],
  'confuso': ['calmo', 'satisfeito'],
  'solitário': ['amado', 'feliz', 'animado'],
  'neutral': []
};

export const calculateMoodMatchScore = (
  userMood: MoodEntry['mood'],
  partnerMood: MoodEntry['mood']
): number => {
  if (userMood.primary === partnerMood.primary) return 1;
  
  const intensityDiff = Math.abs(userMood.intensity - partnerMood.intensity);
  const maxIntensityDiff = 4;
  const intensityScore = 1 - intensityDiff / maxIntensityDiff;
  
  return intensityScore * 0.5;
};

export const calculateTimeDecay = (
  timestamp1: string,
  timestamp2: string
): number => {
  const time1 = new Date(timestamp1).getTime();
  const time2 = new Date(timestamp2).getTime();
  const diffHours = Math.abs(time1 - time2) / (1000 * 60 * 60);
  const maxHours = 24;
  
  return Math.max(0, 1 - diffHours / maxHours);
};

export const findClosestEntry = (
  targetEntry: MoodEntry,
  entries: MoodEntry[],
  maxHoursDiff = 24
): MoodEntry | null => {
  let closestEntry = null;
  let minDiff = maxHoursDiff * 60 * 60 * 1000;
  
  const targetTime = new Date(targetEntry.timestamp).getTime();
  
  for (const entry of entries) {
    const entryTime = new Date(entry.timestamp).getTime();
    const diff = Math.abs(targetTime - entryTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestEntry = entry;
    }
  }
  
  return closestEntry;
};

export const hasSharedContext = (
  entry1: AnalysisMoodEntry,
  entry2: AnalysisMoodEntry
): boolean => {
  if (!entry1.context || !entry2.context) return false;

  // Check for shared activities
  const sharedActivities = entry1.context.activities?.some(
    activity => entry2.context?.activities?.includes(activity)
  ) ?? false;

  // Check for communication
  const hadCommunication = 
    (entry1.context.communication?.hadMeaningfulTalk &&
    entry2.context.communication?.hadMeaningfulTalk) ?? false;

  return sharedActivities || hadCommunication;
};

export const calculateMoodVolatility = (entries: MoodEntry[]): number => {
  if (entries.length < 2) return 0;

  let changes = 0;
  let intensityChanges = 0;
  
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].mood.primary !== entries[i-1].mood.primary) {
      changes++;
    }
    
    const intensityDiff = Math.abs(
      entries[i].mood.intensity - entries[i-1].mood.intensity
    );
    intensityChanges += intensityDiff;
  }
  
  const changeRate = changes / (entries.length - 1);
  const avgIntensityChange = intensityChanges / (entries.length - 1);
  
  return (changeRate * 0.7 + (avgIntensityChange / 4) * 0.3);
};

export const calculatePatternConsistency = (entries: MoodEntry[]): number => {
  if (entries.length < 3) return 1;

  const patterns = calculateMoodPatterns(entries);
  const dominantMoodFreq = patterns.frequency[patterns.dominant] || 0;
  
  return dominantMoodFreq / entries.length;
};

export const calculateIndividualStability = (entries: MoodEntry[]): number => {
  if (entries.length < 3) return 1;

  const volatility = calculateMoodVolatility(entries);
  const consistency = calculatePatternConsistency(entries);
  
  const patterns = calculateMoodPatterns(entries);
  const moodChanges = patterns.transitions.length / entries.length;
  
  return (
    (1 - volatility) * 0.4 +
    consistency * 0.4 +
    (1 - moodChanges) * 0.2
  );
};

export const calculateFrequencyCorrelation = (
  userPatterns: ReturnType<typeof calculateMoodPatterns>,
  partnerPatterns: ReturnType<typeof calculateMoodPatterns>
): number => {
  const allMoods = new Set([
    ...Object.keys(userPatterns.frequency),
    ...Object.keys(partnerPatterns.frequency)
  ]);

  let correlation = 0;
  let total = 0;

  allMoods.forEach(mood => {
    const userFreq = userPatterns.frequency[mood as MoodType] || 0;
    const partnerFreq = partnerPatterns.frequency[mood as MoodType] || 0;
    
    if (userFreq > 0 && partnerFreq > 0) {
      correlation += Math.min(userFreq, partnerFreq) / Math.max(userFreq, partnerFreq);
      total++;
    }
  });

  return total > 0 ? correlation / total : 0;
};

export const calculateResponseTimeGaps = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number[] => {
  const gaps: number[] = [];
  
  userEntries.forEach(userEntry => {
    const closestPartner = findClosestEntry(userEntry, partnerEntries);
    if (closestPartner) {
      const userTime = new Date(userEntry.timestamp).getTime();
      const partnerTime = new Date(closestPartner.timestamp).getTime();
      gaps.push(Math.abs(userTime - partnerTime) / (1000 * 60)); // Convert to minutes
    }
  });
  
  return gaps;
};

export const calculateTimingConsistency = (timeGaps: number[]): number => {
  if (timeGaps.length < 2) return 1;
  
  const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
  const variance = timeGaps.reduce((sum, gap) => {
    const diff = gap - avgGap;
    return sum + (diff * diff);
  }, 0) / timeGaps.length;
  
  const stdDev = Math.sqrt(variance);
  const maxAcceptableStdDev = 120; // 2 hours in minutes
  
  return Math.max(0, 1 - (stdDev / maxAcceptableStdDev));
};

export const calculateMoodPatterns = (entries: MoodEntry[]) => {
  const frequency: Record<MoodType, number> = {
    'feliz': 0,
    'animado': 0,
    'grato': 0,
    'calmo': 0,
    'satisfeito': 0,
    'amado': 0,
    'content': 0,
    'ansioso': 0,
    'estressado': 0,
    'triste': 0,
    'irritado': 0,
    'frustrado': 0,
    'exausto': 0,
    'confuso': 0,
    'solitário': 0,
    'neutral': 0
  };

  const transitions: { from: MoodType; to: MoodType }[] = [];
  let dominant = entries[0]?.mood.primary || 'neutral';
  let maxCount = 0;

  entries.forEach((entry, i) => {
    const mood = entry.mood.primary;
    frequency[mood] = (frequency[mood] || 0) + 1;

    if (frequency[mood] > maxCount) {
      maxCount = frequency[mood];
      dominant = mood;
    }

    if (i > 0) {
      transitions.push({
        from: entries[i - 1].mood.primary,
        to: mood
      });
    }
  });

  return {
    frequency,
    transitions,
    dominant
  };
};

export const calculateDataConsistency = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number => {
  const userVolatility = calculateMoodVolatility(userEntries);
  const partnerVolatility = calculateMoodVolatility(partnerEntries);
  
  const userConsistency = calculatePatternConsistency(userEntries);
  const partnerConsistency = calculatePatternConsistency(partnerEntries);
  
  const volatilityScore = 1 - ((userVolatility + partnerVolatility) / 2);
  const consistencyScore = (userConsistency + partnerConsistency) / 2;
  
  return (volatilityScore * 0.4 + consistencyScore * 0.6);
};

export const impactToScore = (impact: 'low' | 'medium' | 'high'): number => {
  switch (impact) {
    case 'high': return 1;
    case 'medium': return 0.6;
    case 'low': return 0.3;
    default: return 0;
  }
};

export const enjoymentToScore = (level: 'low' | 'medium' | 'high'): number => {
  switch (level) {
    case 'high': return 1;
    case 'medium': return 0.6;
    case 'low': return 0.3;
    default: return 0;
  }
};

export const isCompatibleMoodPair = (mood1: MoodType, mood2: MoodType): boolean => {
  return mood1 === mood2 || (compatiblePairs[mood1]?.includes(mood2) ?? false);
}; 