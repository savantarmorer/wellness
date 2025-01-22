import {
  analyzeAttachmentStyle,
  analyzeCommunicationPatterns,
  calculateEmotionalSecurity,
  analyzeIntimacyBalance,
  analyzeConflictStyle,
  identifyGrowthAreas,
  analyzeRelationshipStrengths
} from '../psychologicalAnalysisService';
import { CategoryAverages, DiscrepancyResult } from '../analysisUtils';
import { DailyAssessment } from '../../types';

describe('psychologicalAnalysisService', () => {
  describe('analyzeAttachmentStyle', () => {
    const mockAverages: CategoryAverages = {
      satisfaction: 4.5,
      consensus: 4.2,
      affection: 4.3,
      cohesion: 4.1,
      conflict: 4.0,
      general: 4.2
    };

    const mockDiscrepancies: DiscrepancyResult[] = [
      { category: 'satisfaction', difference: 0.5, significance: 'low', pattern: null },
      { category: 'consensus', difference: 0.3, significance: 'low', pattern: null }
    ];

    test('should identify secure attachment style with high scores', () => {
      const result = analyzeAttachmentStyle(mockAverages, mockDiscrepancies);
      expect(result.primary).toBe('secure');
      expect(result.recommendations).toHaveLength(3);
    });

    test('should identify anxious attachment style with high discrepancies', () => {
      const highDiscrepancies: DiscrepancyResult[] = Array(4).fill({
        category: 'satisfaction',
        difference: 2.5,
        significance: 'high',
        pattern: null
      });
      const result = analyzeAttachmentStyle(mockAverages, highDiscrepancies);
      expect(result.primary).toBe('anxious');
    });

    test('should identify avoidant attachment style with low intimacy scores', () => {
      const lowIntimacyAverages: CategoryAverages = {
        ...mockAverages,
        affection: 2.5,
        cohesion: 2.5
      };
      const result = analyzeAttachmentStyle(lowIntimacyAverages, mockDiscrepancies);
      expect(result.primary).toBe('avoidant');
    });
  });

  describe('analyzeCommunicationPatterns', () => {
    const mockAssessment1: DailyAssessment = {
      id: '1',
      userId: 'user1',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      ratings: {
        comunicacao: 4.5,
        resolucaoConflitos: 4.2,
        conexaoEmocional: 4.0,
        apoioMutuo: 4.0,
        transparenciaConfianca: 4.0,
        intimidadeFisica: 4.0,
        saudeMental: 4.0,
        segurancaRelacionamento: 4.0,
        alinhamentoObjetivos: 4.0,
        satisfacaoGeral: 4.0,
        autocuidado: 4.0,
        gratidao: 4.0,
        qualidadeTempo: 4.0
      },
      comments: '',
      gratitude: ''
    };

    const mockAssessment2: DailyAssessment = {
      ...mockAssessment1,
      id: '2',
      userId: 'user2'
    };

    test('should identify assertive communication pattern with high scores', () => {
      const result = analyzeCommunicationPatterns(mockAssessment1, mockAssessment2);
      expect(result.style).toBe('assertive');
      expect(result.strengths).toContain('Comunicação clara e direta');
    });

    test('should identify passive communication pattern with low communication and high conflict scores', () => {
      const lowCommAssessment1 = {
        ...mockAssessment1,
        ratings: { ...mockAssessment1.ratings, comunicacao: 2.5 }
      };
      const lowCommAssessment2 = {
        ...mockAssessment2,
        ratings: { ...mockAssessment2.ratings, comunicacao: 2.5 }
      };
      const result = analyzeCommunicationPatterns(lowCommAssessment1, lowCommAssessment2);
      expect(result.style).toBe('passive');
    });
  });

  describe('calculateEmotionalSecurity', () => {
    test('should calculate emotional security score correctly', () => {
      const mockAverages: CategoryAverages = {
        satisfaction: 4.5,
        affection: 4.3,
        consensus: 4.2,
        cohesion: 4.1,
        conflict: 4.0,
        general: 4.2
      };
      const result = calculateEmotionalSecurity(mockAverages);
      expect(result).toBeLessThanOrEqual(5);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('analyzeIntimacyBalance', () => {
    test('should analyze intimacy balance correctly', () => {
      const mockAverages: CategoryAverages = {
        satisfaction: 4.5,
        affection: 4.3,
        consensus: 4.2,
        cohesion: 4.1,
        conflict: 4.0,
        general: 4.2
      };
      const result = analyzeIntimacyBalance(mockAverages);
      expect(result.score).toBeLessThanOrEqual(5);
      expect(result.areas).toHaveProperty('emotional');
      expect(result.areas).toHaveProperty('physical');
      expect(result.areas).toHaveProperty('intellectual');
      expect(result.areas).toHaveProperty('shared');
    });
  });

  describe('analyzeConflictStyle', () => {
    const mockAssessment1: DailyAssessment = {
      id: '1',
      userId: 'user1',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      ratings: {
        comunicacao: 4.5,
        resolucaoConflitos: 4.2,
        conexaoEmocional: 4.0,
        apoioMutuo: 4.0,
        transparenciaConfianca: 4.0,
        intimidadeFisica: 4.0,
        saudeMental: 4.0,
        segurancaRelacionamento: 4.0,
        alinhamentoObjetivos: 4.0,
        satisfacaoGeral: 4.0,
        autocuidado: 4.0,
        gratidao: 4.0,
        qualidadeTempo: 4.0
      },
      comments: '',
      gratitude: ''
    };

    test('should identify collaborative conflict style with high scores', () => {
      const result = analyzeConflictStyle(mockAssessment1, mockAssessment1);
      expect(result.style).toBe('collaborative');
      expect(result.effectiveness).toBeGreaterThan(4);
    });

    test('should identify patterns when there are significant differences', () => {
      const assessment2 = {
        ...mockAssessment1,
        ratings: {
          ...mockAssessment1.ratings,
          resolucaoConflitos: 2.0,
          comunicacao: 2.0
        }
      };
      const result = analyzeConflictStyle(mockAssessment1, assessment2);
      expect(result.patterns).toContain('Percepção divergente sobre resolução de conflitos');
    });
  });

  describe('identifyGrowthAreas', () => {
    test('should identify areas needing improvement', () => {
      const mockAverages: CategoryAverages = {
        satisfaction: 2.5,
        affection: 4.3,
        consensus: 2.8,
        cohesion: 4.1,
        conflict: 4.0,
        general: 4.2
      };
      const mockDiscrepancies: DiscrepancyResult[] = [
        { category: 'satisfaction', difference: 2.5, significance: 'high', pattern: null }
      ];
      const result = identifyGrowthAreas(mockAverages, mockDiscrepancies);
      expect(result).toContain('Desenvolvimento em satisfaction');
      expect(result).toContain('Desenvolvimento em consensus');
    });
  });

  describe('analyzeRelationshipStrengths', () => {
    test('should identify high-scoring areas as strengths', () => {
      const mockAverages: CategoryAverages = {
        satisfaction: 4.5,
        affection: 4.3,
        consensus: 3.2,
        cohesion: 4.1,
        conflict: 4.0,
        general: 4.2
      };
      const result = analyzeRelationshipStrengths(mockAverages);
      expect(result).toContain('satisfaction (4.5/5)');
      expect(result).toContain('affection (4.3/5)');
      expect(result).not.toContain('consensus');
    });
  });
}); 