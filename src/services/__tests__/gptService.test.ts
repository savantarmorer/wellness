import { generateDailyInsight, generateRelationshipAnalysis } from '../gptService';
import type { DailyAssessment, RelationshipContext } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('GPT Service Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  const mockAssessment: DailyAssessment = {
    userId: 'user123',
    date: new Date().toISOString(),
    ratings: {
      comunicacao: 8,
      conexaoEmocional: 7,
      apoioMutuo: 8,
      transparenciaConfianca: 9,
      intimidadeFisica: 7,
      saudeMental: 8,
      resolucaoConflitos: 7,
      segurancaRelacionamento: 8,
      alinhamentoObjetivos: 9,
      satisfacaoGeral: 8,
      autocuidado: 7,
      gratidao: 9,
      qualidadeTempo: 8
    },
    comments: 'Tivemos um bom dia juntos',
    gratitude: 'Agradeço o apoio emocional',
    createdAt: new Date().toISOString()
  };

  const mockContext: RelationshipContext = {
    id: 'context123',
    userId: 'user123',
    partnerId: 'partner123',
    duration: '2 anos',
    status: 'Casados',
    type: 'Relacionamento sério',
    goals: ['Melhorar comunicação', 'Construir confiança'],
    challenges: ['Tempo limitado juntos', 'Estresse do trabalho'],
    values: ['Respeito', 'Honestidade'],
    relationshipDuration: '2 anos',
    relationshipStyle: 'monogamico',
    relationshipStyleOther: '',
    currentDynamics: 'Estável, com alguns desafios de comunicação',
    strengths: 'Forte conexão emocional e valores compartilhados',
    areasNeedingAttention: {
      comunicacao: true,
      confianca: false,
      intimidade: false,
      resolucaoConflitos: true,
      apoioEmocional: false,
      outros: false
    },
    areasNeedingAttentionOther: '',
    recurringProblems: 'Dificuldade em expressar sentimentos',
    appGoals: 'Melhorar comunicação e intimidade',
    hadSignificantCrises: false,
    crisisDescription: '',
    attemptedSolutions: true,
    solutionsDescription: 'Terapia de casal anterior',
    userEmotionalState: 'Geralmente estável, ocasionalmente ansioso',
    partnerEmotionalState: 'Estável, às vezes estressado com trabalho',
    timeSpentTogether: '1-3h',
    qualityTime: true,
    qualityTimeDescription: 'Jantares e conversas significativas',
    routineImpact: 'Trabalho afeta tempo juntos',
    physicalIntimacy: 'Satisfatória, mas pode melhorar',
    intimacyImprovements: 'Mais momentos de qualidade',
    additionalInfo: '',
    createdAt: new Date().toISOString()
  };

  describe('generateDailyInsight', () => {
    it('should include relationship context in the prompt', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Análise terapêutica' } }]
        })
      });

      await generateDailyInsight(mockAssessment, mockContext);

      // Get the actual call to fetch
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[1].content;

      // Verify context information is included in prompt
      expect(prompt).toContain('História e Duração: 2 anos');
      expect(prompt).toContain('Status Atual: Casados');
      expect(prompt).toContain('Natureza do Vínculo: Relacionamento sério');
      expect(prompt).toContain('Dinâmica Atual: Estável, com alguns desafios de comunicação');
      expect(prompt).toContain('Estado Emocional do Usuário: Geralmente estável, ocasionalmente ansioso');
      expect(prompt).toContain('Histórico de Crises: Não');
    });

    it('should handle missing relationship context gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Análise terapêutica' } }]
        })
      });

      await generateDailyInsight(mockAssessment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[1].content;

      // Verify prompt still works without context
      expect(prompt).not.toContain('Contexto Terapêutico do Relacionamento');
      expect(prompt).toContain('Avaliação Detalhada');
    });
  });

  describe('generateRelationshipAnalysis', () => {
    it('should include both partners assessments and context in analysis', async () => {
      const mockAnalysisResponse = {
        overallHealth: { score: 85, trend: 'up' },
        categories: {},
        strengthsAndChallenges: { strengths: [], challenges: [] },
        communicationSuggestions: [],
        actionItems: [],
        relationshipDynamics: { positivePatterns: [], concerningPatterns: [], growthAreas: [] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockAnalysisResponse) } }]
        })
      });

      await generateRelationshipAnalysis(mockAssessment, mockAssessment, mockContext);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[1].content;

      // Verify both assessments and context are included
      expect(prompt).toContain('Avaliação do Primeiro Parceiro');
      expect(prompt).toContain('Avaliação do Segundo Parceiro');
      expect(prompt).toContain('Contexto Terapêutico do Relacionamento');
      expect(prompt).toContain('Dinâmica Atual: Estável, com alguns desafios de comunicação');
      expect(prompt).toContain('Tentativas de Resolução: Sim - Terapia de casal anterior');
    });

    it('should maintain therapeutic focus in system prompt', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{}' } }]
        })
      });

      await generateRelationshipAnalysis(mockAssessment, mockAssessment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      // Verify therapeutic approaches are included
      expect(systemPrompt).toContain('Terapia Focada na Emoção (EFT)');
      expect(systemPrompt).toContain('Teoria do Apego');
      expect(systemPrompt).toContain('Análise Sistêmica de Relacionamentos');
      expect(systemPrompt).toContain('Comunicação Não-Violenta');
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await expect(generateDailyInsight(mockAssessment, mockContext))
        .rejects
        .toThrow('API Error');
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Invalid JSON' } }]
        })
      });

      await expect(generateRelationshipAnalysis(mockAssessment, mockAssessment, mockContext))
        .rejects
        .toThrow();
    });
  });
}); 