import { 
  MoodEntry, 
  MoodTrackingForm,
  FormSubmissionResult,
  FormError,
  ComprehensiveAnalysis,
  DailyAssessment,
  RelationshipContext,
  EmotionalDynamics,
  TemporalAnalysis,
  RelationshipAnalysis,
  ValidatedScales,
  MoodType,
  TrendAnalysis as ImportedTrendAnalysis,
  GPTAnalysis,
  CategoryRatings as ImportedCategoryRatings,
  DyadicAdjustmentScale,
  CouplesSatisfactionIndex,
  GottmanMetrics as GottmanMetricsType,
  GottmanAssessmentData,
  RelationshipStage,
  ConsistencyValidation,
  ValidationRecommendation,
  Insight,
  TimeframeAnalysis,
  DiscrepancyAnalysis,
  MoodDiscrepancy,
  Pattern as PatternType,
  CyclicalBehavior as CyclicalBehaviorType,
  ValidatedScaleAssessmentData,
  AttachmentMetrics,
  AttachmentStyle,
  TimeframeSummary,
  AttachmentStyleAnalysis,
  ValidatedScalesAnalysis,
  ValidationMetadata
} from '../types';

import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { analyzeAttachmentStyle } from './attachmentService';
import { analyzeCommunicationPatterns } from './communicationService';
import { analyzeTrends, detectCyclicalBehaviors } from './temporalAnalysisService';
import { identifyPatterns } from './temporalAnalysisService';
import { getUserMoodEntries, analyzeMoodPatterns } from './moodService';
import { POSITIVE_MOODS, NEGATIVE_MOODS } from './moodConstants';
import { calculateEmotionalSync, calculateMoodStability, calculateEmotionalStability, calculateCommunicationQuality, calculateEmotionalSecurity, calculateResponseFrequency, calculateInteractionDepth } from './calculos/calculosRelacionamento';
import { getLatestGottmanAssessment } from './assessmentService';
import { getLatestAnalysis, saveAnalysis } from './gptAnalysisService';
import { 
  calculateDiscrepancies, 
  calculateImpactScore, 
  generateEnhancedInsights, 
  generateEnhancedRecommendations,
  getCategoryWeight
} from './relationshipUtils';
import type { ConsensusFormData } from '../types';
import { analyzeTemporalPatterns, calculateConfidenceLevel, crossValidateAssessments } from './analysisUtils';
import {
  calculateIntimacyBalance,
  determineEmotionalTrend,
  analyzeDominantMoods,
  calculateConfidenceScore,
  calculateOverallEmotionalHealth
} from './calculos/calculosRelacionamento3';
import {
  calculateMoodVolatility,
  calculatePatternConsistency,
  calculateDataConsistency,
  calculateMoodPatterns,
  DEFAULT_CONFIDENCE,
  MIN_CONFIDENCE,
  MIN_CONFIDENCE_FOR_INSIGHTS,
  MIN_ENTRIES_FOR_STABILITY
} from './calculos/calculosBase';

interface Pattern extends PatternType {}

interface CyclicalBehavior extends CyclicalBehaviorType {}

interface BidsForConnection {
  tentativas: number;
  respostasPositivas: number;
}

interface RatingKey {
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
}

type RatingKeys = Record<keyof RatingKey, number>;

type AttachmentStyleType = AttachmentStyle;

interface AttachmentStyleDetails {
  style: AttachmentStyleType;
  description: string;
  recommendations: string[];
}

interface AttachmentAnalysisResult {
  primary: AttachmentStyleType;
  description: string;
  recommendations: string[];
}



interface TrendAnalysis extends ImportedTrendAnalysis {
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

interface LocalAttachmentMetrics {
  ecr: {
    anxiety: number;
    avoidance: number;
  };
  securityLevel: number;
  attachmentStyle: AttachmentStyle;
}

interface LocalGottmanMetrics {
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

type CategoryRatings = {
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

type GottmanMetrics = LocalGottmanMetrics;

interface AssessmentStatus {
  hasBothAssessments: boolean;
  timeDifference: number;
  isWithin24Hours: boolean;
  sampleSize: number;
  assessmentCompleteness: {
    user: number;
    partner: number;
  };
}

const defaultMoodFrequency: Record<MoodType, number> = {
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
};

export class RelationshipOrchestrator {
  private db = db;
  private historicalAssessments?: DailyAssessment[];
  private readonly MINIMUM_HISTORY_LENGTH = 3;
  private readonly MOOD_TYPES = [
    'feliz',
    'animado',
    'grato',
    'calmo',
    'satisfeito',
    'amado',
    'ansioso',
    'estressado',
    'triste',
    'irritado',
    'frustrado',
    'exausto',
    'confuso',
    'solitário',
    'neutral',
    'content'
  ] as const;

  public async processFormSubmission(
    userId: string,
    formData: MoodTrackingForm | DailyAssessment,
    formType: 'mood_tracking' | 'daily_assessment'
  ): Promise<FormSubmissionResult<MoodEntry | DailyAssessment>> {
    try {
      if (formType === 'mood_tracking') {
        const moodEntry: MoodEntry = {
          id: `${userId}_${new Date().toISOString()}`,
          userId: userId,
          timestamp: (formData as MoodTrackingForm).timestamp || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          mood: (formData as MoodTrackingForm).mood,
          context: {
            activities: [],
            triggers: [],
            location: '',
            socialContext: [],
            intensity: (formData as MoodTrackingForm).mood.intensity
          }
        };

        // Save to Firestore
        const docRef = await addDoc(collection(this.db, 'moodEntries'), moodEntry);
        
        return {
          success: true,
          data: {
            ...moodEntry,
            id: docRef.id
          }
        };
      } else {
        const assessment = formData as DailyAssessment;
        
        // Save to Firestore
        const docRef = await addDoc(collection(this.db, 'assessments'), assessment);
        
        return {
          success: true,
          data: {
            ...assessment,
            id: docRef.id
          }
        };
      }
    } catch (error) {
      console.error(`Error processing ${formType} form:`, error);
      const formError: FormError = {
        message: `Failed to save ${formType}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      return {
        success: false,
        error: formError
      };
    }
  }

  private async generateEmotionalDynamics(
    userAssessment: DailyAssessment,
    partnerAssessment: DailyAssessment,
    consensusForm?: ConsensusFormData
  ): Promise<EmotionalDynamics> {
    const userEntries = this.convertAssessmentToMoodEntry(userAssessment);
    const partnerEntries = this.convertAssessmentToMoodEntry(partnerAssessment);

    // Base calculations
    let synchronicity = calculateEmotionalSync([userEntries], [partnerEntries]);
    let stability = calculateEmotionalStability([userEntries], [partnerEntries]);
    let emotionalSecurity = calculateEmotionalSecurity([userEntries], [partnerEntries]);
    let intimacyBalance = calculateIntimacyBalance([userEntries], [partnerEntries]);
    
    // Calculate emotional trend
    const emotionalTrend = determineEmotionalTrend([userEntries], [partnerEntries]);
    
    // Adjust stability based on trend
    if (emotionalTrend === 'improving') {
      stability *= 1.1; // Boost stability for improving trends
    } else if (emotionalTrend === 'declining') {
      stability *= 0.9; // Reduce stability for declining trends
    }

    // Calculate volatility to enhance stability metrics
    const userVolatility = calculateMoodVolatility([userEntries]);
    const partnerVolatility = calculateMoodVolatility([partnerEntries]);
    stability = stability * (1 - (userVolatility + partnerVolatility) / 4); // Adjust stability based on volatility
    
    // Adjust metrics based on consensus form if available
    if (consensusForm?.scores) {
      // Enhance emotional security based on consensus scores
      const consensusEmotionalSecurity = (
        (consensusForm.scores.affection || 0) +
        (consensusForm.scores.satisfaction || 0)
      ) / 2;
      emotionalSecurity = (emotionalSecurity + consensusEmotionalSecurity) / 2;

      // Adjust intimacy balance using consensus data
      const consensusValues = consensusForm.scores;
      intimacyBalance = {
        overall: (consensusValues.affection * 0.7 + consensusValues.satisfaction * 0.3 + consensusValues.cohesion + consensusValues.consensus) / 3,
        areas: {
          emotional: consensusValues.affection * 0.7 + consensusValues.satisfaction * 0.3,
          physical: consensusValues.cohesion,
          shared: consensusValues.consensus
        }
      };

      // Enhance stability calculation with consensus data
      stability = (stability + consensusValues.satisfaction) / 2;
    }

    const communicationQuality = calculateCommunicationQuality([userEntries], [partnerEntries]);
    const responseFrequency = calculateResponseFrequency([userEntries], [partnerEntries]);
    const interactionDepth = calculateInteractionDepth([userEntries], [partnerEntries]);

    const userPatterns = calculateMoodPatterns([userEntries]);
    const partnerPatterns = calculateMoodPatterns([partnerEntries]);

    const confidenceScore = calculateConfidenceScore([userEntries], [partnerEntries]);

    // Analyze dominant mood patterns
    const dominantMoodAnalysis = analyzeDominantMoods(
      { dominant: userPatterns.dominant },
      { dominant: partnerPatterns.dominant }
    );

    // Adjust emotional metrics based on dominant mood analysis
    if (dominantMoodAnalysis.positive) {
      synchronicity *= 1.1; // Boost synchronicity for positive dominant moods
      emotionalSecurity *= 1.1; // Boost security for positive dominant moods
    } else if (dominantMoodAnalysis.negative) {
      stability *= 0.9; // Reduce stability for negative dominant moods
    }

    // Calculate overall emotional health
    const overallHealth = calculateOverallEmotionalHealth(
      synchronicity,
      stability,
      intimacyBalance
    );

    return {
      synchronicity,
      stability,
      emotionalSecurity,
      intimacyBalance,
      overallHealth,
      conflictResolution: {
        style: 'collaborative',
        effectiveness: (communicationQuality + responseFrequency + interactionDepth) / 3,
        patterns: [],
        confidence: confidenceScore
      },
      patterns: {
        user: {
          dominant: userPatterns.dominant,
          frequency: userPatterns.frequency,
          transitions: this.convertTransitionsToRecord(
            userPatterns.transitions.map(t => `${t.from}->${t.to}`)
          )
        },
        partner: {
          dominant: partnerPatterns.dominant,
          frequency: partnerPatterns.frequency,
          transitions: this.convertTransitionsToRecord(
            partnerPatterns.transitions.map(t => `${t.from}->${t.to}`)
          )
        }
      },
      insights: {
        strengths: this.generateStrengths([userEntries], [partnerEntries]),
        challenges: this.generateChallenges([userEntries], [partnerEntries]),
        recommendations: this.generateRecommendations([userEntries], [partnerEntries])
      }
    };
  }

  private convertMoodFrequencyToRecord(dominantMoods: Array<{ mood: string; frequency: number }>): Record<MoodType, number> {
    const record: Record<MoodType, number> = {
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
    };
    
    dominantMoods.forEach(({ mood, frequency }) => {
      if (this.isMoodType(mood)) {
        record[mood] = frequency;
      }
    });
    return record;
  }

  private convertTransitionsToRecord(transitions: string[]): Record<string, number> {
    const record: Record<string, number> = {};
    transitions.forEach(transition => {
      record[transition] = (record[transition] || 0) + 1;
    });
    return record;
  }

  private isMoodType(mood: string): mood is MoodType {
    return this.MOOD_TYPES.includes(mood as MoodType);
  }

  private generateStrengths(userEntries: MoodEntry[], partnerEntries: MoodEntry[]): string[] {
    const strengths: string[] = [];
    
    // Calculate positive mood ratio
    const userPositiveRatio = this.calculatePositiveMoodRatio(userEntries);
    const partnerPositiveRatio = this.calculatePositiveMoodRatio(partnerEntries);
    
    if (userPositiveRatio > 0.7 && partnerPositiveRatio > 0.7) {
      strengths.push('Alto nível de emoções positivas compartilhadas');
    }
    
    if (this.calculateEmotionalStability(userEntries, partnerEntries) > 0.7) {
      strengths.push('Forte estabilidade emocional no relacionamento');
    }
    
    return strengths;
  }

  private generateChallenges(userEntries: MoodEntry[], partnerEntries: MoodEntry[]): string[] {
    const challenges: string[] = [];
    
    const userNegativeRatio = this.calculateNegativeMoodRatio(userEntries);
    const partnerNegativeRatio = this.calculateNegativeMoodRatio(partnerEntries);
    
    if (userNegativeRatio > 0.3 || partnerNegativeRatio > 0.3) {
      challenges.push('Presença significativa de emoções negativas');
    }
    
    if (this.calculateEmotionalStability(userEntries, partnerEntries) < 0.3) {
      challenges.push('Instabilidade emocional no relacionamento');
    }
    
    return challenges;
  }

  private generateRecommendations(userEntries: MoodEntry[], partnerEntries: MoodEntry[]): string[] {
    const recommendations: string[] = [];
    
    const emotionalStability = this.calculateEmotionalStability(userEntries, partnerEntries);
    
    if (emotionalStability < 0.5) {
      recommendations.push('Praticar técnicas de regulação emocional em conjunto');
    }
    
    const synchronicity = calculateEmotionalSync(userEntries, partnerEntries);
    if (synchronicity < 0.5) {
      recommendations.push('Aumentar momentos de conexão emocional e compartilhamento de experiências');
    }
    
    return recommendations;
  }

  private calculatePositiveMoodRatio(entries: MoodEntry[]): number {
    if (entries.length === 0) return 0;
    const positiveCount = entries.filter(entry => POSITIVE_MOODS.includes(entry.mood.primary)).length;
    return positiveCount / entries.length;
  }

  private calculateNegativeMoodRatio(entries: MoodEntry[]): number {
    if (entries.length === 0) return 0;
    const negativeCount = entries.filter(entry => NEGATIVE_MOODS.includes(entry.mood.primary)).length;
    return negativeCount / entries.length;
  }

  private calculateEmotionalStability(userEntries: MoodEntry[], partnerEntries: MoodEntry[]): number {
    const userStability = calculateMoodStability(userEntries);
    const partnerStability = calculateMoodStability(partnerEntries);
    return (userStability + partnerStability) / 2;
  }

  private calculateOverallHealth(ratings: RatingKeys): number {
    if (!ratings) return 0;
    
    const weights: RatingKeys = {
      satisfacaoGeral: 1.5,
      alinhamentoObjetivos: 1.2,
      conexaoEmocional: 1.3,
      apoioMutuo: 1.2,
      segurancaRelacionamento: 1.4,
      comunicacao: 1.3,
      intimidade: 1.2,
      resolucaoConflitos: 1.3,
      transparenciaConfianca: 1.4,
      intimidadeFisica: 1.1,
      saudeMental: 1.2,
      autocuidado: 1.0,
      gratidao: 1.1,
      qualidadeTempo: 1.2
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach((key) => {
      const rating = ratings[key as keyof RatingKeys];
      const weight = weights[key as keyof RatingKeys];
      if (typeof rating === 'number' && !isNaN(rating)) {
        weightedSum += rating * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private generateCategoryAnalysis(ratings: Record<string, number>) {
    const categories: Record<string, any> = {};
    
    for (const [category, score] of Object.entries(ratings)) {
      categories[category] = {
        score,
        trend: 'stable',
        insights: [],
        impactScore: score,
        priority: score < 5 ? 'high' : score < 7 ? 'medium' : 'low'
      };
    }

    return categories;
  }

  public async generateComprehensiveAnalysis(
    userId: string,
    context: RelationshipContext,
    data: {
      assessments: DailyAssessment[];
      consensusForms: ConsensusFormData[];
      moodEntries: MoodEntry[];
      gottmanAssessment?: GottmanAssessmentData;
      validatedScales?: ValidatedScales;
    }
  ): Promise<FormSubmissionResult<ComprehensiveAnalysis>> {
    // Get latest consensus form scores if available
    const latestConsensusForm = data.consensusForms && data.consensusForms.length > 0
      ? data.consensusForms[0]
      : undefined;

    // Get user assessment and validate
    const userAssessment = data.assessments[0];
    if (!this.validateAssessment(userAssessment)) {
      throw new Error('Invalid user assessment data');
    }

    // Get partner assessment and validate
    const partnerAssessment = data.assessments.length > 1 ? data.assessments[1] : null;
    const isPartnerAssessmentValid = partnerAssessment ? this.validateAssessment(partnerAssessment) : false;

    // Calculate assessment status
    const assessmentStatus: AssessmentStatus = {
      hasBothAssessments: !!partnerAssessment && isPartnerAssessmentValid,
      timeDifference: partnerAssessment ? 
        Math.abs(new Date(userAssessment.createdAt).getTime() - new Date(partnerAssessment.createdAt).getTime()) : 0,
      isWithin24Hours: partnerAssessment ? 
        Math.abs(new Date(userAssessment.createdAt).getTime() - new Date(partnerAssessment.createdAt).getTime()) < 24 * 60 * 60 * 1000 : false,
      sampleSize: data.assessments.length,
      assessmentCompleteness: {
        user: this.calculateCompleteness(userAssessment),
        partner: partnerAssessment ? this.calculateCompleteness(partnerAssessment) : 0
      }
    };

    // Generate temporal analysis first since we need it for confidence calculation
    const temporalAnalysis = await analyzeTemporalPatterns(data.assessments, []);
    
    // Calculate confidence considering both assessments and consensus form
    const confidenceScore = calculateConfidenceLevel(
      data.assessments.length,
      !!latestConsensusForm
    );

    // Generate emotional dynamics with consensus form context
    const emotionalDynamics = await this.generateEmotionalDynamics(
      userAssessment,
      userAssessment,
      latestConsensusForm
    );

    const relationshipAnalysis: RelationshipAnalysis = {
      id: `analysis_${new Date().getTime()}`,
      userId: userAssessment.userId,
      partnerId: userAssessment.partnerId,
      date: new Date().toISOString(),
      type: 'individual',
      overallHealth: {
        score: calculateOverallEmotionalHealth(
          emotionalDynamics.synchronicity,
          emotionalDynamics.stability,
          emotionalDynamics.intimacyBalance
        ),
        trend: this.determineTrend(temporalAnalysis.trends),
        confidence: confidenceScore,
        emotionalSync: emotionalDynamics.synchronicity
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
      emotionalDynamics,
      emotionalSync: 0,
      moodDiscrepancies: [],
      insights: [],
      riskFactors: [],
      recommendations: [],
      validatedScales: data.validatedScales || {
        das: {
          total: 0,
          consenso: 0,
          satisfacao: 0,
          coesao: 0,
          expressaoAfetiva: 0
        }
      },
      metadata: {
        assessmentCount: data.assessments.length,
        timeSpan: '1 day',
        confidence: confidenceScore,
        lastUpdate: new Date().toISOString(),
        hasConsensusForm: !!latestConsensusForm
      } as ValidationMetadata,
      clinicalSignificance: {
        gaps: [{
          dimension: 'communication',
          score: 0,
          normativeScore: 0,
          difference: 0,
          isSignificant: false,
          severity: 'low'
        }],
        recommendations: [],
        riskFactors: [],
        protectiveFactors: [],
        severity: 'low',
        confidence: confidenceScore
      },
      gptAnalysis: {
        id: `gpt_${new Date().getTime()}`,
        userId: userAssessment.userId,
        partnerId: userAssessment.partnerId,
        date: new Date().toISOString(),
        type: 'individual',
        analysis: {
          moodPatterns: {
            user: {
              dominant: 'neutral',
              frequency: defaultMoodFrequency,
              transitions: {}
            },
            partner: {
              dominant: 'neutral',
              frequency: defaultMoodFrequency,
              transitions: {}
            },
            overall: {
              synchronicity: calculateEmotionalSync(
                [this.convertAssessmentToMoodEntry(userAssessment)],
                [this.convertAssessmentToMoodEntry(data.assessments.length > 1 ? data.assessments[1] : userAssessment)]
              ),
              stability: calculateMoodStability(data.moodEntries),
              variability: 0.5
            }
          },
          communicationMetrics: {
            quality: userAssessment.ratings?.comunicacao || 0,
            frequency: userAssessment.ratings?.comunicacao || 0,
            depth: userAssessment.ratings?.conexaoEmocional || 0,
            patterns: []
          },
          relationshipDynamics: {
            strengths: this.generateStrengths(data.moodEntries, []),
            challenges: this.generateChallenges(data.moodEntries, []),
            recommendations: this.generateRecommendations(data.moodEntries, [])
          },
          attachmentInsights: {
            style: 'secure',
            behaviors: [],
            triggers: [],
            suggestions: []
          },
          overallHealth: {
            score: this.calculateOverallHealth(userAssessment.ratings || {}),
            trend: 'stable'
          },
          categories: this.generateCategoryAnalysis(userAssessment.ratings || {}),
          emotionalDynamics: await this.generateEmotionalDynamics(userAssessment, partnerAssessment || userAssessment)
        },
        timestamp: new Date().toISOString(),
        version: '1.0',
        metadata: {
          assessmentCount: data.assessments.length,
          timeSpan: this.determineTimeSpan(data.assessments),
          confidence: this.calculateOverallConfidence(temporalAnalysis, assessmentStatus)
        }
      }
    };

    // Se não houver uma avaliação Gottman fornecida, busca a última disponível
    if (!data.gottmanAssessment) {
      try {
        const latestGottman = await getLatestGottmanAssessment(userId, partnerAssessment?.userId || '');
        if (latestGottman) {
          data.gottmanAssessment = latestGottman;
          console.log('[RelationshipOrchestrator] Retrieved latest Gottman assessment:', {
            hasGottmanAssessment: true
          });
        }
      } catch (error) {
        console.warn('[RelationshipOrchestrator] Failed to retrieve latest Gottman assessment:', error);
      }
    }

    // Process Gottman metrics if available
    const processGottmanMetrics = (gottmanData?: GottmanAssessmentData): GottmanMetrics => {
      if (!gottmanData?.validatedScales?.gottman) {
        return {
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
        };
      }
      return gottmanData.validatedScales.gottman;
    };

    const gottmanMetrics = processGottmanMetrics(data.gottmanAssessment);
    
    // Calculate final confidence score considering all factors
    const finalConfidenceScore = data.gottmanAssessment 
      ? (confidenceScore + 0.8) / 2  // Boost confidence when Gottman data is available
      : confidenceScore;
    
    // Update relationship analysis with Gottman metrics
    relationshipAnalysis.validatedScales = {
      ...relationshipAnalysis.validatedScales,
      gottman: gottmanMetrics
    };

    // Add consensus form insights if available
    if (latestConsensusForm?.scores) {
      const consensusInsights = this.generateConsensusInsights(latestConsensusForm.scores);
      relationshipAnalysis.insights = [
        ...relationshipAnalysis.insights,
        ...consensusInsights.map(insight => ({
          id: `consensus_${new Date().getTime()}_${Math.random()}`,
          type: 'observation' as const,
          category: 'consensus',
          description: insight,
          confidence: confidenceScore,
          impact: 'medium' as const,
          timestamp: new Date().toISOString()
        }))
      ];
    }

    // Update all confidence scores with final value
    relationshipAnalysis.metadata.confidence = finalConfidenceScore;
    relationshipAnalysis.overallHealth.confidence = finalConfidenceScore;
    relationshipAnalysis.clinicalSignificance.confidence = finalConfidenceScore;

    // Return the analysis object that was already created above
    return {
      success: true,
      data: {
        context,
        communicationPatterns: {
          style: 'collaborative',
          effectiveness: 0,
          patterns: [],
          confidence: confidenceScore
        },
        emotionalDynamics,
        stage: {
          current: 'initial',
          nextSteps: [],
          timelineEstimate: '1 month'
        },
        temporalAnalysis,
        validation: {
          consistency: this.validateConsistency(userAssessment, latestConsensusForm),
          reliability: confidenceScore,
          completeness: this.calculateCompleteness(userAssessment, latestConsensusForm),
          recommendations: this.generateValidationRecommendations(userAssessment)
        },
        attachmentStyle: {
          user: 'secure',
          partner: 'secure',
          compatibility: 0.8
        },
        relationshipAnalysis,
        overallHealth: {
          score: this.calculateOverallHealth(userAssessment.ratings),
          trend: this.determineTrend(temporalAnalysis.trends),
          confidence: confidenceScore
        },
        clinicalSignificance: {
          gaps: [{
            dimension: 'communication',
            score: 0,
            normativeScore: 0,
            difference: 0,
            isSignificant: false,
            severity: 'low'
          }],
          recommendations: [],
          riskFactors: [],
          protectiveFactors: [],
          severity: 'low',
          confidence: confidenceScore
        }
      }
    };
  }

  // Helper functions for temporal analysis
  private calculateRSquared(assessments: DailyAssessment[], category: keyof CategoryRatings): number {
    if (!assessments || assessments.length < 2) return 0;
    
    const scores = assessments.map(a => (a.ratings as CategoryRatings)[category] || 0);
    const n = scores.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = scores.reduce((a, b) => a + b, 0) / n;
    
    const ssxx = x.reduce((a, b) => a + Math.pow(b - xMean, 2), 0);
    const ssyy = scores.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
    const ssxy = x.reduce((a, b, i) => a + (b - xMean) * (scores[i] - yMean), 0);
    
    const r = ssxy / Math.sqrt(ssxx * ssyy);
    return Math.pow(r, 2);
  }

  private calculatePValue(assessments: DailyAssessment[]): number {
    // Simplified p-value calculation
    return assessments.length > 30 ? 0.05 : 0.1;
  }

  private determineTimeframe(assessments: DailyAssessment[]): string {
    const days = assessments.length;
    if (days <= 7) return '7 days';
    if (days <= 30) return '30 days';
    return '90 days';
  }

  private calculateSeasonality(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): number {
    if (!userHistory.length || !partnerHistory.length) return 0;

    // Calculate mood frequencies over time
    const userMoodFreq = this.calculateMoodFrequencies(userHistory);
    const partnerMoodFreq = this.calculateMoodFrequencies(partnerHistory);

    // Calculate correlation between mood patterns
    const correlation = this.calculateMoodCorrelation(userMoodFreq, partnerMoodFreq);

    // Calculate mood stability
    const userStability = this.calculateMoodStability(userHistory);
    const partnerStability = this.calculateMoodStability(partnerHistory);

    // Combine metrics for seasonality score
    return (correlation + userStability + partnerStability) / 3;
  }

  private calculateMoodFrequencies(assessments: DailyAssessment[]): Record<string, number> {
    const frequencies: Record<string, number> = {};
    assessments.forEach(assessment => {
      const mood = assessment.mood?.primary;
      if (mood) {
        frequencies[mood] = (frequencies[mood] || 0) + 1;
      }
    });
    return frequencies;
  }

  private calculateMoodCorrelation(userFreq: Record<string, number>, partnerFreq: Record<string, number>): number {
    const allMoods = new Set([...Object.keys(userFreq), ...Object.keys(partnerFreq)]);
    let correlation = 0;
    let count = 0;

    allMoods.forEach(mood => {
      const userCount = userFreq[mood] || 0;
      const partnerCount = partnerFreq[mood] || 0;
      if (userCount > 0 && partnerCount > 0) {
        correlation += Math.min(userCount, partnerCount) / Math.max(userCount, partnerCount);
        count++;
      }
    });

    return count > 0 ? correlation / count : 0;
  }

  private calculateMoodStability(assessments: DailyAssessment[]): number {
    if (assessments.length < 2) return 1;

    let changes = 0;
    for (let i = 1; i < assessments.length; i++) {
      if (assessments[i].mood?.primary !== assessments[i-1].mood?.primary) {
        changes++;
      }
    }

    return 1 - (changes / (assessments.length - 1));
  }

  private calculateVolatility(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): number {
    if (!userHistory.length || !partnerHistory.length) return 0;
    
    const volatilities = Object.keys(userHistory[0].ratings).map(category => {
      const userScores = userHistory.map(h => h.ratings[category] || 0);
      const partnerScores = partnerHistory.map(h => h.ratings[category] || 0);
      
      const userVolatility = this.calculateStandardDeviation(userScores);
      const partnerVolatility = this.calculateStandardDeviation(partnerScores);
      
      return (userVolatility + partnerVolatility) / 2;
    });
    
    return volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  private calculateConfidence(userCount: number, partnerCount: number): number {
    const minCount = Math.min(userCount, partnerCount);
    
    // Base confidence starts at MIN_CONFIDENCE and increases with more entries
    const baseConfidence = minCount > 0 
      ? MIN_CONFIDENCE + (minCount / 10) * (DEFAULT_CONFIDENCE - MIN_CONFIDENCE) 
      : MIN_CONFIDENCE;
    
    // Apply multiplier based on minimum entry threshold
    const baseMultiplier = minCount >= MIN_ENTRIES_FOR_STABILITY ? 1 : 0.8;
    
    return Math.min(baseConfidence * baseMultiplier, 1);
  }

  private generateTimeframeSummary(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[], days: number): TimeframeSummary {
    const recentUser = userHistory.slice(-days);
    const recentPartner = partnerHistory.slice(-days);
    
    const averageScores: CategoryRatings = {
      satisfacaoGeral: 0,
      alinhamentoObjetivos: 0,
      conexaoEmocional: 0,
      apoioMutuo: 0,
      comunicacao: 0,
      transparenciaConfianca: 0,
      intimidadeFisica: 0,
      saudeMental: 0,
      resolucaoConflitos: 0,
      segurancaRelacionamento: 0,
      qualidadeTempo: 0,
      intimidade: 0,
      autocuidado: 0,
      gratidao: 0
    };
    
    const categories = Object.keys(averageScores);
    
    categories.forEach(category => {
      const userAvg = this.average(recentUser.map(h => h.ratings[category] || 0));
      const partnerAvg = this.average(recentPartner.map(h => h.ratings[category] || 0));
      averageScores[category] = (userAvg + partnerAvg) / 2;
    });
    
    return {
      averageScores,
      discrepancies: this.identifyDiscrepancies(recentUser, recentPartner),
      insights: this.generateTimeframeInsights(recentUser, recentPartner),
      confidence: this.calculateConfidence(recentUser.length, recentPartner.length),
      trends: this.generateTimeframeTrends(recentUser, recentPartner)
    };
  }

  private average(numbers: number[]): number {
    return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  private identifyDiscrepancies(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): DiscrepancyAnalysis[] {
    const discrepancies: DiscrepancyAnalysis[] = [];
    const categories = Object.keys(userHistory[0]?.ratings || {});
    
    categories.forEach(category => {
      const userAvg = this.average(userHistory.map(h => h.ratings[category] || 0));
      const partnerAvg = this.average(partnerHistory.map(h => h.ratings[category] || 0));
      const difference = Math.abs(userAvg - partnerAvg);
      
      if (difference > 2) {
        discrepancies.push({
          category,
          difference,
          userScore: userAvg,
          partnerScore: partnerAvg,
          weightedDifference: difference * (userHistory.length / 10), // Weight by data points
          impactScore: calculateImpactScore(category, difference, 'daily'),
          insights: generateEnhancedInsights(category, userAvg, partnerAvg, 'daily'),
          recommendations: generateEnhancedRecommendations(category, difference, 'daily'),
          significance: difference >= 2 ? 'high' : difference >= 1 ? 'medium' : 'low',
          pattern: null
        });
      }
    });
    
    return discrepancies;
  }

  private generateTimeframeInsights(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): Array<{
    category: string;
    type: 'improvement' | 'decline';
    description: string;
  }> {
    const insights: Array<{
      category: string;
      type: 'improvement' | 'decline';
      description: string;
    }> = [];
    
    if (!userHistory.length || !partnerHistory.length) {
      return insights;
    }
    
    const categories = Object.keys(userHistory[0]?.ratings || {});
    
    categories.forEach(category => {
      const userTrend = this.calculateTrend(userHistory.map(h => h.ratings[category] || 0));
      const partnerTrend = this.calculateTrend(partnerHistory.map(h => h.ratings[category] || 0));
      
      if (userTrend * partnerTrend > 0) {
        insights.push({
          category,
          type: userTrend > 0 ? 'improvement' : 'decline',
          description: `Synchronized ${userTrend > 0 ? 'improvement' : 'decline'} in ${category}`
        });
      }
    });
    
    return insights;
  }

  private calculateTrend(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    return numbers[numbers.length - 1] - numbers[0];
  }

  private generateTimeframeTrends(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): Record<string, TrendAnalysis> {
    const trends: Record<string, TrendAnalysis> = {};
    
    if (!userHistory.length || !userHistory[0]?.ratings) {
      return trends;
    }
    
    const categories = Object.keys(userHistory[0].ratings);
    
    categories.forEach(category => {
      const userScores = userHistory.map(h => h.ratings[category] || 0);
      const partnerScores = partnerHistory.map(h => h.ratings[category] || 0);
      
      const slope = this.calculateTrend(userScores.concat(partnerScores));
      const magnitude = Math.abs(slope);
      const direction = slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable';
      const rSquared = this.calculateRSquared(userHistory, category as keyof CategoryRatings);
      const pValue = this.calculatePValue(userHistory);
      const confidence = this.calculateConfidence(userHistory.length, partnerHistory.length);
      const significance = this.calculateTrendSignificance(userScores, partnerScores);
      
      trends[category] = {
        slope,
        rSquared,
        pValue,
        isSignificant: magnitude > 0.5,
        trend: direction,
        confidence,
        timeframe: this.determineTimeframe(userHistory),
        dataPoints: userHistory.length + partnerHistory.length,
        category,
        score: magnitude * 10,
        insights: [this.generateTrendDescription(category, slope, magnitude)],
        magnitude,
        direction,
        significance,
        userTrend: {
          slope: this.calculateTrend(userScores),
          rSquared: this.calculateRSquared(userHistory, category as keyof CategoryRatings),
          trend: direction
        },
        partnerTrend: {
          slope: this.calculateTrend(partnerScores),
          rSquared: this.calculateRSquared(partnerHistory, category as keyof CategoryRatings),
          trend: direction
        }
      };
    });
    
    return trends;
  }

  private generateTrendDescription(category: string, slope: number, magnitude: number): string {
    const magnitudeDesc = magnitude > 1 ? 'significativa' : magnitude > 0.5 ? 'moderada' : 'sutil';
    const direction = slope > 0 ? 'melhoria' : slope < 0 ? 'declínio' : 'estabilidade';
    return `${magnitudeDesc} ${direction} em ${category}`;
  }

  private generateTrendInsight(category: string, direction: 'improving' | 'stable' | 'declining', magnitude: number): string {
    return `${direction === 'improving' ? 'Melhoria' : direction === 'declining' ? 'Declínio' : 'Estabilidade'} em ${category}: ${magnitude.toFixed(2)} pontos`;
  }

  private calculateTrendSignificance(userScores: number[], partnerScores: number[]): 'low' | 'medium' | 'high' {
    const allScores = userScores.concat(partnerScores);
    const trend = this.calculateTrend(allScores);
    const volatility = this.calculateStandardDeviation(allScores);
    
    if (Math.abs(trend) < volatility) return 'low';
    if (Math.abs(trend) < volatility * 2) return 'medium';
    return 'high';
  }

  private determineTrend(trends: Record<string, TrendAnalysis>): 'improving' | 'stable' | 'declining' {
    const trendValues = Object.values(trends);
    if (trendValues.length === 0) return 'stable';
    
    const improvingCount = trendValues.filter(t => t.trend === 'improving').length;
    const decliningCount = trendValues.filter(t => t.trend === 'declining').length;
    
    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  private extractStrengths(analysis: TemporalAnalysis): string[] {
    const strengths: string[] = [];
    Object.entries(analysis.trends).forEach(([category, trend]) => {
      if (trend.trend === 'improving' && trend.isSignificant) {
        strengths.push(`Melhoria significativa em ${category}`);
      }
    });
    return strengths;
  }

  private extractChallenges(analysis: TemporalAnalysis): string[] {
    const challenges: string[] = [];
    Object.entries(analysis.trends).forEach(([category, trend]) => {
      if (trend.trend === 'declining' && trend.isSignificant) {
        challenges.push(`Declínio significativo em ${category}`);
      }
    });
    return challenges;
  }

  private extractRelationshipStrengths(analysis: TemporalAnalysis): string[] {
    return this.extractStrengths(analysis);
  }

  private extractRelationshipChallenges(analysis: TemporalAnalysis): string[] {
    return this.extractChallenges(analysis);
  }

  private generateInsights(analysis: TemporalAnalysis): Insight[] {
    const insights: Insight[] = [];
    
    // Convert cyclical patterns
    analysis.patterns.cyclical.forEach(patternStr => {
      const pattern: Pattern = {
        type: 'cyclic',
        description: patternStr,
        significance: 0.7,
        toString: () => patternStr
      };
      
      insights.push({
        id: `pattern_${new Date().getTime()}_${Math.random()}`,
        type: 'pattern',
        category: 'temporal',
        description: this.convertPatternToString(pattern),
        confidence: analysis.confidence,
        impact: pattern.significance > 0.7 ? 'high' : pattern.significance > 0.4 ? 'medium' : 'low',
        timestamp: new Date().toISOString()
      });
    });

    // Convert persistent patterns
    analysis.patterns.persistent.forEach(patternStr => {
      const pattern: Pattern = {
        type: 'progressive',
        description: patternStr,
        significance: 0.8,
        toString: () => patternStr
      };
      
      insights.push({
        id: `pattern_${new Date().getTime()}_${Math.random()}`,
        type: 'pattern',
        category: 'temporal',
        description: this.convertPatternToString(pattern),
        confidence: analysis.confidence,
        impact: pattern.significance > 0.7 ? 'high' : pattern.significance > 0.4 ? 'medium' : 'low',
        timestamp: new Date().toISOString()
      });
    });
    
    return insights;
  }

  private convertPatternToString(pattern: Pattern): string {
    const significance = pattern.significance > 0.7 ? 'alta' :
                        pattern.significance > 0.4 ? 'média' : 'baixa';
    return `${pattern.type === 'cyclic' ? 'Padrão cíclico' : 'Padrão progressivo'} com ${significance} significância: ${pattern.description}`;
  }

  private identifyRiskFactors(analysis: TemporalAnalysis): string[] {
    const risks: string[] = [];
    
    // Check for persistent negative trends
    Object.entries(analysis.trends).forEach(([category, trend]) => {
      if (trend.trend === 'declining' && trend.confidence > 0.7) {
        risks.push(`Declínio persistente em ${category}`);
      }
    });
    
    // Check for high volatility
    if (analysis.volatility > 0.7) {
      risks.push('Alta volatilidade nas avaliações');
    }
    
    return risks;
  }

  private calculateDAS(assessment: DailyAssessment, partnerAssessment: DailyAssessment): DyadicAdjustmentScale {
    return {
      consenso: (assessment.ratings.alinhamentoObjetivos + partnerAssessment.ratings.alinhamentoObjetivos) / 2,
      satisfacao: (assessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2,
      coesao: (assessment.ratings.apoioMutuo + partnerAssessment.ratings.apoioMutuo) / 2,
      expressaoAfetiva: (assessment.ratings.conexaoEmocional + partnerAssessment.ratings.conexaoEmocional) / 2,
      total: 0 // Will be calculated based on the above scores
    };
  }

  private calculateECRScores(attachmentAnalysis: AttachmentAnalysisResult): { anxiety: number; avoidance: number } {
    const scores = {
      anxiety: 0,
      avoidance: 0
    };

    switch (attachmentAnalysis.primary) {
      case 'secure':
        scores.anxiety = 2;
        scores.avoidance = 2;
        break;
      case 'anxious':
        scores.anxiety = 4;
        scores.avoidance = 2;
        break;
      case 'avoidant':
        scores.anxiety = 2;
        scores.avoidance = 4;
        break;
      case 'disorganized':
        scores.anxiety = 3;
        scores.avoidance = 3;
        break;
    }

    return scores;
  }

  private calculateCSI(assessment: DailyAssessment, partnerAssessment: DailyAssessment): CouplesSatisfactionIndex {
    // Calculate individual components from ratings
    const satisfacaoGlobal = (assessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2;
    const estabilidade = (assessment.ratings.segurancaRelacionamento + partnerAssessment.ratings.segurancaRelacionamento) / 2;
    const comprometimento = (assessment.ratings.alinhamentoObjetivos + partnerAssessment.ratings.alinhamentoObjetivos) / 2;
    const comunicacao = (assessment.ratings.comunicacao + partnerAssessment.ratings.comunicacao) / 2;
    const gestaoConflitos = (assessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2;
    const atividadesCompartilhadas = (assessment.ratings.qualidadeTempo + partnerAssessment.ratings.qualidadeTempo) / 2;

    console.log('📊 Debug - CSI Score Calculation:', {
      raw: {
        satisfacaoGlobal,
        estabilidade,
        comprometimento,
        comunicacao,
        gestaoConflitos,
        atividadesCompartilhadas
      },
      weights: {
        satisfacaoGlobal: 0.25,
        estabilidade: 0.15,
        comprometimento: 0.15,
        comunicacao: 0.15,
        gestaoConflitos: 0.15,
        atividadesCompartilhadas: 0.15
      }
    });

    // Calculate total with weighted components
    const total = (
      satisfacaoGlobal * 0.25 +        // Global satisfaction has highest weight
      estabilidade * 0.15 +            // Stability
      comprometimento * 0.15 +         // Commitment
      comunicacao * 0.15 +             // Communication
      gestaoConflitos * 0.15 +         // Conflict management
      atividadesCompartilhadas * 0.15  // Shared activities
    ) * 7; // Scale up to match the 0-81 CSI scale

    console.log('📊 Debug - CSI Final Score:', {
      weightedTotal: total / 7, // Show pre-scaling
      scaledTotal: total,
      maxPossibleScore: 81
    });

    return {
      satisfacaoGlobal,
      estabilidade,
      comprometimento,
      comunicacao,
      gestaoConflitos,
      atividadesCompartilhadas,
      total: Math.round(total) // Round to nearest integer
    };
  }

  private calculateSecurityLevel(input: AttachmentAnalysisResult | { anxiety: number; avoidance: number }): number {
    if ('anxiety' in input && 'avoidance' in input) {
      // ECR-based calculation
      const maxScore = 5;
      const avgInsecurity = (input.anxiety + input.avoidance) / 2;
      return 1 - (avgInsecurity / maxScore);
    } else {
      // Attachment analysis based calculation
      switch (input.primary) {
        case 'secure': return 0.8;
        case 'anxious': return 0.6;
        case 'avoidant': return 0.5;
        case 'disorganized': return 0.4;
        default: return 0.5;
      }
    }
  }

  private calculateAttachmentCompatibility(assessment: DailyAssessment, partnerAssessment: DailyAssessment): number {
    const userSecurityScore = assessment.ratings.segurancaRelacionamento || 0;
    const partnerSecurityScore = partnerAssessment.ratings.segurancaRelacionamento || 0;
    return Math.min((userSecurityScore + partnerSecurityScore) / 2, 1);
  }

  private calculateConsistencyScore(assessment: DailyAssessment): number {
    const ratings = Object.values(assessment.ratings).filter(v => typeof v === 'number' && v >= 0);
    if (ratings.length === 0) return 1; // If no ratings, consider it consistent
    
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance = ratings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratings.length;
    const score = Math.max(0, 1 - Math.sqrt(variance) / 10); // Adjusted for 0-10 scale
    
    console.log('Consistency calculation:', {
      mean,
      variance,
      score
    });
    return score;
  }

  private calculateConfidenceScore(assessment: DailyAssessment): number {
    const completeness = this.calculateCompleteness(assessment);
    const consistency = this.calculateConsistencyScore(assessment);
    return (completeness + consistency) / 2;
  }

  private identifyConsistencyFlags(assessment: DailyAssessment): string[] {
    const flags: string[] = [];
    const ratings = Object.values(assessment.ratings);
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    
    ratings.forEach((rating, index) => {
      if (Math.abs(rating - mean) > 3) {
        flags.push(`Avaliação discrepante no item ${index + 1}`);
      }
    });
    
    return flags;
  }

  private calculateReliability(assessment: DailyAssessment): number {
    return this.calculateConsistencyScore(assessment);
  }

  private calculateCompleteness(assessment: DailyAssessment, consensusForm?: ConsensusFormData): number {
    // Base completeness on assessment
    const baseCompleteness = assessment.ratings ? Object.keys(assessment.ratings).length / 14 : 0;
    
    // Add bonus for consensus form presence
    return consensusForm ? Math.min(baseCompleteness + 0.2, 1) : baseCompleteness;
  }

  private generateScaleRecommendations(assessment: DailyAssessment): string[] {
    const recommendations: string[] = [];
    
    if (this.calculateCompleteness(assessment) < 0.8) {
      recommendations.push('Preencher todas as avaliações para maior precisão');
    }
    
    if (this.calculateConsistencyScore(assessment) < 0.7) {
      recommendations.push('Revisar avaliações para garantir consistência');
    }
    
    return recommendations;
  }

  private validateAssessment(assessment: DailyAssessment): boolean {
    const completeness = this.calculateCompleteness(assessment);
    const consistency = this.calculateConsistencyScore(assessment);
    const hasValidMood = assessment.mood?.primary && assessment.mood?.intensity >= 0;
    const hasValidRatings = Object.values(assessment.ratings).some(v => 
      typeof v === 'number' && v >= 0 && v <= 10
    );
    
    console.log('Assessment validation:', {
      completeness,
      consistency,
      hasValidMood,
      hasValidRatings,
      mood: assessment.mood,
      ratings: assessment.ratings
    });
    
    // Less strict validation
    return completeness > 0.3 && // Reduced from 0.5
           consistency > 0.3 && // Reduced from 0.5
           hasValidMood && 
           hasValidRatings;
  }

  private determineTimeSpan(assessments: DailyAssessment[] | undefined): string {
    if (!assessments || assessments.length === 0) return '1 day';
    
    const days = Math.ceil((new Date().getTime() - new Date(assessments[0].date).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return '7 days';
    if (days <= 30) return '30 days';
    return '90 days';
  }

  private calculateOverallConfidence(analysis: TemporalAnalysis, assessmentStatus: AssessmentStatus): number {
    const baseConfidence = analysis.confidence;
    
    // Calculate confidence multiplier based on assessment status
    let confidenceMultiplier = 1;
    
    // Adjust for assessment availability
    if (!assessmentStatus.hasBothAssessments) {
      confidenceMultiplier *= 0.6; // Single assessment penalty
    } else if (!assessmentStatus.isWithin24Hours) {
      confidenceMultiplier *= 0.8; // Time gap penalty
    }
    
    // Adjust for assessment completeness
    const averageCompleteness = (assessmentStatus.assessmentCompleteness.user + assessmentStatus.assessmentCompleteness.partner) / 2;
    if (averageCompleteness < 0.8) {
      confidenceMultiplier *= 0.9; // Incomplete assessment penalty
    }
    
    // Adjust for sample size
    if (assessmentStatus.sampleSize < 3) {
      confidenceMultiplier *= 0.9; // Limited data penalty
    }

    // Adjust for pattern consistency
    const patternConsistency = calculatePatternConsistency(
      this.historicalAssessments?.map(a => this.convertAssessmentToMoodEntry(a)) || []
    );
    if (patternConsistency > 0.7) {
      confidenceMultiplier *= 1.1; // Boost confidence for consistent patterns
    } else if (patternConsistency < 0.3) {
      confidenceMultiplier *= 0.9; // Reduce confidence for inconsistent patterns
    }
    
    return Math.min(baseConfidence * confidenceMultiplier, 1); // Cap at 1.0
  }

  private determineRelationshipStage(analysis: TemporalAnalysis): RelationshipStage {
    const stage: RelationshipStage = {
      current: analysis.trends.satisfacaoGeral?.trend === 'improving' ? 'developing' : 
               analysis.confidence > 0.7 ? 'established' : 
               analysis.patterns.persistent.length > 0 ? 'mature' : 'initial',
      timelineEstimate: analysis.timeframes.monthly.confidence > 0.7 ? '3-6 months' : '1-2 weeks',
      nextSteps: [
        'Estabelecer comunicação aberta',
        'Definir expectativas',
        'Criar rotinas compartilhadas'
      ]
    };
    return stage;
  }

  private validateConsistency(assessment: DailyAssessment, consensusForm?: ConsensusFormData): Record<string, any> {
    const baseScore = this.calculateConsistencyScore(assessment);
    const flags = this.identifyConsistencyFlags(assessment);
    
    // Calculate data consistency between user and partner entries
    const userEntries = [this.convertAssessmentToMoodEntry(assessment)];
    const partnerEntries = assessment.partnerId ? this.historicalAssessments
      ?.filter(a => a.userId === assessment.partnerId)
      .map(a => this.convertAssessmentToMoodEntry(a)) || [] : [];
    const dataConsistency = calculateDataConsistency(userEntries, partnerEntries);
    
    // Enhance consistency score with consensus form data if available
    if (consensusForm?.scores) {
      const consensusScore = (
        (consensusForm.scores.consensus || 0) +
        (consensusForm.scores.satisfaction || 0)
      ) / 2;
      return {
        score: (baseScore + consensusScore + dataConsistency) / 3,
        flags,
        hasConsensusValidation: true,
        dataConsistency
      };
    }

    return {
      score: (baseScore + dataConsistency) / 2,
      flags,
      hasConsensusValidation: false,
      dataConsistency
    };
  }

  private generateValidationRecommendations(assessment: DailyAssessment): string[] {
    return this.generateScaleRecommendations(assessment);
  }

  private analyzeMoodDiscrepancies(userEntries: MoodEntry[], partnerEntries: MoodEntry[]): MoodDiscrepancy[] {
    const discrepancies: MoodDiscrepancy[] = [];
    
    userEntries.forEach(userEntry => {
      const partnerEntry = partnerEntries.find(p => 
        Math.abs(new Date(p.timestamp).getTime() - new Date(userEntry.timestamp).getTime()) < 24 * 60 * 60 * 1000
      );
      
      if (partnerEntry && userEntry.mood.primary !== partnerEntry.mood.primary) {
        const moodDifference = Math.abs(userEntry.mood.intensity - partnerEntry.mood.intensity);
        discrepancies.push({
          userMood: userEntry.mood.primary,
          partnerMood: partnerEntry.mood.primary,
          difference: moodDifference,
          pattern: 'divergent',
          type: 'divergent',
          description: `Diferença de humor entre parceiros: ${userEntry.mood.primary} vs ${partnerEntry.mood.primary}`,
          severity: moodDifference > 3 ? 'high' : moodDifference > 1 ? 'medium' : 'low',
          impact: moodDifference > 3 ? 'alto' : moodDifference > 1 ? 'médio' : 'baixo',
          timestamp: userEntry.timestamp
        });
      }
    });
    
    return discrepancies;
  }

  private convertCyclicalBehaviorToString(behavior: CyclicalBehavior): string {
    return `${behavior.category}: ${behavior.description} (period: ${behavior.cycle.period})`;
  }

  private updateTemporalAnalysisPatterns(
    analysis: TemporalAnalysis,
    userHistory: DailyAssessment[],
    partnerHistory: DailyAssessment[],
    hasFullConfidence: boolean = true
  ): void {
    // Update existing patterns with confidence indicators
    analysis.patterns.persistent = analysis.patterns.persistent.map(pattern => 
      hasFullConfidence ? pattern : `${pattern} (Limited confidence due to data constraints)`
    );
    
    // Add data quality indicators to emerging patterns
    if (!hasFullConfidence) {
      analysis.patterns.emerging.push(
        'Pattern analysis confidence is reduced due to limited historical data'
      );
    }
    
    // Adjust cyclical behavior detection threshold based on data availability
    if (userHistory.length < this.MINIMUM_HISTORY_LENGTH * 2 || 
        partnerHistory.length < this.MINIMUM_HISTORY_LENGTH * 2) {
      analysis.patterns.cyclical = analysis.patterns.cyclical.filter(pattern => 
        pattern.includes('high confidence') || pattern.includes('strong evidence')
      );
    }
  }

  private calculateGottmanMetrics(assessment: DailyAssessment | GottmanAssessmentData): GottmanMetricsType {
    if ('type' in assessment && assessment.type === 'gottman_metrics' && 'validatedScales' in assessment && assessment.validatedScales?.gottman) {
      return assessment.validatedScales.gottman;
    }

    return {
      fourHorsemen: {
        critica: 0,
        defensividade: 0,
        desprezo: 0,
        stonewalling: 0
      },
      bidsForConnection: {
        tentativas: assessment.ratings?.conexaoEmocional || 0,
        respostasPositivas: assessment.ratings?.apoioMutuo || 0,
        respostasNegativas: 0,
        respostasNeutras: 0
      },
      resolucaoConflitos: assessment.ratings?.resolucaoConflitos || 0,
      significadoCompartilhado: assessment.ratings?.alinhamentoObjetivos || 0,
      reparacao: assessment.ratings?.apoioMutuo || 0,
      influenciaPositiva: assessment.ratings?.apoioMutuo || 0
    };
  }

  private convertAssessmentToMoodEntry(assessment: DailyAssessment): MoodEntry {
    if (!assessment.mood?.primary || !this.isMoodType(assessment.mood.primary)) {
      throw new Error('Invalid mood data in assessment');
    }

    return {
      id: `mood_${assessment.userId}_${new Date().getTime()}`,
      userId: assessment.userId,
      timestamp: assessment.timestamp || assessment.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mood: {
        primary: assessment.mood.primary,
        intensity: assessment.mood.intensity || 3,
        notes: assessment.mood.notes || ''
      },
      context: {
        activities: assessment.context?.activities?.type || [],
        triggers: assessment.context?.conflict?.hadConflict ? ['conflict'] : [],
        location: '',
        socialContext: [],
        intensity: assessment.mood.intensity || 3,
        duration: 0
      }
    };
  }

  private processAttachmentStyle(metrics: LocalAttachmentMetrics): AttachmentStyleDetails {
    const { anxiety, avoidance } = metrics.ecr;
    let primary: AttachmentStyle;
    let description: string;
    let recommendations: string[];

    if (anxiety < 4 && avoidance < 4) {
      primary = 'secure';
      description = 'Demonstra um padrão de apego seguro, com boa capacidade de conexão e confiança.';
      recommendations = [
        'Continue cultivating the open and honest communication',
        'Maintain the balance between independence and intimacy',
        'Celebrate significant connection moments'
      ];
    } else if (anxiety >= 4 && avoidance < 4) {
      primary = 'anxious';
      description = 'Apresenta tendências de apego ansioso, com necessidade de reasseguramento frequente.';
      recommendations = [
        'Desenvolva práticas de auto-regulação emocional',
        'Trabalhe na construção de autoconfiança',
        'Estabeleça limites saudáveis na relação'
      ];
    } else if (avoidance >= 4 && anxiety < 4) {
      primary = 'avoidant';
      description = 'Apresenta tendências de apego evitativo, com possível dificuldade em confiar e receber apoio.';
      recommendations = [
        'Pratique a vulnerabilidade em pequenos passos',
        'Comunique suas necessidades de espaço de forma clara',
        'Desenvolva estratégias para lidar com a intimidade emocional'
      ];
    } else {
      primary = 'disorganized';
      description = 'Apresenta padrões mistos de apego, que podem variar conforme o contexto.';
      recommendations = [
        'Busque consistência nas interações',
        'Desenvolva estratégias de auto-conhecimento',
        'Considere apoio terapêutico para explorar padrões'
      ];
    }

    return {
      style: primary,
      description,
      recommendations
    };
  }

  private processGottmanMetrics(metrics: ValidatedScales['gottman']): ValidatedScales['gottman'] {
    if (!metrics) {
      return {
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
      };
    }

    return {
      fourHorsemen: metrics.fourHorsemen,
      bidsForConnection: metrics.bidsForConnection,
      resolucaoConflitos: metrics.resolucaoConflitos,
      significadoCompartilhado: metrics.significadoCompartilhado,
      reparacao: metrics.reparacao,
      influenciaPositiva: metrics.influenciaPositiva
    };
  }

  private processAttachmentMetrics(metrics: AttachmentMetrics): AttachmentMetrics {
    if (!metrics) {
      return {
        ecr: {
          anxiety: 0,
          avoidance: 0
        },
        securityLevel: 0,
        attachmentStyle: 'secure'
      };
    }

    return {
      ecr: {
        anxiety: metrics.ecr.anxiety,
        avoidance: metrics.ecr.avoidance
      },
      securityLevel: metrics.securityLevel,
      attachmentStyle: metrics.attachmentStyle
    };
  }

  private async processValidatedScales(assessment: DailyAssessment): Promise<ValidatedScales | undefined> {
    if (!assessment.validatedScales) {
      return undefined;
    }

    // Create a partner assessment with the same ratings for DAS calculation
    const partnerAssessment: DailyAssessment = {
      ...assessment,
      ratings: assessment.validatedScales.das ? 
        {
          ...assessment.ratings,
          alinhamentoObjetivos: assessment.validatedScales.das.consenso * 2,
          satisfacaoGeral: assessment.validatedScales.das.satisfacao * 2,
          apoioMutuo: assessment.validatedScales.das.coesao * 2,
          conexaoEmocional: assessment.validatedScales.das.expressaoAfetiva * 2
        } : 
        assessment.ratings
    };

    return {
      das: this.calculateDAS(assessment, partnerAssessment),
      csi: assessment.validatedScales.csi,
      gottman: this.processGottmanMetrics(assessment.validatedScales.gottman),
      attachment: assessment.validatedScales.attachment ? this.processAttachmentMetrics(assessment.validatedScales.attachment) : this.processAttachmentMetrics({
        ecr: { anxiety: 0, avoidance: 0 },
        securityLevel: 0,
        attachmentStyle: 'secure'
      })
    };
  }

  private calculateRatingScore(ratings: CategoryRatings, category: keyof CategoryRatings): number {
    return ratings[category] || 0;
  }

  private calculateAttachmentMetrics(assessment: DailyAssessment): AttachmentMetrics {
    // If we already have validated scales with attachment data, use that
    if (assessment.validatedScales?.attachment) {
      return assessment.validatedScales.attachment;
    }

    // Calculate ECR scores based on ratings
    const { anxiety, avoidance } = this.calculateECRScores({
      primary: this.determineAttachmentStyle(
        this.calculateAnxietyScore(assessment.ratings),
        this.calculateAvoidanceScore(assessment.ratings)
      ),
      description: '',
      recommendations: []
    });
    
    // Calculate security level based on ECR scores
    const securityLevel = this.calculateSecurityLevel({ anxiety, avoidance });
    
    // Process attachment style using the dedicated method
    const attachmentDetails = this.processAttachmentStyle({
      ecr: { anxiety, avoidance },
      securityLevel,
      attachmentStyle: this.determineAttachmentStyle(anxiety, avoidance)
    });

    return {
      ecr: { anxiety, avoidance },
      securityLevel,
      attachmentStyle: attachmentDetails.style
    };
  }

  private calculateAnxietyScore(ratings: ImportedCategoryRatings): number {
    const anxietyFactors = {
      segurancaRelacionamento: -1,
      conexaoEmocional: -0.8,
      apoioMutuo: -0.6,
      comunicacao: -0.4
    };

    let score = 0;
    let totalWeight = 0;

    Object.entries(anxietyFactors).forEach(([category, weight]) => {
      const rating = this.calculateRatingScore(ratings, category as keyof CategoryRatings);
      if (rating !== undefined) {
        score += (5 - rating) * Math.abs(weight);
        totalWeight += Math.abs(weight);
      }
    });

    return totalWeight > 0 ? (score / totalWeight) : 0;
  }

  private calculateAvoidanceScore(ratings: ImportedCategoryRatings): number {
    const avoidanceFactors = {
      intimidade: -1,
      comunicacao: -0.8,
      qualidadeTempo: -0.6,
      transparenciaConfianca: -0.6
    };

    let score = 0;
    let totalWeight = 0;

    Object.entries(avoidanceFactors).forEach(([category, weight]) => {
      const rating = this.calculateRatingScore(ratings, category as keyof CategoryRatings);
      if (rating !== undefined) {
        score += (5 - rating) * Math.abs(weight);
        totalWeight += Math.abs(weight);
      }
    });

    return totalWeight > 0 ? (score / totalWeight) : 0;
  }

  private determineAttachmentStyle(anxiety: number, avoidance: number): AttachmentStyle {
    const threshold = 2.5; // Midpoint threshold for determining style

    if (anxiety < threshold && avoidance < threshold) {
      return 'secure';
    } else if (anxiety >= threshold && avoidance < threshold) {
      return 'anxious';
    } else if (anxiety < threshold && avoidance >= threshold) {
      return 'avoidant';
    } else {
      return 'disorganized';
    }
  }

  private isValidMoodEntry(entry: MoodEntry | null): entry is MoodEntry {
    if (!entry) return false;
    return (
      !!entry.userId &&
      !!entry.timestamp &&
      !!entry.mood?.primary &&
      this.isMoodType(entry.mood.primary) &&
      typeof entry.mood.intensity === 'number' &&
      entry.mood.intensity >= 1 &&
      entry.mood.intensity <= 5
    );
  }

  private async generateUnifiedAnalysis(
    userId: string,
    context: RelationshipContext,
    data: {
      assessments: DailyAssessment[];
      consensusForms: ConsensusFormData[];
      moodEntries: MoodEntry[];
      gottmanAssessment?: GottmanAssessmentData;
      validatedScales?: ValidatedScales;
    }
  ): Promise<ComprehensiveAnalysis> {
    // Get latest consensus form scores if available
    const latestConsensusForm = data.consensusForms && data.consensusForms.length > 0
      ? data.consensusForms[0]
      : undefined; // Change null to undefined to match expected type

    // Get user assessment and validate
    const userAssessment = data.assessments[0];
    if (!this.validateAssessment(userAssessment)) {
      throw new Error('Invalid user assessment data');
    }

    // Generate temporal analysis first since we need it for confidence calculation
    const temporalAnalysis = await analyzeTemporalPatterns(data.assessments, []);
    
    // Calculate confidence considering both assessments and consensus form
    const confidenceScore = calculateConfidenceLevel(
      data.assessments.length,
      !!latestConsensusForm
    );

    // Generate emotional dynamics with consensus form context
    const emotionalDynamics = await this.generateEmotionalDynamics(
      userAssessment,
      userAssessment,
      latestConsensusForm
    );

    const relationshipAnalysis: RelationshipAnalysis = {
      id: `analysis_${new Date().getTime()}`,
      userId: userAssessment.userId,
      partnerId: userAssessment.partnerId,
      date: new Date().toISOString(),
      type: 'individual',
      overallHealth: {
        score: calculateOverallEmotionalHealth(
          emotionalDynamics.synchronicity,
          emotionalDynamics.stability,
          emotionalDynamics.intimacyBalance
        ),
        trend: this.determineTrend(temporalAnalysis.trends),
        confidence: confidenceScore,
        emotionalSync: emotionalDynamics.synchronicity
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
      emotionalDynamics,
      emotionalSync: 0,
      moodDiscrepancies: [],
      insights: this.generateInsights(temporalAnalysis),
      riskFactors: [],
      recommendations: [],
      validatedScales: data.validatedScales || {
        das: {
          total: 0,
          consenso: 0,
          satisfacao: 0,
          coesao: 0,
          expressaoAfetiva: 0
        }
      },
      metadata: {
        assessmentCount: data.assessments.length,
        timeSpan: '1 day',
        confidence: confidenceScore,
        lastUpdate: new Date().toISOString(),
        hasConsensusForm: !!latestConsensusForm // Add consensus form presence
      } as ValidationMetadata,
      clinicalSignificance: {
        gaps: [{
          dimension: 'communication',
          score: 0,
          normativeScore: 0,
          difference: 0,
          isSignificant: false,
          severity: 'low'
        }],
        recommendations: [],
        riskFactors: [],
        protectiveFactors: [],
        severity: 'low',
        confidence: confidenceScore
      },
      gptAnalysis: {
        id: `gpt_${new Date().getTime()}`,
        userId: userAssessment.userId,
        partnerId: userAssessment.partnerId,
        date: new Date().toISOString(),
        type: 'individual',
        analysis: {
          moodPatterns: {
            user: {
              dominant: 'neutral',
              frequency: defaultMoodFrequency,
              transitions: {}
            },
            partner: {
              dominant: 'neutral',
              frequency: defaultMoodFrequency,
              transitions: {}
            },
            overall: {
              synchronicity: calculateEmotionalSync(
                [this.convertAssessmentToMoodEntry(userAssessment)],
                [this.convertAssessmentToMoodEntry(data.assessments.length > 1 ? data.assessments[1] : userAssessment)]
              ),
              stability: calculateMoodStability(data.moodEntries),
              variability: 0.5
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
            style: 'secure',
            behaviors: [],
            triggers: [],
            suggestions: []
          }
        },
        timestamp: new Date().toISOString(),
        version: '1.0',
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: confidenceScore
        }
      }
    };

    const analysis: ComprehensiveAnalysis = {
      context,
      communicationPatterns: {
        style: 'collaborative',
        effectiveness: 0,
        patterns: [],
        confidence: confidenceScore
      },
      emotionalDynamics,
      stage: {
        current: 'initial',
        nextSteps: [],
        timelineEstimate: '1 month'
      },
      temporalAnalysis,
      validation: {
        consistency: this.validateConsistency(userAssessment, latestConsensusForm),
        reliability: confidenceScore,
        completeness: this.calculateCompleteness(userAssessment, latestConsensusForm),
        recommendations: this.generateValidationRecommendations(userAssessment)
      },
      attachmentStyle: {
        user: 'secure',
        partner: 'secure',
        compatibility: 0.8
      },
      relationshipAnalysis,
      overallHealth: {
        score: this.calculateOverallHealth(userAssessment.ratings),
        trend: this.determineTrend(temporalAnalysis.trends),
        confidence: confidenceScore
      },
      clinicalSignificance: {
        gaps: [{
          dimension: 'communication',
          score: 0,
          normativeScore: 0,
          difference: 0,
          isSignificant: false,
          severity: 'low'
        }],
        recommendations: [],
        riskFactors: [],
        protectiveFactors: [],
        severity: 'low',
        confidence: confidenceScore
      }
    };

    // Process Gottman metrics if available
    const processGottmanMetrics = (gottmanData?: GottmanAssessmentData): GottmanMetrics => {
      if (!gottmanData?.validatedScales?.gottman) {
        return {
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
        };
      }
      return gottmanData.validatedScales.gottman;
    };

    const gottmanMetrics = processGottmanMetrics(data.gottmanAssessment);
    
    // Calculate final confidence score considering all factors
    const finalConfidenceScore = data.gottmanAssessment 
      ? (confidenceScore + 0.8) / 2  // Boost confidence when Gottman data is available
      : confidenceScore;
    
    // Update relationship analysis with Gottman metrics
    relationshipAnalysis.validatedScales = {
      ...relationshipAnalysis.validatedScales,
      gottman: gottmanMetrics
    };

    // Add consensus form insights if available
    if (latestConsensusForm?.scores) {
      const consensusInsights = this.generateConsensusInsights(latestConsensusForm.scores);
      relationshipAnalysis.insights = [
        ...relationshipAnalysis.insights,
        ...consensusInsights.map(insight => ({
          id: `consensus_${new Date().getTime()}_${Math.random()}`,
          type: 'observation' as const,
          category: 'consensus',
          description: insight,
          confidence: confidenceScore,
          impact: 'medium' as const,
          timestamp: new Date().toISOString()
        }))
      ];
    }

    // Update all confidence scores with final value
    relationshipAnalysis.metadata.confidence = finalConfidenceScore;
    relationshipAnalysis.overallHealth.confidence = finalConfidenceScore;
    relationshipAnalysis.clinicalSignificance.confidence = finalConfidenceScore;

    return analysis;
  }

  private generateConsensusInsights(scores: ConsensusFormData['scores']): string[] {
    const insights: string[] = [];
    
    // Generate insights based on scores with null checks
    if (scores?.affection !== undefined && scores.affection < 3) {
      insights.push('Oportunidade para melhorar demonstrações de afeto');
    }
    if (scores?.cohesion !== undefined && scores.cohesion < 3) {
      insights.push('Considere aumentar atividades compartilhadas');
    }
    if (scores?.consensus !== undefined && scores.consensus < 3) {
      insights.push('Importante alinhar expectativas em questões importantes');
    }
    if (scores?.satisfaction !== undefined && scores.satisfaction < 3) {
      insights.push('Atenção à satisfação geral do relacionamento');
    }
    if (scores?.conflict !== undefined && scores.conflict > 3) {
      insights.push('Considere estratégias para melhor resolução de conflitos');
    }
    
    return insights;
  }

  public async generateAnalysis(
    userId: string,
    context: RelationshipContext,
    data: {
      assessments: DailyAssessment[];
      consensusForms: ConsensusFormData[];
      moodEntries: MoodEntry[];
      gottmanAssessment?: GottmanAssessmentData;
      validatedScales?: ValidatedScales;
    },
    analysisType: 'comprehensive' | 'unified' = 'comprehensive'
  ): Promise<FormSubmissionResult<ComprehensiveAnalysis>> {
    try {
      if (analysisType === 'unified') {
        const analysis = await this.generateUnifiedAnalysis(userId, context, data);
        return {
          success: true,
          data: analysis
        };
      } else {
        return this.generateComprehensiveAnalysis(userId, context, data);
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      return {
        success: false,
        error: {
          message: `Failed to generate ${analysisType} analysis`,
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
} 
