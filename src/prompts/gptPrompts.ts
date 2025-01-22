import { THERAPIST_SYSTEM_PROMPT } from '../services/prompts';
import { AttachmentStyle, CategoryScores, RelationshipContext } from '../types';

export interface PromptContext {
  historicalData?: {
    scores: number[];
    dates: string[];
    insights: string[];
  };
  relationshipContext?: RelationshipContext;
}

export const generateAttachmentStylePrompt = (
  averages: CategoryScores,
  discrepancies: Array<{category: string; difference: number}>
): string => {
  return `${THERAPIST_SYSTEM_PROMPT}

Analise o estilo de apego com base nos seguintes dados:

Médias por Categoria:
${Object.entries(averages)
  .map(([category, score]) => `- ${category}: ${score}`)
  .join('\n')}

Discrepâncias Significativas:
${discrepancies.map(d => `- ${d.category}: diferença de ${d.difference}`).join('\n')}

Por favor, forneça uma análise no seguinte formato JSON:
{
  "style": string, // "secure", "anxious", "avoidant", ou "disorganized"
  "confidence": number, // 0-1
  "characteristics": string[],
  "recommendations": string[],
  "riskFactors": string[]
}`;
};

export const generateCategoryInsightPrompt = (
  category: string,
  scores: number[],
  context?: PromptContext
): string => {
  const historicalContext = context?.historicalData
    ? `
Histórico da Categoria:
- Scores anteriores: ${context.historicalData.scores.join(', ')}
- Datas: ${context.historicalData.dates.join(', ')}
- Insights prévios: ${context.historicalData.insights.join('; ')}`
    : '';

  return `${THERAPIST_SYSTEM_PROMPT}

Analise a categoria "${category}" com base nos seguintes dados:
- Scores recentes: ${scores.join(', ')}${historicalContext}

Por favor, forneça uma análise no seguinte formato JSON:
{
  "trend": string, // "improving", "stable", ou "concerning"
  "significance": number, // 0-1
  "insights": string[],
  "recommendations": string[]
}`;
};

export const generateDiscrepancyPrompt = (
  category: string,
  userScores: number[],
  partnerScores: number[],
  context?: PromptContext
): string => {
  const relationshipInfo = context?.relationshipContext
    ? `
Contexto do Relacionamento:
${Object.entries(context.relationshipContext)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}`
    : '';

  return `${THERAPIST_SYSTEM_PROMPT}

Analise as discrepâncias na categoria "${category}":
- Scores do Usuário: ${userScores.join(', ')}
- Scores do Parceiro: ${partnerScores.join(', ')}${relationshipInfo}

Por favor, forneça uma análise no seguinte formato JSON:
{
  "significance": number, // 0-1
  "impact": string, // "low", "moderate", ou "high"
  "insights": string[],
  "recommendations": string[],
  "riskFactors": string[]
}`;
};

export const generatePatternPrompt = (
  category: string,
  scores: number[],
  context?: PromptContext
): string => {
  return `${THERAPIST_SYSTEM_PROMPT}

Identifique padrões na categoria "${category}":
- Scores: ${scores.join(', ')}
${context?.historicalData ? `- Histórico: ${context.historicalData.scores.join(', ')}` : ''}

Por favor, forneça uma análise no seguinte formato JSON:
{
  "pattern": string,
  "confidence": number, // 0-1
  "implications": string[],
  "recommendations": string[]
}`;
};

export const generateTimeframeInsightPrompt = (
  averages: CategoryScores,
  days: number,
  context?: PromptContext
): string => {
  return `${THERAPIST_SYSTEM_PROMPT}

Gere insights para o período de ${days} dias com base nos seguintes dados:

Médias por Categoria:
${Object.entries(averages)
  .map(([category, score]) => `- ${category}: ${score}`)
  .join('\n')}

${context?.relationshipContext ? `
Contexto do Relacionamento:
${Object.entries(context.relationshipContext)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}` : ''}

Por favor, forneça uma análise no seguinte formato JSON:
{
  "overallTrend": string, // "improving", "stable", ou "concerning"
  "significance": number, // 0-1
  "keyInsights": string[],
  "recommendations": string[],
  "riskFactors": string[]
}`;
}; 