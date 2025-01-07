import { 
  MoodEntry, 
  MoodTrackingForm,
  FormSubmissionResult,
  FormError,
  ComprehensiveAnalysis,
  DailyAssessment,
  RelationshipContext,
  CommunicationPatterns,
  EmotionalDynamics,
  TemporalAnalysis,
  RelationshipAnalysis,
  ValidatedScales,
  AttachmentStyle,
  AttachmentStyleType,
  MoodType,
  TrendAnalysis as ImportedTrendAnalysis,
  GPTAnalysis,
  CategoryRatings,
  DyadicAdjustmentScale,
  CouplesSatisfactionIndex,
  GottmanMetrics,
  RelationshipStage,
  ConsistencyValidation,
  ValidationRecommendation,
  Insight,
  TimeframeAnalysis,
  DiscrepancyAnalysis,
  MoodDiscrepancy,
  Pattern as PatternType,
  CyclicalBehavior as CyclicalBehaviorType
} from '../types';

import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { analyzeAttachmentStyle } from './attachmentService';
import { analyzeCommunicationPatterns } from './communicationService';
import { analyzeTrends, detectCyclicalBehaviors } from './temporalAnalysisService';
import { identifyPatterns } from './temporalAnalysisService';
import { getUserMoodEntries, analyzeMoodPatterns, POSITIVE_MOODS, NEGATIVE_MOODS } from './moodService';
import { calculateEmotionalSync, calculateMoodStability } from './relationshipAnalysisService';

interface TimeframeSummary extends TimeframeAnalysis {
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

interface Pattern extends PatternType {}

interface CyclicalBehavior extends CyclicalBehaviorType {}

interface AttachmentAnalysisResult {
  primary: {
    primary: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
    description: string;
    recommendations: string[];
  };
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

export class RelationshipOrchestrator {
  private db = db;
  private historicalAssessments?: DailyAssessment[];

  public async processFormSubmission(
    userId: string,
    formData: MoodTrackingForm,
    formType: 'mood_tracking'
  ): Promise<FormSubmissionResult<MoodEntry>> {
    try {
      const moodEntry: MoodEntry = {
        id: `${userId}_${new Date().toISOString()}`,
        userId: userId,
        timestamp: formData.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        mood: formData.mood,
        context: {
          activities: [],
          triggers: [],
          location: '',
          socialContext: [],
          intensity: formData.mood.intensity
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
    } catch (error) {
      console.error('Error processing mood tracking form:', error);
      const formError: FormError = {
        message: 'Failed to save mood entry',
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
    partnerAssessment: DailyAssessment
  ): Promise<EmotionalDynamics> {
    try {
      // Fetch mood entries for both users
      const [userMoodEntries, partnerMoodEntries] = await Promise.all([
        getUserMoodEntries(userAssessment.userId),
        getUserMoodEntries(partnerAssessment.userId)
      ]);

      // Analyze mood patterns
      const userMoodAnalysis = await analyzeMoodPatterns(userMoodEntries, 'daily');
      const partnerMoodAnalysis = await analyzeMoodPatterns(partnerMoodEntries, 'daily');

      // Calculate emotional synchronicity
      const synchronicity = userMoodEntries.length > 0 && partnerMoodEntries.length > 0
        ? calculateEmotionalSync(userMoodEntries, partnerMoodEntries)
        : 0.5; // Default if no historical data

      // Calculate stability based on mood patterns
      const stability = userMoodEntries.length > 0
        ? calculateMoodStability(userMoodEntries)
        : 0.5; // Default if no historical data

      // Get dominant moods and frequencies
      const userPatterns = userMoodAnalysis?.patterns || {
        dominantMoods: [],
        moodTransitions: [],
        timePatterns: {}
      };
      
      const partnerPatterns = partnerMoodAnalysis?.patterns || {
        dominantMoods: [],
        moodTransitions: [],
        timePatterns: {}
      };

      // Calculate conflict resolution effectiveness
      const conflictResolutionScore = userAssessment.ratings.resolucaoConflitos || 0;
      const conflictStyle = conflictResolutionScore > 7 ? 'collaborative' :
                           conflictResolutionScore > 5 ? 'compromising' :
                           conflictResolutionScore > 3 ? 'avoiding' : 'confrontational';

      return {
        emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
        intimacyBalance: {
          score: (userAssessment.ratings.intimidadeFisica + partnerAssessment.ratings.intimidadeFisica) / 2,
          areas: {
            emotional: userAssessment.ratings.conexaoEmocional || 0,
            physical: userAssessment.ratings.intimidadeFisica || 0,
            intellectual: userAssessment.ratings.alinhamentoObjetivos || 0,
            shared: userAssessment.ratings.qualidadeTempo || 0
          }
        },
        conflictResolution: {
          style: conflictStyle,
          effectiveness: conflictResolutionScore,
          patterns: userPatterns.moodTransitions.filter(transition => 
            transition.includes('irritado') || transition.includes('frustrado')
          ),
          confidence: userMoodEntries.length > 10 ? 0.8 : 0.5
        },
        synchronicity,
        stability,
        patterns: {
          user: {
            dominant: (userPatterns.dominantMoods[0]?.mood as MoodType) || 'neutral',
            frequency: this.convertMoodFrequencyToRecord(userPatterns.dominantMoods),
            transitions: this.convertTransitionsToRecord(userPatterns.moodTransitions)
          },
          partner: {
            dominant: (partnerPatterns.dominantMoods[0]?.mood as MoodType) || 'neutral',
            frequency: this.convertMoodFrequencyToRecord(partnerPatterns.dominantMoods),
            transitions: this.convertTransitionsToRecord(partnerPatterns.moodTransitions)
          }
        },
        insights: {
          strengths: this.generateStrengths(userMoodEntries, partnerMoodEntries),
          challenges: this.generateChallenges(userMoodEntries, partnerMoodEntries),
          recommendations: this.generateRecommendations(userMoodEntries, partnerMoodEntries)
        }
      };
    } catch (error) {
      console.error('Error generating emotional dynamics:', error);
      // Return a safe default with indication of error
      return {
        emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
        intimacyBalance: {
          score: (userAssessment.ratings.intimidadeFisica + partnerAssessment.ratings.intimidadeFisica) / 2,
          areas: {
            emotional: userAssessment.ratings.conexaoEmocional || 0,
            physical: userAssessment.ratings.intimidadeFisica || 0,
            intellectual: userAssessment.ratings.alinhamentoObjetivos || 0,
            shared: userAssessment.ratings.qualidadeTempo || 0
          }
        },
        conflictResolution: {
          style: 'collaborative',
          effectiveness: userAssessment.ratings.resolucaoConflitos || 0,
          patterns: [],
          confidence: 0.5
        },
        synchronicity: 0.5,
        stability: 0.5,
        patterns: {
          user: {
            dominant: 'neutral',
            frequency: {
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
            },
            transitions: {}
          },
          partner: {
            dominant: 'neutral',
            frequency: {
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
            },
            transitions: {}
          }
        },
        insights: {
          strengths: [],
          challenges: [],
          recommendations: []
        }
      };
    }
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
    return [
      'feliz', 'animado', 'grato', 'calmo', 'satisfeito', 'amado',
      'ansioso', 'estressado', 'triste', 'irritado', 'frustrado',
      'exausto', 'confuso', 'solitário', 'neutral', 'content'
    ].includes(mood);
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

  private calculateOverallHealth(ratings: Record<string, number>): number {
    const weights = {
      comunicacao: 0.2,
      conexaoEmocional: 0.15,
      apoioMutuo: 0.1,
      transparenciaConfianca: 0.15,
      intimidadeFisica: 0.1,
      saudeMental: 0.1,
      resolucaoConflitos: 0.1,
      segurancaRelacionamento: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(weights)) {
      if (ratings[category] !== undefined) {
        totalScore += ratings[category] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
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
      consensusForms: any[];
      moodEntries: MoodEntry[];
    }
  ): Promise<ComprehensiveAnalysis> {
    console.log('[RelationshipOrchestrator] Starting comprehensive analysis:', {
      userId,
      hasContext: !!context,
      assessmentsCount: data.assessments.length,
      moodEntriesCount: data.moodEntries.length
    });

    if (!data.assessments || data.assessments.length < 2) {
      console.warn('[RelationshipOrchestrator] Insufficient assessment data');
      throw new Error('Insufficient assessment data for analysis');
    }

    const [userAssessment, partnerAssessment] = data.assessments;
    
    if (!userAssessment || !partnerAssessment) {
      console.warn('[RelationshipOrchestrator] Missing user or partner assessment');
      throw new Error('Missing required assessment data');
    }

    try {
      const emotionalDynamics = await this.generateEmotionalDynamics(userAssessment, partnerAssessment);
      console.log('[RelationshipOrchestrator] Generated emotional dynamics:', {
        hasEmotionalSecurity: !!emotionalDynamics.emotionalSecurity,
        hasIntimacyBalance: !!emotionalDynamics.intimacyBalance,
        hasConflictResolution: !!emotionalDynamics.conflictResolution
      });

      // Generate attachment analysis
      const attachmentAnalysis = await analyzeAttachmentStyle(userAssessment, partnerAssessment);
      const communicationPatterns = await analyzeCommunicationPatterns(userAssessment, partnerAssessment);
      
      // Calculate ECR scores based on attachment style
      const ecrScores = {
        ansiedade: attachmentAnalysis.primary.primary === 'anxious' ? 4 : 
                  attachmentAnalysis.primary.primary === 'disorganized' ? 3 : 2,
        evitacao: attachmentAnalysis.primary.primary === 'avoidant' ? 4 :
                 attachmentAnalysis.primary.primary === 'disorganized' ? 3 : 2
      };

      // Generate temporal analysis using actual historical data
      let temporalAnalysis: TemporalAnalysis = {
        correlation: 0,
        trends: {},
        patterns: {
          cyclical: [],
          persistent: [],
          emerging: []
        },
        timeframes: {
          daily: {
            averageScores: {
              satisfacaoGeral: 0,
              comunicacao: 0,
              intimidade: 0,
              apoioMutuo: 0,
              alinhamentoObjetivos: 0,
              resolucaoConflitos: 0,
              conexaoEmocional: 0,
              segurancaRelacionamento: 0,
              transparenciaConfianca: 0,
              intimidadeFisica: 0,
              saudeMental: 0,
              qualidadeTempo: 0
            },
            discrepancies: [],
            insights: [],
            confidence: 0,
            trends: {}
          },
          weekly: {
            averageScores: {
              satisfacaoGeral: 0,
              comunicacao: 0,
              intimidade: 0,
              apoioMutuo: 0,
              alinhamentoObjetivos: 0,
              resolucaoConflitos: 0,
              conexaoEmocional: 0,
              segurancaRelacionamento: 0,
              transparenciaConfianca: 0,
              intimidadeFisica: 0,
              saudeMental: 0,
              qualidadeTempo: 0
            },
            discrepancies: [],
            insights: [],
            confidence: 0,
            trends: {}
          },
          monthly: {
            averageScores: {
              satisfacaoGeral: 0,
              comunicacao: 0,
              intimidade: 0,
              apoioMutuo: 0,
              alinhamentoObjetivos: 0,
              resolucaoConflitos: 0,
              conexaoEmocional: 0,
              segurancaRelacionamento: 0,
              transparenciaConfianca: 0,
              intimidadeFisica: 0,
              saudeMental: 0,
              qualidadeTempo: 0
            },
            discrepancies: [],
            insights: [],
            confidence: 0,
            trends: {}
          }
        },
        seasonality: 0,
        volatility: 0,
        confidence: 0,
        analysisDate: new Date().toISOString()
      };

      // If we have historical data, analyze trends and patterns
      if (this.historicalAssessments && this.historicalAssessments.length > 0) {
        const userHistory = this.historicalAssessments.filter(a => a.userId === userAssessment.userId);
        const partnerHistory = this.historicalAssessments.filter(a => a.userId === userAssessment.partnerId);
        
        if (userHistory.length > 0 && partnerHistory.length > 0) {
          // Analyze trends
          const trends = analyzeTrends(userHistory, partnerHistory);
          
          // Identify patterns
          const patterns = identifyPatterns(userHistory, partnerHistory);
          
          // Detect cyclical behaviors
          const cyclicalBehaviors = detectCyclicalBehaviors(userHistory, partnerHistory);
          
          // Update temporal analysis with actual data
          temporalAnalysis = {
            ...temporalAnalysis,
            correlation: patterns.find(p => p.type === 'reactive')?.significance || 0,
            trends: Object.fromEntries(
              Object.entries(trends).map(([key, value]) => [
                key,
                {
                  slope: value.magnitude || 0,
                  rSquared: this.calculateRSquared(userHistory, key),
                  pValue: this.calculatePValue(userHistory, key),
                  isSignificant: value.magnitude > 0.5,
                  trend: value.direction,
                  confidence: value.confidence,
                  timeframe: this.determineTimeframe(userHistory),
                  dataPoints: userHistory.length + partnerHistory.length,
                  category: key,
                  score: value.magnitude * 10,
                  insights: [value.description],
                  magnitude: value.magnitude,
                  direction: value.direction,
                  significance: value.magnitude > 0.7 ? 'high' : value.magnitude > 0.3 ? 'medium' : 'low',
                  description: value.description,
                  userTrend: {
                    slope: value.magnitude || 0,
                    rSquared: this.calculateRSquared(userHistory, key),
                    trend: value.direction
                  },
                  partnerTrend: {
                    slope: value.magnitude || 0,
                    rSquared: this.calculateRSquared(partnerHistory, key),
                    trend: value.direction
                  }
                } as TrendAnalysis
              ])
            ),
            patterns: {
              cyclical: cyclicalBehaviors.map(behavior => `${behavior.category}: ${behavior.description} (period: ${behavior.cycle.period})`),
              persistent: patterns.filter(p => p.type === 'progressive').map(pattern => `${pattern.type}: ${pattern.description} (significance: ${pattern.significance})`),
              emerging: patterns.filter(p => p.type === 'reactive').map(pattern => `${pattern.type}: ${pattern.description} (significance: ${pattern.significance})`)
            },
            timeframes: {
              daily: this.generateTimeframeSummary(userHistory, partnerHistory, 1),
              weekly: this.generateTimeframeSummary(userHistory, partnerHistory, 7),
              monthly: this.generateTimeframeSummary(userHistory, partnerHistory, 30)
            },
            seasonality: this.calculateSeasonality(userHistory, partnerHistory),
            volatility: this.calculateVolatility(userHistory, partnerHistory),
            confidence: this.calculateConfidence(userHistory.length, partnerHistory.length),
            analysisDate: new Date().toISOString()
          };
        }
      }

      const relationshipAnalysis: RelationshipAnalysis = {
        id: `analysis_${new Date().getTime()}`,
        userId: userAssessment.userId,
        partnerId: userAssessment.partnerId,
        date: new Date().toISOString(),
        type: 'individual',
        overallHealth: {
          score: this.calculateOverallHealth(userAssessment.ratings),
          trend: this.determineTrend(temporalAnalysis.trends),
          confidence: this.calculateConfidence(this.historicalAssessments?.length || 0, 0)
        },
        categories: this.generateCategoryAnalysis(userAssessment.ratings),
        strengthsAndChallenges: {
          strengths: this.extractStrengths(temporalAnalysis),
          challenges: this.extractChallenges(temporalAnalysis)
        },
        communicationSuggestions: communicationPatterns.patterns,
        actionItems: attachmentAnalysis.recommendations,
        relationshipDynamics: {
          strengths: this.extractRelationshipStrengths(temporalAnalysis),
          challenges: this.extractRelationshipChallenges(temporalAnalysis),
          recommendations: this.generateRecommendations(data.moodEntries, [])
        },
        emotionalDynamics,
        emotionalSync: calculateEmotionalSync(data.moodEntries, []),
        moodDiscrepancies: this.analyzeMoodDiscrepancies(data.moodEntries, []),
        insights: this.generateInsights(temporalAnalysis),
        riskFactors: this.identifyRiskFactors(temporalAnalysis),
        recommendations: this.generateRecommendations(data.moodEntries, []),
        validatedScales: {
          das: this.calculateDAS(userAssessment, partnerAssessment),
          csi: this.calculateCSI(userAssessment, partnerAssessment),
          gottman: this.calculateGottmanMetrics(userAssessment, partnerAssessment),
          attachment: {
            ecr: {
              ansiedade: ecrScores.ansiedade,
              evitacao: ecrScores.evitacao,
              anxiety: ecrScores.ansiedade,
              avoidance: ecrScores.evitacao
            },
            securityLevel: this.calculateSecurityLevel(attachmentAnalysis),
            attachmentStyle: {
              primary: attachmentAnalysis.primary.primary,
              description: attachmentAnalysis.description,
              recommendations: attachmentAnalysis.recommendations
            },
            padraoApego: {
              primary: attachmentAnalysis.primary.primary,
              description: attachmentAnalysis.description,
              recommendations: attachmentAnalysis.recommendations
            },
            compatibilidadeApego: this.calculateAttachmentCompatibility(userAssessment, partnerAssessment)
          },
          consistency: {
            default: {
              score: this.calculateConsistencyScore(userAssessment),
              confidence: this.calculateConfidenceScore(userAssessment),
              flags: this.identifyConsistencyFlags(userAssessment)
            }
          },
          reliability: this.calculateReliability(userAssessment),
          completeness: this.calculateCompleteness(userAssessment),
          recommendations: this.generateScaleRecommendations(userAssessment),
          isValid: this.validateAssessment(userAssessment),
          errors: []
        },
        gptAnalysis: {} as GPTAnalysis,
        metadata: {
          assessmentCount: this.historicalAssessments?.length || 1,
          timeSpan: this.determineTimeSpan(this.historicalAssessments),
          confidence: this.calculateOverallConfidence(temporalAnalysis),
          lastUpdate: new Date().toISOString()
        }
      };

      return {
        context,
        communicationPatterns,
        emotionalDynamics,
        stage: this.determineRelationshipStage(temporalAnalysis),
        temporalAnalysis,
        validation: {
          consistency: this.validateConsistency(userAssessment),
          reliability: this.calculateReliability(userAssessment),
          completeness: this.calculateCompleteness(userAssessment),
          recommendations: this.generateValidationRecommendations(userAssessment)
        },
        attachmentStyle: {
          user: attachmentAnalysis.primary.primary,
          partner: attachmentAnalysis.primary.primary,
          compatibility: this.calculateAttachmentCompatibility(userAssessment, partnerAssessment)
        },
        relationshipAnalysis,
        overallHealth: {
          score: this.calculateOverallHealth(userAssessment.ratings),
          trend: this.determineTrend(temporalAnalysis.trends)
        }
      };
    } catch (error) {
      console.error('[RelationshipOrchestrator] Error in comprehensive analysis:', error);
      throw error;
    }
  }

  // Helper functions for temporal analysis
  private calculateRSquared(assessments: DailyAssessment[], category: string): number {
    if (!assessments || assessments.length < 2) return 0;
    
    const scores = assessments.map(a => a.ratings[category] || 0);
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

  private calculatePValue(assessments: DailyAssessment[], category: string): number {
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
    // Implement seasonality detection using time series analysis
    return 0;
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
    const totalAssessments = userCount + partnerCount;
    if (totalAssessments < 5) return 0.5;
    if (totalAssessments < 15) return 0.7;
    if (totalAssessments < 30) return 0.8;
    return 0.9;
  }

  private generateTimeframeSummary(userHistory: DailyAssessment[], partnerHistory: DailyAssessment[], days: number): TimeframeAnalysis {
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
      qualidadeTempo: 0
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
          insights: [`Diferença significativa em ${category}: ${difference.toFixed(1)} pontos`],
          recommendations: [
            `Discutir percepções sobre ${category}`,
            `Alinhar expectativas em relação a ${category}`
          ]
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
      const rSquared = this.calculateRSquared(userHistory, category);
      const pValue = this.calculatePValue(userHistory, category);
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
        insights: [this.generateTrendInsight(category, direction, magnitude)],
        magnitude,
        direction,
        significance,
        userTrend: {
          slope: this.calculateTrend(userScores),
          rSquared: this.calculateRSquared(userHistory, category),
          trend: direction
        },
        partnerTrend: {
          slope: this.calculateTrend(partnerScores),
          rSquared: this.calculateRSquared(partnerHistory, category),
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
    
    Object.entries(analysis.trends).forEach(([category, trend]) => {
      if (trend.isSignificant) {
        insights.push({
          id: `insight_${Date.now()}_${category}`,
          type: 'pattern',
          category,
          description: `${trend.trend === 'improving' ? 'Melhoria' : 'Declínio'} significativo em ${category}`,
          confidence: trend.confidence,
          impact: trend.magnitude > 0.7 ? 'high' : trend.magnitude > 0.3 ? 'medium' : 'low',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return insights;
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

  private calculateCSI(assessment: DailyAssessment, partnerAssessment: DailyAssessment): CouplesSatisfactionIndex {
    return {
      satisfacaoGlobal: (assessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2,
      estabilidade: (assessment.ratings.segurancaRelacionamento + partnerAssessment.ratings.segurancaRelacionamento) / 2,
      comprometimento: (assessment.ratings.alinhamentoObjetivos + partnerAssessment.ratings.alinhamentoObjetivos) / 2,
      comunicacao: (assessment.ratings.comunicacao + partnerAssessment.ratings.comunicacao) / 2,
      gestaoConflitos: (assessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2,
      atividadesCompartilhadas: (assessment.ratings.qualidadeTempo + partnerAssessment.ratings.qualidadeTempo) / 2,
      total: 0 // Will be calculated based on the above scores
    };
  }

  private calculateGottmanMetrics(assessment: DailyAssessment, partnerAssessment: DailyAssessment): GottmanMetrics {
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
      resolucaoConflitos: (assessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2,
      significadoCompartilhado: (assessment.ratings.alinhamentoObjetivos + partnerAssessment.ratings.alinhamentoObjetivos) / 2,
      reparacao: 0,
      influenciaPositiva: (assessment.ratings.apoioMutuo + partnerAssessment.ratings.apoioMutuo) / 2
    };
  }

  private calculateSecurityLevel(attachmentAnalysis: AttachmentAnalysisResult): number {
    const style = attachmentAnalysis.primary.primary;
    switch (style) {
      case 'secure': return 0.8;
      case 'anxious': return 0.4;
      case 'avoidant': return 0.3;
      case 'disorganized': return 0.2;
      default: return 0.5;
    }
  }

  private calculateAttachmentCompatibility(assessment: DailyAssessment, partnerAssessment: DailyAssessment): number {
    const userSecurityScore = assessment.ratings.segurancaRelacionamento || 0;
    const partnerSecurityScore = partnerAssessment.ratings.segurancaRelacionamento || 0;
    return Math.min((userSecurityScore + partnerSecurityScore) / 2, 1);
  }

  private calculateConsistencyScore(assessment: DailyAssessment): number {
    const ratings = Object.values(assessment.ratings);
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance = ratings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratings.length;
    return Math.max(0, 1 - Math.sqrt(variance) / 5);
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

  private calculateCompleteness(assessment: DailyAssessment): number {
    const totalFields = Object.keys(assessment.ratings).length;
    const filledFields = Object.values(assessment.ratings).filter(v => v !== undefined && v !== null).length;
    return filledFields / totalFields;
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
    return this.calculateCompleteness(assessment) > 0.5 && this.calculateConsistencyScore(assessment) > 0.5;
  }

  private determineTimeSpan(assessments: DailyAssessment[] | undefined): string {
    if (!assessments || assessments.length === 0) return '1 day';
    
    const days = Math.ceil((new Date().getTime() - new Date(assessments[0].date).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return '7 days';
    if (days <= 30) return '30 days';
    return '90 days';
  }

  private calculateOverallConfidence(analysis: TemporalAnalysis): number {
    return analysis.confidence;
  }

  private determineRelationshipStage(analysis: TemporalAnalysis): RelationshipStage {
    const stage: RelationshipStage = {
      current: 'initial',
      timelineEstimate: '1-2 weeks',
      nextSteps: [
        'Estabelecer comunicação aberta',
        'Definir expectativas',
        'Criar rotinas compartilhadas'
      ]
    };
    return stage;
  }

  private validateConsistency(assessment: DailyAssessment): ConsistencyValidation {
    return {
      score: this.calculateConsistencyScore(assessment),
      flags: this.identifyConsistencyFlags(assessment)
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

  private convertPatternToString(pattern: Pattern): string {
    return `${pattern.type}: ${pattern.description} (significance: ${pattern.significance})`;
  }

  private convertCyclicalBehaviorToString(behavior: CyclicalBehavior): string {
    return `${behavior.category}: ${behavior.description} (period: ${behavior.cycle.period})`;
  }

  private updateTemporalAnalysisPatterns(analysis: TemporalAnalysis, userHistory: DailyAssessment[], partnerHistory: DailyAssessment[]): void {
    const patterns = identifyPatterns(userHistory, partnerHistory);
    const cyclicalBehaviors = detectCyclicalBehaviors(userHistory, partnerHistory);
    
    analysis.patterns = {
      cyclical: cyclicalBehaviors.map(behavior => `${behavior.category}: ${behavior.description} (period: ${behavior.cycle.period})`),
      persistent: patterns.filter(p => p.type === 'progressive').map(pattern => `${pattern.type}: ${pattern.description} (significance: ${pattern.significance})`),
      emerging: patterns.filter(p => p.type === 'reactive').map(pattern => `${pattern.type}: ${pattern.description} (significance: ${pattern.significance})`)
    };
  }
} 