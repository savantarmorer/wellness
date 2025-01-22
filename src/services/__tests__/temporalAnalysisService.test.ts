import {
  analyzeTrends,
  identifyPatterns,
  detectCyclicalBehaviors
} from '../temporalAnalysisService';
import { DailyAssessment } from '../../types';

describe('temporalAnalysisService', () => {
  const generateMockAssessments = (
    count: number,
    baseScore: number,
    trend: 'improving' | 'declining' | 'stable' = 'stable'
  ): DailyAssessment[] => {
    return Array(count).fill(null).map((_, index) => {
      let score = baseScore;
      if (trend === 'improving') {
        score += index * 0.2;
      } else if (trend === 'declining') {
        score -= index * 0.2;
      }
      score = Math.min(5, Math.max(1, score));

      return {
        id: `test-${index}`,
        userId: 'user1',
        date: new Date(2024, 0, index + 1).toISOString(),
        createdAt: new Date(2024, 0, index + 1).toISOString(),
        ratings: {
          comunicacao: score,
          resolucaoConflitos: score,
          conexaoEmocional: score,
          apoioMutuo: score,
          transparenciaConfianca: score,
          intimidadeFisica: score,
          saudeMental: score,
          segurancaRelacionamento: score,
          alinhamentoObjetivos: score,
          satisfacaoGeral: score,
          autocuidado: score,
          gratidao: score,
          qualidadeTempo: score
        },
        comments: '',
        gratitude: ''
      };
    });
  };

  describe('analyzeTrends', () => {
    test('should identify improving trends', () => {
      const userHistory = generateMockAssessments(10, 3, 'improving');
      const partnerHistory = generateMockAssessments(10, 3, 'improving');
      
      const trends = analyzeTrends(userHistory, partnerHistory);
      
      Object.values(trends).forEach(trend => {
        expect(trend.direction).toBe('improving');
        expect(trend.magnitude).toBeGreaterThan(0);
        expect(trend.confidence).toBeGreaterThan(0);
        expect(trend.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should identify declining trends', () => {
      const userHistory = generateMockAssessments(10, 4, 'declining');
      const partnerHistory = generateMockAssessments(10, 4, 'declining');
      
      const trends = analyzeTrends(userHistory, partnerHistory);
      
      Object.values(trends).forEach(trend => {
        expect(trend.direction).toBe('declining');
        expect(trend.magnitude).toBeGreaterThan(0);
      });
    });

    test('should identify stable trends', () => {
      const userHistory = generateMockAssessments(10, 3.5, 'stable');
      const partnerHistory = generateMockAssessments(10, 3.5, 'stable');
      
      const trends = analyzeTrends(userHistory, partnerHistory);
      
      Object.values(trends).forEach(trend => {
        expect(trend.direction).toBe('stable');
        expect(trend.magnitude).toBeLessThanOrEqual(0.5);
      });
    });
  });

  describe('identifyPatterns', () => {
    test('should identify cyclic patterns', () => {
      const cyclicAssessments = Array(14).fill(null).map((_, index) => ({
        ...generateMockAssessments(1, 3 + Math.sin(index * Math.PI / 7) * 0.5)[0],
        id: `cyclic-${index}`
      }));
      
      const patterns = identifyPatterns(cyclicAssessments, cyclicAssessments);
      
      expect(patterns.some(p => p.type === 'cyclic')).toBe(true);
      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('description');
        expect(pattern).toHaveProperty('significance');
        if (pattern.type === 'cyclic') {
          expect(pattern).toHaveProperty('period');
        }
      });
    });

    test('should identify progressive patterns', () => {
      const userHistory = generateMockAssessments(10, 3, 'improving');
      const partnerHistory = generateMockAssessments(10, 3, 'improving');
      
      const patterns = identifyPatterns(userHistory, partnerHistory);
      
      expect(patterns.some(p => p.type === 'progressive')).toBe(true);
    });

    test('should identify reactive patterns', () => {
      const userHistory = generateMockAssessments(10, 3);
      const partnerHistory = userHistory.map(assessment => ({
        ...assessment,
        ratings: {
          ...assessment.ratings,
          comunicacao: Math.min(5, assessment.ratings.comunicacao + 1)
        }
      }));
      
      const patterns = identifyPatterns(userHistory, partnerHistory);
      
      expect(patterns.some(p => p.type === 'reactive')).toBe(true);
    });
  });

  describe('detectCyclicalBehaviors', () => {
    test('should detect weekly cycles', () => {
      const weeklyPattern = Array(28).fill(null).map((_, index) => ({
        ...generateMockAssessments(1, 3 + Math.sin(index * Math.PI / 7) * 0.5)[0],
        id: `weekly-${index}`
      }));
      
      const behaviors = detectCyclicalBehaviors(weeklyPattern, weeklyPattern);
      
      behaviors.forEach(behavior => {
        expect(behavior).toHaveProperty('category');
        expect(behavior).toHaveProperty('cycle');
        expect(behavior.cycle).toHaveProperty('period');
        expect(behavior.cycle).toHaveProperty('amplitude');
        expect(behavior.cycle).toHaveProperty('phase');
        expect(behavior).toHaveProperty('description');
      });
    });

    test('should detect monthly cycles', () => {
      const monthlyPattern = Array(90).fill(null).map((_, index) => ({
        ...generateMockAssessments(1, 3 + Math.sin(index * Math.PI / 30) * 1.5)[0],
        id: `monthly-${index}`,
        comments: index % 30 === 0 ? 'Monthly peak' : ''
      }));
      
      const behaviors = detectCyclicalBehaviors(monthlyPattern, monthlyPattern);
      
      expect(behaviors.some(b => b.cycle.period >= 28 && b.cycle.period <= 31)).toBe(true);
    });

    test('should include relevant triggers when detected', () => {
      const cyclicAssessments = Array(30).fill(null).map((_, index) => ({
        ...generateMockAssessments(1, 3 + Math.sin(index * Math.PI / 7) * 1.0)[0],
        id: `trigger-${index}`,
        comments: index % 7 === 0 ? 'Stress at work' : ''
      }));
      
      const behaviors = detectCyclicalBehaviors(cyclicAssessments, cyclicAssessments);
      
      expect(behaviors.some(b => b.triggers && b.triggers.length > 0)).toBe(true);
    });
  });
}); 