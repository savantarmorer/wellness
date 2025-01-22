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
  compatiblePairs,
  DEFAULT_MOOD_INTENSITY,
  MAX_MOOD_INTENSITY
} from './calculosBase';

export { calculateMoodPatterns };

export const EMOTIONAL_SYNC_THRESHOLD = 0.7;
export const NEGATIVE_AFFECT_THRESHOLD = 0.3;

export { compatiblePairs };

export const calculateEmotionalSync = (
  userEntries: MoodEntry[] | AnalysisMoodEntry[],
  partnerEntries: MoodEntry[] | AnalysisMoodEntry[]
): number => {
  if (!userEntries.length || !partnerEntries.length) return 0;

  let syncScore = 0;
  let totalWeight = 0;

  userEntries.forEach(userEntry => {
    const closestPartnerEntry = findClosestEntry(userEntry, partnerEntries);
    if (!closestPartnerEntry) return;

    const moodMatch = calculateMoodMatchScore(userEntry.mood, closestPartnerEntry.mood);
    const timeWeight = calculateTimeDecay(userEntry.timestamp, closestPartnerEntry.timestamp);
  
    syncScore += moodMatch * timeWeight;
    totalWeight += timeWeight;
  });

  return totalWeight > 0 ? syncScore / totalWeight : 0;
};

export const calculateMoodStability = (entries: MoodEntry[]): number => {
  if (entries.length < 3) return 1;

  const patterns = calculateMoodPatterns(entries);
  const volatility = calculateMoodVolatility(entries);
  const consistency = calculatePatternConsistency(entries);
  
  return (
    (1 - volatility) * 0.4 +
    consistency * 0.4 +
    (patterns.transitions.length / entries.length) * 0.2
  );
};

export const calculateEmotionalStability = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number => {
  const MIN_ENTRIES_FOR_STABILITY = 3;
  
  if (userEntries.length < MIN_ENTRIES_FOR_STABILITY || 
      partnerEntries.length < MIN_ENTRIES_FOR_STABILITY) {
    return 1; // Return maximum stability when not enough data
  }

  const userStability = calculateIndividualStability(userEntries);
  const partnerStability = calculateIndividualStability(partnerEntries);

  const userPatterns = calculateMoodPatterns(userEntries);
  const partnerPatterns = calculateMoodPatterns(partnerEntries);

  const correlation = calculateFrequencyCorrelation(userPatterns, partnerPatterns);

  return (
    userStability * 0.35 +
    partnerStability * 0.35 +
    correlation * 0.3
  );
};

export const calculateCommunicationQuality = (
  userEntries: MoodEntry[] | AnalysisMoodEntry[],
  partnerEntries: MoodEntry[] | AnalysisMoodEntry[]
): number => {
  if (userEntries.length < 2 || partnerEntries.length < 2) return 0;

  const sortedUserEntries = [...userEntries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sortedPartnerEntries = [...partnerEntries].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalScore = 0;
  let metrics = 0;

  // Calculate response time consistency
  const timeGaps = calculateResponseTimeGaps(sortedUserEntries, sortedPartnerEntries);
  const timingConsistency = calculateTimingConsistency(timeGaps);
  totalScore += timingConsistency;
  metrics++;

  // Calculate shared context score
  let sharedContexts = 0;
  let totalContexts = 0;

  sortedUserEntries.forEach(userEntry => {
    const closestPartnerEntry = findClosestEntry(userEntry, sortedPartnerEntries);
    if (closestPartnerEntry && 'context' in userEntry && 'context' in closestPartnerEntry) {
      totalContexts++;
      if (hasSharedContext(userEntry as AnalysisMoodEntry, closestPartnerEntry as AnalysisMoodEntry)) {
        sharedContexts++;
      }
    }
  });

  if (totalContexts > 0) {
    const contextScore = sharedContexts / totalContexts;
    totalScore += contextScore;
    metrics++;
  }

  // Calculate mood synchronization during communication
  const communicationSyncScore = calculateEmotionalSync(userEntries, partnerEntries);
  totalScore += communicationSyncScore;
  metrics++;

  return metrics > 0 ? totalScore / metrics : 0;
};

export const calculateEmotionalSecurity = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number => {
  const stability = calculateEmotionalStability(userEntries, partnerEntries);
  const communication = calculateCommunicationQuality(userEntries, partnerEntries);
  const sync = calculateEmotionalSync(userEntries, partnerEntries);

  return (stability * 0.4 + communication * 0.3 + sync * 0.3);
};

export const calculateResponseFrequency = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number => {
  if (!userEntries.length || !partnerEntries.length) return 0;

  const timeGaps = calculateResponseTimeGaps(userEntries, partnerEntries);
  const averageGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
  
  // Convert average gap from minutes to a 0-1 score
  // Lower gaps = higher frequency score
  const maxGap = 24 * 60; // 24 hours in minutes
  return Math.max(0, 1 - (averageGap / maxGap));
};

export const calculateInteractionDepth = (
  userEntries: MoodEntry[],
  partnerEntries: MoodEntry[]
): number => {
  if (!userEntries.length || !partnerEntries.length) return 0;

  let totalDepth = 0;
  let interactions = 0;

  userEntries.forEach(userEntry => {
    const closestPartner = findClosestEntry(userEntry, partnerEntries);
    if (closestPartner) {
      const timeDiff = Math.abs(
        new Date(userEntry.timestamp).getTime() - 
        new Date(closestPartner.timestamp).getTime()
      );

      // Only consider interactions within 6 hours
      if (timeDiff <= 6 * 60 * 60 * 1000) {
        const intensityMatch = Math.min(
          userEntry.mood.intensity || DEFAULT_MOOD_INTENSITY,
          closestPartner.mood.intensity || DEFAULT_MOOD_INTENSITY
        ) / MAX_MOOD_INTENSITY;

        // Cast to AnalysisMoodEntry for type safety
        const userAnalysisEntry = userEntry as unknown as AnalysisMoodEntry;
        const partnerAnalysisEntry = closestPartner as unknown as AnalysisMoodEntry;
        
        const contextMatch = hasSharedContext(userAnalysisEntry, partnerAnalysisEntry) ? 1 : 0;
        
        totalDepth += (intensityMatch * 0.6) + (contextMatch * 0.4);
        interactions++;
      }
    }
  });

  return interactions > 0 ? totalDepth / interactions : 0;
}; 