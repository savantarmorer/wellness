import type { MoodEntry, MoodType, AnalysisMoodEntry } from '../../types/index';
import { NEGATIVE_MOODS, POSITIVE_MOODS } from '../moodConstants';
import {
  calculateMoodMatchScore,
  calculateTimeDecay,
  findClosestEntry,
  hasSharedContext,
  calculateMoodVolatility,
  calculatePatternConsistency,
  calculateIndividualStability,
  calculateFrequencyCorrelation,
  calculateResponseTimeGaps,
  calculateTimingConsistency,
  calculateMoodPatterns,
  isCompatibleMoodPair,
  calculateDataConsistency,
  compatiblePairs
} from './calculosBase';

// Time window constants in milliseconds
const MAX_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const MIN_TIME_WINDOW = 2 * 60 * 60 * 1000;  // 2 hours

export {
  calculateMoodVolatility,
  calculatePatternConsistency,
  calculateIndividualStability,
  calculateFrequencyCorrelation,
  calculateResponseTimeGaps,
  calculateTimingConsistency,
  isCompatibleMoodPair,
  calculateDataConsistency
};

export const isNegativeMood = (mood: MoodType): boolean => {
  return NEGATIVE_MOODS.includes(mood);
};

export const areMoodsSynchronous = (mood1: MoodType, mood2: MoodType): boolean => {
  return mood1 === mood2 || (compatiblePairs[mood1]?.includes(mood2) ?? false);
};

export const determineAdaptiveTimeWindow = (
  userEntry: MoodEntry,
  partnerEntries: MoodEntry[]
): number => {
  if (partnerEntries.length < 2) return MAX_TIME_WINDOW;
  
  const timeGaps = calculateResponseTimeGaps(
    [userEntry],
    partnerEntries
  );
  
  return Math.min(
    MAX_TIME_WINDOW,
    Math.max(
      MIN_TIME_WINDOW,
      timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length * 2
    )
  );
};

export const calculateValenceScore = (entries: MoodEntry[]): number => {
  if (!entries.length) return 0;
  
  const positiveCount = entries.filter(entry => 
    POSITIVE_MOODS.includes(entry.mood.primary as MoodType)
  ).length;
  
  return positiveCount / entries.length;
};

// ... rest of the file unchanged ... 