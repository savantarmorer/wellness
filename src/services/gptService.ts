import { DailyAssessment, RelationshipContext } from '../types';
import { getAnalysisForDate } from './analysisHistoryService';
import { callOpenAI } from './openaiClient';
import {
  THERAPIST_SYSTEM_PROMPT,
  ANALYSIS_SYSTEM_PROMPT,
  generateDailyInsightPrompt,
  CONSENSUS_FORM_ANALYSIS_PROMPT,
} from './prompts';
import { ConsensusFormData } from './analysisHistoryService';

export interface RelationshipAnalysis {
  overallHealth: {
    score: number;
    trend: string;
  };
  categories: {
    [key: string]: {
      score: number;
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
  };
}

export interface ConsensusFormAnalysis {
  overallAnalysis: {
    score: number;
    trend: 'improving' | 'stable' | 'concerning';
    summary: string;
    riskLevel: 'low' | 'moderate' | 'high';
  };
  categoryAnalysis: {
    [key: string]: {
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
      [key: string]: {
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
): Promise<string> => {
  try {
    const prompt = generateDailyInsightPrompt(assessment, relationshipContext);
    return await callOpenAI(THERAPIST_SYSTEM_PROMPT, prompt);
  } catch (error) {
    console.error('Error generating daily insight:', error);
    throw new Error('Failed to generate daily insight. Please try again later.');
  }
};

const generateAnalysisPrompt = (
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
      return existingAnalysis.analysis as RelationshipAnalysis;
    }

    const prompt = generateAnalysisPrompt(userAssessment, partnerAssessment, relationshipContext);
    const analysisText = await callOpenAI(ANALYSIS_SYSTEM_PROMPT, prompt, 0.7);

    try {
      // Remove any potential text before the first { and after the last }
      const jsonStart = analysisText.indexOf('{');
      const jsonEnd = analysisText.lastIndexOf('}') + 1;
      const jsonString = analysisText.slice(jsonStart, jsonEnd);
      
      const parsedAnalysis = JSON.parse(jsonString);
      
      // Validate and ensure all required fields exist with proper structure
      const validatedAnalysis: RelationshipAnalysis = {
        overallHealth: {
          score: Number(parsedAnalysis.overallHealth?.score) || 75,
          trend: parsedAnalysis.overallHealth?.trend || 'stable'
        },
        categories: parsedAnalysis.categories || {},
        strengthsAndChallenges: {
          strengths: Array.isArray(parsedAnalysis.strengthsAndChallenges?.strengths) 
            ? parsedAnalysis.strengthsAndChallenges.strengths 
            : [],
          challenges: Array.isArray(parsedAnalysis.strengthsAndChallenges?.challenges)
            ? parsedAnalysis.strengthsAndChallenges.challenges
            : []
        },
        communicationSuggestions: Array.isArray(parsedAnalysis.communicationSuggestions)
          ? parsedAnalysis.communicationSuggestions
          : [],
        actionItems: Array.isArray(parsedAnalysis.actionItems)
          ? parsedAnalysis.actionItems
          : [],
        relationshipDynamics: {
          positivePatterns: Array.isArray(parsedAnalysis.relationshipDynamics?.positivePatterns)
            ? parsedAnalysis.relationshipDynamics.positivePatterns
            : [],
          concerningPatterns: Array.isArray(parsedAnalysis.relationshipDynamics?.concerningPatterns)
            ? parsedAnalysis.relationshipDynamics.concerningPatterns
            : [],
          growthAreas: Array.isArray(parsedAnalysis.relationshipDynamics?.growthAreas)
            ? parsedAnalysis.relationshipDynamics.growthAreas
            : []
        }
      };

      // Ensure all category objects have the required structure
      Object.keys(validatedAnalysis.categories).forEach(key => {
        validatedAnalysis.categories[key] = {
          score: Number(validatedAnalysis.categories[key]?.score) || 75,
          trend: validatedAnalysis.categories[key]?.trend || 'stable',
          insights: Array.isArray(validatedAnalysis.categories[key]?.insights)
            ? validatedAnalysis.categories[key].insights
            : []
        };
      });

      return validatedAnalysis;
    } catch (parseError) {
      console.error('Failed to parse analysis response:', analysisText);
      throw new Error('Failed to parse analysis response. The AI response was not in the expected format.');
    }
  } catch (error) {
    console.error('Error generating relationship analysis:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while generating the relationship analysis.');
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