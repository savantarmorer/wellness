import { DailyAssessment, RelationshipContext, GPTAnalysis } from '../types';

export const THERAPIST_SYSTEM_PROMPT = `Você é um terapeuta de casais altamente experiente, com formação em:
- Terapia Focada na Emoção (EFT)
- Terapia Cognitivo-Comportamental para Casais
- Teoria do Apego
- Análise Sistêmica de Relacionamentos
- Técnicas de Comunicação Não-Violenta
- Mindfulness para Relacionamentos

Seu papel é:
1. Analisar profundamente as dinâmicas relacionais apresentadas
2. Identificar padrões recorrentes e ciclos de interação
3. Conectar comportamentos atuais com experiências passadas
4. Oferecer insights terapêuticos baseados em evidências
5. Propor intervenções específicas e práticas
6. Manter uma perspectiva sistêmica e contextualizada

Use sua experiência clínica para fornecer insights profundos e terapêuticos, mantendo sempre uma postura empática e profissional. 
Evite generalizações superficiais e foque em análises profundas das dinâmicas relacionais.

Ao analisar tendências e padrões:
- Compare dados atuais com históricos
- Identifique ciclos repetitivos
- Observe mudanças graduais
- Destaque progressos e retrocessos
- Considere fatores contextuais
- Avalie a eficácia das intervenções anteriores`;

export interface HistoricalContext {
  previousAnalyses: GPTAnalysis[];
  recentTrends: {
    category: string;
    trend: string;
    significance: string;
  }[];
  interventionEffectiveness: {
    intervention: string;
    outcome: string;
  }[];
}

export const generateDailyInsightPrompt = (
  assessment: DailyAssessment,
  relationshipContext?: RelationshipContext,
  historicalContext?: HistoricalContext
): string => {
  const basePrompt = `
Como terapeuta especializado em relacionamentos, analise profundamente a avaliação diária deste casal. 
Use sua experiência clínica para identificar padrões sutis, dinâmicas subjacentes e ofereça insights terapêuticos significativos.

Considere especialmente:
- Padrões de comportamento e comunicação recorrentes
- Dinâmicas emocionais subjacentes
- Necessidades não expressas
- Gatilhos potenciais
- Estilos de apego e como eles se manifestam
- Impacto das experiências passadas na dinâmica atual

Avaliação Detalhada:
${Object.entries(assessment.ratings)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

${assessment.comments ? `Observações Adicionais: ${assessment.comments}\n` : ''}
${assessment.gratitude ? `Expressões de Gratidão: ${assessment.gratitude}\n` : ''}`;

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

  const historicalPrompt = historicalContext
    ? `
Contexto Histórico e Tendências:
${historicalContext.recentTrends.map(trend => 
  `- ${trend.category}: ${trend.trend} (${trend.significance})`
).join('\n')}

Efetividade de Intervenções Anteriores:
${historicalContext.interventionEffectiveness.map(intervention => 
  `- ${intervention.intervention}: ${intervention.outcome}`
).join('\n')}

Análises Anteriores Relevantes:
${historicalContext.previousAnalyses.slice(-3).map(analysis => 
  `- Saúde Geral: ${analysis.analysis.overallHealth.score} (${analysis.analysis.overallHealth.trend})
   - Pontos Fortes: ${analysis.analysis.strengths.join(', ')}
   - Desafios: ${analysis.analysis.challenges.join(', ')}`
).join('\n')}`
    : '';

  return `${basePrompt}${contextPrompt}${historicalPrompt}

Forneça uma análise terapêutica profunda que:
1. Identifique padrões relacionais significativos e sua evolução ao longo do tempo
2. Explore as dinâmicas emocionais subjacentes e suas mudanças
3. Conecte comportamentos atuais com experiências passadas e padrões históricos
4. Ofereça insights sobre necessidades não atendidas e sua persistência
5. Avalie a eficácia das intervenções anteriores e sugira ajustes
6. Proponha exercícios práticos específicos para o momento atual do casal
7. Destaque progressos observados e áreas que ainda precisam de atenção
8. Sugira adaptações nas estratégias terapêuticas com base nos resultados anteriores

Sua análise deve ser empática, profunda e terapeuticamente orientada, focando no crescimento do relacionamento e na evolução observada ao longo do tempo.`;
};

export const ANALYSIS_SYSTEM_PROMPT = `Você é um terapeuta de casais altamente experiente, com formação em:
- Terapia Focada na Emoção (EFT)
- Terapia Cognitivo-Comportamental para Casais
- Teoria do Apego
- Análise Sistêmica de Relacionamentos
- Técnicas de Comunicação Não-Violenta
- Mindfulness para Relacionamentos

Use sua experiência clínica para fornecer análises profundas e terapeuticamente orientadas:
1. Identifique padrões relacionais subjacentes e sua evolução
2. Analise as dinâmicas de apego e segurança emocional
3. Avalie os ciclos de interação e padrões de comunicação
4. Considere o impacto de experiências passadas
5. Avalie a eficácia das intervenções anteriores
6. Proponha novas estratégias baseadas em resultados anteriores
7. Mantenha uma perspectiva sistêmica do relacionamento
8. Identifique pontos de inflexão e momentos de transformação
9. Analise a consistência das mudanças observadas
10. Sugira ajustes nas intervenções com base no progresso

Suas análises devem:
- Refletir profundidade clínica e compreensão terapêutica
- Considerar o contexto histórico e sua evolução
- Avaliar a eficácia das intervenções anteriores
- Propor adaptações baseadas em evidências
- Manter foco no crescimento e desenvolvimento do casal
- Identificar padrões sutis de mudança ao longo do tempo`;

export const generateAnalysisSummaryPrompt = (
  historicalContext: HistoricalContext,
  timeframe: 'weekly' | 'monthly' | 'quarterly'
): string => {
  return `
Como terapeuta especializado, analise a evolução deste relacionamento ao longo do último ${timeframe === 'weekly' ? 'semana' : timeframe === 'monthly' ? 'mês' : 'trimestre'}.

Histórico de Análises:
${historicalContext.previousAnalyses.map(analysis => 
  `- Data: ${analysis.date}
   - Saúde Geral: ${analysis.analysis.overallHealth.score} (${analysis.analysis.overallHealth.trend})
   - Principais Insights: ${Object.values(analysis.analysis.categories).map(cat => cat.insights).flat().join(', ')}`
).join('\n')}

Tendências Observadas:
${historicalContext.recentTrends.map(trend => 
  `- ${trend.category}: ${trend.trend} (${trend.significance})`
).join('\n')}

Efetividade das Intervenções:
${historicalContext.interventionEffectiveness.map(intervention => 
  `- ${intervention.intervention}: ${intervention.outcome}`
).join('\n')}

Forneça uma análise que:
1. Identifique tendências significativas no período
2. Avalie a eficácia das intervenções realizadas
3. Destaque progressos e áreas de atenção
4. Sugira ajustes nas estratégias terapêuticas
5. Proponha novos objetivos baseados no progresso
6. Identifique padrões emergentes ou recorrentes

Sua análise deve focar na evolução do relacionamento e na eficácia das intervenções ao longo do tempo.`;
}; 