import { DailyAssessment, RelationshipContext } from '../types';

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

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.VITE_OPENAI_API_KEY) {
    return process.env.VITE_OPENAI_API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).env && (window as any).env.VITE_OPENAI_API_KEY) {
    return (window as any).env.VITE_OPENAI_API_KEY;
  }
  throw new Error('API key not found');
};

export const generateDailyInsight = async (
  assessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): Promise<string> => {
  const prompt = `
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
- Comunicação: ${assessment.ratings.comunicacao}
- Conexão Emocional: ${assessment.ratings.conexaoEmocional}
- Apoio Mútuo: ${assessment.ratings.apoioMutuo}
- Transparência e Confiança: ${assessment.ratings.transparenciaConfianca}
- Intimidade Física: ${assessment.ratings.intimidadeFisica}
- Saúde Mental: ${assessment.ratings.saudeMental}
- Resolução de Conflitos: ${assessment.ratings.resolucaoConflitos}
- Segurança no Relacionamento: ${assessment.ratings.segurancaRelacionamento}
- Alinhamento em Objetivos: ${assessment.ratings.alinhamentoObjetivos}
- Satisfação Geral: ${assessment.ratings.satisfacaoGeral}
- Autocuidado: ${assessment.ratings.autocuidado}
- Gratidão: ${assessment.ratings.gratidao}
- Qualidade do Tempo: ${assessment.ratings.qualidadeTempo}

${assessment.comments ? `Observações Adicionais: ${assessment.comments}\n` : ''}
${assessment.gratitude ? `Expressões de Gratidão: ${assessment.gratitude}\n` : ''}

${
  relationshipContext
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
- Intimidade Física: ${relationshipContext.physicalIntimacy}
`
    : ''
}

Forneça uma análise terapêutica profunda que:
1. Identifique padrões relacionais significativos
2. Explore as dinâmicas emocionais subjacentes
3. Conecte comportamentos atuais com experiências passadas
4. Ofereça insights sobre necessidades não atendidas
5. Sugira intervenções terapêuticas específicas
6. Proponha exercícios práticos para desenvolvimento emocional

Sua análise deve ser empática, profunda e terapeuticamente orientada, focando no crescimento do relacionamento.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Você é um terapeuta de casais altamente experiente, com formação em:
- Terapia Focada na Emoção (EFT)
- Terapia Cognitivo-Comportamental para Casais
- Teoria do Apego
- Análise Sistêmica de Relacionamentos
- Técnicas de Comunicação Não-Violenta
- Mindfulness para Relacionamentos

Use sua experiência clínica para fornecer insights profundos e terapêuticos, mantendo sempre uma postura empática e profissional. 
Evite generalizações superficiais e foque em análises profundas das dinâmicas relacionais.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate insight');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating insight:', error);
    throw error;
  }
};

export const generateRelationshipAnalysis = async (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): Promise<RelationshipAnalysis> => {
  const prompt = `
Como terapeuta especializado, realize uma análise profunda da dinâmica relacional deste casal.
Considere tanto os aspectos manifestos quanto os padrões latentes do relacionamento.

Avaliação do Primeiro Parceiro:
- Comunicação: ${userAssessment.ratings.comunicacao}
- Conexão Emocional: ${userAssessment.ratings.conexaoEmocional}
- Apoio Mútuo: ${userAssessment.ratings.apoioMutuo}
- Transparência e Confiança: ${userAssessment.ratings.transparenciaConfianca}
- Intimidade Física: ${userAssessment.ratings.intimidadeFisica}
- Saúde Mental: ${userAssessment.ratings.saudeMental}
- Resolução de Conflitos: ${userAssessment.ratings.resolucaoConflitos}
- Segurança no Relacionamento: ${userAssessment.ratings.segurancaRelacionamento}
- Alinhamento em Objetivos: ${userAssessment.ratings.alinhamentoObjetivos}
- Satisfação Geral: ${userAssessment.ratings.satisfacaoGeral}
- Autocuidado: ${userAssessment.ratings.autocuidado}
- Gratidão: ${userAssessment.ratings.gratidao}
- Qualidade do Tempo: ${userAssessment.ratings.qualidadeTempo}

Avaliação do Segundo Parceiro:
- Comunicação: ${partnerAssessment.ratings.comunicacao}
- Conexão Emocional: ${partnerAssessment.ratings.conexaoEmocional}
- Apoio Mútuo: ${partnerAssessment.ratings.apoioMutuo}
- Transparência e Confiança: ${partnerAssessment.ratings.transparenciaConfianca}
- Intimidade Física: ${partnerAssessment.ratings.intimidadeFisica}
- Saúde Mental: ${partnerAssessment.ratings.saudeMental}
- Resolução de Conflitos: ${partnerAssessment.ratings.resolucaoConflitos}
- Segurança no Relacionamento: ${partnerAssessment.ratings.segurancaRelacionamento}
- Alinhamento em Objetivos: ${partnerAssessment.ratings.alinhamentoObjetivos}
- Satisfação Geral: ${partnerAssessment.ratings.satisfacaoGeral}
- Autocuidado: ${partnerAssessment.ratings.autocuidado}
- Gratidão: ${partnerAssessment.ratings.gratidao}
- Qualidade do Tempo: ${partnerAssessment.ratings.qualidadeTempo}

${userAssessment.comments ? `Observações do Primeiro Parceiro: ${userAssessment.comments}\n` : ''}
${userAssessment.gratitude ? `Gratidão do Primeiro Parceiro: ${userAssessment.gratitude}\n` : ''}
${partnerAssessment.comments ? `Observações do Segundo Parceiro: ${partnerAssessment.comments}\n` : ''}
${partnerAssessment.gratitude ? `Gratidão do Segundo Parceiro: ${partnerAssessment.gratitude}\n` : ''}

${
  relationshipContext
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
- Intimidade Física: ${relationshipContext.physicalIntimacy}
`
    : ''
}

Baseado em sua experiência clínica, forneça uma análise terapêutica detalhada no seguinte formato JSON:

{
  "overallHealth": {
    "score": number, // 0-100, avaliação clínica da saúde do relacionamento
    "trend": string // "up", "down", or "stable" - tendência terapêutica
  },
  "categories": {
    "comunicacao": {
      "score": number, // 0-10
      "trend": string, // "up", "down", or "stable"
      "insights": string[] // Insights terapêuticos específicos sobre padrões de comunicação
    },
    "conexaoEmocional": {
      "score": number,
      "trend": string,
      "insights": string[] // Análise da vinculação emocional e padrões de apego
    },
    "apoioMutuo": {
      "score": number,
      "trend": string,
      "insights": string[] // Avaliação dos sistemas de suporte e reciprocidade
    },
    "transparenciaConfianca": {
      "score": number,
      "trend": string,
      "insights": string[] // Análise da segurança emocional e vulnerabilidade
    },
    "intimidadeFisica": {
      "score": number,
      "trend": string,
      "insights": string[] // Avaliação da conexão física e intimidade
    },
    "saudeMental": {
      "score": number,
      "trend": string,
      "insights": string[] // Impacto da saúde mental na dinâmica do casal
    },
    "resolucaoConflitos": {
      "score": number,
      "trend": string,
      "insights": string[] // Padrões de conflito e estratégias de resolução
    },
    "segurancaRelacionamento": {
      "score": number,
      "trend": string,
      "insights": string[] // Análise do apego e segurança emocional
    },
    "alinhamentoObjetivos": {
      "score": number,
      "trend": string,
      "insights": string[] // Avaliação da visão compartilhada e valores
    },
    "satisfacaoGeral": {
      "score": number,
      "trend": string,
      "insights": string[] // Análise holística da satisfação relacional
    },
    "autocuidado": {
      "score": number,
      "trend": string,
      "insights": string[] // Impacto do autocuidado na dinâmica do casal
    },
    "gratidao": {
      "score": number,
      "trend": string,
      "insights": string[] // Análise da expressão de apreciação e reconhecimento
    },
    "qualidadeTempo": {
      "score": number,
      "trend": string,
      "insights": string[] // Avaliação da qualidade da conexão durante tempo juntos
    }
  },
  "strengthsAndChallenges": {
    "strengths": string[], // Recursos terapêuticos e pontos fortes identificados
    "challenges": string[] // Áreas que necessitam intervenção terapêutica
  },
  "communicationSuggestions": string[], // Intervenções terapêuticas específicas para comunicação
  "actionItems": string[], // Exercícios e práticas terapêuticas recomendadas
  "relationshipDynamics": {
    "positivePatterns": string[], // Padrões relacionais saudáveis identificados
    "concerningPatterns": string[], // Padrões que necessitam atenção terapêutica
    "growthAreas": string[] // Oportunidades de desenvolvimento emocional
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Você é um terapeuta de casais altamente experiente, com formação em:
- Terapia Focada na Emoção (EFT)
- Terapia Cognitivo-Comportamental para Casais
- Teoria do Apego
- Análise Sistêmica de Relacionamentos
- Técnicas de Comunicação Não-Violenta
- Mindfulness para Relacionamentos

Use sua experiência clínica para fornecer análises profundas e terapeuticamente orientadas:
1. Identifique padrões relacionais subjacentes
2. Analise as dinâmicas de apego e segurança emocional
3. Avalie os ciclos de interação e padrões de comunicação
4. Considere o impacto de experiências passadas
5. Proponha intervenções terapêuticas específicas
6. Mantenha uma perspectiva sistêmica do relacionamento

Suas análises devem refletir profundidade clínica e compreensão terapêutica.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate analysis');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error generating analysis:', error);
    throw error;
  }
}; 