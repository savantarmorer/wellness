export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  createdAt: string;
  updatedAt?: string;
  interests?: string[];
}

export interface CategoryRatings {
  satisfacaoGeral: number;
  alinhamentoObjetivos: number;
  conexaoEmocional: number;
  apoioMutuo: number;
  comunicacao: number;
  transparenciaConfianca: number;
  intimidadeFisica: number;
  saudeMental: number;
  resolucaoConflitos: number;
  segurancaRelacionamento: number;
  qualidadeTempo: number;
  [key: string]: number;
}

/**
 * Represents a daily assessment submitted by a user.
 * Core data structure for tracking relationship health and mood.
 */
export interface DailyAssessment {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: 'individual' | 'collective';
  mood: Mood;
  ratings: CategoryRatings;
  validatedScales: {
    das?: {
      total: number;
      consenso: number;
      satisfacao: number;
      coesao: number;
      expressaoAfetiva: number;
    };
    gottman?: {
      fourHorsemen: string[];
      bidsForConnection: number;
      reparacao: number;
      influenciaPositiva: number;
    };
  };
  notes?: string;
  context?: {
    activities: string[];
    triggers: string[];
    location: string;
    socialContext: string[];
    intensity: number;
    duration?: number;
  };
  metadata: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
    lastUpdate: string;
  };
  comments?: string;
  gratitude?: string;
  createdAt?: string;
}

export interface DailyAssessmentWithRatings extends Omit<DailyAssessment, 'ratings'> {
  ratings: {
    satisfacaoGeral: number;
    alinhamentoObjetivos: number;
    conexaoEmocional: number;
    apoioMutuo: number;
    segurancaRelacionamento: number;
    comunicacao: number;
    intimidade: number;
    resolucaoConflitos: number;
    transparenciaConfianca: number;
    intimidadeFisica: number;
    saudeMental: number;
    autocuidado: number;
    gratidao: number;
    qualidadeTempo: number;
    [key: string]: number;
  };
}

export interface Insight {
  id: string;
  type: 'pattern' | 'observation' | 'recommendation' | 'warning';
  category: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
  relatedMoods?: MoodType[];
  actionItems?: string[];
  context?: {
    timeframe: string;
    frequency: number;
    triggers?: string[];
  };
}

export type MoodType = 
  | 'feliz'
  | 'animado'
  | 'grato'
  | 'calmo'
  | 'satisfeito'
  | 'amado'
  | 'ansioso'
  | 'estressado'
  | 'triste'
  | 'irritado'
  | 'frustrado'
  | 'exausto'
  | 'confuso'
  | 'solitário'
  | 'neutral'
  | 'content';

export interface Mood {
  primary: MoodType;
  type?: MoodType;
  intensity: number;
  notes?: string;
  secondary?: MoodType[];
}

export interface MoodAnalysis {
  patterns: {
    dominantMoods: Array<{
      mood: MoodType;
      frequency: number;
      averageIntensity: number;
    }>;
    moodTransitions: string[];
    timePatterns: Record<string, any>;
    daily: string[];
    weekly: string[];
    monthly: string[];
  };
  insights: Insight[];
  trends: {
    [key: string]: {
      direction: 'improving' | 'stable' | 'declining';
      significance: 'low' | 'medium' | 'high';
    };
  };
  metrics: {
    emotionalVariability: number;
    positiveNegativeRatio: number;
    recoveryResilience: number;
    moodStability: number;
  };
}

export interface MoodSynchronyAnalysis extends MoodAnalysis {
  emotionalSync: number;
  moodDiscrepancies: MoodDiscrepancy[];
}

export interface ValidatedScales {
  // Core scales
  das: DyadicAdjustmentScale;
  csi: CouplesSatisfactionIndex;
  gottman: GottmanMetrics;
  attachment: AttachmentMetrics;
  
  // Validation metadata
  consistency: {
    default?: {
      score: number;
      confidence: number;
      flags: string[];
    };
  };
  reliability: number;
  completeness: number;
  recommendations: string[];
  isValid: boolean;
  errors: string[];
}

export interface ValidatedScalesAnalysis extends ValidatedScales {
  insights: Insight[];
  recommendations: string[];
  analysisDate: string;
  confidence: number;
  trends: {
    [key: string]: {
      direction: 'improving' | 'stable' | 'declining';
      significance: 'low' | 'medium' | 'high';
    };
  };
}

export interface UnifiedAnalysis {
  gptAnalysis?: GPTAnalysis | null;
  relationshipAnalysis?: RelationshipAnalysis;
  moodAnalysis?: MoodAnalysis | MoodSynchronyAnalysis;
  temporalAnalysis?: TemporalAnalysis;
  attachmentAnalysis?: AttachmentAnalysis;
  communicationPatterns?: CommunicationPatterns;
  dailyInsight: string;
  stage: {
    current: string;
    nextSteps: string[];
    timelineEstimate: string;
  };
  relationshipContext?: RelationshipContext;
}

export type DailyAssessmentType = DailyAssessment; 

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: string;
  createdAt: string;
  mood: {
    primary: MoodType;
    intensity: number;
    notes?: string;
  };
  context?: {
    activities: string[];
    triggers: string[];
    location: string;
    socialContext: string[];
    intensity: number;
    duration?: number;
    notes?: string;
  };
}

export interface AssessmentData {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: AssessmentType;
  emotionalSecurity?: number;
  intimacy?: number;
  communication?: number;
  trust?: number;
  mood?: Mood;
  validatedScales?: {
    das?: Partial<DyadicAdjustmentScale>;
    csi?: Partial<CouplesSatisfactionIndex>;
    gottman?: Partial<GottmanMetrics>;
  };
  ratings?: CategoryRatings;
  createdAt: string;
  metadata?: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
    lastUpdate: string;
  };
}

export interface GottmanAssessmentData extends Omit<AssessmentData, 'type' | 'validatedScales'> {
  type: 'gottman_metrics';
  validatedScales: {
    gottman: GottmanMetrics;
  };
}

export interface AssessmentWithMetadata extends AssessmentData {
  id: string;
  userId: string;
  partnerId: string;
  timestamp: string;
  type: 'daily';
  emotionalSecurity: number;
  intimacy: number;
  communication: number;
  trust: number;
  goals: string[];
  challenges: string[];
}

export interface NormalizedAssessment {
  timestamp: string;
  scores: {
    emotionalSecurity: number;
    intimacy: number;
    communication: number;
    trust: number;
  };
  mood: Mood;
  goals: string[];
  challenges: string[];
} 

export interface NormalizedRelationshipData {
  userHistory: DailyAssessment[];
  partnerHistory: DailyAssessment[];
  userMoodEntries: MoodEntry[];
  partnerMoodEntries: MoodEntry[];
  userData: {
    name?: string;
    [key: string]: any;
  };
  partnerData: {
    name?: string;
    [key: string]: any;
  };
}

export interface AttachmentAnalysis {
  userAttachment: string;
  partnerAttachment: string;
  compatibilityScore: number;
  insights: string[];
  validatedMetrics?: {
    ecr?: {
      anxiety: number;
      avoidance: number;
    };
    compatibility?: {
      score: number;
      analysis: string;
      recommendations: string[];
    };
  };
}

export interface EmotionalDynamicsAnalysis {
  trustLevel: number;
  conflictFrequency: 'high' | 'medium' | 'low';
  emotionalSync: number;
  patterns?: string[];
  recommendations?: string[];
}

export interface MoodDiscrepancy {
  userMood: MoodType;
  partnerMood: MoodType;
  difference: number;
  pattern: string;
  type: 'stable' | 'divergent' | 'convergent';
  description: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  timestamp: string;
}

export interface ValidationResult {
  consistency: {
    [category: string]: {
      score: number;
      confidence: number;
      flags: string[];
    };
  } & {
    default?: {
      score: number;
      confidence: number;
      flags: string[];
    };
  };
  reliability: number;
  completeness: number;
  recommendations: string[];
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  attachment?: {
    attachmentStyle: string;
    compatibilidadeApego: number;
  };
}

export interface TrendAnalysis {
  slope: number;
  rSquared: number;
  pValue: number;
  isSignificant: boolean;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  timeframe: string;
  dataPoints: number;
  category: string;
  score: number;
  insights: string[];
  magnitude: number;
  direction: 'improving' | 'declining' | 'stable';
  significance: 'low' | 'medium' | 'high';
  userTrend: {
    slope: number;
    rSquared: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  partnerTrend: {
    slope: number;
    rSquared: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export interface TimeframeAnalysis {
  averageScores: CategoryRatings;
  discrepancies: DiscrepancyAnalysis[];
  insights: Array<{
    category: string;
    type: 'improvement' | 'decline';
    description: string;
  }>;
  confidence: number;
  trends: Record<string, {
    direction: 'improving' | 'declining' | 'stable';
    significance: 'low' | 'medium' | 'high';
  }>;
}

export interface TemporalAnalysis {
  correlation: number;
  trends: Record<string, TrendAnalysis>;
  patterns: {
    cyclical: string[];
    persistent: string[];
    emerging: string[];
  };
  timeframes: {
    daily: TimeframeAnalysis;
    weekly: TimeframeAnalysis;
    monthly: TimeframeAnalysis;
  };
  seasonality: number;
  volatility: number;
  confidence: number;
  analysisDate: string;
}

export interface CommunicationPatterns {
  style: string;
  effectiveness: number;
  patterns: string[];
  confidence: number;
}

export interface AnalysisSummary {
  averageScores: CategoryRatings;
  discrepancies: DiscrepancyAnalysis[];
  insights: string[];
}

export interface DiscrepancyAnalysis {
  category: string;
  difference: number;
  userScore: number;
  partnerScore: number;
  weightedDifference: number;
  insights: string[];
  recommendations: string[];
} 

export interface FormError {
  message: string;
  details: string;
  operation?: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
}

export interface FormSubmissionResult<T> {
  success: boolean;
  data?: T;
  error?: FormError;
  warnings?: string[];
}

export interface DailyAssessmentForm {
  ratings: CategoryRatings;
  comments: string;
  gratitude: string;
  userId: string;
  partnerId: string;
  date: string;
  mood?: Mood;
  validation?: FormValidation;
  validatedMetrics?: ValidatedScales;
}

export interface MoodTrackingForm {
  userId: string;
  mood: Mood;
  timestamp?: string;
  validation?: FormValidation;
}

export interface ConflictResolutionForm {
  date: string;
  description: string;
  resolution?: string;
  satisfactionLevel: number;
  learnings: string[];
  preventionStrategies?: string[];
  validation?: FormValidation;
}

export interface QualityTimeForm {
  date: string;
  activity: string;
  duration: number;
  satisfaction: number;
  connection: number;
  notes?: string;
  validation?: FormValidation;
}

export interface RelationshipContextForm {
  duration: string;
  status: 'dating' | 'engaged' | 'married' | 'other';
  type: string;
  goals: string[];
  challenges: string[];
  values: string[];
  relationshipStyle: string;
  currentDynamics: string;
  strengths: string;
  areasNeedingAttention: {
    comunicacao: boolean;
    confianca: boolean;
    intimidade: boolean;
    resolucaoConflitos: boolean;
    apoioEmocional: boolean;
    outros: boolean;
  };
  recurringProblems?: string;
  hadSignificantCrises: boolean;
  crisisDescription?: string;
  attemptedSolutions: boolean;
  solutionsDescription?: string;
  validation?: FormValidation;
} 

export interface RelationshipStage {
  current: 'initial' | 'developing' | 'established' | 'mature';
  timelineEstimate: string;
  nextSteps: string[];
}

export interface ComprehensiveAnalysis {
  context: RelationshipContext;
  communicationPatterns: CommunicationPatterns;
  emotionalDynamics: EmotionalDynamics;
  stage: {
    current: string;
    nextSteps: string[];
    timelineEstimate: string;
  };
  temporalAnalysis: TemporalAnalysis;
  validation: {
    consistency: any;
    reliability: number;
    completeness: number;
    recommendations: string[];
  };
  attachmentStyle: {
    user: string;
    partner: string;
    compatibility: number;
  };
  relationshipAnalysis: RelationshipAnalysis;
  overallHealth: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence?: number;
  };
  categories?: Record<string, {
    score: number;
    trend: string;
    insights: string[];
    impactScore: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  strengthsAndChallenges?: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions?: string[];
  actionItems?: string[];
  relationshipDynamics?: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
  emotionalSync?: number;
  moodDiscrepancies?: MoodDiscrepancy[];
  insights?: Insight[];
  riskFactors?: string[];
  recommendations?: string[];
  validatedScales?: {
    das?: DyadicAdjustmentScale;
    csi?: CouplesSatisfactionIndex;
    gottman?: GottmanMetrics;
    attachment?: AttachmentMetrics;
  };
  clinicalSignificance?: {
    gaps: Array<{
      dimension: string;
      score: number;
      normativeScore: number;
      difference: number;
      isSignificant: boolean;
      severity: 'low' | 'moderate' | 'high';
    }>;
    recommendations: string[];
  };
  compositeIndex?: {
    score: number;
    weights: {
      communication: number;
      attachment: number;
      satisfaction: number;
      conflict: number;
      intimacy: number;
    };
    breakdown: Record<string, {
      contribution: number;
      significance: number;
    }>;
  };
}

export interface EmotionalDynamics {
  synchronicity: number;
  stability: number;
  emotionalSecurity: number;
  intimacyBalance: {
    score: number;
    areas: {
      emotional: number;
      physical: number;
      intellectual: number;
      shared: number;
    };
  };
  conflictResolution: {
    style: string;
    effectiveness: number;
    patterns: string[];
    confidence: number;
  };
  patterns: {
    user: {
      dominant: MoodType;
      frequency: Record<MoodType, number>;
      transitions: Record<string, number>;
    };
    partner: {
      dominant: MoodType;
      frequency: Record<MoodType, number>;
      transitions: Record<string, number>;
    };
  };
  insights: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
}

export interface DyadicAdjustmentScale {
  consenso: number;
  satisfacao: number;
  coesao: number;
  expressaoAfetiva: number;
  total: number;
}

export interface CouplesSatisfactionIndex {
  satisfacaoGlobal: number;
  estabilidade: number;
  comprometimento: number;
  comunicacao: number;
  gestaoConflitos: number;
  atividadesCompartilhadas: number;
  total: number;
}

export interface GottmanMetrics {
  fourHorsemen: {
    critica: number;
    defensividade: number;
    desprezo: number;
    stonewalling: number;
  };
  bidsForConnection: {
    tentativas: number;
    respostasPositivas: number;
    respostasNegativas: number;
    respostasNeutras: number;
  };
  resolucaoConflitos: number;
  significadoCompartilhado: number;
  reparacao: number;
  influenciaPositiva: number;
}

export interface GottmanAnalysis {
  fourHorsemen: {
    critica: number;
    defensividade: number;
    desprezo: number;
    stonewalling: number;
  };
  bidsForConnection: {
    tentativas: number;
    respostasPositivas: number;
    respostasNegativas: number;
    respostasNeutras: number;
  };
  resolucaoConflitos: number;
  significadoCompartilhado: number;
  reparacao: number;
  influenciaPositiva: number;
}

export type AttachmentStyleType = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface AttachmentStyle {
  primary: AttachmentStyleType;
  description: string;
  recommendations: string[];
  type?: string;
  intensity?: number;
  triggers?: string[];
  coping?: string[];
  history?: {
    patterns: string[];
    events: string[];
  };
}

export interface AttachmentMetrics {
  ecr: {
    ansiedade: number;
    evitacao: number;
    anxiety: number;
    avoidance: number;
  };
  securityLevel: number;
  attachmentStyle: AttachmentStyle;
  padraoApego: AttachmentStyle;
  compatibilidadeApego: number;
}

export interface DiscrepancyResult {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
} 

export interface DASAnalysis {
  consenso: number;
  satisfacao: number;
  coesao: number;
  expressaoAfetiva: number;
  total: number;
} 

export interface ClinicalSignificance {
  gaps: Array<{
    dimension: string;
    score: number;
    normativeScore: number;
    difference: number;
    isSignificant: boolean;
    severity: 'low' | 'moderate' | 'high';
  }>;
  riskFactors: string[];
  protectiveFactors: string[];
  recommendations: string[];
  severity: 'low' | 'moderate' | 'high';
  confidence: number;
} 

export interface ValidatedScalesAssessment {
  validatedScales: ValidatedScales;
  timestamp: string;
} 

export interface RelationshipContextFormData {
  status: 'dating' | 'engaged' | 'married' | 'other';
  duration: string;
  cohabitation: boolean;
  children: boolean;
  previousMarriage: boolean;
  previousCounseling: boolean;
  relationshipStyle: string;
  relationshipStyleOther?: string;
  strengths: string[];
  areasNeedingAttention: {
    comunicacao: boolean;
    confianca: boolean;
    intimidade: boolean;
    resolucaoConflitos: boolean;
    apoioEmocional: boolean;
    outros: boolean;
  };
  recurringProblems: string[];
  appGoals: string[];
  mentalHealth: {
    ansiedade: boolean;
    depressao: boolean;
    outros: boolean;
  };
  qualityTime: boolean;
  physicalIntimacy: boolean;
  intimacyImprovements: string[];
  values: string[];
  goals: string[];
  challenges: string[];
  type: string;
  currentDynamics: string;
  userEmotionalState: string;
  partnerEmotionalState: string;
  hadSignificantCrises: boolean;
  crisisDescription?: string;
  attemptedSolutions: boolean;
  solutionsDescription?: string;
  routineImpact: string;
  relationshipStatus: string;
  livingArrangement: string;
  communicationStyle: string;
  sharedActivities: string[];
  supportSystem: string[];
  futureExpectations: string;
  challengeAreas: string[];
  strengthAreas: string[];
  timeSpentTogether: string;
  qualityTimeDescription: string;
  additionalInfo?: string;
  userId: string;
  partnerId: string;
  majorLifeEvents?: string[];
  attachmentStyle?: 'seguro' | 'ansioso' | 'evitativo' | 'desorganizado';
  relationshipDuration?: string;
}

export interface CommunicationRecord {
  content: {
    quality: number;
    resolution: number;
    emotionalTone: number;
    topics?: string[];
  };
}

export interface CommunicationQualityAnalysis {
  overall: {
    score: number;
    trend: string;
    patterns: string[];
  };
  byTopic: {
    [topic: string]: {
      frequency: number;
      quality: number;
      resolution: number;
      emotionalTone: number;
    };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
} 

export interface CategoryScores {
  [category: string]: number;
} 

export interface TimeframeAnalysis {
  averageScores: CategoryRatings;
  discrepancies: DiscrepancyAnalysis[];
  insights: Array<{
    category: string;
    type: 'improvement' | 'decline';
    description: string;
  }>;
  confidence: number;
  trends: Record<string, {
    direction: 'improving' | 'declining' | 'stable';
    significance: 'low' | 'medium' | 'high';
  }>;
} 

export interface RelationshipContext {
  id?: string;
  userId?: string;
  partnerId?: string;
  createdAt?: string;
  updatedAt?: string;
  type: string;
  duration: string;
  status: 'dating' | 'engaged' | 'married' | 'other';
  relationshipStyle: string;
  relationshipStyleOther?: string;
  currentDynamics: string;
  userEmotionalState: string;
  partnerEmotionalState: string;
  hadSignificantCrises: boolean;
  crisisDescription: string;
  attemptedSolutions: boolean;
  solutionsDescription: string;
  routineImpact: string;
  relationshipStatus: string;
  livingArrangement: string;
  communicationStyle: string;
  sharedActivities: string[];
  supportSystem: string[];
  futureExpectations: string;
  challengeAreas: string[];
  strengthAreas: string[];
  values: string[];
  goals: string[];
  challenges: string[];
  strengths: string[];
  appGoals: string[];
  timeSpentTogether: string;
  qualityTime: 'yes' | 'no';
  qualityTimeDescription: string;
  physicalIntimacy: 'yes' | 'no';
  intimacyImprovements: string[];
  additionalInfo: string;
  areasNeedingAttention: string[];
  areasNeedingAttentionOther?: string;
  recurringProblems?: string[];
  majorLifeEvents?: string[];
  attachmentStyle?: 'seguro' | 'ansioso' | 'evitativo' | 'desorganizado';
  relationshipDuration?: string;
  cohabitation?: boolean;
  children?: boolean;
  previousMarriage?: boolean;
  previousCounseling?: boolean;
}

export interface AnalysisContent {
  type: 'daily_assessment' | 'consensus_form';
  content: RelationshipAnalysis | ConsensusFormData;
  metadata?: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
    lastUpdate: string;
  };
}

export type GPTAnalysisContent = AnalysisContent;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  partnerEmail?: string;
  partnerId?: string;
  relationshipContext?: RelationshipContext;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  dailyReminder: boolean;
  weeklyInsights: boolean;
  partnerActivities: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTime?: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ConsensusFormData {
  type: 'consensus_form';
  userId: string;
  partnerId: string;
  date: string;
  responses: { [key: string]: { rating: number; notes?: string } };
  scores?: {
    consensus: number;
    affection: number;
    cohesion: number;
    satisfaction: number;
    conflict: number;
    general: number;
    overall: number;
  };
  createdAt: string;
}

export interface ConsensusFormAnalysis {
  overallAnalysis: {
    score: number;
    trend: 'improving' | 'stable' | 'concerning';
    summary: string;
    riskLevel: 'low' | 'moderate' | 'high';
  };
  categoryAnalysis: {
    [category: string]: {
      score: number;
      insights: string[];
      recommendations: string[];
      riskFactors: string[];
    };
  };
  progressionAnalysis: {
    improvements: string[];
    concerns: string[];
    trends: {
      [area: string]: {
        direction: string;
        significance: string;
      };
    };
  };
  therapeuticInsights: {
    immediateActions: string[];
    longTermStrategies: string[];
    underlyingIssues: string[];
  };
  consistencyAnalysis: {
    alignedAreas: string[];
    discrepancies: string[];
    possibleMotivations: string[];
  };
  recommendations: {
    communication: string[];
    exercises: string[];
    professionalSupport: string[];
  };
}

export interface CategoryAnalysis {
  score: number;
  partnerScore?: number;
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
}

export interface RelationshipDynamics {
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  discrepancyInsights?: string;
}

export interface RelationshipAnalysis {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: 'individual' | 'collective';
  overallHealth: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
  };
  categories: Record<string, {
    score: number;
    trend: string;
    insights: string[];
    impactScore: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  strengthsAndChallenges: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions: string[];
  actionItems: string[];
  relationshipDynamics: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
  emotionalDynamics: EmotionalDynamics;
  emotionalSync: number;
  moodDiscrepancies: MoodDiscrepancy[];
  insights: Insight[];
  riskFactors: string[];
  recommendations: string[];
  validatedScales: ValidatedScales;
  gptAnalysis: GPTAnalysis;
  metadata: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
    lastUpdate: string;
  };
}

export interface GPTAnalysis {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: {
    moodPatterns: {
      user: {
        dominant: MoodType;
        frequency: Record<MoodType, number>;
        transitions: Record<string, number>;
      };
      partner: {
        dominant: MoodType;
        frequency: Record<MoodType, number>;
        transitions: Record<string, number>;
      };
      overall: {
        synchronicity: number;
        stability: number;
        variability: number;
      };
    };
    communicationMetrics: {
      quality: number;
      frequency: number;
      depth: number;
      patterns: string[];
    };
    relationshipDynamics: {
      strengths: string[];
      challenges: string[];
      recommendations: string[];
    };
    attachmentInsights: {
      style: string;
      behaviors: string[];
      triggers: string[];
      suggestions: string[];
    };
    overallHealth?: {
      score: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    categories?: Record<string, {
      score: number;
      trend: string;
      insights: string[];
      impactScore: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    emotionalDynamics?: EmotionalDynamics;
  };
  timestamp: string;
  version: string;
  metadata: {
    assessmentCount: number;
    timeSpan: string;
    confidence: number;
  };
  createdAt?: string;
} 

export interface ConsistencyValidation {
  score: number;
  flags: string[];
}

export interface ValidationRecommendation {
  type: 'consistency' | 'completeness' | 'reliability';
  description: string;
  priority: 'low' | 'medium' | 'high';
  toString(): string;
}

export interface Insight {
  id: string;
  type: 'pattern' | 'observation' | 'recommendation' | 'warning';
  category: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface TrendAnalysis {
  slope: number;
  rSquared: number;
  pValue: number;
  isSignificant: boolean;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  timeframe: string;
  dataPoints: number;
  category: string;
  score: number;
  insights: string[];
  magnitude: number;
  direction: 'improving' | 'declining' | 'stable';
  significance: 'low' | 'medium' | 'high';
  userTrend: {
    slope: number;
    rSquared: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  partnerTrend: {
    slope: number;
    rSquared: number;
    trend: 'improving' | 'stable' | 'declining';
  };
} 

export interface Pattern {
  type: 'cyclic' | 'progressive' | 'reactive';
  period?: number;
  description: string;
  significance: number;
  toString(): string;
}

export interface CyclicalBehavior {
  category: string;
  cycle: {
    period: number;
    amplitude: number;
    phase: number;
  };
  description: string;
  triggers?: string[];
  toString(): string;
}

export interface AttachmentAnalysisResult {
  primary: AttachmentStyleType;
  description: string;
  recommendations: string[];
} 

export interface ValidatedScaleAssessmentData {
  id: string;
  userId: string;
  partnerId: string;
  date: string;
  type: AssessmentType;
  emotionalSecurity: number;
  intimacy: number;
  communication: number;
  trust: number;
  mood: {
    primary: string;
    intensity: number;
  };
  validatedScales: ValidatedScales;
  ratings: CategoryRatings;
  createdAt: string;
  metadata: AssessmentMetadata;
  timestamp: string;
} 

export interface AssessmentMetadata {
  assessmentCount: number;
  timeSpan: string;
  confidence: number;
  lastUpdate: string;
  assessmentType?: string;
  assessmentName?: string;
  description?: string;
  category?: string;
  version?: string;
}

export type AssessmentType = 'individual' | 'couple' | 'daily' | 'gottman_metrics'; 