import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Container, Box, Grid, CircularProgress, Paper, Alert, useTheme, Button, Stack, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { saveAnalysis, getAnalysisForDate, getAnalysisHistory, migrateAnalysisData } from '../services/analysisHistoryService';
import type { AnalysisRecord } from '../services/analysisHistoryService';
import { generateDailyInsight, generateRelationshipAnalysis } from '../services/gptService';
import { RelationshipAnalysis as RelationshipAnalysisComponent } from '../components/RelationshipAnalysis';
import { Layout } from '../components/Layout';
import {
  DailyAssessment,
  RelationshipAnalysis,
  RelationshipContext,
  CommunicationPatterns,
  EmotionalDynamics,
  GPTAnalysis,
  AttachmentStyle,
  MoodType,
  Mood,
  CategoryRatings,
  TrendAnalysis,
  TemporalAnalysis,
  TimeframeAnalysis,
  DailyAssessmentWithRatings,
  AnalysisContent,
  DiscrepancyAnalysis,
  MoodDiscrepancy,
  Insight,
  ValidatedScales,
  ComprehensiveAnalysis,
  AttachmentMetrics,
  MoodEntry,
  GottmanAssessmentData
} from '../types';
import { Psychology as PsychologyIcon, Group as GroupIcon } from '@mui/icons-material';
import { createDefaultRelationshipContext, calculateEmotionalSync, calculateMoodStability } from '../services/relationshipAnalysisService';
import { calculateOverallQuality } from '../services/analysisUtils';
import { calculateEmotionalVariability } from '../services/moodService';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { v4 as uuid } from 'uuid';

const METRICS = {
  comunicacao: 'Comunicação',
  conexaoEmocional: 'Conexão Emocional',
  apoioMutuo: 'Apoio Mútuo',
  transparenciaConfianca: 'Transparência e Confiança',
  intimidadeFisica: 'Intimidade Física',
  saudeMental: 'Saúde Mental',
  resolucaoConflitos: 'Resolução de Conflitos',
  segurancaRelacionamento: 'Segurança no Relacionamento',
  satisfacaoGeral: 'Satisfação Geral',
};

interface AnalysisDialogContent {
  relationshipAnalysis: RelationshipAnalysis;
  temporalAnalysis: TemporalAnalysis;
  validation: {
    consistency: any;
    reliability: number;
    completeness: number;
    recommendations: string[];
  };
  attachmentStyle: {
    user: string;
    partner: string;
    compatibility: number;
  };
}

interface AnalysisDialog {
  open: boolean;
  title: string;
  content: AnalysisDialogContent;
}

const defaultRatings = {
  satisfacaoGeral: 0,
  alinhamentoObjetivos: 0,
  conexaoEmocional: 0,
  apoioMutuo: 0,
  segurancaRelacionamento: 0,
  comunicacao: 0,
  intimidade: 0,
  resolucaoConflitos: 0,
  transparenciaConfianca: 0,
  intimidadeFisica: 0,
  saudeMental: 0,
  autocuidado: 0,
  gratidao: 0,
  qualidadeTempo: 0
};

const defaultTrendAnalysis: TrendAnalysis = {
  slope: 0,
  rSquared: 0,
  pValue: 0.5,
  isSignificant: false,
  trend: 'stable',
  confidence: 0.5,
  timeframe: 'weekly',
  dataPoints: 0,
  category: 'overall',
  score: 0,
  insights: [],
  magnitude: 0,
  direction: 'stable',
  significance: 'low',
  userTrend: {
    slope: 0,
    rSquared: 0,
    trend: 'stable'
  },
  partnerTrend: {
    slope: 0,
    rSquared: 0,
    trend: 'stable'
  }
};

const defaultTimeframeAnalysis: TimeframeAnalysis = {
  averageScores: defaultRatings,
  discrepancies: [],
  insights: [],
  confidence: 0.8,
  trends: {
    overall: {
      direction: 'stable',
      significance: 'low'
    }
  }
};

// Type guard for analysis data
const isValidAnalysis = (analysis: any): analysis is RelationshipAnalysis => {
  return analysis 
    && typeof analysis === 'object'
    && 'validatedScales' in analysis
    && 'emotionalDynamics' in analysis;
};

// Error boundary for charts
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            Erro ao carregar o gráfico
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => this.setState({ hasError: false })}
          >
            Tentar Novamente
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

// Loading skeleton component
const ChartSkeleton = () => (
  <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
);

export default function Statistics() {
  const theme = useTheme();
  const { currentUser, userData } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartData, setChartData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [intimacyBalanceData, setIntimacyBalanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [analysisDialog, setAnalysisDialog] = useState<{
    open: boolean;
    title: string;
    content: AnalysisDialogContent;
  }>({
    open: false,
    title: '',
    content: {} as AnalysisDialogContent
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [partnerMoodEntries, setPartnerMoodEntries] = useState<MoodEntry[]>([]);
  const [assessments, setAssessments] = useState<DailyAssessmentWithRatings[]>([]);

  const [userAssessment, setUserAssessment] = useState<DailyAssessmentWithRatings>({
    id: '',
    userId: '',
    partnerId: '',
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    type: 'individual',
    emotionalSecurity: 0,
    intimacy: 0,
    communication: 0,
    trust: 0,
    mood: {
      primary: 'neutral',
      intensity: 0,
      notes: ''
    },
    ratings: {
      comunicacao: 0,
      conexaoEmocional: 0,
      apoioMutuo: 0,
      transparenciaConfianca: 0,
      intimidadeFisica: 0,
      saudeMental: 0,
      resolucaoConflitos: 0,
      segurancaRelacionamento: 0,
      satisfacaoGeral: 0,
      alinhamentoObjetivos: 0,
      qualidadeTempo: 0,
      intimidade: 0,
      autocuidado: 0,
      gratidao: 0
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
        crisisType: 'emotional' as const,
        attemptedSolutions: false,
        solutionType: [],
        impactLevel: 'low' as const,
        resolutionStatus: 'unresolved' as const
      }
    }
  });

  const [partnerAssessment, setPartnerAssessment] = useState<DailyAssessmentWithRatings>({
    id: '',
    userId: '',
    partnerId: '',
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    type: 'individual',
    emotionalSecurity: 0,
    intimacy: 0,
    communication: 0,
    trust: 0,
    mood: {
      primary: 'neutral',
      intensity: 0,
      notes: ''
    },
    ratings: {
      comunicacao: 0,
      conexaoEmocional: 0,
      apoioMutuo: 0,
      transparenciaConfianca: 0,
      intimidadeFisica: 0,
      saudeMental: 0,
      resolucaoConflitos: 0,
      segurancaRelacionamento: 0,
      satisfacaoGeral: 0,
      alinhamentoObjetivos: 0,
      qualidadeTempo: 0,
      intimidade: 0,
      autocuidado: 0,
      gratidao: 0
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
        crisisType: 'emotional' as const,
        attemptedSolutions: false,
        solutionType: [],
        impactLevel: 'low' as const,
        resolutionStatus: 'unresolved' as const
      }
    }
  });

  // Add memoized data processing functions
  const processMetrics = useCallback((analysis: RelationshipAnalysis) => ({
    date: new Date(analysis.date).toLocaleDateString(),
    comunicacao: analysis.validatedScales?.das?.consenso || 0,
    conexaoEmocional: analysis.emotionalDynamics?.synchronicity || 0,
    apoioMutuo: analysis.validatedScales?.das?.coesao || 0,
    transparenciaConfianca: analysis.validatedScales?.das?.satisfacao || 0,
    intimidadeFisica: analysis.emotionalDynamics?.intimacyBalance?.score || 0,
    saudeMental: analysis.validatedScales?.gottman?.resolucaoConflitos || 0,
    resolucaoConflitos: analysis.emotionalDynamics?.conflictResolution?.effectiveness || 0,
    segurancaRelacionamento: analysis.validatedScales?.attachment?.securityLevel || 0,
    satisfacaoGeral: analysis.validatedScales?.das?.total || 0
  }), []);

  const processRadarData = useCallback((analysis: RelationshipAnalysis) => 
    Object.entries(METRICS).map(([key, label]) => ({
      subject: label,
      score: analysis.validatedScales?.das?.[key as keyof typeof analysis.validatedScales.das] || 0,
      fullMark: 5
    })), []);

  const processIntimacyData = useCallback((analysis: RelationshipAnalysis) => [
    {
      name: 'Emocional',
      value: analysis.emotionalDynamics?.intimacyBalance?.areas?.emotional || 0
    },
    {
      name: 'Física',
      value: analysis.emotionalDynamics?.intimacyBalance?.areas?.physical || 0
    },
    {
      name: 'Intelectual',
      value: analysis.emotionalDynamics?.intimacyBalance?.areas?.intellectual || 0
    },
    {
      name: 'Compartilhada',
      value: analysis.emotionalDynamics?.intimacyBalance?.areas?.shared || 0
    }
  ], []);

  // Add retry mechanism for data fetching
  const fetchWithRetry = useCallback(async (retries = 3) => {
    if (!currentUser?.uid) return null;
    
    for (let i = 0; i < retries; i++) {
      try {
        const data = await getAnalysisHistory(currentUser.uid);
        return data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch analysis history
        const analysisHistory = await fetchWithRetry();
        
        if (!analysisHistory || analysisHistory.length === 0) {
          setChartData([]);
          setRadarData([]);
          setIntimacyBalanceData([]);
          setLoading(false);
          return;
        }

        // Process chart data
        const processedChartData = analysisHistory
          .filter(record => record.analysis && typeof record.analysis === 'object')
          .map(record => {
            const analysis = record.analysis as RelationshipAnalysis;
            return processMetrics(analysis);
          });

        // Process radar data
        const latestAnalysis = analysisHistory[0]?.analysis as RelationshipAnalysis;
        if (latestAnalysis) {
          const radarMetrics = processRadarData(latestAnalysis);
          setRadarData(radarMetrics);

          // Process intimacy balance data
          const intimacyData = processIntimacyData(latestAnalysis);
          setIntimacyBalanceData(intimacyData);
        }

        setChartData(processedChartData);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err instanceof Error ? err : new Error('Failed to load statistics'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?.uid, processMetrics, processRadarData, processIntimacyData, fetchWithRetry]);

  useEffect(() => {
    const fetchMoodEntries = async () => {
      if (!currentUser?.uid || !userData?.partnerId) return;

      try {
        // Fetch user's mood entries
        const userMoodQuery = query(
          collection(db, 'moodEntries'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(30)
        );
        const userMoodSnapshot = await getDocs(userMoodQuery);
        const userMoods = userMoodSnapshot.docs.map(doc => doc.data() as MoodEntry);
        setMoodEntries(userMoods);

        // Fetch partner's mood entries
        const partnerMoodQuery = query(
          collection(db, 'moodEntries'),
          where('userId', '==', userData.partnerId),
          orderBy('timestamp', 'desc'),
          limit(30)
        );
        const partnerMoodSnapshot = await getDocs(partnerMoodQuery);
        const partnerMoods = partnerMoodSnapshot.docs.map(doc => doc.data() as MoodEntry);
        setPartnerMoodEntries(partnerMoods);

      } catch (error) {
        console.error('Error fetching mood entries:', error);
      }
    };

    fetchMoodEntries();
  }, [currentUser, userData]);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!currentUser?.uid) return;
      
      const assessmentsRef = collection(db, 'assessments');
      const q = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(30)
      );

      try {
        const querySnapshot = await getDocs(q);
        const assessmentData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as DailyAssessmentWithRatings[];
        setAssessments(assessmentData);
      } catch (err) {
        console.error('Error fetching assessments:', err);
      }
    };

    fetchAssessments();
  }, [currentUser?.uid]);

  const generateAnalysis = async () => {
    if (!currentUser || !userData?.partnerId) return;

    try {
      setGeneratingAnalysis(true);
      setError(null);

      const now = new Date().toISOString();
      const userDailyAssessment: DailyAssessment = {
        id: `assessment_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId || '',
        date: now,
        timestamp: now,
        createdAt: now,
        type: 'collective',
        emotionalSecurity: 0,
        intimacy: 0,
        communication: 0,
        trust: 0,
        mood: {
          primary: 'neutral',
          intensity: 0,
          notes: ''
        },
        ratings: defaultRatings,
        validatedScales: {
          das: {
            total: 0,
            satisfacao: 0,
            coesao: 0,
            consenso: 0,
            expressaoAfetiva: 0
          }
        },
        context: {
          communication: { hadMeaningfulTalk: false, feltUnderstood: false, topics: [], quality: 0 },
          conflict: { hadConflict: false, resolvedSameDay: false, impactOnMood: 0 },
          support: { neededSupport: false, receivedSupport: false, supportType: [] },
          activities: { didActivity: false, type: [], enjoyment: 0 },
          crisis: {
            hadSignificantCrises: false,
            crisisType: 'emotional' as const,
            attemptedSolutions: false,
            solutionType: [],
            impactLevel: 'low' as const,
            resolutionStatus: 'unresolved' as const
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        }
      };

      const partnerDailyAssessment: DailyAssessment = {
        id: `assessment_${new Date().getTime()}_partner`,
        userId: userData.partnerId || '',
        partnerId: currentUser?.uid || '',
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: 'collective',
        emotionalSecurity: 0,
        intimacy: 0,
        communication: 0,
        trust: 0,
        mood: {
          primary: 'neutral',
          intensity: 0,
          notes: ''
        },
        ratings: defaultRatings,
        validatedScales: {
          das: {
            total: 0,
            satisfacao: 0,
            coesao: 0,
            consenso: 0,
            expressaoAfetiva: 0
          }
        },
        context: {
          communication: { hadMeaningfulTalk: false, feltUnderstood: false, topics: [], quality: 0 },
          conflict: { hadConflict: false, resolvedSameDay: false, impactOnMood: 0 },
          support: { neededSupport: false, receivedSupport: false, supportType: [] },
          activities: { didActivity: false, type: [], enjoyment: 0 },
          crisis: {
            hadSignificantCrises: false,
            crisisType: 'emotional' as const,
            attemptedSolutions: false,
            solutionType: [],
            impactLevel: 'low' as const,
            resolutionStatus: 'unresolved' as const
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        }
      };

      // Create daily assessments for analysis
      const userAnalysisAssessment = {
        ...userDailyAssessment,
        timestamp: now,
        createdAt: now,
        emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
        intimacy: userAssessment.ratings.intimidadeFisica || 0,
        communication: userAssessment.ratings.comunicacao || 0,
        trust: userAssessment.ratings.transparenciaConfianca || 0,
        context: {
          communication: { hadMeaningfulTalk: false, feltUnderstood: false, topics: [], quality: 0 },
          conflict: { hadConflict: false, resolvedSameDay: false, impactOnMood: 0 },
          support: { neededSupport: false, receivedSupport: false, supportType: [] },
          activities: { didActivity: false, type: [], enjoyment: 0 },
          crisis: {
            hadSignificantCrises: false,
            crisisType: 'emotional' as const,
            attemptedSolutions: false,
            solutionType: [],
            impactLevel: 'low' as const,
            resolutionStatus: 'unresolved' as const
          }
        }
      };

      const partnerAnalysisAssessment = {
        ...partnerDailyAssessment,
        timestamp: now,
        createdAt: now,
        emotionalSecurity: partnerAssessment.ratings.segurancaRelacionamento || 0,
        intimacy: partnerAssessment.ratings.intimidadeFisica || 0,
        communication: partnerAssessment.ratings.comunicacao || 0,
        trust: partnerAssessment.ratings.transparenciaConfianca || 0,
        context: {
          communication: { hadMeaningfulTalk: false, feltUnderstood: false, topics: [], quality: 0 },
          conflict: { hadConflict: false, resolvedSameDay: false, impactOnMood: 0 },
          support: { neededSupport: false, receivedSupport: false, supportType: [] },
          activities: { didActivity: false, type: [], enjoyment: 0 },
          crisis: {
            hadSignificantCrises: false,
            crisisType: 'emotional' as const,
            attemptedSolutions: false,
            solutionType: [],
            impactLevel: 'low' as const,
            resolutionStatus: 'unresolved' as const
          }
        }
      };

      const defaultContext = createDefaultRelationshipContext();
      const defaultGottmanData: GottmanAssessmentData = {
        id: `gottman_${new Date().getTime()}`,
        userId: '',
        partnerId: '',
        date: new Date().toISOString(),
        type: 'gottman_metrics',
        emotionalSecurity: 0,
        intimacy: 0,
        communication: 0,
        trust: 0,
        mood: {
          primary: 'neutral',
          intensity: 0
        },
        ratings: {
          satisfacaoGeral: 0,
          alinhamentoObjetivos: 0,
          conexaoEmocional: 0,
          apoioMutuo: 0,
          segurancaRelacionamento: 0,
          comunicacao: 0,
          intimidade: 0,
          resolucaoConflitos: 0,
          transparenciaConfianca: 0,
          intimidadeFisica: 0,
          saudeMental: 0,
          autocuidado: 0,
          gratidao: 0,
          qualidadeTempo: 0
        },
        validatedScales: {
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
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      const relationshipAnalysis = await generateRelationshipAnalysis(
        userAnalysisAssessment,
        partnerAnalysisAssessment,
        defaultContext,
        defaultGottmanData
      );

      const analysisData: RelationshipAnalysis = {
        id: `analysis_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId || '',
        date: new Date().toISOString(),
        type: 'collective',
        overallHealth: {
          score: 0,
          trend: 'stable' as const,
          confidence: 0.8,
          emotionalSync: 0.7
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
          synchronicity: 0.7,
          stability: 0.8,
          emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
          intimacyBalance: {
            score: (userAssessment.ratings.intimidadeFisica + partnerAssessment.ratings.intimidadeFisica) / 2,
            areas: {
              emotional: userAssessment.ratings.conexaoEmocional || 0,
              physical: userAssessment.ratings.intimidadeFisica || 0,
              intellectual: userAssessment.ratings.alinhamentoObjetivos || 0,
              shared: userAssessment.ratings.qualidadeTempo || 0
            }
          },
          conflictResolution: {
            style: 'collaborative',
            effectiveness: userAssessment.ratings.resolucaoConflitos || 0,
            patterns: [],
            confidence: 0.8
          },
          patterns: {
            user: {
              dominant: 'neutral' as MoodType,
              frequency: {
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
              },
              transitions: {}
            },
            partner: {
              dominant: 'neutral' as MoodType,
              frequency: {
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
              },
              transitions: {}
            }
          },
          insights: {
            strengths: [],
            challenges: [],
            recommendations: []
          }
        },
        emotionalSync: calculateEmotionalSync(moodEntries, partnerMoodEntries),
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
          },
          csi: {
            satisfacaoGlobal: 0,
            estabilidade: 0,
            comprometimento: 0,
            comunicacao: 0,
            gestaoConflitos: 0,
            atividadesCompartilhadas: 0,
            total: 0
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
            attachmentStyle: 'secure' as AttachmentStyle
          }
        },
        gptAnalysis: relationshipAnalysis.gptAnalysis || {
          id: `gpt_${new Date().getTime()}`,
          userId: currentUser.uid,
          partnerId: userData.partnerId || '',
          date: new Date().toISOString(),
          type: 'collective',
          analysis: {
            moodPatterns: {
              user: {
                dominant: 'neutral' as MoodType,
                frequency: {
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
                },
                transitions: {}
              },
              partner: {
                dominant: 'neutral' as MoodType,
                frequency: {
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
                },
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
              quality: calculateOverallQuality(
                assessments.filter(entry => {
                  const entryDate = new Date(entry.date);
                  return entryDate <= selectedDate && entry.ratings?.comunicacao !== undefined;
                }).map(entry => ({
                  id: entry.id,
                  userId: entry.userId,
                  content: {
                    quality: entry.ratings?.comunicacao ?? 0,
                    resolution: entry.ratings?.resolucaoConflitos ?? 0,
                    emotionalTone: entry.mood?.intensity ?? 0,
                    topics: []
                  },
                  timestamp: entry.date
                }))
              ),
              frequency: assessments.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate <= selectedDate && (entry.ratings?.comunicacao ?? 0) > 0;
              }).length,
              depth: assessments.reduce((acc, entry) => {
                if (new Date(entry.date) <= selectedDate && entry.ratings?.comunicacao) {
                  return acc + entry.ratings.comunicacao;
                }
                return acc;
              }, 0) / Math.max(1, assessments.filter(entry => entry.ratings?.comunicacao !== undefined).length),
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
            assessmentCount: 1,
            timeSpan: '1 day',
            confidence: 0.8
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        },
        clinicalSignificance: {
          gaps: [],
          riskFactors: [],
          protectiveFactors: [],
          recommendations: [],
          severity: 'low',
          confidence: 0.8
        }
      };

      await saveAnalysis(
        currentUser.uid,
        'collective',
        analysisData,
        userData.partnerId || undefined
      );

      setSnackbarMessage('Análise gerada com sucesso!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      setError(new Error('Failed to generate analysis'));
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleGenerateCollectiveAnalysis = async () => {
    if (!currentUser || !userData?.partnerId) return;

    try {
      setGeneratingAnalysis(true);
      setError(null);

      const userDailyAssessment: DailyAssessment = {
        id: `assessment_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId || '',
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: 'collective',
        emotionalSecurity: 0,
        intimacy: 0,
        communication: 0,
        trust: 0,
        mood: {
          primary: 'neutral',
          intensity: 0,
          notes: ''
        },
        ratings: defaultRatings,
        validatedScales: {
          das: {
            total: 0,
            satisfacao: 0,
            coesao: 0,
            consenso: 0,
            expressaoAfetiva: 0
          }
        },
        context: {
          communication: { hadMeaningfulTalk: false, feltUnderstood: false, topics: [], quality: 0 },
          conflict: { hadConflict: false, resolvedSameDay: false, impactOnMood: 0 },
          support: { neededSupport: false, receivedSupport: false, supportType: [] },
          activities: { didActivity: false, type: [], enjoyment: 0 },
          crisis: {
            hadSignificantCrises: false,
            crisisType: 'emotional' as const,
            attemptedSolutions: false,
            solutionType: [],
            impactLevel: 'low' as const,
            resolutionStatus: 'unresolved' as const
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        }
      };

      const partnerDailyAssessment: DailyAssessment = {
        id: `assessment_${new Date().getTime()}_partner`,
        userId: userData.partnerId || '',
        partnerId: currentUser?.uid || '',
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: 'collective',
        emotionalSecurity: 0,
        intimacy: 0,
        communication: 0,
        trust: 0,
        mood: {
          primary: 'neutral',
          intensity: 0,
          notes: ''
        },
        ratings: defaultRatings,
        validatedScales: {
          das: {
            total: 0,
            satisfacao: 0,
            coesao: 0,
            consenso: 0,
            expressaoAfetiva: 0
          }
        },
        context: {
          communication: { hadMeaningfulTalk: false, feltUnderstood: false, topics: [], quality: 0 },
          conflict: { hadConflict: false, resolvedSameDay: false, impactOnMood: 0 },
          support: { neededSupport: false, receivedSupport: false, supportType: [] },
          activities: { didActivity: false, type: [], enjoyment: 0 },
          crisis: {
            hadSignificantCrises: false,
            crisisType: 'emotional' as const,
            attemptedSolutions: false,
            solutionType: [],
            impactLevel: 'low' as const,
            resolutionStatus: 'unresolved' as const
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        }
      };

      const defaultContext = createDefaultRelationshipContext();
      const defaultGottmanData: GottmanAssessmentData = {
        id: `gottman_${new Date().getTime()}`,
        userId: '',
        partnerId: '',
        date: new Date().toISOString(),
        type: 'gottman_metrics',
        emotionalSecurity: 0,
        intimacy: 0,
        communication: 0,
        trust: 0,
        mood: {
          primary: 'neutral',
          intensity: 0
        },
        ratings: {
          satisfacaoGeral: 0,
          alinhamentoObjetivos: 0,
          conexaoEmocional: 0,
          apoioMutuo: 0,
          segurancaRelacionamento: 0,
          comunicacao: 0,
          intimidade: 0,
          resolucaoConflitos: 0,
          transparenciaConfianca: 0,
          intimidadeFisica: 0,
          saudeMental: 0,
          autocuidado: 0,
          gratidao: 0,
          qualidadeTempo: 0
        },
        validatedScales: {
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
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      const relationshipAnalysis = await generateRelationshipAnalysis(
        userDailyAssessment,
        partnerDailyAssessment,
        defaultContext,
        defaultGottmanData
      );

      const analysisData: RelationshipAnalysis = {
        id: `analysis_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId || '',
        date: new Date().toISOString(),
        type: 'collective',
        overallHealth: {
          score: 0,
          trend: 'stable' as const,
          confidence: 0.8,
          emotionalSync: 0.7
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
          synchronicity: 0.7,
          stability: 0.8,
          emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
          intimacyBalance: {
            score: (userAssessment.ratings.intimidadeFisica + partnerAssessment.ratings.intimidadeFisica) / 2,
            areas: {
              emotional: userAssessment.ratings.conexaoEmocional || 0,
              physical: userAssessment.ratings.intimidadeFisica || 0,
              intellectual: userAssessment.ratings.alinhamentoObjetivos || 0,
              shared: userAssessment.ratings.qualidadeTempo || 0
            }
          },
          conflictResolution: {
            style: 'collaborative',
            effectiveness: userAssessment.ratings.resolucaoConflitos || 0,
            patterns: [],
            confidence: 0.8
          },
          patterns: {
            user: {
              dominant: 'neutral' as MoodType,
              frequency: {
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
              },
              transitions: {}
            },
            partner: {
              dominant: 'neutral' as MoodType,
              frequency: {
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
              },
              transitions: {}
            }
          },
          insights: {
            strengths: [],
            challenges: [],
            recommendations: []
          }
        },
        emotionalSync: calculateEmotionalSync(moodEntries, partnerMoodEntries),
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
          },
          csi: {
            satisfacaoGlobal: 0,
            estabilidade: 0,
            comprometimento: 0,
            comunicacao: 0,
            gestaoConflitos: 0,
            atividadesCompartilhadas: 0,
            total: 0
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
            attachmentStyle: 'secure' as AttachmentStyle
          }
        },
        gptAnalysis: relationshipAnalysis.gptAnalysis || {
          id: `gpt_${new Date().getTime()}`,
          userId: currentUser.uid,
          partnerId: userData.partnerId || '',
          date: new Date().toISOString(),
          type: 'collective',
          analysis: {
            moodPatterns: {
              user: {
                dominant: 'neutral' as MoodType,
                frequency: {
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
                },
                transitions: {}
              },
              partner: {
                dominant: 'neutral' as MoodType,
                frequency: {
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
                },
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
              quality: calculateOverallQuality(
                assessments.filter(entry => {
                  const entryDate = new Date(entry.date);
                  return entryDate <= selectedDate && entry.ratings?.comunicacao !== undefined;
                }).map(entry => ({
                  id: entry.id,
                  userId: entry.userId,
                  content: {
                    quality: entry.ratings?.comunicacao ?? 0,
                    resolution: entry.ratings?.resolucaoConflitos ?? 0,
                    emotionalTone: entry.mood?.intensity ?? 0,
                    topics: []
                  },
                  timestamp: entry.date
                }))
              ),
              frequency: assessments.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate <= selectedDate && (entry.ratings?.comunicacao ?? 0) > 0;
              }).length,
              depth: assessments.reduce((acc, entry) => {
                if (new Date(entry.date) <= selectedDate && entry.ratings?.comunicacao) {
                  return acc + entry.ratings.comunicacao;
                }
                return acc;
              }, 0) / Math.max(1, assessments.filter(entry => entry.ratings?.comunicacao !== undefined).length),
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
            assessmentCount: 1,
            timeSpan: '1 day',
            confidence: 0.8
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        },
        clinicalSignificance: {
          gaps: [],
          riskFactors: [],
          protectiveFactors: [],
          recommendations: [],
          severity: 'low',
          confidence: 0.8
        }
      };

      await saveAnalysis(
        currentUser.uid,
        'collective',
        analysisData,
        userData.partnerId || undefined
      );

      setSnackbarMessage('Análise coletiva gerada com sucesso!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to generate collective analysis:', error);
      setError(new Error('Failed to generate collective analysis'));
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <Container>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              Please log in to view statistics.
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!userData?.partnerId) {
    return (
      <Layout>
        <Container>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              You need to connect with your partner to view relationship statistics.
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <Alert severity="error" sx={{ mt: 2 }}>
            {String(error)}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Box sx={{ mt: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: 2,
            mb: 3 
          }}>
            <Typography variant="h4" sx={{ 
              fontSize: { xs: '1.75rem', sm: '2rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              Estatísticas do Relacionamento
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<PsychologyIcon />}
                onClick={generateAnalysis}
                disabled={generatingAnalysis}
                fullWidth
              >
                Análise Individual
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<GroupIcon />}
                onClick={handleGenerateCollectiveAnalysis}
                disabled={generatingAnalysis}
                fullWidth
              >
                Análise do Casal
              </Button>
            </Stack>
          </Box>

          {generatingAnalysis && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Gerando análise...
              </Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Radar Chart - Overview */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Visão Geral do Relacionamento
                </Typography>
                <ChartErrorBoundary>
                  <Box sx={{ height: 400 }}>
                    {loading ? <ChartSkeleton /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis domain={[0, 10]} />
                          <Radar
                            name="You"
                            dataKey="user"
                            stroke={theme.palette.primary.main}
                            fill={theme.palette.primary.main}
                            fillOpacity={0.3}
                          />
                          <Radar
                            name="Partner"
                            dataKey="partner"
                            stroke={theme.palette.secondary.main}
                            fill={theme.palette.secondary.main}
                            fillOpacity={0.3}
                          />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </ChartErrorBoundary>
              </Paper>
            </Grid>

            {/* Intimacy Balance Radar Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Intimacy Balance
                </Typography>
                <ChartErrorBoundary>
                  <Box sx={{ height: 400 }}>
                    {loading ? <ChartSkeleton /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={intimacyBalanceData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis domain={[0, 5]} />
                          <Radar
                            name="You"
                            dataKey="user"
                            stroke={theme.palette.primary.main}
                            fill={theme.palette.primary.main}
                            fillOpacity={0.3}
                          />
                          <Radar
                            name="Partner"
                            dataKey="partner"
                            stroke={theme.palette.secondary.main}
                            fill={theme.palette.secondary.main}
                            fillOpacity={0.3}
                          />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </ChartErrorBoundary>
              </Paper>
            </Grid>

            {/* Emotional Security Line Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Emotional Security Over Time
                </Typography>
                <ChartErrorBoundary>
                  <Box sx={{ height: 400 }}>
                    {loading ? <ChartSkeleton /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="userEmotionalSecurity"
                            name="Your Emotional Security"
                            stroke={theme.palette.primary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="partnerEmotionalSecurity"
                            name="Partner's Emotional Security"
                            stroke={theme.palette.secondary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </ChartErrorBoundary>
              </Paper>
            </Grid>

            {/* Conflict Resolution Line Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Conflict Resolution Effectiveness
                </Typography>
                <ChartErrorBoundary>
                  <Box sx={{ height: 400 }}>
                    {loading ? <ChartSkeleton /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="userConflictResolution"
                            name="Your Conflict Resolution"
                            stroke={theme.palette.primary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="partnerConflictResolution"
                            name="Partner's Conflict Resolution"
                            stroke={theme.palette.secondary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </ChartErrorBoundary>
              </Paper>
            </Grid>

            {/* Overall Satisfaction Line Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Satisfaction
                </Typography>
                <ChartErrorBoundary>
                  <Box sx={{ height: 400 }}>
                    {loading ? <ChartSkeleton /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="userSatisfacaoGeral"
                            name="Your Overall Satisfaction"
                            stroke={theme.palette.primary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="partnerSatisfacaoGeral"
                            name="Partner's Overall Satisfaction"
                            stroke={theme.palette.secondary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </ChartErrorBoundary>
              </Paper>
            </Grid>
          </Grid>

          <Dialog
            open={analysisDialog.open}
            onClose={() => setAnalysisDialog({ open: false, title: '', content: {} as AnalysisDialogContent })}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>{analysisDialog.title}</DialogTitle>
            <DialogContent dividers>
              {typeof analysisDialog.content === 'object' && 'type' in analysisDialog.content && analysisDialog.content.type === 'consensus_form' ? (
                <Typography>{JSON.stringify(analysisDialog.content || 'No analysis available')}</Typography>
              ) : (
                <RelationshipAnalysisComponent analysis={
                  typeof analysisDialog.content === 'string' || 'type' in analysisDialog.content 
                    ? {
                        context: createDefaultRelationshipContext() as unknown as RelationshipContext,
                        communicationPatterns: {} as CommunicationPatterns,
                        emotionalDynamics: {
                          synchronicity: 0.8,
                          stability: 0.7,
                          emotionalSecurity: userAssessment.ratings.segurancaRelacionamento || 0,
                          intimacyBalance: {
                            score: (userAssessment.ratings.intimidadeFisica + partnerAssessment.ratings.intimidadeFisica) / 2,
                            areas: {
                              emotional: userAssessment.ratings.conexaoEmocional || 0,
                              physical: userAssessment.ratings.intimidadeFisica || 0,
                              intellectual: userAssessment.ratings.alinhamentoObjetivos || 0,
                              shared: userAssessment.ratings.qualidadeTempo || 0
                            }
                          },
                          conflictResolution: {
                            style: 'collaborative',
                            effectiveness: userAssessment.ratings.resolucaoConflitos || 0,
                            patterns: [],
                            confidence: 0.8
                          },
                          patterns: {
                            user: {
                              dominant: 'neutral' as MoodType,
                              frequency: {
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
                              },
                              transitions: {}
                            },
                            partner: {
                              dominant: 'neutral' as MoodType,
                              frequency: {
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
                              },
                              transitions: {}
                            }
                          },
                          insights: {
                            strengths: [],
                            challenges: [],
                            recommendations: []
                          }
                        } as EmotionalDynamics,
                        stage: {
                          current: 'initial',
                          nextSteps: [],
                          timelineEstimate: '1 day'
                        },
                        temporalAnalysis: {
                          correlation: 0,
                          trends: {
                            overall: defaultTrendAnalysis
                          },
                          patterns: {
                            cyclical: [],
                            persistent: [],
                            emerging: []
                          },
                          timeframes: {
                            daily: defaultTimeframeAnalysis,
                            weekly: defaultTimeframeAnalysis,
                            monthly: defaultTimeframeAnalysis
                          },
                          seasonality: 0,
                          volatility: 0,
                          confidence: 0.8,
                          analysisDate: new Date().toISOString()
                        },
                        validation: {
                          consistency: {},
                          reliability: 0,
                          completeness: 0,
                          recommendations: []
                        },
                        attachmentStyle: {
                          user: '',
                          partner: '',
                          compatibility: 0
                        },
                        relationshipAnalysis: {} as RelationshipAnalysis,
                        overallHealth: {
                          score: 0,
                          trend: 'stable' as 'improving' | 'stable' | 'declining',
                          confidence: 0.8
                        }
                      } as ComprehensiveAnalysis
                    : analysisDialog.content as ComprehensiveAnalysis
                } />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAnalysisDialog({ open: false, title: '', content: {} as AnalysisDialogContent })}>
                Fechar
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
          />
        </Box>
      </Container>
    </Layout>
  );
} 