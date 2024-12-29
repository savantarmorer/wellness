import { DailyAssessment, RelationshipContext } from '../types';
import { getAnalysisForDate } from './analysisHistoryService';
import { callOpenAI } from './openaiClient';
import {
  THERAPIST_SYSTEM_PROMPT,
  ANALYSIS_SYSTEM_PROMPT,
  generateDailyInsightPrompt,
} from './prompts';

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
    
    if (existingAnalysis && typeof existingAnalysis.analysis !== 'string') {
      return existingAnalysis.analysis;
    }

    const prompt = generateAnalysisPrompt(userAssessment, partnerAssessment, relationshipContext);
    const analysisText = await callOpenAI(ANALYSIS_SYSTEM_PROMPT, prompt, 0.7);

    try {
      // Remove any potential text before the first { and after the last }
      const jsonStart = analysisText.indexOf('{');
      const jsonEnd = analysisText.lastIndexOf('}') + 1;
      const jsonString = analysisText.slice(jsonStart, jsonEnd);
      
      const parsedAnalysis = JSON.parse(jsonString);
      
      // Validate the required fields
      if (!parsedAnalysis.overallHealth || !parsedAnalysis.categories || 
          !parsedAnalysis.strengthsAndChallenges || !parsedAnalysis.communicationSuggestions || 
          !parsedAnalysis.actionItems || !parsedAnalysis.relationshipDynamics) {
        throw new Error('Invalid analysis format: missing required fields');
      }

      return parsedAnalysis;
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