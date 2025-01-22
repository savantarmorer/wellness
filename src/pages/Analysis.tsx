import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Typography, Paper, CircularProgress, alpha, IconButton, Stack, Alert, LinearProgress } from '@mui/material';
import { Layout } from '../components/Layout';
import { AnalysisTabs } from '../components/AnalysisTabs';
import { useAuth } from '../contexts/AuthContext';
import { useDebug } from '../contexts/DebugContext';
import type { 
  GPTAnalysis, 
  RelationshipAnalysis, 
  MoodAnalysis,
  MoodSynchronyAnalysis,
  UnifiedAnalysis, 
  DailyAssessment, 
  ConsensusFormData, 
  MoodEntry, 
  ValidatedScalesAnalysis, 
  ClinicalSignificance, 
  AttachmentAnalysis,
  MoodType,
  ComprehensiveAnalysis,
  ValidatedScales,
  EmotionalDynamics,
  TemporalAnalysis,
  CommunicationPatterns,
  CategoryRatings,
  AttachmentStyle,
  FormSubmissionResult,
  RelationshipContext,
  AttachmentMetrics
} from '../types';
import { ArrowBack, ArrowForwardIos } from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RelationshipOrchestrator } from '../services/relationshipOrchestratorNew';
import { getRelationshipContext } from '../services/relationshipContextService';
import { analyzeMoodPatterns } from '../services/moodService';
import { analyzeTemporalPatterns } from '../services/analysisUtils';
import { analyzeAttachmentDynamics } from '../services/psychologicalAnalysisService';
import { generateDailyInsight } from '../services/gptService';
import { useTheme } from '@mui/material/styles';
import { calculateEmotionalVariability } from '../services/moodService';
import { 
  calculateOverallSatisfaction,
  calculateConfidenceLevel
} from '../services/analysisUtils';
import { DebugPanel } from '../components/DebugPanel';
import { DebugProvider } from '../contexts/DebugContext';
import axios from 'axios';
import {
  calculateEmotionalSync,
  calculateMoodStability,
  calculateEmotionalStability,
  calculateCommunicationQuality,
  calculateEmotionalSecurity,
  calculateMoodPatterns,
  calculateResponseFrequency,
  calculateInteractionDepth
} from '../services/calculos/calculosRelacionamento';
import {
  calculateIntimacyBalance,
  determineEmotionalTrend,
  analyzeDominantMoods,
  calculateConfidenceScore,
  calculateOverallEmotionalHealth
} from '../services/calculos/calculosRelacionamento3';
import { calculateMoodVolatility } from '../services/calculos/calculosBase';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface ExtendedRelationshipContext extends RelationshipContext {
  validatedScales?: ValidatedScales;
}

const createDefaultMoodFrequency = (): Record<MoodType, number> => ({
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
});

const createDefaultGPTAnalysis = (userId: string, partnerId: string): GPTAnalysis => ({
  id: `gpt_${new Date().getTime()}`,
  userId,
  partnerId,
  date: new Date().toISOString(),
  type: 'individual',
  analysis: {
    moodPatterns: {
      user: {
        dominant: 'neutral',
        frequency: createDefaultMoodFrequency(),
        transitions: {}
      },
      partner: {
        dominant: 'neutral',
        frequency: createDefaultMoodFrequency(),
        transitions: {}
      },
      overall: {
        synchronicity: 0,
        stability: 0,
        variability: 0
      }
    },
    communicationMetrics: {
      quality: 0,
      frequency: 0,
      depth: 0,
      patterns: []
    },
    relationshipDynamics: {
      strengths: [],
      challenges: [],
      recommendations: []
    },
    attachmentInsights: {
      style: 'secure',
      behaviors: [],
      triggers: [],
      suggestions: []
    }
  },
  timestamp: new Date().toISOString(),
  version: '1.0',
  metadata: {
    assessmentCount: 0,
    timeSpan: '1 day',
    confidence: 0.5
  }
});

const createDefaultMoodAnalysis = (): MoodSynchronyAnalysis => ({
  patterns: {
    dominantMoods: [],
    moodTransitions: [],
    timePatterns: {},
    daily: [],
    weekly: [],
    monthly: []
  },
  insights: [],
  trends: {
    direction: { direction: 'stable', significance: 'medium' },
    significance: { direction: 'stable', significance: 'medium' }
  },
  metrics: {
    emotionalVariability: 0,
    positiveNegativeRatio: 0.5,
    recoveryResilience: 0.5,
    moodStability: 0.5
  },
  emotionalSync: 0,
  moodDiscrepancies: []
});

const createDefaultTemporalAnalysis = (): TemporalAnalysis => ({
  correlation: 0,
  trends: {},
  patterns: {
    cyclical: [],
    persistent: [],
    emerging: []
  },
  timeframes: {
    daily: createDefaultTimeframe(),
    weekly: createDefaultTimeframe(),
    monthly: createDefaultTimeframe()
  },
  seasonality: 0,
  volatility: 0,
  confidence: 0.5,
  analysisDate: new Date().toISOString()
});

const createDefaultTimeframe = () => ({
  averageScores: createDefaultCategoryRatings(),
  insights: [],
  discrepancies: [],
  confidence: 0.5,
  trends: {}
});

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

const createDefaultAttachmentAnalysis = (): AttachmentAnalysis => ({
  userAttachment: 'secure',
  partnerAttachment: 'secure',
  compatibilityScore: 0.5,
  insights: ['Initial assessment pending']
});

const createDefaultCommunicationPatterns = (): CommunicationPatterns => ({
  style: 'balanced',
  effectiveness: 0.5,
  patterns: [],
  confidence: 0.5
});

export const createDefaultRelationshipAnalysis = (): RelationshipAnalysis => ({
  id: `rel_${new Date().getTime()}`,
  userId: '',
  partnerId: '',
  date: new Date().toISOString(),
  type: 'individual',
  gptAnalysis: createDefaultGPTAnalysis('', ''),
  overallHealth: {
    score: 0,
    trend: 'stable',
    confidence: 0.5,
    emotionalSync: 0
  },
  categories: {},
  strengthsAndChallenges: {
    strengths: [],
    challenges: []
  },
  communicationSuggestions: [],
  actionItems: [],
  relationshipDynamics: {
    strengths: [],
    challenges: [],
    recommendations: []
  },
  emotionalDynamics: {
    synchronicity: 0,
    stability: 0,
    emotionalSecurity: 0,
    intimacyBalance: {
      score: 0,
      areas: {
        emotional: 0,
        physical: 0,
        intellectual: 0,
        shared: 0
      }
    },
    conflictResolution: {
      style: 'collaborative',
      effectiveness: 0.5,
      patterns: [],
      confidence: 0.8
    },
    patterns: {
      user: {
        dominant: 'neutral',
        frequency: createDefaultMoodFrequency(),
        transitions: {}
      },
      partner: {
        dominant: 'neutral',
        frequency: createDefaultMoodFrequency(),
        transitions: {}
      }
    },
    insights: {
      strengths: [],
      challenges: [],
      recommendations: []
    }
  },
  emotionalSync: 0,
  moodDiscrepancies: [],
  insights: [],
  riskFactors: [],
  recommendations: [],
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
    assessmentCount: 0,
    timeSpan: '1 day',
    confidence: 0.5,
    lastUpdate: new Date().toISOString()
  },
  clinicalSignificance: {
    gaps: [],
    riskFactors: [],
    protectiveFactors: [],
    recommendations: [],
    severity: 'low',
    confidence: 0.5
  }
});

const createDefaultDailyAssessment = (userId: string): DailyAssessment => ({
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

// Função auxiliar para logging
const logAnalysis = (action: string, data?: any) => {
  console.log(`[Analysis] ${action}`, data ? data : '');
};

const AnalysisContent: React.FC = () => {
  const { logs, addLog } = useDebug();
  const theme = useTheme();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [unifiedAnalysis, setUnifiedAnalysis] = useState<UnifiedAnalysis | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [partnerMoodEntries, setPartnerMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<DailyAssessment | null>(null);
  const [relationshipAnalysis, setRelationshipAnalysis] = useState<RelationshipAnalysis | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    moodEntries: true,
    partnerEntries: true,
    analysis: true,
    insights: true
  });
  
  // Initialize orchestrator inside component
  const orchestrator = new RelationshipOrchestrator();

  useEffect(() => {
    logAnalysis('Component mounted', {
      currentUser: currentUser?.uid,
      hasUserData: !!userData,
      selectedDate: selectedDate.toISOString()
    });
  }, [currentUser?.uid, userData, selectedDate]);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    logAnalysis('Changed to previous day', newDate.toISOString());
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
    logAnalysis('Changed to next day', newDate.toISOString());
  };

  const calculateSatisfactionScore = useCallback((assessment: DailyAssessment) => {
    return calculateOverallSatisfaction(assessment, addLog);
  }, [addLog]);

  useEffect(() => {
    if (selectedAssessment) {
      console.log('[Analysis] Calculating satisfaction for assessment:', selectedAssessment);
      const score = calculateSatisfactionScore(selectedAssessment);
      console.log('[Analysis] Calculated satisfaction score:', score);
    }
  }, [selectedAssessment, calculateSatisfactionScore]);

  // Separate effect for mood entries updates
  useEffect(() => {
    const fetchMoodEntries = async () => {
      if (!currentUser?.uid || !userData?.partnerId) return;

      try {
        const [fetchedMoodEntries, fetchedPartnerMoodEntries] = await Promise.all([
          // Mood entries
          getDocs(query(
            collection(db, 'moodEntries'),
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as MoodEntry)),

          // Partner's mood entries
          getDocs(query(
            collection(db, 'moodEntries'),
            where('userId', '==', userData.partnerId),
            orderBy('timestamp', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as MoodEntry))
        ]);

        setMoodEntries(fetchedMoodEntries);
        setPartnerMoodEntries(fetchedPartnerMoodEntries);
      } catch (error) {
        console.error('[Analysis] Error fetching mood entries:', error);
      }
    };

    fetchMoodEntries();
  }, [currentUser?.uid, userData?.partnerId]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!currentUser?.uid || !userData) {
        logAnalysis('Missing user data', { currentUser: currentUser?.uid, hasUserData: !!userData });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        logAnalysis('Starting data fetch');
        setLoadingStates({
          moodEntries: true,
          partnerEntries: true,
          analysis: true,
          insights: true
        });

        // Fetch relationship context first
        const relationshipContext = await getRelationshipContext(currentUser.uid);
        if (!relationshipContext) {
          console.log('[Analysis] No relationship context found');
          setUnifiedAnalysis(null);
          setLoading(false);
          return;
        }

        // Fetch all required data in parallel
        const [
          userAssessments,
          consensusForms,
          partnerAssessment,
          partnerAssessments,
          moodEntries,
          partnerMoodEntries
        ] = await Promise.all([
          // User assessments - last 30 days
          getDocs(query(
            collection(db, 'assessments'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as DailyAssessment)),

          // Consensus forms - last 30 days
          getDocs(query(
            collection(db, 'consensusForms'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as ConsensusFormData)),

          // Partner's assessment for selected date
          getDocs(query(
            collection(db, 'assessments'),
            where('userId', '==', userData.partnerId),
            where('date', '>=', new Date(selectedDate).toISOString()),
            where('date', '<=', new Date(selectedDate).toISOString()),
            orderBy('date', 'desc'),
            limit(1)
          )).then(snapshot => snapshot.empty ? null : snapshot.docs[0].data() as DailyAssessment),

          // Partner's historical assessments - last 30 days
          getDocs(query(
            collection(db, 'assessments'),
            where('userId', '==', userData.partnerId),
            orderBy('date', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as DailyAssessment)),

          // User mood entries - last 30 days
          getDocs(query(
            collection(db, 'moodEntries'),
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as MoodEntry)),

          // Partner mood entries - last 30 days
          getDocs(query(
            collection(db, 'moodEntries'),
            where('userId', '==', userData.partnerId),
            orderBy('timestamp', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as MoodEntry))
        ]);

        // Data validation and completeness check
        const dataCompleteness = {
          hasUserAssessments: userAssessments.length > 0,
          hasPartnerAssessment: !!partnerAssessment,
          hasPartnerAssessments: partnerAssessments.length > 0,
          hasConsensusForms: consensusForms.length > 0,
          hasMoodEntries: moodEntries.length > 0,
          hasPartnerMoodEntries: partnerMoodEntries.length > 0
        };

        console.log('[Analysis] Data completeness:', dataCompleteness);

        // Filter valid assessments
        const validUserAssessments = userAssessments.filter(a => a !== null && a.ratings !== undefined);
        const validPartnerAssessments = partnerAssessments.filter(a => a !== null && a.ratings !== undefined);

        // Generate analyses with proper error handling
        const [
          analysisResult,
          moodAnalysisResult,
          temporalAnalysisResult,
          attachmentAnalysisResult,
          gptAnalysisResult
        ] = await Promise.allSettled([
          // Comprehensive relationship analysis
          orchestrator.generateComprehensiveAnalysis(
            currentUser.uid,
            relationshipContext,
            {
              assessments: validUserAssessments.filter(Boolean) as DailyAssessment[],
              consensusForms,
              moodEntries
            }
          ),
          // Mood analysis with data validation
          analyzeMoodPatterns(
            moodEntries.filter(entry => {
              const entryDate = new Date(entry.timestamp);
              return !isNaN(entryDate.getTime()) && entry.mood?.primary;
            }),
            'daily'
          ),
          // Temporal analysis with validated data
          analyzeTemporalPatterns(validUserAssessments, validPartnerAssessments),
          // Attachment analysis with context
          analyzeAttachmentDynamics(
            validUserAssessments[0] || createDefaultDailyAssessment(currentUser.uid),
            partnerAssessment || createDefaultDailyAssessment(userData.partnerId || '')
          ),
          // GPT insight with validated data
          generateDailyInsight(
            validUserAssessments[0] || null,
            partnerAssessment || null,
            relationshipContext
          )
        ]);

        // Handle analysis results
        const analysis = analysisResult.status === 'fulfilled' ? analysisResult.value : null;
        const moodAnalysis = moodAnalysisResult.status === 'fulfilled' ? moodAnalysisResult.value : null;
        const temporalAnalysis = temporalAnalysisResult.status === 'fulfilled' ? temporalAnalysisResult.value : null;
        const attachmentAnalysis = attachmentAnalysisResult.status === 'fulfilled' ? attachmentAnalysisResult.value : null;
        const gptAnalysis = gptAnalysisResult.status === 'fulfilled' ? gptAnalysisResult.value : null;

        if (!analysis) {
          console.error('[Analysis] Failed to generate comprehensive analysis');
          setError(new Error('Failed to generate analysis'));
          return;
        }

        // Create unified analysis with proper fallback values
        const unifiedAnalysis: UnifiedAnalysis = {
          gptAnalysis: (typeof gptAnalysis === 'object' && gptAnalysis !== null && 'id' in gptAnalysis && 'userId' in gptAnalysis && 'partnerId' in gptAnalysis && 'date' in gptAnalysis && 'type' in gptAnalysis && 'analysis' in gptAnalysis && 'timestamp' in gptAnalysis && 'version' in gptAnalysis && 'metadata' in gptAnalysis) 
            ? gptAnalysis as GPTAnalysis 
            : createDefaultGPTAnalysis(currentUser.uid, userData.partnerId || ''),
          relationshipAnalysis: analysisResult.status === 'fulfilled' && analysisResult.value?.data?.relationshipAnalysis 
            ? analysisResult.value.data.relationshipAnalysis 
            : {
                ...createDefaultRelationshipAnalysis(),
                userId: currentUser.uid,
                partnerId: userData.partnerId || ''
              },
          moodAnalysis: moodAnalysis || createDefaultMoodAnalysis(),
          temporalAnalysis: temporalAnalysis || createDefaultTemporalAnalysis(),
          attachmentAnalysis: attachmentAnalysis ? {
            userAttachment: attachmentAnalysis.user?.primary || 'secure',
            partnerAttachment: attachmentAnalysis.partner?.primary || 'secure',
            compatibilityScore: attachmentAnalysis.compatibility?.score || 0.5,
            insights: attachmentAnalysis.compatibility?.insights || ['Initial assessment pending'],
            validatedMetrics: {
              ecr: {
                anxiety: 0,
                avoidance: 0
              }
            }
          } : createDefaultAttachmentAnalysis(),
          communicationPatterns: analysisResult.status === 'fulfilled' ? (analysisResult.value?.data as any)?.communicationPatterns || createDefaultCommunicationPatterns() : createDefaultCommunicationPatterns(),
          dailyInsight: typeof gptAnalysis === 'string' ? gptAnalysis : '',
          stage: {
            current: 'initial',
            nextSteps: [],
            timelineEstimate: '1 month'
          },
          relationshipContext
        };

        console.log('[Analysis] Generated unified analysis:', {
          hasGPTAnalysis: !!unifiedAnalysis.gptAnalysis,
          hasContext: !!unifiedAnalysis.relationshipContext,
          hasMoodAnalysis: !!unifiedAnalysis.moodAnalysis,
          hasRelationshipAnalysis: !!unifiedAnalysis.relationshipAnalysis,
          dataCompleteness
        });

        setUnifiedAnalysis(unifiedAnalysis);
      } catch (error) {
        console.error('[Analysis] Error fetching analysis:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [currentUser?.uid, userData, selectedDate, currentUser, moodEntries, partnerMoodEntries]);

  // Memoize calculations to prevent unnecessary recalculations
  const memoizedCalculations = useCallback(() => {
    if (!selectedAssessment || !unifiedAnalysis) return null;

    const emotionalSync = calculateEmotionalSync(moodEntries, partnerMoodEntries);
    const emotionalStability = calculateMoodStability(moodEntries);
    const intimacyBalance = calculateIntimacyBalance(moodEntries, partnerMoodEntries);

    return {
      emotionalSync,
      emotionalStability,
      intimacyBalance
    };
  }, [selectedAssessment, unifiedAnalysis, moodEntries, partnerMoodEntries]);

  // Update relationship analysis only when necessary
  useEffect(() => {
    const calculations = memoizedCalculations();
    if (!calculations || !selectedAssessment || !unifiedAnalysis || !currentUser?.uid) return;

    const { emotionalSync, emotionalStability, intimacyBalance } = calculations;

    // Create ValidatedScalesAnalysis
    const validatedScalesAnalysis: ValidatedScalesAnalysis = {
      ...(unifiedAnalysis?.relationshipAnalysis?.validatedScales || {}),
      insights: [{
        id: `insight_${new Date().getTime()}`,
        type: 'pattern',
        category: 'validated_scales',
        description: 'Análise inicial das escalas validadas',
        confidence: 0.8,
        impact: 'medium',
        timestamp: new Date().toISOString()
      }],
      recommendations: ['Mantenha a consistência nas avaliações'],
      analysisDate: new Date().toISOString(),
      confidence: 0.8,
      trends: {
        overall: {
          direction: 'stable' as 'improving' | 'stable' | 'declining',
          significance: 'medium' as 'low' | 'medium' | 'high'
        },
        positiveNegativeRatio: {
          direction: 'stable' as 'improving' | 'stable' | 'declining',
          significance: 'medium' as 'low' | 'medium' | 'high'
        }
      }
    };

    // Update relationshipAnalysis with validatedScalesAnalysis
    const relationshipAnalysis: RelationshipAnalysis = {
      id: `rel_${new Date().getTime()}`,
      userId: currentUser?.uid || '',
      partnerId: userData?.partnerId || '',
      date: new Date().toISOString(),
      type: 'individual',
      overallHealth: {
        score: calculateOverallEmotionalHealth(emotionalSync, emotionalStability, intimacyBalance),
        trend: unifiedAnalysis?.temporalAnalysis?.trends?.comunicacao?.trend as 'improving' | 'stable' | 'declining' || 'stable',
        confidence: unifiedAnalysis?.temporalAnalysis?.confidence || 0.8,
        emotionalSync: 0.7
      },
      categories: {
        communication: {
          score: (selectedAssessment?.ratings as CategoryRatings)?.comunicacao || 0,
          trend: unifiedAnalysis?.temporalAnalysis?.trends?.comunicacao?.trend || 'stable',
          insights: ['Baseado nas avaliações recentes'],
          impactScore: calculateCommunicationQuality(moodEntries, partnerMoodEntries),
          priority: (selectedAssessment?.ratings as CategoryRatings)?.comunicacao < 5 ? 'high' : 'medium'
        }
      },
      strengthsAndChallenges: {
        strengths: unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics?.strengths || [],
        challenges: unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics?.challenges || []
      },
      communicationSuggestions: unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics?.recommendations || [],
      actionItems: [],
      relationshipDynamics: unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics || {
        strengths: [],
        challenges: [],
        recommendations: []
      },
      emotionalDynamics: {
        synchronicity: emotionalSync,
        stability: emotionalStability,
        emotionalSecurity: calculateEmotionalSecurity(moodEntries, partnerMoodEntries),
        intimacyBalance: {
          score: intimacyBalance.score,
          areas: {
            emotional: (selectedAssessment?.ratings as CategoryRatings)?.conexaoEmocional / 10 || 0,
            physical: (selectedAssessment?.ratings as CategoryRatings)?.intimidadeFisica / 10 || 0,
            intellectual: (selectedAssessment?.ratings as CategoryRatings)?.alinhamentoObjetivos / 10 || 0,
            shared: (selectedAssessment?.ratings as CategoryRatings)?.qualidadeTempo / 10 || 0
          }
        },
        conflictResolution: {
          style: 'collaborative',
          effectiveness: selectedAssessment?.ratings?.resolucaoConflitos / 10 || 0,
          patterns: [],
          confidence: 0.8
        },
        patterns: {
          user: {
            dominant: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.user?.dominant || 'neutral',
            frequency: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.user?.frequency || calculateMoodPatterns([]).frequency,
            transitions: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.user?.transitions || {}
          },
          partner: {
            dominant: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.partner?.dominant || 'neutral',
            frequency: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.partner?.frequency || calculateMoodPatterns([]).frequency,
            transitions: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.partner?.transitions || {}
          }
        },
        insights: {
          strengths: [],
          challenges: [],
          recommendations: []
        }
      } as EmotionalDynamics,
      emotionalSync: unifiedAnalysis?.gptAnalysis?.analysis?.moodPatterns?.overall?.synchronicity || 0,
      moodDiscrepancies: [],
      insights: [],
      riskFactors: [],
      recommendations: [],
      validatedScales: validatedScalesAnalysis,
      gptAnalysis: unifiedAnalysis?.gptAnalysis || {
        id: '',
        userId: '',
        partnerId: '',
        date: '',
        type: 'individual',
        analysis: {
          moodPatterns: {
            user: { dominant: 'neutral', frequency: calculateMoodPatterns([]).frequency, transitions: {} },
            partner: { dominant: 'neutral', frequency: calculateMoodPatterns([]).frequency, transitions: {} },
            overall: { synchronicity: 0, stability: 0, variability: 0 }
          },
          communicationMetrics: { quality: 0, frequency: 0, depth: 0, patterns: [] },
          relationshipDynamics: { strengths: [], challenges: [], recommendations: [] },
          attachmentInsights: { style: '', behaviors: [], triggers: [], suggestions: [] }
        },
        timestamp: '',
        version: '1.0',
        metadata: { assessmentCount: 0, timeSpan: '', confidence: 0 }
      },
      metadata: {
        assessmentCount: 1,
        timeSpan: '1 day',
        confidence: 0.8,
        lastUpdate: new Date().toISOString()
      },
      clinicalSignificance: {
        gaps: [{
          dimension: 'emotional_health',
          score: calculateOverallEmotionalHealth(emotionalSync, emotionalStability, intimacyBalance),
          normativeScore: validatedScalesAnalysis?.das?.total ? validatedScalesAnalysis.das.total / 100 : 0.7,
          difference: Math.abs(calculateOverallEmotionalHealth(emotionalSync, emotionalStability, intimacyBalance) - (validatedScalesAnalysis?.das?.total ?? 70) / 100),
          isSignificant: Math.abs(calculateOverallEmotionalHealth(emotionalSync, emotionalStability, intimacyBalance) - (validatedScalesAnalysis?.das?.total ?? 70) / 100) > 0.2,
          severity: Math.abs(calculateOverallEmotionalHealth(emotionalSync, emotionalStability, intimacyBalance) - (validatedScalesAnalysis?.das?.total ?? 70) / 100) > 0.3 ? 'high' : 'moderate'
        },
        {
          dimension: 'communication',
          score: selectedAssessment?.ratings?.comunicacao / 10 || 0,
          normativeScore: validatedScalesAnalysis?.gottman?.resolucaoConflitos || 0.75,
          difference: Math.abs((selectedAssessment?.ratings?.comunicacao / 10 || 0) - (validatedScalesAnalysis?.gottman?.resolucaoConflitos || 0.75)),
          isSignificant: Math.abs((selectedAssessment?.ratings?.comunicacao / 10 || 0) - (validatedScalesAnalysis?.gottman?.resolucaoConflitos || 0.75)) > 0.2,
          severity: Math.abs((selectedAssessment?.ratings?.comunicacao / 10 || 0) - (validatedScalesAnalysis?.gottman?.resolucaoConflitos || 0.75)) > 0.3 ? 'high' : 'moderate'
        },
        {
          dimension: 'intimacy',
          score: selectedAssessment?.ratings?.intimidade / 10 || 0,
          normativeScore: validatedScalesAnalysis?.das?.expressaoAfetiva ? validatedScalesAnalysis.das.expressaoAfetiva / 100 : 0.7,
          difference: Math.abs((selectedAssessment?.ratings?.intimidade / 10 || 0) - (validatedScalesAnalysis?.das?.expressaoAfetiva ?? 70) / 100),
          isSignificant: Math.abs((selectedAssessment?.ratings?.intimidade / 10 || 0) - (validatedScalesAnalysis?.das?.expressaoAfetiva ?? 70) / 100) > 0.2,
          severity: Math.abs((selectedAssessment?.ratings?.intimidade / 10 || 0) - (validatedScalesAnalysis?.das?.expressaoAfetiva ?? 70) / 100) > 0.3 ? 'high' : 'moderate'
        }],
        riskFactors: [
          ...validatedScalesAnalysis.recommendations || [],
          ...unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics?.challenges || [],
          ...(emotionalSync < 0.3 ? ['Low emotional synchronization'] : []),
          ...(emotionalStability < 0.4 ? ['Unstable emotional patterns'] : [])
        ],
        protectiveFactors: [
          ...(validatedScalesAnalysis?.das?.total ?? 0 > 70 ? ['High relationship satisfaction'] : []),
          ...unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics?.strengths || [],
          ...(emotionalSync > 0.7 ? ['Strong emotional connection'] : []),
          ...(emotionalStability > 0.6 ? ['Stable emotional patterns'] : [])
        ],
        recommendations: [
          ...validatedScalesAnalysis.recommendations || [],
          ...unifiedAnalysis?.gptAnalysis?.analysis?.relationshipDynamics?.recommendations || [],
          ...(emotionalSync < 0.3 ? ['Focus on emotional attunement exercises'] : []),
          ...(emotionalStability < 0.4 ? ['Implement mood regulation strategies'] : [])
        ],
        severity: (validatedScalesAnalysis?.das?.total ?? 0) < 50 ? 'high' :
                 (validatedScalesAnalysis?.das?.total ?? 0) < 70 ? 'moderate' : 'low',
        confidence: validatedScalesAnalysis.confidence
      } satisfies ClinicalSignificance
    };

    setRelationshipAnalysis(relationshipAnalysis);
  }, [
    selectedAssessment,
    unifiedAnalysis,
    currentUser?.uid,
    userData?.partnerId,
    moodEntries,
    partnerMoodEntries,
    memoizedCalculations
  ]);

  // Add auth token to API requests and configure axios
  useEffect(() => {
    const setupAPIAuth = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        // Set token in headers for API calls
        window.localStorage.setItem('authToken', token);
        
        // Configure axios defaults for API calls
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['Content-Type'] = 'application/json';
      } catch (error) {
        console.error('Error setting up API auth:', error);
        // Clear token if there's an error
        window.localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    setupAPIAuth();

    // Cleanup function
    return () => {
      delete axios.defaults.headers.common['Authorization'];
      window.localStorage.removeItem('authToken');
    };
  }, [currentUser]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <IconButton
              onClick={handlePreviousDay}
              size="small"
              sx={{ 
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: (theme) =>
                  `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
              }}
            >
              {formatDate(selectedDate)}
            </Typography>

            <IconButton
              onClick={handleNextDay}
              disabled={selectedDate >= new Date()}
              size="small"
              sx={{ 
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
                '&.Mui-disabled': {
                  backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.1),
                }
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <AnalysisTabs
              analysis={{
                id: `gpt_${new Date().getTime()}`,
                userId: currentUser?.uid || '',
                partnerId: userData?.partnerId || '',
                date: new Date().toISOString(),
                type: 'individual',
                analysis: {
                  moodPatterns: {
                    user: {
                      dominant: 'neutral' as MoodType,
                      frequency: calculateMoodPatterns([]).frequency,
                      transitions: {}
                    },
                    partner: {
                      dominant: 'neutral' as MoodType,
                      frequency: calculateMoodPatterns([]).frequency,
                      transitions: {}
                    },
                    overall: {
                      synchronicity: moodEntries.length > 0 && partnerMoodEntries.length > 0 ? 
                        calculateEmotionalSync(
                          moodEntries.filter(entry => {
                            const entryDate = new Date(entry.timestamp);
                            return entryDate <= selectedDate;
                          }),
                          partnerMoodEntries.filter(entry => {
                            const entryDate = new Date(entry.timestamp);
                            return entryDate <= selectedDate;
                          })
                        ) : 0,
                      stability: calculateMoodStability(moodEntries.filter(entry => {
                        const entryDate = new Date(entry.timestamp);
                        return entryDate <= selectedDate;
                      })),
                      variability: calculateEmotionalVariability(moodEntries.filter(entry => {
                        const entryDate = new Date(entry.timestamp);
                        return entryDate <= selectedDate;
                      }))
                    }
                  },
                  communicationMetrics: {
                    quality: calculateCommunicationQuality(
                      moodEntries.filter(entry => {
                        const entryDate = new Date(entry.timestamp);
                        return entryDate <= selectedDate;
                      }),
                      partnerMoodEntries.filter(entry => {
                        const entryDate = new Date(entry.timestamp);
                        return entryDate <= selectedDate;
                      })
                    ),
                    frequency: 0,
                    depth: 0,
                    patterns: []
                  },
                  relationshipDynamics: {
                    strengths: [],
                    challenges: [],
                    recommendations: []
                  },
                  attachmentInsights: {
                    style: '',
                    behaviors: [],
                    triggers: [],
                    suggestions: []
                  }
                },
                timestamp: new Date().toISOString(),
                version: '1.0',
                metadata: {
                  assessmentCount: 0,
                  timeSpan: '',
                  confidence: 0
                }
              } as GPTAnalysis}
              validatedScales={unifiedAnalysis?.relationshipAnalysis?.validatedScales ? {
                ...(unifiedAnalysis.relationshipAnalysis.validatedScales satisfies ValidatedScales),
                insights: [{
                  id: `insight_${new Date().getTime()}`,
                  type: 'pattern',
                  category: 'validated_scales',
                  description: 'Análise inicial das escalas validadas',
                  confidence: 0.8,
                  impact: 'medium',
                  timestamp: new Date().toISOString()
                }],
                recommendations: ['Mantenha a consistência nas avaliações'],
                analysisDate: new Date().toISOString(),
                confidence: 0.8,
                trends: {
                  overall: {
                    direction: 'stable' as 'improving' | 'stable' | 'declining',
                    significance: 'medium' as 'low' | 'medium' | 'high'
                  },
                  positiveNegativeRatio: {
                    direction: 'stable' as 'improving' | 'stable' | 'declining',
                    significance: 'medium' as 'low' | 'medium' | 'high'
                  }
                }
              } as ValidatedScalesAnalysis : undefined}
              temporalAnalysis={{
                correlation: 0,
                trends: {
                  comunicacao: {
                    slope: 0,
                    rSquared: 0,
                    pValue: 0,
                    isSignificant: false,
                    trend: 'stable',
                    magnitude: 0,
                    confidence: 0,
                    direction: 'stable',
                    significance: 'low',
                    insights: [],
                    userTrend: { trend: 'stable', slope: 0, rSquared: 0 },
                    partnerTrend: { trend: 'stable', slope: 0, rSquared: 0 },
                    timeframe: 'daily',
                    dataPoints: 0,
                    category: 'comunicacao',
                    score: 0
                  }
                },
                patterns: {
                  cyclical: ['Padrão inicial de análise'],
                  persistent: ['Aguardando mais dados para análise'],
                  emerging: ['Coletando informações iniciais']
                },
                timeframes: {
                  daily: {
                    averageScores: {
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
                    },
                    insights: [{ type: 'improvement', category: 'comunicacao', description: 'Iniciando análise diária' }],
                    discrepancies: [],
                    confidence: 0,
                    trends: {}
                  },
                  weekly: {
                    averageScores: {
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
                    },
                    insights: [{ type: 'improvement', category: 'comunicacao', description: 'Iniciando análise semanal' }],
                    discrepancies: [],
                    confidence: 0,
                    trends: {}
                  },
                  monthly: {
                    averageScores: {
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
                    },
                    insights: [{ type: 'improvement', category: 'comunicacao', description: 'Iniciando análise mensal' }],
                    discrepancies: [],
                    confidence: 0,
                    trends: {}
                  }
                },
                seasonality: 0,
                volatility: 0,
                confidence: 0,
                analysisDate: new Date().toISOString()
              }}
              attachmentAnalysis={unifiedAnalysis?.attachmentAnalysis || undefined}
              relationshipContext={unifiedAnalysis?.relationshipContext || null}
              dailyInsight={unifiedAnalysis?.dailyInsight || ''}
              moodAnalysis={unifiedAnalysis?.moodAnalysis || undefined}
              relationshipAnalysis={relationshipAnalysis || undefined}
              clinicalSignificance={relationshipAnalysis?.clinicalSignificance}
            />
          </Paper>
        </Box>
      </Container>
      <DebugPanel logs={logs} />
    </Layout>
  );
};

const Analysis: React.FC = () => {
  return (
    <DebugProvider>
      <AnalysisContent />
    </DebugProvider>
  );
};

export default Analysis; 