import { analyzeDiscrepancies } from '../insightService';
import { CategoryRatings } from '../../types';

jest.mock('../openaiClient', () => ({
  callOpenAI: jest.fn().mockResolvedValue({
    choices: [{
      message: {
        content: 'Mocked GPT commentary'
      }
    }]
  })
}));

describe('insightService', () => {
  describe('analyzeDiscrepancies', () => {
    const mockUserRatings: CategoryRatings = {
      comunicacao: 4,
      resolucaoConflitos: 5,
      conexaoEmocional: 4,
      apoioMutuo: 4,
      transparenciaConfianca: 4,
      intimidadeFisica: 4,
      saudeMental: 4,
      segurancaRelacionamento: 4,
      alinhamentoObjetivos: 4,
      satisfacaoGeral: 4,
      autocuidado: 4,
      gratidao: 4,
      qualidadeTempo: 4
    };

    const mockPartnerRatings: CategoryRatings = {
      comunicacao: 2,
      resolucaoConflitos: 2,
      conexaoEmocional: 4,
      apoioMutuo: 4,
      transparenciaConfianca: 4,
      intimidadeFisica: 4,
      saudeMental: 4,
      segurancaRelacionamento: 4,
      alinhamentoObjetivos: 4,
      satisfacaoGeral: 4,
      autocuidado: 4,
      gratidao: 4,
      qualidadeTempo: 4
    };

    test('should identify high discrepancies correctly', async () => {
      const discrepancies = await analyzeDiscrepancies(mockUserRatings, mockPartnerRatings);
      
      const communicationDiscrepancy = discrepancies.find(d => d.category === 'comunicacao');
      expect(communicationDiscrepancy).toBeDefined();
      expect(communicationDiscrepancy?.significance).toBe('high');
      expect(communicationDiscrepancy?.difference).toBe(2);
    });

    test('should sort discrepancies by difference', async () => {
      const discrepancies = await analyzeDiscrepancies(mockUserRatings, mockPartnerRatings);
      
      const differences = discrepancies.map(d => d.difference);
      const sortedDifferences = [...differences].sort((a, b) => b - a);
      expect(differences).toEqual(sortedDifferences);
    });

    test('should include recommendations for high discrepancies', async () => {
      const discrepancies = await analyzeDiscrepancies(mockUserRatings, mockPartnerRatings);
      
      discrepancies
        .filter(d => d.significance === 'high')
        .forEach(d => {
          expect(d.recommendation).toBeDefined();
          expect(d.recommendation.length).toBeGreaterThan(0);
        });
    });

    test('should include GPT commentary for discrepancies', async () => {
      const discrepancies = await analyzeDiscrepancies(mockUserRatings, mockPartnerRatings);
      
      discrepancies.forEach(d => {
        expect(d.gptCommentary).toBeDefined();
        expect(d.gptCommentary).toBe('Mocked GPT commentary');
      });
    });

    test('should handle no discrepancies', async () => {
      const sameRatings: CategoryRatings = { ...mockUserRatings };
      const discrepancies = await analyzeDiscrepancies(sameRatings, sameRatings);
      
      expect(discrepancies).toHaveLength(0);
    });

    test('should handle missing categories', async () => {
      const partialUserRatings = {
        comunicacao: 4,
        resolucaoConflitos: 5
      };
      const partialPartnerRatings = {
        comunicacao: 2,
        resolucaoConflitos: 2
      };
      
      const discrepancies = await analyzeDiscrepancies(
        partialUserRatings as CategoryRatings,
        partialPartnerRatings as CategoryRatings
      );
      
      expect(discrepancies.length).toBeGreaterThan(0);
      discrepancies.forEach(d => {
        expect(['comunicacao', 'resolucaoConflitos']).toContain(d.category);
      });
    });

    test('should handle extreme rating differences', async () => {
      const extremeUserRatings = { ...mockUserRatings, comunicacao: 5 };
      const extremePartnerRatings = { ...mockPartnerRatings, comunicacao: 1 };
      
      const discrepancies = await analyzeDiscrepancies(extremeUserRatings, extremePartnerRatings);
      
      const communicationDiscrepancy = discrepancies.find(d => d.category === 'comunicacao');
      expect(communicationDiscrepancy?.significance).toBe('high');
      expect(communicationDiscrepancy?.difference).toBe(4);
    });

    test('should provide appropriate recommendations based on significance', async () => {
      const mixedUserRatings = {
        ...mockUserRatings,
        comunicacao: 5, // High discrepancy
        resolucaoConflitos: 4, // Medium discrepancy
        conexaoEmocional: 3.5 // Low discrepancy
      };
      
      const mixedPartnerRatings = {
        ...mockPartnerRatings,
        comunicacao: 1, // High discrepancy
        resolucaoConflitos: 2, // Medium discrepancy
        conexaoEmocional: 3 // Low discrepancy
      };
      
      const discrepancies = await analyzeDiscrepancies(mixedUserRatings, mixedPartnerRatings);
      
      discrepancies.forEach(d => {
        expect(d.recommendation).toBeDefined();
        if (d.significance === 'high') {
          expect(d.recommendation).toContain('diferença significativa');
        } else if (d.significance === 'medium') {
          expect(d.recommendation).toContain('espaço para melhorar');
        } else {
          expect(d.recommendation).toContain('pequenos ajustes');
        }
      });
    });
  });
}); 