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
  DailyAssessmentForm,
  MoodTrackingForm,
  ConflictResolutionForm,
  QualityTimeForm,
  FormSubmissionResult,
  NormalizedRelationshipData,
  AttachmentAnalysis,
  AttachmentStyle,
  ValidatedScales,
  GottmanAssessmentData,
  AttachmentStyleType,
  GottmanMetrics
} from '../types';
import { getAnalysisForDate } from './analysisHistoryService';
import { callOpenAI } from './openaiClient';
import {
  THERAPIST_SYSTEM_PROMPT,
  ANALYSIS_SYSTEM_PROMPT,
  generateDailyInsightPrompt,
  CONSENSUS_FORM_ANALYSIS_PROMPT,
  ANALYSIS_SCHEMA,
} from './prompts';
import { analyzeEmotionalDynamics } from './psychologicalAnalysisService';
import { CategoryAverages } from './analysisUtils';
import { config } from '../config';
import { getAuth } from 'firebase/auth';
import { openaiClient } from './openaiClient';
import { analyzeGottmanMetrics } from './psychologicalAnalysisService';
import { getLatestGottmanAssessment } from './assessmentService';

export const getApiKey = () => {
  const apiKey = config.openai.apiKey;
  if (!apiKey) {
    console.error('OpenAI API key not found in environment variables');
    throw new Error('API key not found');
  }
  return apiKey;
};

const createGPTAnalysis = (assessment: DailyAssessment): GPTAnalysis => ({
  id: `gpt_${new Date().getTime()}`,
  userId: assessment.userId,
  partnerId: assessment.partnerId,
  date: new Date().toISOString(),
  type: 'individual',
  analysis: {
    moodPatterns: {
      user: {
        dominant: 'feliz' as MoodType,
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
        dominant: 'feliz' as MoodType,
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
      overall: {
        synchronicity: 0.8,
        stability: 0.7,
        variability: 0.5
      }
    },
    communicationMetrics: {
      quality: 0.8,
      frequency: 0.7,
      depth: 0.6,
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
});

const createBaseAnalysis = (
  assessment: DailyAssessment,
  gptAnalysis: any,
  gottmanMetrics: GottmanMetrics,
  gottmanInsights: any[],
  gottmanRecommendations: string[]
): RelationshipAnalysis => {
  // Consolidate insights and recommendations
  const baseInsights = [...(gptAnalysis.insights || []), ...gottmanInsights];
  const baseRecommendations = [...(gptAnalysis.recommendations || []), ...gottmanRecommendations];

  // Create the base analysis object
  const baseAnalysis: RelationshipAnalysis = {
    id: `analysis_${new Date().getTime()}`,
    userId: assessment.userId,
    partnerId: assessment.partnerId,
    date: new Date().toISOString(),
    type: 'individual',
    overallHealth: {
      score: gptAnalysis.relationshipAnalysis?.overallHealth?.score || 0,
      trend: (gptAnalysis.relationshipAnalysis?.overallHealth?.trend || 'stable') as 'improving' | 'stable' | 'declining',
      confidence: gptAnalysis.relationshipAnalysis?.overallHealth?.confidence || 0.8
    },
    categories: gptAnalysis.categories || {},
    strengthsAndChallenges: {
      strengths: gptAnalysis.strengthsAndChallenges?.strengths || [],
      challenges: gptAnalysis.strengthsAndChallenges?.challenges || []
    },
    communicationSuggestions: gptAnalysis.communicationSuggestions || [],
    actionItems: gptAnalysis.actionItems || [],
    relationshipDynamics: {
      strengths: gptAnalysis.relationshipDynamics?.strengths || [],
      challenges: gptAnalysis.relationshipDynamics?.challenges || [],
      recommendations: gptAnalysis.relationshipDynamics?.recommendations || []
    },
    emotionalDynamics: {
      synchronicity: 0.7,
      stability: 0.8,
      emotionalSecurity: assessment.ratings.segurancaRelacionamento || 0,
      intimacyBalance: {
        score: assessment.ratings.intimidadeFisica || 0,
        areas: {
          emotional: assessment.ratings.conexaoEmocional || 0,
          physical: assessment.ratings.intimidadeFisica || 0,
          intellectual: assessment.ratings.alinhamentoObjetivos || 0,
          shared: assessment.ratings.qualidadeTempo || 0
        }
      },
      conflictResolution: {
        style: 'collaborative',
        effectiveness: assessment.ratings.resolucaoConflitos || 0,
        patterns: [],
        confidence: 0.8
      },
      patterns: {
        user: {
          dominant: 'feliz' as MoodType,
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
          dominant: 'feliz' as MoodType,
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
    },
    emotionalSync: gptAnalysis.emotionalSync || 0,
    moodDiscrepancies: gptAnalysis.moodDiscrepancies || [],
    insights: baseInsights,
    riskFactors: gptAnalysis.riskFactors || [],
    recommendations: baseRecommendations,
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
      gottman: gottmanMetrics,
      attachment: {
        ecr: {
          ansiedade: 0,
          evitacao: 0,
          anxiety: 0,
          avoidance: 0
        },
        securityLevel: 0,
        attachmentStyle: {
          primary: 'secure' as AttachmentStyleType,
          description: 'Secure attachment style',
          recommendations: ['Continue fostering trust and open communication']
        },
        padraoApego: {
          primary: 'secure' as AttachmentStyleType,
          description: 'Padrão de apego seguro',
          recommendations: ['Manter comunicação aberta e confiança']
        },
        compatibilidadeApego: 0
      },
      consistency: {
        default: {
          score: 0,
          confidence: 0,
          flags: []
        }
      },
      reliability: 0,
      completeness: 0,
      recommendations: [
        'Mantenha a consistência nas avaliações',
        'Continue fornecendo feedback detalhado'
      ],
      isValid: true,
      errors: []
    },
    gptAnalysis: createGPTAnalysis(assessment),
    metadata: {
      assessmentCount: 1,
      timeSpan: '1 day',
      confidence: 0.8,
      lastUpdate: new Date().toISOString()
    },
    insights: [
      ...(gptAnalysis.insights || []),
      ...gottmanInsights,
      ...(gptAnalysis.recommendations || []).map((rec: string) => ({
        id: `insight_rec_${new Date().getTime()}_${Math.random()}`,
        type: 'recommendation' as const,
        category: 'general',
        description: rec,
        confidence: 0.9,
        impact: 'high' as const,
        timestamp: new Date().toISOString()
      })),
      ...gottmanRecommendations.map((rec: string) => ({
        id: `insight_gottman_${new Date().getTime()}_${Math.random()}`,
        type: 'recommendation' as const,
        category: 'gottman_metrics',
        description: rec,
        confidence: 0.9,
        impact: 'high' as const,
        timestamp: new Date().toISOString()
      }))
    ]
  };

  return baseAnalysis;
};

export const generateDailyInsight = async (
  assessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): Promise<RelationshipAnalysis> => {
  try {
    // Busca a última avaliação Gottman disponível
    const latestGottmanAssessment = await getLatestGottmanAssessment(assessment.userId, assessment.partnerId);
    
    // Se houver uma avaliação Gottman, use-a para análise
    const gottmanMetrics = latestGottmanAssessment?.validatedScales?.gottman || {
      fourHorsemen: {
        critica: 0,
        defensividade: 0,
        desprezo: 0,
        stonewalling: 0
      },
      bidsForConnection: {
        tentativas: assessment.ratings.conexaoEmocional || 0,
        respostasPositivas: assessment.ratings.apoioMutuo || 0,
        respostasNegativas: 0,
        respostasNeutras: 0
      },
      resolucaoConflitos: assessment.ratings.resolucaoConflitos || 0,
      significadoCompartilhado: assessment.ratings.alinhamentoObjetivos || 0,
      reparacao: assessment.ratings.apoioMutuo || 0,
      influenciaPositiva: assessment.ratings.apoioMutuo || 0
    };

    // Analisa as métricas de Gottman para insights
    const gottmanAnalysis = analyzeGottmanMetrics(gottmanMetrics);
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

    const prompt = generateDailyInsightPrompt(assessment, relationshipContext);

    const response = await callOpenAI({
      messages: [
        { role: 'system', content: THERAPIST_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    });

    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Failed to generate daily insight');
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate daily insight');
    }

    try {
      const gptAnalysis = JSON.parse(content);
      if (gptAnalysis) {
        return createBaseAnalysis(assessment, gptAnalysis, gottmanMetrics, gottmanInsights, gottmanRecommendations);
      }
      throw new Error('Failed to parse GPT response');
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      console.log('Raw GPT response:', response);
      throw new Error('Failed to parse GPT response');
    }
  } catch (error) {
    console.error('Error generating daily insight:', error);
    throw error;
  }
};

export const generateAnalysisPrompt = (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): string => {
  const data = {
    schema: ANALYSIS_SCHEMA,
    assessment: {
      user: {
        ratings: userAssessment.ratings,
        mood: {
          type: userAssessment.mood.primary,
          intensity: userAssessment.mood.intensity,
          notes: userAssessment.mood.notes
        },
        activities: userAssessment.context?.activities,
        triggers: userAssessment.context?.triggers
      },
      partner: {
        ratings: partnerAssessment.ratings,
        mood: {
          type: partnerAssessment.mood.primary,
          intensity: partnerAssessment.mood.intensity,
          notes: partnerAssessment.mood.notes
        },
        activities: partnerAssessment.context?.activities,
        triggers: partnerAssessment.context?.triggers
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
  gottmanAssessment?: GottmanAssessmentData,
  relationshipContext?: RelationshipContext
): Promise<RelationshipAnalysis> => {
  try {
    // Initialize empty arrays for strengths and challenges
    const strengthsAndChallenges = {
      strengths: [] as string[],
      challenges: [] as string[]
    };

    // Check for existing analysis
    const today = new Date().toISOString().split('T')[0];
    const existingAnalysis = await getAnalysisForDate(userAssessment.userId, today, 'collective');
    
    // Se houver uma avaliação Gottman específica, use-a para análise
    const gottmanMetrics = gottmanAssessment?.validatedScales?.gottman || {
      fourHorsemen: {
        critica: 0,
        defensividade: 0,
        desprezo: 0,
        stonewalling: 0
      },
      bidsForConnection: {
        tentativas: userAssessment.ratings.conexaoEmocional || 0,
        respostasPositivas: userAssessment.ratings.apoioMutuo || 0,
        respostasNegativas: 0,
        respostasNeutras: 0
      },
      resolucaoConflitos: userAssessment.ratings.resolucaoConflitos || 0,
      significadoCompartilhado: userAssessment.ratings.alinhamentoObjetivos || 0,
      reparacao: userAssessment.ratings.apoioMutuo || 0,
      influenciaPositiva: userAssessment.ratings.apoioMutuo || 0
    };

    // Analisa as métricas de Gottman para insights
    const gottmanAnalysis = analyzeGottmanMetrics(gottmanMetrics);
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

    if (existingAnalysis && typeof existingAnalysis.analysis !== 'string' && 'overallHealth' in existingAnalysis.analysis) {
      const analysis = existingAnalysis.analysis as RelationshipAnalysis;
      console.log('[generateRelationshipAnalysis] Found existing analysis:', {
        hasEmotionalDynamics: !!analysis.emotionalDynamics,
        emotionalDynamicsStructure: analysis.emotionalDynamics
      });
      
      // Ensure emotionalDynamics exists in existing analysis
      if (!analysis.emotionalDynamics) {
        console.log('[generateRelationshipAnalysis] Initializing missing emotionalDynamics in existing analysis');
        const averages: CategoryAverages = {
          satisfaction: Math.min(5, (userAssessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2),
          affection: Math.min(5, (userAssessment.ratings.conexaoEmocional + partnerAssessment.ratings.conexaoEmocional) / 2),
          consensus: Math.min(5, (userAssessment.ratings.alinhamentoObjetivos + partnerAssessment.ratings.alinhamentoObjetivos) / 2),
          cohesion: Math.min(5, (userAssessment.ratings.apoioMutuo + partnerAssessment.ratings.apoioMutuo) / 2),
          conflict: Math.min(5, (userAssessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2),
          general: Math.min(5, (userAssessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2)
        };
        const emotionalDynamics = analyzeEmotionalDynamics(averages, userAssessment, partnerAssessment);
        analysis.emotionalDynamics = {
          ...emotionalDynamics,
          synchronicity: 0.8,
          stability: 0.7,
          patterns: {
            user: {
              dominant: 'feliz' as MoodType,
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
              dominant: 'feliz' as MoodType,
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

      // Ensure arrays are initialized
      analysis.strengthsAndChallenges = analysis.strengthsAndChallenges || { strengths: [], challenges: [] };
      analysis.strengthsAndChallenges.strengths = analysis.strengthsAndChallenges.strengths || [];
      analysis.strengthsAndChallenges.challenges = analysis.strengthsAndChallenges.challenges || [];
      
      return analysis;
    }

    // Get authentication token
    const auth = getAuth();
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) {
      console.error('Failed to get authentication token');
      throw new Error('Authentication required. Please sign in again.');
    }

    // Generate analysis prompt
    const prompt = generateAnalysisPrompt(userAssessment, partnerAssessment, relationshipContext);

    try {
      // Call API with proper CORS and error handling
      const response = await fetch('https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          systemPrompt: ANALYSIS_SYSTEM_PROMPT,
          userPrompt: prompt,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('Invalid response format');
      }

      const content = data.result;
      if (!content) {
        throw new Error('Empty response from GPT');
      }

      try {
        // Try to find JSON in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid response format');
        }

        const jsonString = jsonMatch[0];
        const gptAnalysis = JSON.parse(jsonString);

        // Initialize arrays if they don't exist
        gptAnalysis.strengthsAndChallenges = gptAnalysis.strengthsAndChallenges || { strengths: [], challenges: [] };
        gptAnalysis.strengthsAndChallenges.strengths = Array.isArray(gptAnalysis.strengthsAndChallenges.strengths) 
          ? gptAnalysis.strengthsAndChallenges.strengths 
          : [];
        gptAnalysis.strengthsAndChallenges.challenges = Array.isArray(gptAnalysis.strengthsAndChallenges.challenges) 
          ? gptAnalysis.strengthsAndChallenges.challenges 
          : [];
        gptAnalysis.communicationSuggestions = Array.isArray(gptAnalysis.communicationSuggestions) 
          ? gptAnalysis.communicationSuggestions 
          : [];
        gptAnalysis.actionItems = Array.isArray(gptAnalysis.actionItems) 
          ? gptAnalysis.actionItems 
          : [];
        gptAnalysis.relationshipDynamics = gptAnalysis.relationshipDynamics || { strengths: [], challenges: [], recommendations: [] };
        gptAnalysis.relationshipDynamics.strengths = Array.isArray(gptAnalysis.relationshipDynamics.strengths) 
          ? gptAnalysis.relationshipDynamics.strengths 
          : [];
        gptAnalysis.relationshipDynamics.challenges = Array.isArray(gptAnalysis.relationshipDynamics.challenges) 
          ? gptAnalysis.relationshipDynamics.challenges 
          : [];
        gptAnalysis.relationshipDynamics.recommendations = Array.isArray(gptAnalysis.relationshipDynamics.recommendations) 
          ? gptAnalysis.relationshipDynamics.recommendations 
          : [];
        gptAnalysis.riskFactors = Array.isArray(gptAnalysis.riskFactors) 
          ? gptAnalysis.riskFactors 
          : [];
        gptAnalysis.recommendations = Array.isArray(gptAnalysis.recommendations) 
          ? gptAnalysis.recommendations 
          : [];
        gptAnalysis.moodDiscrepancies = Array.isArray(gptAnalysis.moodDiscrepancies) 
          ? gptAnalysis.moodDiscrepancies 
          : [];
        gptAnalysis.insights = Array.isArray(gptAnalysis.insights) 
          ? gptAnalysis.insights 
          : [];

        // Validate required fields and create a properly typed result
        const result: RelationshipAnalysis = {
          id: `analysis_${new Date().getTime()}`,
          userId: userAssessment.userId,
          partnerId: userAssessment.partnerId,
          date: new Date().toISOString(),
          type: 'individual',
          overallHealth: {
            score: gptAnalysis.relationshipAnalysis?.overallHealth?.score || 0,
            trend: (gptAnalysis.relationshipAnalysis?.overallHealth?.trend || 'stable') as 'improving' | 'stable' | 'declining',
            confidence: gptAnalysis.relationshipAnalysis?.overallHealth?.confidence || 0.8
          },
          categories: gptAnalysis.categories || {},
          strengthsAndChallenges: {
            strengths: gptAnalysis.strengthsAndChallenges.strengths,
            challenges: gptAnalysis.strengthsAndChallenges.challenges
          },
          communicationSuggestions: gptAnalysis.communicationSuggestions,
          actionItems: gptAnalysis.actionItems,
          relationshipDynamics: {
            strengths: gptAnalysis.relationshipDynamics.strengths,
            challenges: gptAnalysis.relationshipDynamics.challenges,
            recommendations: gptAnalysis.relationshipDynamics.recommendations
          },
          emotionalDynamics: {
            synchronicity: 0.7,
            stability: 0.8,
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
              confidence: 0.8
            },
            patterns: {
              user: {
                dominant: 'feliz' as MoodType,
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
                dominant: 'feliz' as MoodType,
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
          },
          emotionalSync: gptAnalysis.emotionalSync || 0,
          moodDiscrepancies: gptAnalysis.moodDiscrepancies || [],
          insights: gptAnalysis.insights || [],
          riskFactors: gptAnalysis.riskFactors || [],
          recommendations: gptAnalysis.recommendations || [],
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
            gottman: {
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
              attachmentStyle: {
                primary: 'secure',
                description: 'Secure attachment style',
                recommendations: ['Continue fostering trust and open communication']
              },
              compatibilidadeApego: 0,
              ecr: {
                ansiedade: 0,
                evitacao: 0,
                anxiety: 0,
                avoidance: 0
              },
              securityLevel: 0,
              padraoApego: {
                primary: 'secure',
                description: 'Padrão de apego seguro',
                recommendations: ['Manter comunicação aberta e confiança']
              }
            },
            consistency: {
              default: {
                score: 0,
                confidence: 0,
                flags: []
              }
            },
            reliability: 0,
            completeness: 0,
            recommendations: [
              'Mantenha a consistência nas avaliações',
              'Continue fornecendo feedback detalhado'
            ],
            isValid: true,
            errors: []
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
                  dominant: 'feliz' as MoodType,
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
                  dominant: 'feliz' as MoodType,
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
                overall: {
                  synchronicity: 0.8,
                  stability: 0.7,
                  variability: 0.5
                }
              },
              communicationMetrics: {
                quality: 0.8,
                frequency: 0.7,
                depth: 0.6,
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
          },
          metadata: {
            assessmentCount: 1,
            timeSpan: '1 day',
            confidence: 0.8,
            lastUpdate: new Date().toISOString()
          }
        } satisfies RelationshipAnalysis;

        return result;
      } catch (error) {
        console.error('[generateRelationshipAnalysis] Failed to parse analysis response:', error);
        console.error('[generateRelationshipAnalysis] Response that failed:', response);
        throw new Error('Failed to parse analysis response. Please try again later.');
      }
    } catch (error) {
      console.error('[generateRelationshipAnalysis] API call failed:', error);
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        throw new Error('Network error: Please check your internet connection and try again');
      }
      if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('CORS error: Please try again later');
      }
      throw error;
    }
  } catch (error) {
    console.error('[generateRelationshipAnalysis] Error generating analysis:', error);
    throw new Error('Failed to generate relationship analysis. Please try again later.');
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
): Promise<ConsensusFormAnalysis> {
  return retryWithBackoff(async () => {
    try {
      if (!userFormData || !userFormData.responses) {
        throw new Error('Invalid consensus form data');
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
        };
      } catch (parseError) {
        console.error('Error parsing analysis response:', parseError);
        console.error('Response that failed parsing:', content);
        throw new Error('Failed to parse analysis response');
      }
    } catch (error) {
      console.error('Error in consensus form analysis:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to analyze consensus form');
    }
  });
}

export type { RelationshipAnalysis, ConsensusFormData } from '../types'; 