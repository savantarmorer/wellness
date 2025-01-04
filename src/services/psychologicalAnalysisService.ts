import { DailyAssessment } from '../types';
import { CategoryAverages, DiscrepancyResult } from './analysisUtils';

interface AttachmentStyle {
  primary: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  description: string;
  recommendations: string[];
}

interface CommunicationPattern {
  style: 'assertive' | 'passive' | 'aggressive' | 'passive-aggressive';
  strengths: string[];
  challenges: string[];
  recommendations: string[];
}

export interface EmotionalDynamics {
  emotionalSecurity: number;
  intimacyBalance: {
    score: number;
    areas: {
      emotional: number;
      physical: number;
      intellectual: number;
      shared: number;
    };
  };
  conflictResolution: {
    style: string;
    effectiveness: number;
    patterns: string[];
  };
}

interface RelationshipStage {
  current: string;
  challenges: string[];
  opportunities: string[];
  nextStage: string;
}

export const analyzeAttachmentStyle = (
  averages: CategoryAverages,
  discrepancies: DiscrepancyResult[]
): AttachmentStyle => {
  const securityScore = averages.satisfaction * 0.3 + 
                     averages.consensus * 0.2 + 
                     averages.affection * 0.3 + 
                     averages.cohesion * 0.2;

  const highDiscrepancies = discrepancies.filter(d => d.significance === 'high');
  
  let style: AttachmentStyle['primary'] = 'secure';
  let description = '';
  let recommendations: string[] = [];

  if (highDiscrepancies.length >= 3) {
    style = 'anxious';
    description = 'Demonstra padrões ansiosos de apego, com preocupação elevada sobre o relacionamento.';
    recommendations = [
      'Trabalhe no desenvolvimento da autoconfiança',
      'Pratique comunicação assertiva de necessidades',
      'Desenvolva atividades independentes'
    ];
  } else if (averages.affection < 3 && averages.cohesion < 3) {
    style = 'avoidant';
    description = 'Mostra tendências evitativas, com dificuldade em manter proximidade emocional.';
    recommendations = [
      'Explore gradualmente maior intimidade emocional',
      'Identifique medos e resistências específicos',
      'Estabeleça pequenos objetivos de conexão diária'
    ];
  } else if (securityScore >= 4) {
    style = 'secure';
    description = 'Demonstra padrões seguros de apego, com boa capacidade de intimidade e autonomia.';
    recommendations = [
      'Continue fortalecendo a comunicação aberta',
      'Mantenha o equilíbrio entre intimidade e independência',
      'Celebre as conquistas do relacionamento'
    ];
  } else {
    style = 'disorganized';
    description = 'Apresenta padrões mistos de apego, com variações significativas no comportamento.';
    recommendations = [
      'Busque consistência nas interações diárias',
      'Desenvolva rotinas de conexão previsíveis',
      'Considere apoio terapêutico para explorar padrões'
    ];
  }

  return { primary: style, description, recommendations };
};

export const analyzeCommunicationPatterns = (
  assessment1: DailyAssessment,
  assessment2: DailyAssessment
): CommunicationPattern => {
  const communicationScore = (assessment1.ratings.comunicacao + assessment2.ratings.comunicacao) / 2;
  const conflictScore = (assessment1.ratings.resolucaoConflitos + assessment2.ratings.resolucaoConflitos) / 2;

  let style: CommunicationPattern['style'];
  let strengths: string[] = [];
  let challenges: string[] = [];
  let recommendations: string[] = [];

  if (communicationScore >= 4 && conflictScore >= 4) {
    style = 'assertive';
    strengths = ['Comunicação clara e direta', 'Boa gestão de conflitos', 'Escuta ativa'];
    challenges = ['Manter consistência em momentos de estresse', 'Equilibrar razão e emoção'];
    recommendations = ['Aprofundar técnicas de diálogo', 'Explorar temas mais complexos'];
  } else if (communicationScore < 3 && conflictScore > 3) {
    style = 'passive';
    strengths = ['Evita conflitos diretos', 'Mantém harmonia aparente'];
    challenges = ['Dificuldade em expressar necessidades', 'Acúmulo de ressentimentos'];
    recommendations = ['Praticar expressão assertiva', 'Desenvolver confiança na comunicação'];
  } else if (communicationScore < 3 && conflictScore < 3) {
    style = 'aggressive';
    strengths = ['Expressão direta de opiniões', 'Clareza sobre posições'];
    challenges = ['Dificuldade em escutar', 'Escalada de conflitos'];
    recommendations = ['Desenvolver empatia', 'Praticar escuta ativa'];
  } else {
    style = 'passive-aggressive';
    strengths = ['Criatividade na expressão', 'Percepção de nuances'];
    challenges = ['Comunicação indireta', 'Dificuldade em confrontos saudáveis'];
    recommendations = ['Desenvolver assertividade', 'Praticar comunicação direta'];
  }

  return { style, strengths, challenges, recommendations };
};

export const calculateEmotionalSecurity = (averages: CategoryAverages): number => {
  return Math.min(5, 
    averages.satisfaction * 0.3 +
    averages.affection * 0.3 +
    averages.consensus * 0.2 +
    averages.cohesion * 0.2
  );
};

export const analyzeIntimacyBalance = (averages: CategoryAverages) => {
  return {
    score: Math.min(5, averages.affection),
    areas: {
      emotional: Math.min(5, averages.affection * 1.2),
      physical: Math.min(5, averages.affection * 0.8),
      intellectual: Math.min(5, averages.cohesion),
      shared: Math.min(5, averages.cohesion * 0.9)
    }
  };
};

export const analyzeConflictStyle = (
  assessment1: DailyAssessment,
  assessment2: DailyAssessment
) => {
  const conflictScore = Math.min(5, (assessment1.ratings.resolucaoConflitos + assessment2.ratings.resolucaoConflitos) / 2);
  
  return {
    style: conflictScore > 4 ? 'collaborative' : 
           conflictScore > 3 ? 'compromising' : 
           conflictScore > 2 ? 'avoiding' : 'confrontational',
    effectiveness: conflictScore,
    patterns: determineConflictPatterns(assessment1, assessment2)
  };
};

const determineConflictPatterns = (assessment1: DailyAssessment, assessment2: DailyAssessment): string[] => {
  const patterns: string[] = [];
  
  if (Math.abs(assessment1.ratings.resolucaoConflitos - assessment2.ratings.resolucaoConflitos) > 2) {
    patterns.push('Percepção divergente sobre resolução de conflitos');
  }
  
  if (assessment1.ratings.comunicacao < 3 && assessment2.ratings.comunicacao < 3) {
    patterns.push('Dificuldade mútua na comunicação durante conflitos');
  }
  
  return patterns;
};

export const determineRelationshipStage = (
  averages: CategoryAverages,
  discrepancies: DiscrepancyResult[]
): RelationshipStage => {
  const overallScore = (Object.values(averages) as number[]).reduce((sum, score) => sum + score, 0) / 6;
  const hasHighDiscrepancies = discrepancies.some(d => d.significance === 'high');

  let stage: RelationshipStage = {
    current: '',
    challenges: [],
    opportunities: [],
    nextStage: ''
  };

  if (overallScore > 4 && !hasHighDiscrepancies) {
    stage = {
      current: 'Consolidação',
      challenges: ['Manter o crescimento', 'Evitar acomodação'],
      opportunities: ['Aprofundar intimidade', 'Planejar futuro conjunto'],
      nextStage: 'Expansão'
    };
  } else if (overallScore > 3) {
    stage = {
      current: 'Desenvolvimento',
      challenges: ['Alinhar expectativas', 'Gerenciar diferenças'],
      opportunities: ['Fortalecer comunicação', 'Construir confiança'],
      nextStage: 'Consolidação'
    };
  } else {
    stage = {
      current: 'Ajuste',
      challenges: ['Estabelecer padrões saudáveis', 'Superar inseguranças'],
      opportunities: ['Desenvolver entendimento mútuo', 'Criar base segura'],
      nextStage: 'Desenvolvimento'
    };
  }

  return stage;
};

export const identifyGrowthAreas = (
  averages: CategoryAverages,
  discrepancies: DiscrepancyResult[]
): string[] => {
  const areas: string[] = [];

  (Object.entries(averages) as [string, number][]).forEach(([category, score]) => {
    if (score < 3) {
      areas.push(`Desenvolvimento em ${category}`);
    }
  });

  discrepancies
    .filter(d => d.significance === 'high')
    .forEach(d => {
      areas.push(`Alinhamento em ${d.category}`);
    });

  return areas;
};

export const analyzeRelationshipStrengths = (averages: CategoryAverages): string[] => {
  return (Object.entries(averages) as [string, number][])
    .filter(([_, score]) => score >= 4)
    .map(([category, score]) => {
      const strength = `${category} (${score.toFixed(1)}/5)`;
      return strength;
    });
};

export const analyzeEmotionalDynamics = (
  averages: CategoryAverages,
  assessment1: DailyAssessment,
  assessment2: DailyAssessment
): EmotionalDynamics => {
  return {
    emotionalSecurity: calculateEmotionalSecurity(averages),
    intimacyBalance: analyzeIntimacyBalance(averages),
    conflictResolution: analyzeConflictStyle(assessment1, assessment2)
  };
}; 