import {
  calculateAverageScores,
  analyzeDiscrepancies,
  calculateTrend,
  analyzeConvergence,
  calculateVolatility,
  average,
  detectConsistentDiscrepancy,
  detectNewInteractionPattern
} from '../analysisUtils';
import { DailyAssessment, MoodType } from '../../types';

describe('analysisUtils', () => {
  const createMockAssessment = (scores: Record<string, number>): DailyAssessment => ({
    id: 'test-id',
    userId: 'test-user',
    partnerId: 'test-partner',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    type: 'individual',
    mood: {
      primary: 'neutral' as MoodType,
      intensity: 0,
      notes: ''
    },
    ratings: {
      comunicacao: scores.comunicacao || 0,
      resolucaoConflitos: scores.resolucaoConflitos || 0,
      conexaoEmocional: scores.conexaoEmocional || 0,
      apoioMutuo: scores.apoioMutuo || 0,
      transparenciaConfianca: scores.transparenciaConfianca || 0,
      intimidadeFisica: scores.intimidadeFisica || 0,
      saudeMental: scores.saudeMental || 0,
      segurancaRelacionamento: scores.segurancaRelacionamento || 0,
      satisfacaoGeral: scores.satisfacaoGeral || 0,
      alinhamentoObjetivos: scores.alinhamentoObjetivos || 0,
      qualidadeTempo: scores.qualidadeTempo || 0,
      intimidade: scores.intimidade || 0,
      autocuidado: scores.autocuidado || 0,
      gratidao: scores.gratidao || 0
    },
    comments: '',
    gratitude: '',
    validatedScales: {
      das: {
        total: 0,
        consenso: 0,
        satisfacao: 0,
        coesao: 0,
        expressaoAfetiva: 0
      }
    },
    metadata: {
      assessmentCount: 1,
      timeSpan: '1 day',
      confidence: 0.8,
      lastUpdate: new Date().toISOString()
    }
  });

  describe('calculateAverageScores', () => {
    test('should calculate correct averages from user and partner history', () => {
      const userHistory = [
        createMockAssessment({ comunicacao: 4, resolucaoConflitos: 5 }),
        createMockAssessment({ comunicacao: 5, resolucaoConflitos: 4 })
      ];
      const partnerHistory = [
        createMockAssessment({ comunicacao: 3, resolucaoConflitos: 4 }),
        createMockAssessment({ comunicacao: 4, resolucaoConflitos: 3 })
      ];

      const averages = calculateAverageScores(userHistory, partnerHistory);
      
      expect(averages.satisfaction).toBeDefined();
      expect(averages.consensus).toBeDefined();
      expect(averages.affection).toBeDefined();
      expect(averages.cohesion).toBeDefined();
      expect(averages.conflict).toBeDefined();
      expect(averages.general).toBeDefined();
    });

    test('should handle empty histories', () => {
      const averages = calculateAverageScores([], []);
      expect(Object.values(averages).every(v => !isNaN(v))).toBe(true);
    });
  });

  describe('analyzeDiscrepancies', () => {
    test('should identify high discrepancies', () => {
      const userHistory = [
        createMockAssessment({
          comunicacao: 5,
          resolucaoConflitos: 5,
          conexaoEmocional: 5,
          apoioMutuo: 5,
          transparenciaConfianca: 5,
          intimidadeFisica: 5,
          saudeMental: 5,
          segurancaRelacionamento: 5,
          alinhamentoObjetivos: 5,
          satisfacaoGeral: 5,
          autocuidado: 5,
          gratidao: 5,
          qualidadeTempo: 5
        })
      ];
      const partnerHistory = [
        createMockAssessment({
          comunicacao: 1,
          resolucaoConflitos: 1,
          conexaoEmocional: 1,
          apoioMutuo: 1,
          transparenciaConfianca: 1,
          intimidadeFisica: 1,
          saudeMental: 1,
          segurancaRelacionamento: 1,
          alinhamentoObjetivos: 1,
          satisfacaoGeral: 1,
          autocuidado: 1,
          gratidao: 1,
          qualidadeTempo: 1
        })
      ];

      const discrepancies = analyzeDiscrepancies(userHistory, partnerHistory);
      
      discrepancies.forEach(d => {
        expect(d.significance).toBe('high');
        expect(d.difference).toBeGreaterThan(2);
      });
    });

    test('should identify low discrepancies', () => {
      const userHistory = [createMockAssessment({ comunicacao: 4, resolucaoConflitos: 4 })];
      const partnerHistory = [createMockAssessment({ comunicacao: 3.5, resolucaoConflitos: 3.5 })];

      const discrepancies = analyzeDiscrepancies(userHistory, partnerHistory);
      
      discrepancies.forEach(d => {
        expect(d.significance).toBe('low');
        expect(d.difference).toBeLessThan(1);
      });
    });
  });

  describe('calculateTrend', () => {
    test('should identify improving trend', () => {
      const scores = [3, 3.2, 3.4, 3.6, 3.8, 4];
      expect(calculateTrend(scores)).toBe('improving');
    });

    test('should identify declining trend', () => {
      const scores = [4, 3.8, 3.6, 3.4, 3.2, 3];
      expect(calculateTrend(scores)).toBe('declining');
    });

    test('should identify stable trend', () => {
      const scores = [3.5, 3.4, 3.6, 3.5, 3.4, 3.5];
      expect(calculateTrend(scores)).toBe('stable');
    });

    test('should handle insufficient data', () => {
      expect(calculateTrend([3.5])).toBe('stable');
    });
  });

  describe('analyzeConvergence', () => {
    test('should identify converging scores', () => {
      const userScores = [4, 3.8, 3.6];
      const partnerScores = [3, 3.2, 3.4];
      expect(analyzeConvergence(userScores, partnerScores)).toBe('converging');
    });

    test('should identify diverging scores', () => {
      const userScores = [3.5, 3.7, 4];
      const partnerScores = [3.5, 3.3, 3];
      expect(analyzeConvergence(userScores, partnerScores)).toBe('diverging');
    });

    test('should identify stable relationship', () => {
      const userScores = [3.5, 3.5, 3.5];
      const partnerScores = [3.5, 3.5, 3.5];
      expect(analyzeConvergence(userScores, partnerScores)).toBe('stable');
    });
  });

  describe('calculateVolatility', () => {
    test('should calculate high volatility', () => {
      const scores = [1, 5, 1, 5, 1, 5];
      const volatility = calculateVolatility(scores);
      expect(volatility).toBeGreaterThan(1.5);
    });

    test('should calculate low volatility', () => {
      const scores = [3, 3.1, 2.9, 3, 3.1, 2.9];
      const volatility = calculateVolatility(scores);
      expect(volatility).toBeLessThan(0.5);
    });

    test('should handle insufficient data', () => {
      expect(calculateVolatility([3])).toBe(0);
    });
  });

  describe('average', () => {
    test('should calculate correct average', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
    });

    test('should cap average at 5', () => {
      expect(average([5, 5, 5, 6, 7])).toBe(5);
    });

    test('should handle empty array', () => {
      expect(average([])).toBe(0);
    });
  });

  describe('detectConsistentDiscrepancy', () => {
    test('should detect consistent positive discrepancy', () => {
      const userScores = [4, 4, 4, 4];
      const partnerScores = [2, 2, 2, 2];
      const pattern = detectConsistentDiscrepancy(userScores, partnerScores);
      expect(pattern).toContain('consistentemente mais alto');
    });

    test('should detect consistent negative discrepancy', () => {
      const userScores = [2, 2, 2, 2];
      const partnerScores = [4, 4, 4, 4];
      const pattern = detectConsistentDiscrepancy(userScores, partnerScores);
      expect(pattern).toContain('consistentemente mais baixo');
    });

    test('should detect no consistent pattern', () => {
      const userScores = [2, 4, 2, 4];
      const partnerScores = [4, 2, 4, 2];
      const pattern = detectConsistentDiscrepancy(userScores, partnerScores);
      expect(pattern).toBeNull();
    });
  });

  describe('detectNewInteractionPattern', () => {
    test('should detect positive interaction pattern', () => {
      const userScores = [4, 4, 4, 4];
      const partnerScores = [4, 4, 4, 4];
      const pattern = detectNewInteractionPattern(userScores, partnerScores);
      expect(pattern).toContain('positivo');
    });

    test('should detect negative interaction pattern', () => {
      const userScores = [2, 2, 2, 2];
      const partnerScores = [2, 2, 2, 2];
      const pattern = detectNewInteractionPattern(userScores, partnerScores);
      expect(pattern).toContain('negativo');
    });

    test('should detect mixed interaction pattern', () => {
      const userScores = [2, 4, 2, 4];
      const partnerScores = [4, 2, 4, 2];
      const pattern = detectNewInteractionPattern(userScores, partnerScores);
      expect(pattern).toContain('misto');
    });
  });
}); 