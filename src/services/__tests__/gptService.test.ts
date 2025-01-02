import {
  generateDailyInsight,
  generateRelationshipAnalysis,
  analyzeConsensusForm,
  type ConsensusFormData
} from '../gptService';
import { DailyAssessment, RelationshipContext } from '../../types';
import { callOpenAI } from '../openaiClient';

jest.mock('../openaiClient', () => ({
  callOpenAI: jest.fn()
}));

describe('gptService', () => {
  const mockDailyAssessment: DailyAssessment = {
    id: 'test-id',
    userId: 'test-user',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ratings: {
      comunicacao: 4,
      resolucaoConflitos: 4,
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
    },
    comments: 'Test comments',
    gratitude: 'Test gratitude'
  };

  const mockRelationshipContext: RelationshipContext = {
    id: 'test-context-id',
    userId: 'test-user-id',
    partnerId: 'test-partner-id',
    duration: '2 years',
    status: 'married',
    type: 'serious',
    goals: ['Improve communication', 'Build trust'],
    challenges: ['Limited time together', 'Work stress'],
    values: ['Respect', 'Honesty'],
    relationshipDuration: '2 years',
    relationshipStyle: 'monogamico',
    relationshipStyleOther: '',
    currentDynamics: 'Stable relationship with good communication',
    strengths: 'Strong emotional connection',
    areasNeedingAttention: {
      comunicacao: false,
      confianca: false,
      intimidade: false,
      resolucaoConflitos: false,
      apoioEmocional: false,
      outros: false
    },
    areasNeedingAttentionOther: '',
    recurringProblems: 'None',
    appGoals: 'Maintain and improve communication',
    hadSignificantCrises: false,
    crisisDescription: '',
    attemptedSolutions: false,
    solutionsDescription: '',
    userEmotionalState: 'Stable',
    partnerEmotionalState: 'Stable',
    timeSpentTogether: '3-5h',
    qualityTime: true,
    qualityTimeDescription: 'Regular date nights and activities',
    routineImpact: 'Positive impact on relationship',
    physicalIntimacy: 'Satisfactory',
    intimacyImprovements: 'None needed',
    additionalInfo: '',
    createdAt: new Date().toISOString()
  };

  describe('generateDailyInsight', () => {
    beforeEach(() => {
      (callOpenAI as jest.Mock).mockReset();
    });

    test('should generate daily insight successfully', async () => {
      const mockGPTResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              insight: 'Test insight',
              recommendations: ['Test recommendation'],
              focus_areas: ['Test focus area']
            })
          }
        }]
      };

      (callOpenAI as jest.Mock).mockResolvedValue(mockGPTResponse);

      const result = await generateDailyInsight(mockDailyAssessment, mockRelationshipContext);

      expect(result).toHaveProperty('insight');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('focus_areas');
    });

    test('should handle API errors gracefully', async () => {
      (callOpenAI as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(generateDailyInsight(mockDailyAssessment, mockRelationshipContext))
        .rejects.toThrow('Failed to generate daily insight');
    });

    test('should handle invalid API response format', async () => {
      const mockInvalidResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON'
          }
        }]
      };

      (callOpenAI as jest.Mock).mockResolvedValue(mockInvalidResponse);

      await expect(generateDailyInsight(mockDailyAssessment, mockRelationshipContext))
        .rejects.toThrow('Failed to parse GPT response');
    });
  });

  describe('generateRelationshipAnalysis', () => {
    beforeEach(() => {
      (callOpenAI as jest.Mock).mockReset();
    });

    test('should generate relationship analysis successfully', async () => {
      const mockGPTResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallHealth: { score: 4, trend: 'improving' },
              categories: {},
              strengthsAndChallenges: {
                strengths: ['Test strength'],
                challenges: ['Test challenge']
              },
              communicationSuggestions: ['Test suggestion'],
              actionItems: ['Test action'],
              relationshipDynamics: {
                positivePatterns: ['Test positive'],
                concerningPatterns: ['Test concern'],
                growthAreas: ['Test growth']
              },
              emotionalDynamics: {
                emotionalSecurity: 4,
                intimacyBalance: {
                  score: 4,
                  areas: {
                    emotional: 4,
                    physical: 4,
                    intellectual: 4,
                    shared: 4
                  }
                },
                conflictResolution: {
                  style: 'collaborative',
                  effectiveness: 4,
                  patterns: ['Test pattern']
                }
              }
            })
          }
        }]
      };

      (callOpenAI as jest.Mock).mockResolvedValue(mockGPTResponse);

      const result = await generateRelationshipAnalysis(
        mockDailyAssessment,
        mockDailyAssessment,
        mockRelationshipContext
      );

      expect(result).toHaveProperty('overallHealth');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('strengthsAndChallenges');
      expect(result).toHaveProperty('communicationSuggestions');
      expect(result).toHaveProperty('actionItems');
      expect(result).toHaveProperty('relationshipDynamics');
      expect(result).toHaveProperty('emotionalDynamics');
    });

    test('should handle missing relationship context', async () => {
      const mockGPTResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallHealth: { score: 4, trend: 'improving' },
              categories: {},
              strengthsAndChallenges: { strengths: [], challenges: [] },
              communicationSuggestions: [],
              actionItems: [],
              relationshipDynamics: {
                positivePatterns: [],
                concerningPatterns: [],
                growthAreas: []
              },
              emotionalDynamics: {
                emotionalSecurity: 4,
                intimacyBalance: {
                  score: 4,
                  areas: { emotional: 4, physical: 4, intellectual: 4, shared: 4 }
                },
                conflictResolution: {
                  style: 'collaborative',
                  effectiveness: 4,
                  patterns: []
                }
              }
            })
          }
        }]
      };

      (callOpenAI as jest.Mock).mockResolvedValue(mockGPTResponse);

      const result = await generateRelationshipAnalysis(
        mockDailyAssessment,
        mockDailyAssessment,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.overallHealth).toBeDefined();
    });
  });

  describe('analyzeConsensusForm', () => {
    const mockConsensusForm: ConsensusFormData = {
      type: 'consensus_form',
      answers: {
        communication: 'daily',
        conflicts: 'rarely',
        intimacy: 'frequently',
        support: 'always'
      },
      date: new Date().toISOString()
    };

    beforeEach(() => {
      (callOpenAI as jest.Mock).mockReset();
    });

    test('should analyze consensus form successfully', async () => {
      const mockGPTResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallAnalysis: {
                score: 85,
                trend: 'improving',
                summary: 'Test summary',
                riskLevel: 'low'
              },
              categoryAnalysis: {
                communication: {
                  score: 4,
                  insights: ['Test insight'],
                  recommendations: ['Test recommendation'],
                  riskFactors: []
                }
              },
              progressionAnalysis: {
                improvements: ['Test improvement'],
                concerns: [],
                trends: {}
              },
              therapeuticInsights: {
                immediateActions: ['Test action'],
                longTermStrategies: ['Test strategy'],
                underlyingIssues: []
              },
              consistencyAnalysis: {
                alignedAreas: ['Test area'],
                discrepancies: [],
                possibleMotivations: []
              },
              recommendations: {
                communication: ['Test recommendation'],
                exercises: ['Test exercise'],
                professionalSupport: []
              }
            })
          }
        }]
      };

      (callOpenAI as jest.Mock).mockResolvedValue(mockGPTResponse);

      const result = await analyzeConsensusForm(mockConsensusForm);

      expect(result).toHaveProperty('overallAnalysis');
      expect(result.overallAnalysis).toHaveProperty('score');
      expect(result.overallAnalysis).toHaveProperty('trend');
      expect(result.overallAnalysis).toHaveProperty('summary');
      expect(result.overallAnalysis).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('categoryAnalysis');
      expect(result).toHaveProperty('progressionAnalysis');
      expect(result).toHaveProperty('therapeuticInsights');
      expect(result).toHaveProperty('consistencyAnalysis');
      expect(result).toHaveProperty('recommendations');
    });

    test('should handle partner form comparison', async () => {
      const mockPartnerForm: ConsensusFormData = {
        ...mockConsensusForm,
        answers: {
          ...mockConsensusForm.answers,
          communication: 'rarely',
          conflicts: 'frequently'
        }
      };

      const mockGPTResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallAnalysis: {
                score: 70,
                trend: 'stable',
                summary: 'Test summary with discrepancies',
                riskLevel: 'moderate'
              },
              categoryAnalysis: {
                communication: {
                  score: 3,
                  insights: ['Test insight with discrepancy'],
                  recommendations: ['Test recommendation for discrepancy'],
                  riskFactors: ['Communication discrepancy']
                }
              },
              progressionAnalysis: {
                improvements: [],
                concerns: ['Communication gap'],
                trends: {}
              },
              therapeuticInsights: {
                immediateActions: ['Address communication gap'],
                longTermStrategies: ['Develop communication plan'],
                underlyingIssues: ['Different communication expectations']
              },
              consistencyAnalysis: {
                alignedAreas: [],
                discrepancies: ['Communication frequency'],
                possibleMotivations: ['Different needs']
              },
              recommendations: {
                communication: ['Establish communication routine'],
                exercises: ['Daily check-ins'],
                professionalSupport: []
              }
            })
          }
        }]
      };

      (callOpenAI as jest.Mock).mockResolvedValue(mockGPTResponse);

      const result = await analyzeConsensusForm(mockConsensusForm, mockPartnerForm);

      expect(result.overallAnalysis.score).toBe(70);
      expect(result.consistencyAnalysis.discrepancies.length).toBeGreaterThan(0);
    });

    test('should handle invalid form data', async () => {
      const invalidForm = {
        type: 'consensus_form',
        answers: {},
        date: new Date().toISOString()
      } as ConsensusFormData;

      await expect(analyzeConsensusForm(invalidForm))
        .rejects.toThrow('Invalid consensus form data');
    });
  });
}); 