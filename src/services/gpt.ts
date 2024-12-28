import { DailyAssessmentWithRatings, RelationshipContext } from '../types';

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
}

export const generateRelationshipAnalysis = async (
  userAssessment: DailyAssessmentWithRatings,
  partnerAssessment: DailyAssessmentWithRatings,
  relationshipContext?: RelationshipContext
): Promise<RelationshipAnalysis> => {
  const prompt = `
Analise a saúde do relacionamento com base nas avaliações diárias do casal e no contexto do relacionamento.

Avaliação do Usuário:
- Comunicação: ${userAssessment.ratings.comunicacao}
- Ansiedade: ${userAssessment.ratings.saudeMental}
- Transparência: ${userAssessment.ratings.transparenciaConfianca}
- Intimidade: ${userAssessment.ratings.intimidadeFisica}
- Insegurança: ${userAssessment.ratings.segurancaRelacionamento}
- Satisfação Geral: ${userAssessment.ratings.satisfacaoGeral}

Avaliação do Parceiro:
- Comunicação: ${partnerAssessment.ratings.comunicacao}
- Ansiedade: ${partnerAssessment.ratings.saudeMental}
- Transpar��ncia: ${partnerAssessment.ratings.transparenciaConfianca}
- Intimidade: ${partnerAssessment.ratings.intimidadeFisica}
- Insegurança: ${partnerAssessment.ratings.segurancaRelacionamento}
- Satisfação Geral: ${partnerAssessment.ratings.satisfacaoGeral}

${
  relationshipContext
    ? `
Contexto do Relacionamento:
- Duração: ${relationshipContext.duration}
- Status: ${relationshipContext.status}
- Tipo de Relacionamento: ${relationshipContext.type}
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
    "saudeMental": {
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
    "segurancaRelacionamento": {
      "score": number,
      "trend": string,
      "insights": string[]
    },
    "satisfacaoGeral": {
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
  "actionItems": string[] // Lista de ações práticas
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