import { DailyAssessment, RelationshipContext } from '../types';
import { getAnalysisForDate } from './analysisHistoryService';
import { callOpenAI } from './openaiClient';
import {
  THERAPIST_SYSTEM_PROMPT,
  ANALYSIS_SYSTEM_PROMPT,
  generateDailyInsightPrompt,
  CONSENSUS_FORM_ANALYSIS_PROMPT,
} from './prompts';
import { analyzeEmotionalDynamics, EmotionalDynamics } from './psychologicalAnalysisService';
import { CategoryAverages } from './analysisUtils';

export interface RelationshipAnalysis {
  overallHealth: {
    score: number;
    trend: string;
  };
  categories: {
    [key: string]: {
      score: number;
      partnerScore?: number;
      trend: string;
      insights: string[];
    };
  };
  strengthsAndChallenges: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions: string[];
  actionItems: string[];
  relationshipDynamics: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
    discrepancyInsights?: string;
  };
  emotionalDynamics: EmotionalDynamics;
}

export interface ConsensusFormData {
  type: 'consensus_form';
  answers: Record<string, string>;
  date: string;
  scores?: {
    consensus: number;
    affection: number;
    cohesion: number;
    satisfaction: number;
    conflict: number;
    general: number;
    overall: number;
  };
  analysis?: ConsensusFormAnalysis;
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

export const getApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key not found in environment variables');
    throw new Error('API key not found');
  }
  return apiKey;
};

export const generateDailyInsight = async (
  assessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): Promise<RelationshipAnalysis> => {
  try {
    const prompt = `
Por favor, forneça uma análise do relacionamento no seguinte formato JSON:
{
  "overallHealth": {
    "score": number,
    "trend": string
  },
  "categories": {
    "comunicacao": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "conexaoEmocional": {
      "score": number,
      "trend": string,
      "insights": string[]
    }
    // ... outros campos
  },
  "strengthsAndChallenges": {
    "strengths": string[],
    "challenges": string[]
  },
  "communicationSuggestions": string[],
  "actionItems": string[],
  "relationshipDynamics": {
    "positivePatterns": string[],
    "concerningPatterns": string[],
    "growthAreas": string[]
  }
}

Baseado na seguinte avaliação:
${JSON.stringify(assessment, null, 2)}
${relationshipContext ? `\nContexto do relacionamento:\n${JSON.stringify(relationshipContext, null, 2)}` : ''}`;

    const response = await callOpenAI(THERAPIST_SYSTEM_PROMPT, prompt);
    
    // Calculate emotional dynamics
    const averages: CategoryAverages = {
      satisfaction: assessment.ratings.satisfacaoGeral,
      affection: assessment.ratings.conexaoEmocional,
      consensus: assessment.ratings.alinhamentoObjetivos,
      cohesion: assessment.ratings.apoioMutuo,
      conflict: assessment.ratings.resolucaoConflitos,
      general: assessment.ratings.satisfacaoGeral
    };

    const emotionalDynamics = analyzeEmotionalDynamics(averages, assessment, assessment);

    // Try to parse insights from the GPT response
    try {
      const gptAnalysis = JSON.parse(response);
      if (gptAnalysis) {
        return {
          overallHealth: gptAnalysis.overallHealth || {
            score: assessment.ratings.satisfacaoGeral * 10,
            trend: "stable"
          },
          categories: gptAnalysis.categories || {
            comunicacao: {
              score: assessment.ratings.comunicacao,
              trend: "stable",
              insights: []
            },
            conexaoEmocional: {
              score: assessment.ratings.conexaoEmocional,
              trend: "stable",
              insights: []
            },
            apoioMutuo: {
              score: assessment.ratings.apoioMutuo,
              trend: "stable",
              insights: []
            },
            transparenciaConfianca: {
              score: assessment.ratings.transparenciaConfianca,
              trend: "stable",
              insights: []
            }
          },
          strengthsAndChallenges: gptAnalysis.strengthsAndChallenges || {
            strengths: [],
            challenges: []
          },
          communicationSuggestions: gptAnalysis.communicationSuggestions || [],
          actionItems: gptAnalysis.actionItems || [],
          relationshipDynamics: gptAnalysis.relationshipDynamics || {
            positivePatterns: [],
            concerningPatterns: [],
            growthAreas: []
          },
          emotionalDynamics
        };
      }
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      console.log('Raw GPT response:', response);
    }

    // Fallback analysis if parsing fails
    return {
      overallHealth: {
        score: assessment.ratings.satisfacaoGeral * 10,
        trend: "stable"
      },
      categories: {
        comunicacao: {
          score: assessment.ratings.comunicacao,
          trend: "stable",
          insights: []
        },
        conexaoEmocional: {
          score: assessment.ratings.conexaoEmocional,
          trend: "stable",
          insights: []
        },
        apoioMutuo: {
          score: assessment.ratings.apoioMutuo,
          trend: "stable",
          insights: []
        },
        transparenciaConfianca: {
          score: assessment.ratings.transparenciaConfianca,
          trend: "stable",
          insights: []
        }
      },
      strengthsAndChallenges: {
        strengths: [],
        challenges: []
      },
      communicationSuggestions: [],
      actionItems: [],
      relationshipDynamics: {
        positivePatterns: [],
        concerningPatterns: [],
        growthAreas: []
      },
      emotionalDynamics
    };
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
  const basePrompt = `
    Como terapeuta especializado, realize uma análise profunda da dinâmica relacional deste casal.
    Considere tanto os aspectos manifestos quanto os padrões latentes do relacionamento.

    Avaliação do Primeiro Parceiro:
    ${Object.entries(userAssessment.ratings)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n    ')}

    Avaliação do Segundo Parceiro:
    ${Object.entries(partnerAssessment.ratings)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n    ')}

    ${userAssessment.comments ? `Observações do Primeiro Parceiro: ${userAssessment.comments}\n` : ''}
    ${userAssessment.gratitude ? `Gratidão do Primeiro Parceiro: ${userAssessment.gratitude}\n` : ''}
    ${partnerAssessment.comments ? `Observações do Segundo Parceiro: ${partnerAssessment.comments}\n` : ''}
    ${partnerAssessment.gratitude ? `Gratidão do Segundo Parceiro: ${partnerAssessment.gratitude}\n` : ''}`;

  const contextPrompt = relationshipContext
    ? `
    Contexto Terapêutico do Relacionamento:
    - História e Duração: ${relationshipContext.duration}
    - Status Atual: ${relationshipContext.status}
    - Natureza do Vínculo: ${relationshipContext.type}
    - Objetivos Compartilhados: ${relationshipContext.goals.join(', ')}
    - Desafios Identificados: ${relationshipContext.challenges.join(', ')}
    - Valores Fundamentais: ${relationshipContext.values.join(', ')}
    - Dinâmica Atual: ${relationshipContext.currentDynamics}
    - Pontos Fortes: ${relationshipContext.strengths}
    - Estado Emocional do Usuário: ${relationshipContext.userEmotionalState}
    - Estado Emocional do Parceiro: ${relationshipContext.partnerEmotionalState}
    - Histórico de Crises: ${relationshipContext.hadSignificantCrises ? 'Sim - ' + relationshipContext.crisisDescription : 'Não'}
    - Tentativas de Resolução: ${relationshipContext.attemptedSolutions ? 'Sim - ' + relationshipContext.solutionsDescription : 'Não'}
    - Impacto da Rotina: ${relationshipContext.routineImpact}
    - Intimidade Física: ${relationshipContext.physicalIntimacy}`
    : '';

  return `${basePrompt}${contextPrompt}

    Por favor, forneça uma análise detalhada do relacionamento no seguinte formato JSON:

    {
      "overallHealth": {
        "score": number, // 0-100
        "trend": string // "up", "down", or "stable"
      },
      "categories": {
        [categoria]: {
          "score": number, // 0-10
          "trend": string, // "up", "down", or "stable"
          "insights": string[] // Lista de insights específicos
        }
      },
      "strengthsAndChallenges": {
        "strengths": string[],
        "challenges": string[]
      },
      "communicationSuggestions": string[],
      "actionItems": string[],
      "relationshipDynamics": {
        "positivePatterns": string[],
        "concerningPatterns": string[],
        "growthAreas": string[]
      }
    }`;
};

export const generateRelationshipAnalysis = async (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): Promise<RelationshipAnalysis> => {
  try {
    // Check for existing analysis
    const today = new Date().toISOString().split('T')[0];
    const existingAnalysis = await getAnalysisForDate(userAssessment.userId, today, 'collective');
    
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
        analysis.emotionalDynamics = analyzeEmotionalDynamics(averages, userAssessment, partnerAssessment);
        console.log('[generateRelationshipAnalysis] Initialized emotionalDynamics:', analysis.emotionalDynamics);
      }
      return analysis;
    }

    // Calculate averages for emotional dynamics analysis
    const averages: CategoryAverages = {
      satisfaction: Math.min(5, (userAssessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2),
      affection: Math.min(5, (userAssessment.ratings.conexaoEmocional + partnerAssessment.ratings.conexaoEmocional) / 2),
      consensus: Math.min(5, (userAssessment.ratings.alinhamentoObjetivos + partnerAssessment.ratings.alinhamentoObjetivos) / 2),
      cohesion: Math.min(5, (userAssessment.ratings.apoioMutuo + partnerAssessment.ratings.apoioMutuo) / 2),
      conflict: Math.min(5, (userAssessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2),
      general: Math.min(5, (userAssessment.ratings.satisfacaoGeral + partnerAssessment.ratings.satisfacaoGeral) / 2)
    };

    // Analyze emotional dynamics
    const emotionalDynamics = analyzeEmotionalDynamics(averages, userAssessment, partnerAssessment);
    console.log('[generateRelationshipAnalysis] Generated new emotionalDynamics:', emotionalDynamics);
    
    // Use the comprehensive analysis prompt
    const prompt = generateAnalysisPrompt(userAssessment, partnerAssessment, relationshipContext);
    
    // Call OpenAI with the analysis prompt
    const response = await callOpenAI(ANALYSIS_SYSTEM_PROMPT, prompt);
    console.log('[generateRelationshipAnalysis] Raw OpenAI response:', response);

    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[generateRelationshipAnalysis] No JSON found in response');
        throw new Error('Invalid response format');
      }

      const jsonString = jsonMatch[0];
      console.log('[generateRelationshipAnalysis] Extracted JSON:', jsonString);

      const analysis = JSON.parse(jsonString) as RelationshipAnalysis;
      
      // Validate required fields
      if (!analysis.overallHealth || !analysis.categories || !analysis.strengthsAndChallenges) {
        console.error('[generateRelationshipAnalysis] Missing required fields in analysis');
        throw new Error('Invalid analysis structure');
      }

      // Add emotional dynamics to the analysis
      analysis.emotionalDynamics = emotionalDynamics;
      
      console.log('[generateRelationshipAnalysis] Final analysis:', {
        hasEmotionalDynamics: !!analysis.emotionalDynamics,
        emotionalDynamicsStructure: analysis.emotionalDynamics
      });

      return analysis;
    } catch (error) {
      console.error('[generateRelationshipAnalysis] Failed to parse analysis response:', error);
      console.error('[generateRelationshipAnalysis] Response that failed:', response);
      throw new Error('Failed to parse analysis response. Please try again later.');
    }
  } catch (error) {
    console.error('[generateRelationshipAnalysis] Error generating analysis:', error);
    throw new Error('Failed to generate relationship analysis. Please try again later.');
  }
};

export const analyzeConsensusForm = async (
  userFormData: ConsensusFormData,
  partnerFormData?: ConsensusFormData,
  historicalContext?: {
    previousForms?: ConsensusFormData[];
    dailyAssessments?: any[];
    previousAnalyses?: any[];
  }
): Promise<ConsensusFormAnalysis> => {
  try {
    const prompt = `
Analise os seguintes dados do formulário de consenso conjugal:

Respostas do Usuário:
${JSON.stringify(userFormData.answers, null, 2)}

${partnerFormData ? `
Respostas do Parceiro:
${JSON.stringify(partnerFormData.answers, null, 2)}
` : ''}

${historicalContext?.previousForms ? `
Formulários Anteriores:
${JSON.stringify(historicalContext.previousForms, null, 2)}
` : ''}

${historicalContext?.dailyAssessments ? `
Avaliações Diárias Recentes:
${JSON.stringify(historicalContext.dailyAssessments, null, 2)}
` : ''}

${historicalContext?.previousAnalyses ? `
Análises Anteriores:
${JSON.stringify(historicalContext.previousAnalyses, null, 2)}
` : ''}
`;

    const analysisText = await callOpenAI(CONSENSUS_FORM_ANALYSIS_PROMPT, prompt, 0.7);

    try {
      const jsonStart = analysisText.indexOf('{');
      const jsonEnd = analysisText.lastIndexOf('}') + 1;
      const jsonString = analysisText.slice(jsonStart, jsonEnd);
      
      const analysis = JSON.parse(jsonString);

      // Validate and ensure all required fields exist
      const validatedAnalysis: ConsensusFormAnalysis = {
        overallAnalysis: {
          score: Number(analysis.overallAnalysis?.score) || 75,
          trend: analysis.overallAnalysis?.trend || 'stable',
          summary: analysis.overallAnalysis?.summary || '',
          riskLevel: analysis.overallAnalysis?.riskLevel || 'low'
        },
        categoryAnalysis: analysis.categoryAnalysis || {},
        progressionAnalysis: {
          improvements: Array.isArray(analysis.progressionAnalysis?.improvements) 
            ? analysis.progressionAnalysis.improvements 
            : [],
          concerns: Array.isArray(analysis.progressionAnalysis?.concerns)
            ? analysis.progressionAnalysis.concerns
            : [],
          trends: analysis.progressionAnalysis?.trends || {}
        },
        therapeuticInsights: {
          immediateActions: Array.isArray(analysis.therapeuticInsights?.immediateActions)
            ? analysis.therapeuticInsights.immediateActions
            : [],
          longTermStrategies: Array.isArray(analysis.therapeuticInsights?.longTermStrategies)
            ? analysis.therapeuticInsights.longTermStrategies
            : [],
          underlyingIssues: Array.isArray(analysis.therapeuticInsights?.underlyingIssues)
            ? analysis.therapeuticInsights.underlyingIssues
            : []
        },
        consistencyAnalysis: {
          alignedAreas: Array.isArray(analysis.consistencyAnalysis?.alignedAreas)
            ? analysis.consistencyAnalysis.alignedAreas
            : [],
          discrepancies: Array.isArray(analysis.consistencyAnalysis?.discrepancies)
            ? analysis.consistencyAnalysis.discrepancies
            : [],
          possibleMotivations: Array.isArray(analysis.consistencyAnalysis?.possibleMotivations)
            ? analysis.consistencyAnalysis.possibleMotivations
            : []
        },
        recommendations: {
          communication: Array.isArray(analysis.recommendations?.communication)
            ? analysis.recommendations.communication
            : [],
          exercises: Array.isArray(analysis.recommendations?.exercises)
            ? analysis.recommendations.exercises
            : [],
          professionalSupport: Array.isArray(analysis.recommendations?.professionalSupport)
            ? analysis.recommendations.professionalSupport
            : []
        }
      };

      return validatedAnalysis;
    } catch (parseError) {
      console.error('Failed to parse consensus form analysis:', parseError);
      throw new Error('Failed to parse analysis response. The AI response was not in the expected format.');
    }
  } catch (error) {
    console.error('Error analyzing consensus form:', error);
    throw error;
  }
}; 