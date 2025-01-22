export {};
import { DailyAssessment, CategoryRatings } from '../../types';

const createDefaultCategoryRatings = (): CategoryRatings => ({
  satisfacaoGeral: 0,
  alinhamentoObjetivos: 0,
  conexaoEmocional: 0,
  apoioMutuo: 0,
  comunicacao: 0,
  resolucaoConflitos: 0,
  intimidade: 0,
  autocuidado: 0,
  gratidao: 0,
  transparenciaConfianca: 0,
  intimidadeFisica: 0,
  saudeMental: 0,
  segurancaRelacionamento: 0,
  qualidadeTempo: 0
});

export const createDefaultDailyAssessment = (userId: string): DailyAssessment => ({
  id: `default_${new Date().getTime()}`,
  userId,
  partnerId: '',
  date: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  type: 'individual',
  ratings: createDefaultCategoryRatings(),
  emotionalSecurity: 0,
  intimacy: 0,
  communication: 0,
  trust: 0,
  mood: { primary: 'neutral', intensity: 0 },
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
  }
}); 