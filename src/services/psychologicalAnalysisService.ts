import { 
  DailyAssessment, 
  CommunicationPatterns, 
  DyadicAdjustmentScale, 
  GottmanMetrics,
  GottmanAssessmentData,
  AttachmentStyle as AttachmentStyleType,
  MoodType,
  ValidatedScaleAssessmentData
} from '../types';
import { CategoryAverages, DiscrepancyResult } from './analysisUtils';

interface AttachmentStyle {
  primary: AttachmentStyleType;
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
    confidence: number;
  };
  synchronicity: number;
  stability: number;
  patterns: {
    user: {
      dominant: MoodType;
      frequency: Record<MoodType, number>;
      transitions: Record<string, number>;
    };
    partner: {
      dominant: MoodType;
      frequency: Record<MoodType, number>;
      transitions: Record<string, number>;
    };
  };
  insights: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
}

export interface RelationshipStage {
  current: string;
  challenges: string[];
  opportunities: string[];
  nextStage: string;
}

interface DASAnalysis {
  overallHealth: number;
  componentAnalysis: {
    consenso: ComponentAnalysis;
    satisfacao: ComponentAnalysis;
    coesao: ComponentAnalysis;
    expressaoAfetiva: ComponentAnalysis;
  };
}

interface ComponentAnalysis {
  score: number;
  level: 'concerning' | 'moderate' | 'healthy';
  recommendations: string[];
}

interface GottmanAnalysis {
  fourHorsemenRisk: {
    total: number;
    breakdown: {
      critica: number;
      defensividade: number;
      desprezo: number;
      stonewalling: number;
    };
    riskLevel: 'low' | 'moderate' | 'high';
  };
  bidsEffectiveness: {
    responseRatio: number;
    effectiveness: 'poor' | 'fair' | 'good';
    recommendations: string[];
  };
  overallHealth: {
    score: number;
    strengths: string[];
    concerns: string[];
  };
}

export interface AttachmentAnalysis {
  style: AttachmentStyle['primary'];
  description: string;
  compatibility: {
    score: number;
    insights: string[];
  };
  recommendations: string[];
}

export const SCALE_RANGES = {
  das: {
    consenso: { concerning: { min: 0, max: 20 }, moderate: { min: 21, max: 40 }, healthy: { min: 41, max: 65 } },
    satisfacao: { concerning: { min: 0, max: 15 }, moderate: { min: 16, max: 30 }, healthy: { min: 31, max: 50 } },
    coesao: { concerning: { min: 0, max: 8 }, moderate: { min: 9, max: 16 }, healthy: { min: 17, max: 24 } },
    expressaoAfetiva: { concerning: { min: 0, max: 4 }, moderate: { min: 5, max: 8 }, healthy: { min: 9, max: 12 } }
  },
  gottman: {
    fourHorsemen: { concerning: { min: 7, max: 10 }, moderate: { min: 4, max: 6 }, healthy: { min: 0, max: 3 } },
    bidsRatio: { concerning: { min: 0, max: 0.3 }, moderate: { min: 0.31, max: 0.6 }, healthy: { min: 0.61, max: 1 } }
  }
};

const analyzeComponent = (score: number, range: typeof SCALE_RANGES.das[keyof typeof SCALE_RANGES.das]): ComponentAnalysis => {
  let level: ComponentAnalysis['level'];
  let recommendations: string[] = [];

  if (score <= range.concerning.max) {
    level = 'concerning';
    recommendations = ['Considere buscar ajuda profissional', 'Foque em melhorar a comunicação'];
  } else if (score <= range.moderate.max) {
    level = 'moderate';
    recommendations = ['Continue trabalhando no fortalecimento', 'Mantenha o diálogo aberto'];
  } else {
    level = 'healthy';
    recommendations = ['Mantenha as práticas positivas', 'Celebre os sucessos'];
  }

  return { score, level, recommendations };
};

export const analyzeDAS = (das: DyadicAdjustmentScale): DASAnalysis => {
  const componentAnalysis = {
    consenso: analyzeComponent(das.consenso, SCALE_RANGES.das.consenso),
    satisfacao: analyzeComponent(das.satisfacao, SCALE_RANGES.das.satisfacao),
    coesao: analyzeComponent(das.coesao, SCALE_RANGES.das.coesao),
    expressaoAfetiva: analyzeComponent(das.expressaoAfetiva, SCALE_RANGES.das.expressaoAfetiva)
  };

  // Calculate overall health as a weighted average
  const overallHealth = (
    (das.consenso / 65) * 0.3 +
    (das.satisfacao / 50) * 0.3 +
    (das.coesao / 24) * 0.2 +
    (das.expressaoAfetiva / 12) * 0.2
  ) * 100;

  return {
    overallHealth,
    componentAnalysis
  };
};

export const analyzeGottmanMetrics = (metrics: GottmanMetrics): GottmanAnalysis => {
  // Analyze Four Horsemen
  const fourHorsemenTotal = 
    metrics.fourHorsemen.critica +
    metrics.fourHorsemen.defensividade +
    metrics.fourHorsemen.desprezo +
    metrics.fourHorsemen.stonewalling;

  let riskLevel: GottmanAnalysis['fourHorsemenRisk']['riskLevel'];
  if (fourHorsemenTotal >= SCALE_RANGES.gottman.fourHorsemen.concerning.min) {
    riskLevel = 'high';
  } else if (fourHorsemenTotal >= SCALE_RANGES.gottman.fourHorsemen.moderate.min) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  // Analyze Bids for Connection
  const totalResponses = 
    metrics.bidsForConnection.respostasPositivas +
    metrics.bidsForConnection.respostasNegativas +
    metrics.bidsForConnection.respostasNeutras;

  const responseRatio = totalResponses > 0 
    ? metrics.bidsForConnection.respostasPositivas / totalResponses 
    : 0;

  let effectiveness: GottmanAnalysis['bidsEffectiveness']['effectiveness'];
  let recommendations: string[] = [];

  if (responseRatio <= SCALE_RANGES.gottman.bidsRatio.concerning.max) {
    effectiveness = 'poor';
    recommendations = [
      'Seu parceiro precisa prestar mais atenção às suas tentativas de conexão',
      'Seu parceiro pode melhorar suas respostas em momentos de estresse'
    ];
  } else if (responseRatio <= SCALE_RANGES.gottman.bidsRatio.moderate.max) {
    effectiveness = 'fair';
    recommendations = [
      'Seu parceiro pode melhorar o reconhecimento de suas tentativas de conexão',
      'Seu parceiro pode trabalhar em responder mais positivamente'
    ];
  } else {
    effectiveness = 'good';
    recommendations = [
      'Seu parceiro mantém um bom nível de responsividade',
      'Seu parceiro cultiva bem os momentos de conexão'
    ];
  }

  // Calculate overall health
  const overallHealth = {
    score: Math.max(0, 100 - (fourHorsemenTotal * 10)) * (responseRatio + metrics.influenciaPositiva / 10) / 2,
    strengths: [] as string[],
    concerns: [] as string[]
  };

  if (responseRatio > 0.6) {
    overallHealth.strengths.push('Alta taxa de resposta positiva do parceiro às suas tentativas de conexão');
  }
  if (fourHorsemenTotal < 4) {
    overallHealth.strengths.push('Baixa presença dos quatro cavaleiros na comunicação do parceiro');
  }
  if (metrics.influenciaPositiva > 7) {
    overallHealth.strengths.push('Forte influência positiva do parceiro no relacionamento');
  }

  if (fourHorsemenTotal > 6) {
    overallHealth.concerns.push('Alta presença dos quatro cavaleiros na comunicação do parceiro');
  }
  if (responseRatio < 0.4) {
    overallHealth.concerns.push('Baixa taxa de resposta positiva do parceiro às suas tentativas de conexão');
  }
  if (metrics.influenciaPositiva < 5) {
    overallHealth.concerns.push('Influência positiva do parceiro abaixo do ideal');
  }

  return {
    fourHorsemenRisk: {
      total: fourHorsemenTotal,
      breakdown: metrics.fourHorsemen,
      riskLevel
    },
    bidsEffectiveness: {
      responseRatio,
      effectiveness,
      recommendations
    },
    overallHealth
  };
};

export const analyzeGottmanAssessment = async (
  assessment: GottmanAssessmentData
): Promise<GottmanAnalysis> => {
  if (!assessment.validatedScales?.gottman) {
    throw new Error('Métricas de Gottman não encontradas na avaliação');
  }

  return analyzeGottmanMetrics(assessment.validatedScales.gottman);
};

export const analyzeAttachmentStyle = (
  userAssessment: DailyAssessment | ValidatedScaleAssessmentData,
  partnerAssessment: DailyAssessment | ValidatedScaleAssessmentData
): AttachmentStyle => {
  const securityScore = userAssessment.ratings.satisfacaoGeral * 0.3 + 
                     userAssessment.ratings.alinhamentoObjetivos * 0.2 + 
                     userAssessment.ratings.conexaoEmocional * 0.3 + 
                     userAssessment.ratings.apoioMutuo * 0.2;
  
  const hasHighDiscrepancies = Math.abs(
    userAssessment.ratings.satisfacaoGeral - partnerAssessment.ratings.satisfacaoGeral
  ) > 1;
  
  let style: AttachmentStyle['primary'] = 'secure';
  let description = '';
  let recommendations: string[] = [];

  if (securityScore > 4 && !hasHighDiscrepancies) {
    style = 'secure';
    description = 'Demonstra um estilo de apego seguro, com boa capacidade de intimidade e autonomia.';
    recommendations = [
      'Continue cultivando a comunicação aberta',
      'Mantenha o equilíbrio entre proximidade e independência',
      'Celebre as conquistas do relacionamento'
    ];
  } else if (securityScore < 3 && hasHighDiscrepancies) {
    style = 'anxious';
    description = 'Apresenta características de apego ansioso, com preocupação excessiva com o relacionamento.';
    recommendations = [
      'Trabalhe no desenvolvimento da autoestima',
      'Pratique autorregulação emocional',
      'Desenvolva atividades independentes'
    ];
  } else if (userAssessment.ratings.conexaoEmocional < 3 && userAssessment.ratings.apoioMutuo < 3) {
    style = 'avoidant';
    description = 'Mostra tendências evitativas, com dificuldade em manter proximidade emocional.';
    recommendations = [
      'Explore gradualmente a expressão emocional',
      'Identifique padrões de distanciamento',
      'Busque equilíbrio entre espaço pessoal e intimidade'
    ];
  } else {
    style = 'disorganized';
    description = 'Apresenta padrões mistos de apego, alternando entre diferentes estilos.';
    recommendations = [
      'Busque consistência nas interações',
      'Desenvolva estratégias de autorregulação',
      'Considere terapia individual ou de casal'
    ];
  }

  return {
    primary: style,
    description,
    recommendations
  };
};

export const analyzeCommunicationPatterns = (
  userAssessment: DailyAssessment,
  partnerAssessment: DailyAssessment
): CommunicationPatterns => {
  const communicationScore = (userAssessment.ratings.comunicacao + partnerAssessment.ratings.comunicacao) / 2;
  const conflictScore = (userAssessment.ratings.resolucaoConflitos + partnerAssessment.ratings.resolucaoConflitos) / 2;

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

  return {
    style: style,
    effectiveness: conflictScore,
    patterns: strengths.concat(challenges),
    confidence: 0.8
  };
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
    patterns: determineConflictPatterns(assessment1, assessment2),
    confidence: 0.8
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

export const identifyrecommendations = (
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
    conflictResolution: analyzeConflictStyle(assessment1, assessment2),
    synchronicity: 0.8,
    stability: 0.7,
    patterns: {
      user: {
        dominant: 'feliz' as MoodType,
        frequency: {
          feliz: 0,
          animado: 0,
          grato: 0,
          calmo: 0,
          satisfeito: 0,
          amado: 0,
          ansioso: 0,
          estressado: 0,
          triste: 0,
          irritado: 0,
          frustrado: 0,
          exausto: 0,
          confuso: 0,
          solitário: 0,
          neutral: 0,
          content: 0
        },
        transitions: {}
      },
      partner: {
        dominant: 'feliz' as MoodType,
        frequency: {
          feliz: 0,
          animado: 0,
          grato: 0,
          calmo: 0,
          satisfeito: 0,
          amado: 0,
          ansioso: 0,
          estressado: 0,
          triste: 0,
          irritado: 0,
          frustrado: 0,
          exausto: 0,
          confuso: 0,
          solitário: 0,
          neutral: 0,
          content: 0
        },
        transitions: {}
      }
    },
    insights: {
      strengths: [],
      challenges: [],
      recommendations: []
    }
  };
};

export const calculateAttachmentCompatibility = (
  userStyle: AttachmentStyle['primary'],
  partnerStyle: AttachmentStyle['primary']
): { score: number; insights: string[] } => {
  const compatibilityMap: Record<AttachmentStyle['primary'], Record<AttachmentStyle['primary'], number>> = {
    secure: { secure: 0.9, anxious: 0.7, avoidant: 0.6, disorganized: 0.5 },
    anxious: { secure: 0.7, anxious: 0.4, avoidant: 0.3, disorganized: 0.2 },
    avoidant: { secure: 0.6, anxious: 0.3, avoidant: 0.5, disorganized: 0.3 },
    disorganized: { secure: 0.5, anxious: 0.2, avoidant: 0.3, disorganized: 0.2 }
  };

  const score = compatibilityMap[userStyle][partnerStyle];
  const insights: string[] = [];

  if (userStyle === 'secure' && partnerStyle === 'secure') {
    insights.push('Alta compatibilidade com base segura mútua');
  } else if (userStyle === 'secure' || partnerStyle === 'secure') {
    insights.push('Potencial para crescimento com apoio do parceiro seguro');
  } else if (userStyle === partnerStyle) {
    insights.push('Desafios similares podem dificultar o crescimento mútuo');
  } else {
    insights.push('Diferenças nos estilos requerem atenção e trabalho conjunto');
  }

  return { score, insights };
};

export const analyzeAttachmentDynamics = (
  userAssessment: DailyAssessment | null,
  partnerAssessment: DailyAssessment | null
): { user: AttachmentStyle; partner: AttachmentStyle; compatibility: { score: number; insights: string[] } } => {
  const defaultAssessment: DailyAssessment = {
    id: `default_${new Date().getTime()}`,
    userId: '',
    partnerId: '',
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type: 'individual',
    ratings: {
      segurancaRelacionamento: 0,
      conexaoEmocional: 0,
      apoioMutuo: 0,
      transparenciaConfianca: 0,
      satisfacaoGeral: 0,
      alinhamentoObjetivos: 0,
      comunicacao: 0,
      intimidade: 0,
      resolucaoConflitos: 0,
      gestaoEmocional: 0,
      intimidadeFisica: 0,
      saudeMental: 0,
      autocuidado: 0,
      gratidao: 0,
      qualidadeTempo: 0
    },
    mood: { primary: 'neutral', intensity: 0 },
    emotionalSecurity: 0,
    intimacy: 0,
    communication: 0,
    trust: 0,
    createdAt: new Date().toISOString(),
    context: {
      communication: {
        hadMeaningfulTalk: false,
        feltUnderstood: false,
        topics: [],
        quality: 0
      },
      conflict: {
        hadConflict: false,
        resolvedSameDay: false,
        impactOnMood: 0
      },
      support: {
        neededSupport: false,
        receivedSupport: false,
        supportType: []
      },
      activities: {
        didActivity: false,
        type: [],
        enjoyment: 0
      },
      crisis: {
        hadSignificantCrises: false,
        crisisType: 'other',
        attemptedSolutions: false,
        solutionType: [],
        impactLevel: 'low',
        resolutionStatus: 'unresolved'
      }
    },
    validatedScales: {
      das: {
        consenso: 0,
        satisfacao: 0,
        coesao: 0,
        expressaoAfetiva: 0,
        total: 0
      },
      csi: {
        satisfacaoGlobal: 0,
        estabilidade: 0,
        comprometimento: 0,
        comunicacao: 0,
        gestaoConflitos: 0,
        atividadesCompartilhadas: 0,
        total: 0
      },
      gottman: {
        fourHorsemen: {
          critica: 0,
          defensividade: 0,
          desprezo: 0,
          stonewalling: 0
        },
        bidsForConnection: {
          tentativas: 0,
          respostasPositivas: 0,
          respostasNegativas: 0,
          respostasNeutras: 0
        },
        resolucaoConflitos: 0,
        significadoCompartilhado: 0,
        reparacao: 0,
        influenciaPositiva: 0
      },
      attachment: {
        ecr: {
          anxiety: 0,
          avoidance: 0
        },
        securityLevel: 0,
        attachmentStyle: 'secure'
      }
    },
    metadata: {
      assessmentCount: 0,
      timeSpan: '1 day',
      confidence: 0.5,
      lastUpdate: new Date().toISOString()
    }
  };

  const userStyle = analyzeAttachmentStyle(userAssessment || defaultAssessment, partnerAssessment || defaultAssessment);
  const partnerStyle = analyzeAttachmentStyle(partnerAssessment || defaultAssessment, userAssessment || defaultAssessment);
  
  const compatibility = calculateAttachmentCompatibility(
    userStyle.primary,
    partnerStyle.primary
  );

  return {
    user: userStyle,
    partner: partnerStyle,
    compatibility
  };
}; 