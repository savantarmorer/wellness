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

export const generateDailyInsight = async (
  assessment: DailyAssessment,
  relationshipContext?: RelationshipContext
): Promise<string> => {
  const prompt = `
Analise a avaliação diária do relacionamento e forneça um insight personalizado.

Avaliação:
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

${assessment.comments ? `Comentários: ${assessment.comments}\n` : ''}
${assessment.gratitude ? `Gratidão: ${assessment.gratitude}\n` : ''}

${
  relationshipContext
    ? `
Contexto do Relacionamento:
- Duração: ${relationshipContext.duration}
- Status: ${relationshipContext.status}
- Tipo: ${relationshipContext.type}
- Objetivos: ${relationshipContext.goals.join(', ')}
- Desafios: ${relationshipContext.challenges.join(', ')}
- Valores: ${relationshipContext.values.join(', ')}
`
    : ''
}

Por favor, forneça um insight personalizado sobre o estado atual do relacionamento, destacando pontos positivos e áreas que merecem atenção. O insight deve ser motivador e construtivo, oferecendo sugestões práticas quando apropriado.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Você é um terapeuta de casais experiente que fornece insights personalizados sobre relacionamentos.',
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
Analise a saúde do relacionamento com base nas avaliações diárias do casal e no contexto do relacionamento.

Avaliação do Usuário:
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

Avaliação do Parceiro:
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

${
  relationshipContext
    ? `
Contexto do Relacionamento:
- Duração: ${relationshipContext.duration}
- Status: ${relationshipContext.status}
- Tipo: ${relationshipContext.type}
- Objetivos: ${relationshipContext.goals.join(', ')}
- Desafios: ${relationshipContext.challenges.join(', ')}
- Valores: ${relationshipContext.values.join(', ')}
`
    : ''
}

Por favor, forneça uma análise detalhada do relacionamento no seguinte formato JSON:

{
  "overallHealth": {
    "score": number, // 0-100
    "trend": string // "up", "down", or "stable"
  },
  "categories": {
    "comunicacao": {
      "score": number, // 0-10
      "trend": string, // "up", "down", or "stable"
      "insights": string[] // Lista de insights específicos
    },
    "conexaoEmocional": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "apoioMutuo": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "transparenciaConfianca": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "intimidadeFisica": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "saudeMental": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "resolucaoConflitos": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "segurancaRelacionamento": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "alinhamentoObjetivos": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "satisfacaoGeral": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "autocuidado": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "gratidao": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "qualidadeTempo": {
      "score": number,
      "trend": string,
      "insights": string[]
    }
  },
  "strengthsAndChallenges": {
    "strengths": string[], // Lista de pontos fortes
    "challenges": string[] // Lista de desafios
  },
  "communicationSuggestions": string[], // Lista de sugestões de comunicação
  "actionItems": string[], // Lista de ações práticas
  "relationshipDynamics": {
    "positivePatterns": string[], // Padrões positivos identificados
    "concerningPatterns": string[], // Padrões preocupantes identificados
    "growthAreas": string[] // Áreas com potencial de crescimento
  }
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Você é um terapeuta de casais experiente que analisa a saúde dos relacionamentos com base em avaliações diárias e fornece insights valiosos.',
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