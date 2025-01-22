import { 
  ComprehensiveAnalysis, 
  DailyAssessment, 
  type MoodEntry, 
  AssessmentData,
  MoodType,
  AssessmentWithMetadata,
  ValidatedScales
} from '../types';
import { RelationshipOrchestrator } from './relationshipOrchestratorNew';
import { getRecentAssessments } from './assessmentService';
import { getUserMoodEntries } from './moodService';
import { getRelationshipContext } from './relationshipContextService';

const orchestrator = new RelationshipOrchestrator();

const isMoodType = (mood: string): mood is MoodType => {
  return [
    'feliz',
    'animado',
    'grato',
    'calmo',
    'satisfeito',
    'amado',
    'ansioso',
    'estressado',
    'triste',
    'irritado',
    'frustrado',
    'exausto',
    'confuso',
    'solitário',
    'neutral',
    'content'
  ].includes(mood);
};

const createDailyAssessment = (
  userId: string,
  partnerId: string,
  assessment: AssessmentData
): DailyAssessment => ({
  id: `${userId}-${Date.now()}`,
  userId,
  partnerId,
  date: new Date().toISOString(),
  type: 'individual',
  emotionalSecurity: 0,
  intimacy: 0,
  communication: 0,
  trust: 0,
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ratings: {
    comunicacao: assessment.ratings?.comunicacao ?? 0,
    conexaoEmocional: assessment.ratings?.conexaoEmocional ?? 0,
    apoioMutuo: assessment.ratings?.apoioMutuo ?? 0,
    transparenciaConfianca: assessment.ratings?.transparenciaConfianca ?? 0,
    satisfacaoGeral: assessment.ratings?.satisfacaoGeral ?? 0,
    intimidadeFisica: assessment.ratings?.intimidadeFisica ?? 0,
    saudeMental: assessment.ratings?.saudeMental ?? 0,
    resolucaoConflitos: assessment.ratings?.resolucaoConflitos ?? 0,
    segurancaRelacionamento: assessment.ratings?.segurancaRelacionamento ?? 0,
    autocuidado: assessment.ratings?.autocuidado ?? 0,
    gratidao: assessment.ratings?.gratidao ?? 0,
    qualidadeTempo: assessment.ratings?.qualidadeTempo ?? 0,
    intimidade: assessment.ratings?.intimidadeFisica ?? 0,
    alinhamentoObjetivos: assessment.ratings?.alinhamentoObjetivos ?? 0
  },
  mood: {
    primary: isMoodType(assessment.mood?.primary || 'neutral') 
      ? (assessment.mood?.primary || 'neutral')
      : 'neutral' as MoodType,
    intensity: assessment.mood?.intensity || 0,
    notes: assessment.mood?.notes
  },
  validatedScales: {
    das: {
      total: 0,
      consenso: 0,
      satisfacao: 0,
      coesao: 0,
      expressaoAfetiva: 0
    },
    csi: {
      total: 0,
      satisfacaoGlobal: 0,
      estabilidade: 0,
      comprometimento: 0,
      comunicacao: 0,
      gestaoConflitos: 0,
      atividadesCompartilhadas: 0
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
  context: {
    communication: {
      hadMeaningfulTalk: false,
      feltUnderstood: false,
      quality: 0,
      topics: []
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
      enjoyment: 0,
      type: []
    },
    crisis: {
      hadSignificantCrises: false,
      crisisType: 'communication',
      attemptedSolutions: false,
      solutionType: [],
      impactLevel: 'low',
      resolutionStatus: 'unresolved'
    }
  }
});

const convertToDaily = (assessment: AssessmentWithMetadata): DailyAssessment => {
  // Convert partial validated scales to full structure
  const validatedScales: ValidatedScales = {
    das: {
      total: assessment.validatedScales?.das?.total ?? 0,
      consenso: assessment.validatedScales?.das?.consenso ?? 0,
      satisfacao: assessment.validatedScales?.das?.satisfacao ?? 0,
      coesao: assessment.validatedScales?.das?.coesao ?? 0,
      expressaoAfetiva: assessment.validatedScales?.das?.expressaoAfetiva ?? 0
    },
    csi: {
      total: assessment.validatedScales?.csi?.total ?? 0,
      satisfacaoGlobal: assessment.validatedScales?.csi?.satisfacaoGlobal ?? 0,
      estabilidade: assessment.validatedScales?.csi?.estabilidade ?? 0,
      comprometimento: assessment.validatedScales?.csi?.comprometimento ?? 0,
      comunicacao: assessment.validatedScales?.csi?.comunicacao ?? 0,
      gestaoConflitos: assessment.validatedScales?.csi?.gestaoConflitos ?? 0,
      atividadesCompartilhadas: assessment.validatedScales?.csi?.atividadesCompartilhadas ?? 0
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
  };

  return {
    id: assessment.id,
    userId: assessment.userId,
    partnerId: assessment.partnerId,
    date: assessment.timestamp,
    type: 'individual',
    emotionalSecurity: 0,
    intimacy: 0,
    communication: 0,
    trust: 0,
    timestamp: assessment.timestamp,
    createdAt: assessment.timestamp,
    ratings: {
      satisfacaoGeral: assessment.ratings?.satisfacaoGeral ?? 0,
      alinhamentoObjetivos: assessment.ratings?.alinhamentoObjetivos ?? 0,
      conexaoEmocional: assessment.ratings?.conexaoEmocional ?? 0,
      apoioMutuo: assessment.ratings?.apoioMutuo ?? 0,
      segurancaRelacionamento: assessment.ratings?.segurancaRelacionamento ?? 0,
      comunicacao: assessment.ratings?.comunicacao ?? 0,
      intimidade: assessment.ratings?.intimidade ?? 0,
      resolucaoConflitos: assessment.ratings?.resolucaoConflitos ?? 0,
      transparenciaConfianca: assessment.ratings?.transparenciaConfianca ?? 0,
      intimidadeFisica: assessment.ratings?.intimidadeFisica ?? 0,
      saudeMental: assessment.ratings?.saudeMental ?? 0,
      autocuidado: assessment.ratings?.autocuidado ?? 0,
      gratidao: assessment.ratings?.gratidao ?? 0,
      qualidadeTempo: assessment.ratings?.qualidadeTempo ?? 0
    },
    mood: assessment.mood ?? { primary: 'neutral' as MoodType, intensity: 0 },
    validatedScales,
    context: {
      communication: {
        hadMeaningfulTalk: false,
        feltUnderstood: false,
        quality: 0,
        topics: []
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
        enjoyment: 0,
        type: []
      },
      crisis: {
        hadSignificantCrises: false,
        crisisType: 'communication',
        attemptedSolutions: false,
        solutionType: [],
        impactLevel: 'low',
        resolutionStatus: 'unresolved'
      }
    }
  };
};

export const generateAnalysisFromAssessment = async (
  userId: string,
  partnerId: string,
  userAssessment: AssessmentData,
  partnerAssessment: AssessmentData
): Promise<ComprehensiveAnalysis> => {
  try {
    // Convert AssessmentData to DailyAssessment
    const userDailyAssessment = createDailyAssessment(userId, partnerId, userAssessment);
    const partnerDailyAssessment = createDailyAssessment(partnerId, userId, partnerAssessment);

    // Get historical data
    const [historicalAssessments, userMoodEntries, partnerMoodEntries, context] = await Promise.all([
      getRecentAssessments(userId, partnerId),
      getUserMoodEntries(userId),
      getUserMoodEntries(partnerId),
      getRelationshipContext(userId)
    ]);

    if (!context) {
      throw new Error('Relationship context not found');
    }

    // Generate comprehensive analysis
    const analysis = await orchestrator.generateComprehensiveAnalysis(
      userId,
      context,
      {
        assessments: [...historicalAssessments.map(convertToDaily), userDailyAssessment, partnerDailyAssessment],
        consensusForms: [],
        moodEntries: [...userMoodEntries, ...partnerMoodEntries]
      }
    );

    if (!analysis.success) {
      throw new Error(analysis.error?.message || 'Failed to generate analysis');
    }

    if (!analysis.data) {
      throw new Error('Analysis data is undefined');
    }

    return analysis.data;
  } catch (error) {
    console.error('[generateAnalysisFromAssessment] Error:', error);
    throw error;
  }
}; 