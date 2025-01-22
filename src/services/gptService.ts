import {
  DailyAssessment,
  RelationshipContext,
  RelationshipAnalysis,
  ConsensusFormData,
  ConsensusFormAnalysis,
  EmotionalDynamics,
  CategoryRatings,
  GPTAnalysis,
  GPTAnalysisContent,
  MoodEntry,
  MoodType,
  Insight,
  FormValidation,
  MoodTrackingForm,
  ConflictResolutionForm,
  QualityTimeForm,
  FormSubmissionResult,
  NormalizedRelationshipData,
  GottmanAssessmentData,
  GottmanMetrics
} from '../types';
import { getAnalysisForDate } from './analysisHistoryService';
import { callOpenAI } from './openaiClient';
import {
  THERAPIST_SYSTEM_PROMPT,
  generateDailyInsightPrompt,
  CONSENSUS_FORM_ANALYSIS_PROMPT,
  ANALYSIS_SCHEMA,
  HistoricalContext
} from './prompts';
import { config } from '../config';
import { analyzeGottmanMetrics } from './psychologicalAnalysisService';
import { getLatestGottmanAssessment } from './assessmentService';
import { getUserMoodEntries } from '../services/moodService';
import { calculateEmotionalSync, calculateMoodStability } from '../services/relationshipAnalysisService';
import { createDefaultDailyAssessment } from '../utils/padroesUteis/defaultDailyAssessment';

export const getApiKey = () => {
  const apiKey = config.openai.apiKey;
  if (!apiKey) {
    console.error('OpenAI API key not found in environment variables');
    throw new Error('API key not found');
  }
  return apiKey;
};

const createGPTAnalysis = (assessment: DailyAssessment): GPTAnalysis => {
  const emptyMoodFrequency: Record<MoodType, number> = {
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

  return {
    id: `gpt_${new Date().getTime()}`,
    userId: assessment.userId,
    partnerId: assessment.partnerId,
    date: new Date().toISOString(),
    type: 'individual',
    analysis: {
      moodPatterns: {
        user: {
          dominant: assessment.mood?.primary || 'neutral' as MoodType,
          frequency: { ...emptyMoodFrequency },
          transitions: {}
        },
        partner: {
          dominant: 'neutral' as MoodType,
          frequency: { ...emptyMoodFrequency },
          transitions: {}
        },
        overall: {
          synchronicity: 0,
          stability: 0,
          variability: 0
        }
      },
      communicationMetrics: {
        quality: assessment.ratings?.comunicacao || 0,
        frequency: 0,
        depth: 0,
        patterns: []
      },
      attachmentInsights: {
        style: 'secure',
        behaviors: [],
        triggers: [],
        suggestions: []
      },
      relationshipDynamics: {
        strengths: [],
        challenges: [],
        recommendations: []
      }
    },
    timestamp: new Date().toISOString(),
    version: '1.0',
    metadata: {
      assessmentCount: 1,
      timeSpan: '1 day',
      confidence: 0.8
    }
  };
};

const createBaseAnalysis = (
  assessment: DailyAssessment,
  gptAnalysis: GPTAnalysisContent,
  gottmanMetrics: GottmanMetrics,
  gottmanInsights: Insight[],
  gottmanRecommendations: string[],
  relationshipContext?: RelationshipContext
): RelationshipAnalysis => {
  // Consolidate insights and recommendations
  const baseInsights = gottmanInsights;
  const baseRecommendations = gottmanRecommendations;

  // Initialize emotional dynamics with proper typing
  const emotionalDynamics: EmotionalDynamics = {
    synchronicity: assessment.ratings.conexaoEmocional / 7 || 0,
    stability: assessment.ratings.resolucaoConflitos / 7 || 0,
    emotionalSecurity: assessment.ratings.segurancaRelacionamento / 7 || 0,
    intimacyBalance: {
      score: assessment.ratings.intimidadeFisica / 7 || 0,
      areas: {
        emotional: assessment.ratings.conexaoEmocional / 7 || 0,
        physical: assessment.ratings.intimidadeFisica / 7 || 0,
        intellectual: assessment.ratings.alinhamentoObjetivos / 7 || 0,
        shared: assessment.ratings.qualidadeTempo / 7 || 0
      }
    },
    conflictResolution: {
      style: assessment.ratings.resolucaoConflitos > 5 ? 'collaborative' : 'challenging',
      effectiveness: assessment.ratings.resolucaoConflitos / 7 || 0,
      patterns: [],
      confidence: 0.8
    },
    patterns: {
      user: {
        dominant: assessment.mood?.primary || 'neutral',
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

  const analysis = gptAnalysis.content as RelationshipAnalysis;

  // Create the base analysis object with proper emotional dynamics integration
  const baseAnalysis: RelationshipAnalysis = {
    id: `analysis_${new Date().getTime()}`,
    userId: assessment.userId,
    partnerId: assessment.partnerId,
    date: new Date().toISOString(),
    type: 'individual',
    overallHealth: {
      score: analysis?.overallHealth?.score || 0,
      trend: (analysis?.overallHealth?.trend || 'stable') as 'improving' | 'stable' | 'declining',
      confidence: analysis?.overallHealth?.confidence || 0.8,
      emotionalSync: analysis?.overallHealth?.emotionalSync || 0.7
    },
    clinicalSignificance: {
      gaps: [{
        dimension: 'communication',
        score: relationshipContext?.communicationStyle ? 0.7 : 0.5,
        normativeScore: 0.7,
        difference: relationshipContext?.communicationStyle ? 0 : 0.2,
        isSignificant: !relationshipContext?.communicationStyle,
        severity: relationshipContext?.communicationStyle ? 'low' : 'moderate'
      }],
      riskFactors: [
        ...(relationshipContext?.hadSignificantCrises ? ['Previous relationship crisis'] : []),
        ...(relationshipContext?.challengeAreas || [])
      ],
      protectiveFactors: [
        ...(relationshipContext?.strengthAreas || []),
        ...(relationshipContext?.supportSystem || [])
      ],
      recommendations: [
        ...(relationshipContext?.solutionsDescription ? [relationshipContext.solutionsDescription] : [])
      ],
      severity: relationshipContext?.hadSignificantCrises ? 'high' : 'moderate',
      confidence: 0.8
    },
    categories: analysis?.categories || {},
    strengthsAndChallenges: {
      strengths: analysis?.strengthsAndChallenges?.strengths || [],
      challenges: analysis?.strengthsAndChallenges?.challenges || []
    },
    communicationSuggestions: analysis?.communicationSuggestions || [],
    actionItems: analysis?.actionItems || [],
    relationshipDynamics: {
      strengths: analysis?.relationshipDynamics?.strengths || [],
      challenges: analysis?.relationshipDynamics?.challenges || [],
      recommendations: analysis?.relationshipDynamics?.recommendations || []
    },
    emotionalDynamics,
    emotionalSync: emotionalDynamics.synchronicity,
    moodDiscrepancies: [],
    insights: baseInsights,
    riskFactors: analysis?.riskFactors || [],
    recommendations: baseRecommendations,
    validatedScales: assessment.validatedScales || {},
    gptAnalysis: createGPTAnalysis(assessment),
    metadata: {
      assessmentCount: 1,
      timeSpan: '1 day',
      confidence: 0.8,
      lastUpdate: new Date().toISOString()
    }
  };

  return baseAnalysis;
};

const validateAssessmentForGPT = (assessment: DailyAssessment): FormValidation => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate required fields for GPT processing
  if (!assessment.ratings) {
    errors['ratings'] = 'Assessment ratings are required for GPT analysis';
  }

  if (!assessment.mood?.primary) {
    errors['mood'] = 'Mood information is required for emotional analysis';
  }

  // Check for data quality
  if (assessment.ratings) {
    const ratingValues = Object.values(assessment.ratings);
    const allSame = ratingValues.every(v => v === ratingValues[0]);
    if (allSame && ratingValues.length > 0) {
      warnings.push('All ratings are identical - this may affect analysis quality');
    }
  }

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0
  };
};

const validateMoodTrackingForm = (form: MoodTrackingForm): FormValidation => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Required fields validation
  if (!form.userId) {
    errors['userId'] = 'User ID is required';
  }

  if (!form.mood) {
    errors['mood'] = 'Mood data is required';
  } else {
    // Validate mood data
    if (!form.mood.primary) {
      errors['primary'] = 'Primary mood is required';
    }
    
    if (form.mood.intensity < 1 || form.mood.intensity > 5) {
      errors['intensity'] = 'Mood intensity must be between 1 and 5';
    }
  }

  // Add timestamp if not provided
  if (!form.timestamp) {
    warnings.push('Timestamp not provided, using current time');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

const createHistoricalContext = async (normalizedData: NormalizedRelationshipData): Promise<HistoricalContext> => {
  // Extract ratings from history
  const userRatings = normalizedData.userHistory.map(h => h.ratings);
  const partnerRatings = normalizedData.partnerHistory.map(h => h.ratings);

  // Get previous analysis for context
  const previousAnalysis = await getAnalysisForDate(
    normalizedData.userData.name || '',
    new Date(normalizedData.userHistory[0].date).toISOString(),
    'individual'
  );

  // Calculate trends from both user and partner ratings
  const recentTrends = Object.keys(userRatings[0] || {}).map(category => {
    const userTrend = userRatings.map(r => r[category] || 0);
    const partnerTrend = partnerRatings.map(r => r[category] || 0);
    const combinedTrend = [...userTrend, ...partnerTrend];
    
    return {
      category,
      trend: calculateTrendDirection(combinedTrend),
      significance: calculateTrendSignificance(userTrend, partnerTrend),
      timestamp: new Date().toISOString(),
      confidence: 0.8
    };
  });

  // Create relationship metrics incorporating both user and partner data
  const relationshipMetrics = {
    satisfactionTrend: combineRatings(userRatings, partnerRatings, 'satisfacaoGeral'),
    communicationQuality: combineRatings(userRatings, partnerRatings, 'comunicacao'),
    emotionalConnection: combineRatings(userRatings, partnerRatings, 'conexaoEmocional'),
    conflictResolution: combineRatings(userRatings, partnerRatings, 'resolucaoConflitos'),
    timestamps: normalizedData.userHistory.map(h => h.date)
  };

  // Convert previous analysis to GPTAnalysis format if it exists
  const previousAnalyses = previousAnalysis?.analysis ? 
    [previousAnalysis.analysis as unknown as GPTAnalysis] : 
    [];

  // Create empty intervention effectiveness array
  const interventionEffectiveness: HistoricalContext['interventionEffectiveness'] = [];

  // Create empty significant events array
  const significantEvents: HistoricalContext['significantEvents'] = [];

  return {
    previousAnalyses,
    recentTrends,
    interventionEffectiveness,
    relationshipMetrics,
    significantEvents
  };
};

// Helper function to combine user and partner ratings for a specific category
const combineRatings = (userRatings: CategoryRatings[], partnerRatings: CategoryRatings[], category: keyof CategoryRatings): number[] => {
  return userRatings.map((_, index) => {
    const userScore = userRatings[index]?.[category] || 0;
    const partnerScore = partnerRatings[index]?.[category] || 0;
    return (userScore + partnerScore) / 2;
  });
};

// Helper function to calculate trend direction
const calculateTrendDirection = (scores: number[]): 'improving' | 'stable' | 'declining' => {
  if (scores.length < 2) return 'stable';
  const change = scores[scores.length - 1] - scores[0];
  return change > 0.5 ? 'improving' : change < -0.5 ? 'declining' : 'stable';
};

// Helper function to calculate trend significance
const calculateTrendSignificance = (userScores: number[], partnerScores: number[]): 'low' | 'medium' | 'high' => {
  const avgDiff = Math.abs(
    average(userScores) - average(partnerScores)
  );
  return avgDiff > 2 ? 'high' : avgDiff > 1 ? 'medium' : 'low';
};

// Helper function to calculate average
const average = (numbers: number[]): number => 
  numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;

export const generateDailyInsight = async (
  userAssessment: DailyAssessment | null,
  partnerAssessment: DailyAssessment | null,
  relationshipContext?: RelationshipContext
): Promise<FormSubmissionResult<RelationshipAnalysis>> => {
  try {
    // Create default assessment if null
    const defaultAssessment = createDefaultDailyAssessment('');
    const validUserAssessment = userAssessment || defaultAssessment;
    const validPartnerAssessment = partnerAssessment || defaultAssessment;

    // Normalize relationship data for consistent analysis
    const normalizedData: NormalizedRelationshipData = {
      userHistory: [validUserAssessment],
      partnerHistory: [validPartnerAssessment],
      userMoodEntries: [],
      partnerMoodEntries: [],
      userData: {
        name: validUserAssessment.userId
      },
      partnerData: {
        name: validPartnerAssessment.userId
      }
    };

    // Validate assessments before processing
    const userValidation = validateAssessmentForGPT(validUserAssessment);
    const partnerValidation = validateAssessmentForGPT(validPartnerAssessment);

    if (!userValidation.isValid || !partnerValidation.isValid) {
      const errorMessages = [
        ...Object.values(userValidation.errors || {}),
        ...Object.values(partnerValidation.errors || {})
      ].filter(Boolean);
      return {
        success: false,
        error: {
          message: 'Invalid assessment data',
          details: errorMessages.join(', ')
        }
      };
    }

    // Collect warnings but proceed with analysis
    const warnings = [
      ...(userValidation.warnings || []),
      ...(partnerValidation.warnings || [])
    ];

    // Validate required assessment data
    if (!validUserAssessment || !validUserAssessment.userId) {
      console.error('Invalid assessment data:', validUserAssessment);
      throw new Error('Invalid assessment data provided');
    }

    // Busca a última avaliação Gottman disponível
    let latestGottmanAssessment;
    try {
      latestGottmanAssessment = await getLatestGottmanAssessment(validUserAssessment.userId, validUserAssessment.partnerId);
      console.log('Retrieved Gottman assessment:', latestGottmanAssessment ? 'Found' : 'Not found');
    } catch (gottmanError) {
      console.error('Error fetching Gottman assessment:', gottmanError);
      // Continue without Gottman data
    }

    // Se houver uma avaliação Gottman, use-a para análise
    const gottmanMetrics = latestGottmanAssessment?.validatedScales?.gottman || {
      fourHorsemen: {
        critica: 0,
        defensividade: 0,
        desprezo: 0,
        stonewalling: 0
      },
      bidsForConnection: {
        tentativas: validUserAssessment.ratings.conexaoEmocional || 0,
        respostasPositivas: validUserAssessment.ratings.apoioMutuo || 0,
        respostasNegativas: 0,
        respostasNeutras: 0
      },
      resolucaoConflitos: validUserAssessment.ratings.resolucaoConflitos || 0,
      significadoCompartilhado: validUserAssessment.ratings.alinhamentoObjetivos || 0,
      reparacao: validUserAssessment.ratings.apoioMutuo || 0,
      influenciaPositiva: validUserAssessment.ratings.apoioMutuo || 0
    };

    // Analisa as métricas de Gottman para insights
    let gottmanAnalysis;
    try {
      gottmanAnalysis = analyzeGottmanMetrics(gottmanMetrics);
      console.log('Gottman analysis completed');
    } catch (analyzeError) {
      console.error('Error analyzing Gottman metrics:', analyzeError);
      gottmanAnalysis = {
        overallHealth: { strengths: [], concerns: [] },
        bidsEffectiveness: { recommendations: [] }
      };
    }

    const gottmanInsights = gottmanAnalysis.overallHealth.strengths.map(strength => ({
      id: `insight_gottman_${new Date().getTime()}_${Math.random()}`,
      type: 'observation' as const,
      category: 'gottman_metrics',
      description: strength,
      confidence: 0.9,
      impact: 'high' as const,
      timestamp: new Date().toISOString()
    }));

    // Adiciona recomendações baseadas nas métricas de Gottman
    const gottmanRecommendations = [
      ...gottmanAnalysis.bidsEffectiveness.recommendations,
      ...(gottmanAnalysis.overallHealth.concerns.map(concern => 
        `Trabalhe em: ${concern}`
      ))
    ];

    console.log('Generating daily insight prompt with normalized data...');
    const historicalContext = await createHistoricalContext(normalizedData);
    const prompt = generateDailyInsightPrompt(validUserAssessment, relationshipContext, historicalContext);

    console.log('Calling OpenAI...');
    const response = await callOpenAI({
      messages: [
        { role: 'system', content: THERAPIST_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    });

    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('Invalid OpenAI response:', response);
      throw new Error('Failed to generate daily insight: Invalid API response');
    }

    const content = response.choices[0].message.content;
    if (!content) {
      console.error('Empty content in OpenAI response');
      throw new Error('Failed to generate daily insight: Empty response content');
    }

    try {
      console.log('Parsing GPT response...');
      const gptAnalysis = JSON.parse(content);
      if (gptAnalysis) {
        console.log('Creating base analysis...');
        const analysis = createBaseAnalysis(validUserAssessment, gptAnalysis, gottmanMetrics, gottmanInsights, gottmanRecommendations, relationshipContext);
        return {
          success: true,
          data: analysis,
          warnings
        };
      }
      console.error('Invalid GPT analysis after parsing:', gptAnalysis);
      throw new Error('Failed to parse GPT response: Invalid analysis data');
    } catch (parseError: unknown) {
      console.error('Error parsing GPT response:', parseError);
      console.log('Raw GPT response:', content);
      const errorMessage = parseError instanceof Error 
        ? parseError.message 
        : 'Unknown parsing error';
      throw new Error(`Failed to parse GPT response: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error generating daily insight:', error);
    return {
      success: false,
      error: {
        message: 'Failed to generate daily insight',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

export const generateAnalysisPrompt = (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): string => {
  // Validate ratings objects
  const validateRatings = (ratings: CategoryRatings): void => {
    const requiredCategories: Array<keyof CategoryRatings> = [
      'satisfacaoGeral',
      'alinhamentoObjetivos',
      'conexaoEmocional',
      'apoioMutuo',
      'segurancaRelacionamento',
      'comunicacao',
      'intimidade',
      'resolucaoConflitos'
    ];
    
    for (const category of requiredCategories) {
      if (typeof ratings[category] !== 'number') {
        throw new Error(`Missing or invalid rating for category: ${category}`);
      }
    }
  };

  // Validate both user and partner ratings
  validateRatings(userAssessment.ratings);
  validateRatings(partnerAssessment.ratings);

  const data = {
    schema: ANALYSIS_SCHEMA,
    assessment: {
      user: {
        ratings: userAssessment.ratings as CategoryRatings,
        mood: {
          type: userAssessment.mood.primary,
          intensity: userAssessment.mood.intensity,
          notes: userAssessment.mood.notes
        },
        activities: userAssessment.context?.activities
      },
      partner: {
        ratings: partnerAssessment.ratings as CategoryRatings,
        mood: {
          type: partnerAssessment.mood.primary,
          intensity: partnerAssessment.mood.intensity,
          notes: partnerAssessment.mood.notes
        },
        activities: partnerAssessment.context?.activities
      }
    },
    context: relationshipContext && {
      type: relationshipContext.type,
      duration: relationshipContext.duration,
      dynamics: relationshipContext.currentDynamics,
      emotional: {
        user: relationshipContext.userEmotionalState,
        partner: relationshipContext.partnerEmotionalState
      },
      crisis: relationshipContext.hadSignificantCrises ? relationshipContext.crisisDescription : null,
      solutions: relationshipContext.attemptedSolutions ? relationshipContext.solutionsDescription : null,
      routine: relationshipContext.routineImpact,
      status: relationshipContext.relationshipStatus,
      living: relationshipContext.livingArrangement,
      communication: relationshipContext.communicationStyle,
      activities: relationshipContext.sharedActivities,
      support: relationshipContext.supportSystem,
      future: relationshipContext.futureExpectations,
      challenges: relationshipContext.challengeAreas,
      strengths: relationshipContext.strengthAreas,
      values: relationshipContext.values,
      goals: relationshipContext.goals
    }
  };

  return JSON.stringify(data);
};

export const generateRelationshipAnalysis = async (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  relationshipContext: RelationshipContext,
  gottmanAssessment?: GottmanAssessmentData
): Promise<RelationshipAnalysis> => {
  try {
    // Get mood entries for both users
    const [userMoodEntries, partnerMoodEntries] = await Promise.all([
      getUserMoodEntries(userAssessment.userId),
      getUserMoodEntries(partnerAssessment.userId)
    ]);

    // Calculate emotional sync
    const emotionalSync = calculateEmotionalSync(userMoodEntries, partnerMoodEntries);

    // Create base analysis
    const analysis: RelationshipAnalysis = {
      id: `analysis_${new Date().getTime()}`,
      userId: userAssessment.userId,
      partnerId: partnerAssessment.userId,
      date: new Date().toISOString(),
      type: 'individual',
      overallHealth: {
        score: 0.8,
        trend: 'stable' as const,
        confidence: 0.8,
        emotionalSync: 0.7
      },
      clinicalSignificance: {
        gaps: [{
          dimension: 'communication',
          score: relationshipContext?.communicationStyle ? 0.7 : 0.5,
          normativeScore: 0.7,
          difference: relationshipContext?.communicationStyle ? 0 : 0.2,
          isSignificant: !relationshipContext?.communicationStyle,
          severity: relationshipContext?.communicationStyle ? 'low' : 'moderate'
        }],
        riskFactors: [
          ...(relationshipContext?.hadSignificantCrises ? ['Previous relationship crisis'] : []),
          ...(relationshipContext?.challengeAreas || [])
        ],
        protectiveFactors: [
          ...(relationshipContext?.strengthAreas || []),
          ...(relationshipContext?.supportSystem || [])
        ],
        recommendations: [
          ...(relationshipContext?.solutionsDescription ? [relationshipContext.solutionsDescription] : [])
        ],
        severity: relationshipContext?.hadSignificantCrises ? 'high' : 'moderate',
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
        synchronicity: emotionalSync,
        stability: userMoodEntries.length > 0 ? calculateMoodStability(userMoodEntries) : 0,
        emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
        intimacyBalance: {
          score: userAssessment.ratings.intimidadeFisica || 0,
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
          confidence: 0
        },
        patterns: {
          user: {
            dominant: 'neutral',
            frequency: {
              neutral: 0,
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
              content: 0
            },
            transitions: {}
          },
          partner: {
            dominant: 'neutral',
            frequency: {
              neutral: 0,
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
      },
      emotionalSync,
      moodDiscrepancies: [],
      insights: [
        ...(Array.isArray(relationshipContext?.currentDynamics) ? relationshipContext.currentDynamics.map(dynamic => ({
          id: `insight_${Date.now()}`,
          type: 'observation' as const,
          category: 'relationship_dynamics',
          description: dynamic,
          confidence: 0.8,
          impact: 'high' as const,
          timestamp: new Date().toISOString()
        })) : [])
      ],
      riskFactors: [],
      recommendations: [],
      validatedScales: {
        das: {
          total: 0,
          consenso: 0,
          satisfacao: 0,
          coesao: 0,
          expressaoAfetiva: 0
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
        gottman: gottmanAssessment?.validatedScales?.gottman || {
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
            anxiety: 0,
            avoidance: 0
          },
          securityLevel: 0,
          attachmentStyle: 'secure'
        }
      },
      gptAnalysis: {
        id: `gpt_${new Date().getTime()}`,
        userId: userAssessment.userId,
        partnerId: partnerAssessment.userId,
        date: new Date().toISOString(),
        type: 'individual',
        analysis: {
          moodPatterns: {
            user: {
              dominant: 'neutral',
              frequency: {
                neutral: 0,
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
                content: 0
              },
              transitions: {}
            },
            partner: {
              dominant: 'neutral',
              frequency: {
                neutral: 0,
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
                content: 0
              },
              transitions: {}
            },
            overall: {
              synchronicity: emotionalSync,
              stability: userMoodEntries.length > 0 ? calculateMoodStability(userMoodEntries) : 0,
              variability: 0
            }
          },
          communicationMetrics: {
            quality: userAssessment.ratings.comunicacao || 0,
            frequency: 0,
            depth: 0,
            patterns: []
          },
          attachmentInsights: {
            style: 'secure',
            behaviors: [],
            triggers: [],
            suggestions: []
          },
          relationshipDynamics: {
            strengths: [],
            challenges: [],
            recommendations: []
          }
        },
        timestamp: new Date().toISOString(),
        version: '1.0',
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0
        }
      },
      metadata: {
        assessmentCount: 1,
        timeSpan: '1 day',
        confidence: 0,
        lastUpdate: new Date().toISOString()
      }
    };

    // Integrate relationship context if available
    if (relationshipContext) {
      // Update relationship dynamics with proper typing
      analysis.relationshipDynamics = {
        strengths: Array.isArray(relationshipContext.strengthAreas) 
          ? relationshipContext.strengthAreas 
          : [],
        challenges: Array.isArray(relationshipContext.challengeAreas)
          ? relationshipContext.challengeAreas
          : [],
        recommendations: relationshipContext.solutionsDescription 
          ? [relationshipContext.solutionsDescription]
          : []
      };

      // Update emotional dynamics based on context
      if (analysis.emotionalDynamics) {
        analysis.emotionalDynamics.patterns = {
          user: {
            ...analysis.emotionalDynamics.patterns.user,
            dominant: (relationshipContext.userEmotionalState || 'neutral') as MoodType
          },
          partner: {
            ...analysis.emotionalDynamics.patterns.partner,
            dominant: (relationshipContext.partnerEmotionalState || 'neutral') as MoodType
          }
        };
      }
    }

    return analysis;
  } catch (error) {
    console.error('[generateRelationshipAnalysis] Error:', error);
    throw error;
  }
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation. Attempts remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzeConsensusForm(
  userFormData: ConsensusFormData,
  partnerFormData?: ConsensusFormData,
  historicalContext?: {
    previousForms?: ConsensusFormData[];
    assessments?: any[];
    previousAnalyses?: any[];
  }
): Promise<FormSubmissionResult<ConsensusFormAnalysis>> {
  return retryWithBackoff(async () => {
    try {
      if (!userFormData || !userFormData.responses) {
        return {
          success: false,
          error: {
            message: 'Invalid consensus form data',
            details: 'Missing required form data or responses'
          }
        };
      }

      const data = {
        user: Object.entries(userFormData.responses).map(([question, response]) => ({
          q: question,
          r: response.rating,
          n: response.notes
        })),
        partner: partnerFormData ? Object.entries(partnerFormData.responses).map(([question, response]) => ({
          q: question,
          r: response.rating,
          n: response.notes
        })) : undefined,
        history: historicalContext && {
          forms: historicalContext.previousForms?.map(f => ({
            responses: f?.responses ? Object.entries(f.responses).map(([q, r]) => ({ q, r: r?.rating || 0 })) : []
          })),
          assessments: historicalContext.assessments?.map(a => ({
            ratings: a?.ratings || {},
            date: a?.date || new Date().toISOString()
          })),
          analyses: historicalContext.previousAnalyses?.map(a => ({
            insights: a?.insights || [],
            date: a?.date || new Date().toISOString()
          }))
        }
      };

      console.log('Analyzing consensus form with data:', JSON.stringify(data, null, 2));

      const response = await callOpenAI({
        messages: [
          {
            role: 'system',
            content: CONSENSUS_FORM_ANALYSIS_PROMPT
          },
          {
            role: 'user',
            content: JSON.stringify(data)
          }
        ],
        temperature: 0.7
      });

      if (!response) {
        console.error('Empty response from OpenAI');
        throw new Error('Failed to get response from analysis service');
      }

      let content: any;
      
      // Handle both direct response and response.result formats
      if (typeof response === 'string') {
        content = response;
      } else if (response.data) {
        content = response.data;
      } else if (response.result) {
        content = response.result;
      } else if (typeof response === 'object' && response !== null) {
        // If response is already a valid object with the expected structure
        content = response;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from analysis service');
      }

      console.log('Raw analysis response:', content);

      try {
        // Try to parse the response if it's a string
        let analysis: any;
        if (typeof content === 'string') {
          try {
            analysis = JSON.parse(content);
          } catch (parseError) {
            // If direct parsing fails, try to find JSON in the string
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.error('No JSON found in response:', content);
              throw new Error('Invalid response format from analysis service');
            }
            analysis = JSON.parse(jsonMatch[0]);
          }
        } else {
          analysis = content;
        }

        // Validate the required fields
        if (!analysis.overallAnalysis || !analysis.categoryAnalysis) {
          console.error('Missing required fields in analysis:', analysis);
          throw new Error('Incomplete analysis response');
        }

        return {
          success: true,
          data: {
            overallAnalysis: {
              score: analysis.overallAnalysis?.score || 0,
              trend: analysis.overallAnalysis?.trend || 'stable',
              summary: analysis.overallAnalysis?.summary || '',
              riskLevel: analysis.overallAnalysis?.riskLevel || 'low'
            },
            categoryAnalysis: analysis.categoryAnalysis || {},
            progressionAnalysis: {
              improvements: analysis.progressionAnalysis?.improvements || [],
              concerns: analysis.progressionAnalysis?.concerns || [],
              trends: analysis.progressionAnalysis?.trends || {}
            },
            therapeuticInsights: {
              immediateActions: analysis.therapeuticInsights?.immediateActions || [],
              longTermStrategies: analysis.therapeuticInsights?.longTermStrategies || [],
              underlyingIssues: analysis.therapeuticInsights?.underlyingIssues || []
            },
            consistencyAnalysis: {
              alignedAreas: analysis.consistencyAnalysis?.alignedAreas || [],
              discrepancies: analysis.consistencyAnalysis?.discrepancies || [],
              possibleMotivations: analysis.consistencyAnalysis?.possibleMotivations || []
            },
            recommendations: {
              communication: analysis.recommendations?.communication || [],
              exercises: analysis.recommendations?.exercises || [],
              professionalSupport: analysis.recommendations?.professionalSupport || []
            }
          }
        };
      } catch (parseError) {
        console.error('Error parsing analysis response:', parseError);
        console.error('Response that failed parsing:', content);
        throw new Error('Failed to parse analysis response');
      }
    } catch (error) {
      console.error('Error in consensus form analysis:', error);
      return {
        success: false,
        error: {
          message: 'Failed to analyze consensus form',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  });
}

export type { RelationshipAnalysis, ConsensusFormData } from '../types'; 