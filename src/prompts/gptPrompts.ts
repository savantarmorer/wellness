export const generateAttachmentStylePrompt = (averages: Record<string, number>, discrepancies: any[]): string => {
  return `Analise o estilo de apego com base nas seguintes médias: ${JSON.stringify(averages)} e discrepâncias: ${JSON.stringify(discrepancies)}`;
};

export const generateCategoryInsightPrompt = (category: string, scores: number[]): string => {
  return `Analise a categoria ${category} com base nos seguintes scores: ${scores.join(', ')}`;
};

export const generateDiscrepancyPrompt = (category: string, userScores: number[], partnerScores: number[]): string => {
  return `Analise as discrepâncias em ${category} entre os scores do usuário (${userScores.join(', ')}) e do parceiro (${partnerScores.join(', ')})`;
};

export const generatePatternPrompt = (category: string, scores: number[]): string => {
  return `Identifique padrões em ${category} com base nos seguintes scores: ${scores.join(', ')}`;
};

export const generateRelationshipContextPrompt = (context: any): string => {
  return `Analise o contexto do relacionamento: ${JSON.stringify(context)}`;
};

export const generateTimeframeInsightPrompt = (averages: Record<string, number>, days: number): string => {
  return `Gere insights para o período de ${days} dias com base nas médias: ${JSON.stringify(averages)}`;
}; 