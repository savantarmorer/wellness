export interface MoodCategory {
  valence: number;
  category: string;
  baseIntensity: number;
}

export interface CategorySimilarity {
  [key: string]: {
    [key: string]: number;
  };
}

export interface AnalysisConfig {
  valence: {
    alpha: number;
    minSimilarity: number;
  };
  intensity: {
    minValue: number;
    maxValue: number;
  };
  direction: {
    veryNegativeThreshold: number;
    veryNegativeAdjustment: number;
    negativeAdjustment: number;
    positiveAdjustment: number;
  };
  timeWindow: {
    defaultHours: number;
    minHours: number;
    maxHours: number;
    decayFactor: number;
  };
}

export interface MoodAnalysisConfig {
  moodCategories: {
    [key: string]: MoodCategory;
  };
  categorySimilarity: CategorySimilarity;
  analysis: AnalysisConfig;
} 