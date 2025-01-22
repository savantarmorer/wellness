import { useMemo } from 'react';
import { RelationshipAnalysis as Analysis } from '../types';

const isValidNumber = (value: any): value is number => {
  return Number.isFinite(value) && !Number.isNaN(value);
};

const normalizeValue = (value: any, fallback: number = 0): number => {
  if (!isValidNumber(value)) return fallback;
  return Math.max(0, Math.min(1, value)); // Ensure value is between 0-1
};

/**
 * Weights for satisfaction calculation
 * - Direct satisfaction (0.35): Primary indicator of relationship health
 * - DAS score (0.35): Validated scale with proven reliability
 * - Emotional sync (0.15): Secondary indicator from real-time interactions
 * - Stability (0.15): Secondary indicator from pattern analysis
 */
const SATISFACTION_WEIGHTS = {
  directSatisfaction: 0.35,
  dasScore: 0.35,
  emotionalSync: 0.15,
  stability: 0.15,
} as const;

/**
 * Weights for overall health calculation
 * Equal weights (0.25) for each factor as they're considered equally important
 * indicators of relationship health based on different aspects
 */
const HEALTH_WEIGHTS = {
  overallHealth: 0.25,
  satisfaction: 0.25,
  emotionalSync: 0.25,
  stability: 0.25,
} as const;

const generateRelationshipDynamics = (metrics: any, overallHealth: number) => {
  const strengths: string[] = [];
  const challenges: string[] = [];
  const recommendations: string[] = [];

  // Análise de Sincronia Emocional
  if (metrics.emotionalSync >= 0.7) {
    strengths.push('Forte conexão emocional e empatia mútua');
    strengths.push('Capacidade de compreender e validar sentimentos');
  } else if (metrics.emotionalSync < 0.4) {
    challenges.push('Dificuldade em compreender as emoções um do outro');
    recommendations.push('Praticar escuta ativa e validação emocional diariamente');
    recommendations.push('Reservar tempo para conversas profundas sobre sentimentos');
  }

  // Análise de Comunicação
  if (metrics.communicationQuality >= 0.7) {
    strengths.push('Comunicação clara e efetiva');
    strengths.push('Diálogo construtivo e respeitoso');
  } else if (metrics.communicationQuality < 0.4) {
    challenges.push('Padrões de comunicação que precisam ser melhorados');
    challenges.push('Dificuldade em expressar necessidades e preocupações');
    recommendations.push('Estabelecer momentos regulares para diálogo aberto');
    recommendations.push('Praticar comunicação não-violenta');
  }

  // Análise de Estabilidade
  if (metrics.stability >= 0.7) {
    strengths.push('Relacionamento estável e previsível');
    strengths.push('Forte comprometimento mútuo');
  } else if (metrics.stability < 0.4) {
    challenges.push('Instabilidade nas interações e rotinas');
    challenges.push('Dificuldade em manter acordos e compromissos');
    recommendations.push('Criar e manter rituais de conexão diários');
    recommendations.push('Estabelecer acordos claros e cumpri-los');
  }

  // Análise de Satisfação
  if (metrics.satisfaction >= 0.7) {
    strengths.push('Alto nível de satisfação com o relacionamento');
    strengths.push('Expectativas bem alinhadas');
  } else if (metrics.satisfaction < 0.4) {
    challenges.push('Insatisfação com aspectos importantes do relacionamento');
    challenges.push('Expectativas não atendidas');
    recommendations.push('Discutir e alinhar expectativas mútuamente');
    recommendations.push('Identificar e trabalhar em áreas específicas de insatisfação');
  }

  // Recomendações gerais baseadas na saúde geral
  if (overallHealth < 0.7) {
    recommendations.push('Considerar terapia de casal para fortalecer a relação');
  }
  if (overallHealth < 0.4) {
    recommendations.push('Buscar ajuda profissional para superar desafios atuais');
  }

  // Garantir que sempre haja pelo menos uma recomendação
  if (recommendations.length === 0) {
    recommendations.push('Continuar cultivando os aspectos positivos do relacionamento');
    recommendations.push('Manter diálogo aberto sobre expectativas e necessidades');
  }

  // Garantir que sempre haja pelo menos um ponto forte
  if (strengths.length === 0) {
    if (metrics.emotionalSync >= metrics.communicationQuality && metrics.emotionalSync >= metrics.stability) {
      strengths.push('Potencial para desenvolver maior conexão emocional');
    } else if (metrics.communicationQuality >= metrics.stability) {
      strengths.push('Base para desenvolver comunicação mais efetiva');
    } else {
      strengths.push('Capacidade de construir maior estabilidade');
    }
  }

  // Garantir que sempre haja pelo menos um desafio
  if (challenges.length === 0) {
    challenges.push('Manter e aprimorar os níveis atuais de satisfação');
  }

  return {
    strengths,
    challenges,
    recommendations
  };
};

export const useMetricsCalculation = (analysis: Analysis) => {
  return useMemo(() => {
    // Calculate base metrics (all normalized to 0-1 scale)
    const baseMetrics = {
      emotionalSync: normalizeValue(
        analysis.emotionalSync || analysis.emotionalDynamics?.synchronicity
      ),
      communicationQuality: normalizeValue(
        analysis.categories?.comunicacao?.score || analysis.gptAnalysis?.analysis?.communicationMetrics?.quality
      ),
      stability: normalizeValue(
        analysis.emotionalDynamics?.stability
      )
    };

    // Calculate satisfaction (0-1 scale)
    const satisfactionFactors = [
      { 
        value: normalizeValue(analysis.categories?.satisfacaoGeral?.score),
        weight: SATISFACTION_WEIGHTS.directSatisfaction
      },
      { 
        value: normalizeValue((analysis.validatedScales?.das?.satisfacao || 0) / 7), // DAS is 0-7 scale
        weight: SATISFACTION_WEIGHTS.dasScore
      },
      { 
        value: baseMetrics.emotionalSync,
        weight: SATISFACTION_WEIGHTS.emotionalSync
      },
      { 
        value: baseMetrics.stability,
        weight: SATISFACTION_WEIGHTS.stability
      }
    ];

    const satisfaction = satisfactionFactors.reduce(
      (sum, factor) => sum + factor.value * factor.weight,
      0
    );

    // Calculate overall health (0-1 scale)
    const healthFactors = [
      { 
        value: normalizeValue(analysis.overallHealth?.score / 100), // Convert from percentage
        weight: HEALTH_WEIGHTS.overallHealth
      },
      { 
        value: satisfaction,
        weight: HEALTH_WEIGHTS.satisfaction
      },
      { 
        value: baseMetrics.emotionalSync,
        weight: HEALTH_WEIGHTS.emotionalSync
      },
      { 
        value: baseMetrics.stability,
        weight: HEALTH_WEIGHTS.stability
      }
    ];

    const overallHealth = healthFactors.reduce(
      (sum, factor) => sum + factor.value * factor.weight,
      0
    );

    const metrics = {
      ...baseMetrics,
      satisfaction
    };

    const dynamics = generateRelationshipDynamics(metrics, overallHealth);

    return {
      metrics,
      overallHealth,
      dynamics
    };
  }, [analysis]);
}; 