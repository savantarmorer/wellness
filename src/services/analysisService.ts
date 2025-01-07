import { 
  ComprehensiveAnalysis, 
  DailyAssessment, 
  MoodEntry, 
  AssessmentData,
  MoodType 
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

export const generateAnalysisFromAssessment = async (
  userId: string,
  partnerId: string,
  userAssessment: AssessmentData,
  partnerAssessment: AssessmentData
): Promise<ComprehensiveAnalysis> => {
  try {
    // Convert AssessmentData to DailyAssessment
    const userDailyAssessment: DailyAssessment = {
      id: `${userId}-${Date.now()}`,
      userId,
      partnerId,
      date: new Date().toISOString(),
      type: 'individual',
      comments: '',
      gratitude: '',
      createdAt: new Date().toISOString(),
      ratings: {
        comunicacao: userAssessment.ratings.comunicacao,
        conexaoEmocional: userAssessment.ratings.conexaoEmocional,
        apoioMutuo: userAssessment.ratings.apoioMutuo,
        transparenciaConfianca: userAssessment.ratings.transparenciaConfianca,
        satisfacaoGeral: userAssessment.ratings.satisfacaoGeral,
        intimidadeFisica: userAssessment.ratings.intimidadeFisica,
        saudeMental: userAssessment.ratings.saudeMental,
        resolucaoConflitos: userAssessment.ratings.resolucaoConflitos,
        segurancaRelacionamento: userAssessment.ratings.segurancaRelacionamento,
        autocuidado: userAssessment.ratings.autocuidado,
        gratidao: userAssessment.ratings.gratidao,
        qualidadeTempo: userAssessment.ratings.qualidadeTempo,
        intimidade: userAssessment.ratings.intimidadeFisica,
        alinhamentoObjetivos: userAssessment.ratings.alinhamentoObjetivos || 0
      },
      mood: {
        primary: userAssessment.mood?.primary || 'neutral' as MoodType,
        intensity: userAssessment.mood?.intensity || 0,
        notes: userAssessment.mood?.notes
      },
      validatedScales: {
        das: {
          total: 0,
          consenso: 0,
          satisfacao: 0,
          coesao: 0,
          expressaoAfetiva: 0
        },
        gottman: {
          fourHorsemen: [],
          bidsForConnection: 0,
          reparacao: 0,
          influenciaPositiva: 0
        }
      },
      metadata: {
        assessmentCount: 1,
        timeSpan: '1d',
        confidence: 0.8,
        lastUpdate: new Date().toISOString()
      }
    };

    const partnerDailyAssessment: DailyAssessment = {
      id: `${partnerId}-${Date.now()}`,
      userId: partnerId,
      partnerId: userId,
      date: new Date().toISOString(),
      type: 'individual',
      comments: '',
      gratitude: '',
      createdAt: new Date().toISOString(),
      ratings: {
        comunicacao: partnerAssessment.ratings.comunicacao,
        conexaoEmocional: partnerAssessment.ratings.conexaoEmocional,
        apoioMutuo: partnerAssessment.ratings.apoioMutuo,
        transparenciaConfianca: partnerAssessment.ratings.transparenciaConfianca,
        satisfacaoGeral: partnerAssessment.ratings.satisfacaoGeral,
        intimidadeFisica: partnerAssessment.ratings.intimidadeFisica,
        saudeMental: partnerAssessment.ratings.saudeMental,
        resolucaoConflitos: partnerAssessment.ratings.resolucaoConflitos,
        segurancaRelacionamento: partnerAssessment.ratings.segurancaRelacionamento,
        autocuidado: partnerAssessment.ratings.autocuidado,
        gratidao: partnerAssessment.ratings.gratidao,
        qualidadeTempo: partnerAssessment.ratings.qualidadeTempo,
        intimidade: partnerAssessment.ratings.intimidadeFisica,
        alinhamentoObjetivos: partnerAssessment.ratings.alinhamentoObjetivos || 0
      },
      mood: {
        primary: partnerAssessment.mood?.primary || 'neutral' as MoodType,
        intensity: partnerAssessment.mood?.intensity || 0,
        notes: partnerAssessment.mood?.notes
      },
      validatedScales: {
        das: {
          total: 0,
          consenso: 0,
          satisfacao: 0,
          coesao: 0,
          expressaoAfetiva: 0
        },
        gottman: {
          fourHorsemen: [],
          bidsForConnection: 0,
          reparacao: 0,
          influenciaPositiva: 0
        }
      },
      metadata: {
        assessmentCount: 1,
        timeSpan: '1d',
        confidence: 0.8,
        lastUpdate: new Date().toISOString()
      }
    };

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
        assessments: [userDailyAssessment, partnerDailyAssessment],
        consensusForms: [],
        moodEntries: [...userMoodEntries, ...partnerMoodEntries]
      }
    );

    return analysis;
  } catch (error) {
    console.error('[generateAnalysisFromAssessment] Error:', error);
    throw error;
  }
}; 