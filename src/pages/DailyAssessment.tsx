import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Typography,
  Alert,
  Rating,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  Info as InfoIcon,
  Check,
  SentimentVerySatisfied,
  SentimentVeryDissatisfied
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import {
  CategoryRatings,
  MoodEntry,
  GPTAnalysis,
  RelationshipAnalysis,
  ValidatedScalesAnalysis,
  Mood,
  DailyAssessmentForm,
  AttachmentStyle,
  RelationshipContext
} from '../types';
import type { AssessmentType, DailyAssessment as IDailyAssessment } from '../types';
import { RelationshipOrchestrator } from '../services/relationshipOrchestratorNew';
import { collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getLatestAnalysis } from '../services/gptAnalysisService';
import { ValidatedScalesTab } from '../components/ValidatedScalesTab';

/**
 * DailyAssessment Component
 * 
 * Handles daily relationship assessments and mood tracking.
 * Uses MoodEntry directly for mood tracking instead of the simpler MoodTrackingForm
 * for better integration with the mood analysis system.
 */

type MoodType = typeof MOOD_TYPES[keyof typeof MOOD_TYPES];

const MOOD_TYPES = {
  HAPPY: 'feliz',
  EXCITED: 'animado',
  GRATEFUL: 'grato',
  CALM: 'calmo',
  SATISFIED: 'satisfeito',
  LOVED: 'amado',
  ANXIOUS: 'ansioso',
  STRESSED: 'estressado',
  SAD: 'triste',
  ANGRY: 'irritado',
  FRUSTRATED: 'frustrado',
  TIRED: 'exausto',
  CONFUSED: 'confuso',
  LONELY: 'solitário',
  NEUTRAL: 'neutral',
  CONTENT: 'content'
} as const;

const MOOD_DESCRIPTIONS: Record<string, string> = {
  [MOOD_TYPES.HAPPY]: 'Você está se sentindo alegre e positivo hoje!',
  [MOOD_TYPES.EXCITED]: 'Você está animado e cheio de energia!',
  [MOOD_TYPES.GRATEFUL]: 'Você está sentindo gratidão!',
  [MOOD_TYPES.CALM]: 'Um estado tranquilo e equilibrado.',
  [MOOD_TYPES.SATISFIED]: 'Você está contente com o momento atual.',
  [MOOD_TYPES.LOVED]: 'Você se sente querido e valorizado!',
  [MOOD_TYPES.ANXIOUS]: 'Você está se sentindo inquieto ou preocupado.',
  [MOOD_TYPES.STRESSED]: 'Você está sob pressão ou tensão hoje.',
  [MOOD_TYPES.SAD]: 'Você está se sentindo triste hoje.',
  [MOOD_TYPES.ANGRY]: 'Você está irritado com algo.',
  [MOOD_TYPES.FRUSTRATED]: 'Algo está te incomodando.',
  [MOOD_TYPES.TIRED]: 'Você está se sentindo sem energia.',
  [MOOD_TYPES.CONFUSED]: 'Você está com dúvidas ou incertezas.',
  [MOOD_TYPES.LONELY]: 'Você está se sentindo sozinho.',
  [MOOD_TYPES.NEUTRAL]: 'Você está se sentindo neutro.',
  [MOOD_TYPES.CONTENT]: 'Você está satisfeito e em paz.'
};

const INTENSITY_DESCRIPTIONS: Record<number, string> = {
  1: 'Muito pouco',
  2: 'Um pouco',
  3: 'Moderado',
  4: 'Bastante',
  5: 'Extremamente'
};

const ASSESSMENT_CATEGORIES: Record<keyof CategoryRatings, { label: string; description: string; tip: string }> = {
  satisfacaoGeral: {
    label: 'Satisfação Geral',
    description: 'Qual seu nível de satisfação geral com o relacionamento hoje?',
    tip: 'Avalie sua satisfação geral com o relacionamento.'
  },
  alinhamentoObjetivos: {
    label: 'Alinhamento de Objetivos',
    description: 'Como você avalia o alinhamento de objetivos entre vocês?',
    tip: 'Considere metas e planos compartilhados.'
  },
  conexaoEmocional: {
    label: 'Conexão Emocional',
    description: 'Você sentiu uma conexão emocional com seu parceiro hoje?',
    tip: 'Pense na empatia e proximidade emocional.'
  },
  apoioMutuo: {
    label: 'Apoio Mútuo',
    description: 'Você se sentiu apoiado(a) pelo seu parceiro hoje?',
    tip: 'Considere o suporte emocional e prático.'
  },
  segurancaRelacionamento: {
    label: 'Segurança no Relacionamento',
    description: 'Quão seguro você se sente no relacionamento hoje?',
    tip: 'Avalie seu sentimento de estabilidade e confiança.'
  },
  comunicacao: {
    label: 'Comunicação',
    description: 'A comunicação com seu parceiro foi aberta e clara hoje?',
    tip: 'Considere se você se sentiu ouvido e compreendido.'
  },
  intimidade: {
    label: 'Intimidade',
    description: 'Como você avalia a intimidade geral do relacionamento hoje?',
    tip: 'Considere a proximidade emocional e física.'
  },
  resolucaoConflitos: {
    label: 'Resolução de Conflitos',
    description: 'Como você avalia a resolução de conflitos hoje?',
    tip: 'Considere como vocês lidaram com desacordos.'
  },
  transparenciaConfianca: {
    label: 'Transparência e Confiança',
    description: 'Você sentiu que houve transparência e confiança entre vocês hoje?',
    tip: 'Avalie a honestidade na comunicação.'
  },
  intimidadeFisica: {
    label: 'Intimidade Física',
    description: 'Como está a intimidade física no relacionamento?',
    tip: 'Inclui contato físico e intimidade.'
  },
  saudeMental: {
    label: 'Saúde Mental',
    description: 'Como você avaliaria seu estado mental hoje?',
    tip: 'Considere seu bem-estar emocional.'
  },
  autocuidado: {
    label: 'Autocuidado',
    description: 'Como você avalia seu autocuidado hoje?',
    tip: 'Considere suas práticas de bem-estar pessoal.'
  },
  gratidao: {
    label: 'Gratidão',
    description: 'Quanto você se sente grato pelo seu relacionamento hoje?',
    tip: 'Reflita sobre aspectos positivos do relacionamento.'
  },
  qualidadeTempo: {
    label: 'Qualidade do Tempo',
    description: 'Como você avalia a qualidade do tempo juntos hoje?',
    tip: 'Considere momentos significativos compartilhados.'
  }
};

const MOOD_CATEGORIES = {
  POSITIVE: [
    MOOD_TYPES.HAPPY,
    MOOD_TYPES.EXCITED,
    MOOD_TYPES.GRATEFUL,
    MOOD_TYPES.CALM,
    MOOD_TYPES.SATISFIED,
    MOOD_TYPES.LOVED
  ] as MoodType[],
  NEUTRAL: [
    MOOD_TYPES.NEUTRAL,
    MOOD_TYPES.CONTENT
  ] as MoodType[],
  CHALLENGING: [
    MOOD_TYPES.ANXIOUS,
    MOOD_TYPES.STRESSED,
    MOOD_TYPES.SAD,
    MOOD_TYPES.ANGRY,
    MOOD_TYPES.FRUSTRATED,
    MOOD_TYPES.TIRED,
    MOOD_TYPES.CONFUSED,
    MOOD_TYPES.LONELY
  ] as MoodType[]
};

const DailyAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [ratings, setRatings] = useState<CategoryRatings>({
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
  });
  const [mood, setMood] = useState<Mood>({
    primary: 'neutral',
    intensity: 3,
    notes: ''
  });
  const [comments, setComments] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [analysisResult, setAnalysisResult] = useState<GPTAnalysis | null>(null);
  const [relationshipAnalysis, setRelationshipAnalysis] = useState<RelationshipAnalysis | null>(null);
  const [scalesAnalysis, setScalesAnalysis] = useState<ValidatedScalesAnalysis | null>(null);
  const orchestrator = useMemo(() => new RelationshipOrchestrator(), []);
  const [partnerAssessment, setPartnerAssessment] = useState<IDailyAssessment | undefined>();
  const [hasCheckedPartnerAssessment, setHasCheckedPartnerAssessment] = useState(false);
  const [submittedAssessment, setSubmittedAssessment] = useState<IDailyAssessment | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<{
    userSubmitted: boolean;
    partnerSubmitted: boolean;
    lastCheck: Date | null;
    checkingPartner: boolean;
    analysisConfidence: number;
    completeness: {
      user: number;
      partner: number;
    };
  }>({
    userSubmitted: false,
    partnerSubmitted: false,
    lastCheck: null,
    checkingPartner: false,
    analysisConfidence: 0,
    completeness: {
      user: 0,
      partner: 0
    }
  });

  const calculateCompleteness = (assessment: IDailyAssessment): number => {
    const totalFields = Object.keys(assessment.ratings || {}).length;
    if (totalFields === 0) return 0;
    
    const filledFields = Object.values(assessment.ratings || {})
      .filter(v => v !== undefined && v !== null && v > 0)
      .length;
    
    return filledFields / totalFields;
  };

  const checkPartnerAssessment = useCallback(async () => {
    if (!userData?.partnerId || !currentUser) return undefined;
    
    setAssessmentStatus(prev => ({
      ...prev,
      checkingPartner: true,
      lastCheck: new Date()
    }));
    
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const partnerAssessmentsRef = collection(db, 'assessments');
      const partnerQuery = query(
        partnerAssessmentsRef,
        where('userId', '==', userData.partnerId),
        where('date', '>=', startOfDay.toISOString()),
        where('date', '<=', endOfDay.toISOString()),
        limit(1)
      );
      
      const partnerSnapshot = await getDocs(partnerQuery);
      const partnerAssessment = partnerSnapshot.docs[0]?.data() as IDailyAssessment | undefined;
      
      if (partnerAssessment) {
        setAssessmentStatus(prev => ({
          ...prev,
          partnerSubmitted: true,
          checkingPartner: false,
          completeness: {
            ...prev.completeness,
            partner: calculateCompleteness(partnerAssessment)
          }
        }));
      } else {
        setAssessmentStatus(prev => ({
          ...prev,
          checkingPartner: false
        }));
      }
      
      return partnerAssessment;
    } catch (error) {
      console.error('Error checking partner assessment:', error);
      setAssessmentStatus(prev => ({
        ...prev,
        checkingPartner: false
      }));
      return undefined;
    }
  }, [userData?.partnerId, currentUser]);

  const regenerateAnalysis = useCallback(async (userAssessment: IDailyAssessment, newPartnerAssessment: IDailyAssessment) => {
    if (!currentUser) return;

    try {
      const analysisContext: RelationshipContext = {
        id: `context_${currentUser.uid}_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData?.partnerId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'daily_assessment',
        duration: '0-6 months',
        status: 'dating',
        relationshipStyle: 'monogamous',
        currentDynamics: userAssessment.ratings.comunicacao > 7 ? 'positive' : 'needs_attention',
        userEmotionalState: userAssessment.mood?.primary || 'unknown',
        partnerEmotionalState: newPartnerAssessment.mood?.primary || 'unknown',
        hadSignificantCrises: false,
        crisisDescription: '',
        attemptedSolutions: false,
        solutionsDescription: '',
        routineImpact: userAssessment.ratings.qualidadeTempo > 7 ? 'positive' : 'needs_attention',
        relationshipStatus: 'active',
        livingArrangement: 'unknown',
        communicationStyle: userAssessment.ratings.comunicacao > 7 ? 'open' : 'needs_improvement',
        sharedActivities: [],
        supportSystem: [],
        futureExpectations: '',
        challengeAreas: [],
        strengthAreas: [],
        values: [],
        goals: [],
        challenges: [],
        strengths: [],
        appGoals: [],
        timeSpentTogether: userAssessment.ratings.qualidadeTempo > 7 ? 'sufficient' : 'insufficient',
        qualityTime: userAssessment.ratings.qualidadeTempo > 7 ? 'yes' : 'no',
        qualityTimeDescription: '',
        physicalIntimacy: userAssessment.ratings.intimidadeFisica > 7 ? 'yes' : 'no',
        attachmentStyle: mapAttachmentStyle(userAssessment.validatedScales?.attachment?.attachmentStyle),
        intimacyImprovements: [],
        additionalInfo: '',
        areasNeedingAttention: Object.entries(userAssessment.ratings)
          .filter(([_, value]) => value < 5)
          .map(([key]) => ASSESSMENT_CATEGORIES[key as keyof typeof ASSESSMENT_CATEGORIES].label)
      };

      const moodEntry: MoodEntry = {
        id: `mood_${currentUser.uid}_${new Date().getTime()}`,
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        mood: userAssessment.mood || {
          primary: 'neutral',
          intensity: 5
        }
      };

      const comprehensiveAnalysisResult = await orchestrator.generateComprehensiveAnalysis(
        currentUser.uid,
        analysisContext,
        {
          assessments: [userAssessment, newPartnerAssessment],
          consensusForms: [],
          moodEntries: [moodEntry],
          gottmanAssessment: undefined,
          validatedScales: userAssessment.validatedScales
        }
      );

      if (comprehensiveAnalysisResult.success && 
          comprehensiveAnalysisResult.data?.relationshipAnalysis?.metadata?.confidence !== undefined) {
        const analysisData = comprehensiveAnalysisResult.data;
        
        setAssessmentStatus(prev => ({
          ...prev,
          analysisConfidence: analysisData.relationshipAnalysis.metadata.confidence
        }));
        
        setRelationshipAnalysis(analysisData.relationshipAnalysis);
        setSuccess(prev => `${prev}\n\nAnálise atualizada com a avaliação do parceiro!`);
        
        // Update validated scales analysis with higher confidence
        if (scalesAnalysis) {
          setScalesAnalysis(prev => prev ? {
            ...prev,
            confidence: 0.85 // Higher confidence with both assessments
          } : null);
        }
      }
    } catch (error) {
      console.error('Error regenerating analysis:', error);
    }
  }, [currentUser, userData?.partnerId, setAssessmentStatus, setRelationshipAnalysis, setScalesAnalysis, setSuccess, orchestrator, scalesAnalysis]);

  // Effect for periodic partner assessment checking
  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval>;
    let checkCount = 0;
    const MAX_CHECKS = 12; // Maximum 1 hour of checking (12 * 5 minutes)
    
    if (submittedAssessment && !partnerAssessment && !hasCheckedPartnerAssessment) {
      const checkPartnerSubmission = async () => {
        checkCount++;
        try {
          const updatedPartnerAssessment = await checkPartnerAssessment();
          if (updatedPartnerAssessment) {
            clearInterval(checkInterval);
            setPartnerAssessment(updatedPartnerAssessment);
            setHasCheckedPartnerAssessment(true);
            await regenerateAnalysis(submittedAssessment, updatedPartnerAssessment);
          } else if (checkCount >= MAX_CHECKS) {
            clearInterval(checkInterval);
            setHasCheckedPartnerAssessment(true);
            console.log('Stopped checking for partner assessment after maximum attempts');
          }
        } catch (error) {
          console.error('Error checking partner assessment:', error);
          clearInterval(checkInterval);
          setHasCheckedPartnerAssessment(true);
        }
      };

      // Initial check
      checkPartnerSubmission();
      
      // Set up interval for subsequent checks
      checkInterval = setInterval(checkPartnerSubmission, 5 * 60 * 1000); // Check every 5 minutes
    }
    
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [submittedAssessment, partnerAssessment, hasCheckedPartnerAssessment, checkPartnerAssessment, regenerateAnalysis]);

  // Function to render scales analysis feedback
  const renderScalesAnalysis = () => {
    if (!scalesAnalysis) return null;
    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Análise das Escalas Validadas
        </Typography>
        <ValidatedScalesTab analysis={scalesAnalysis} />
      </Box>
    );
  };

  useEffect(() => {
    const checkTodaySubmission = async () => {
      if (!currentUser?.uid) {
        console.log('No user authenticated');
        navigate('/login');
        return;
      }

      if (!userData?.partnerId) {
        console.log('No partner ID found');
        setError('Por favor, configure seu perfil com as informações do parceiro primeiro.');
        return;
      }

      try {
        // Wait for authentication to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const assessmentsRef = collection(db, 'assessments');
        const q = query(
          assessmentsRef,
          where('userId', '==', currentUser.uid),
          where('date', '>=', startOfDay.toISOString()),
          where('date', '<=', endOfDay.toISOString()),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        setHasSubmittedToday(!snapshot.empty);
      } catch (error) {
        console.error('Error checking today submission:', error);
        if (error instanceof Error && error.message.includes('permission-denied')) {
          setError('Erro de permissão. Por favor, faça login novamente.');
          navigate('/login');
        } else {
          setError('Erro ao verificar submissões. Por favor, tente novamente.');
        }
      }
    };

    checkTodaySubmission();
  }, [currentUser, userData, navigate]);

  useEffect(() => {
    // Update UI when analysis results change
    if (analysisResult && relationshipAnalysis) {
      const communicationPatterns = analysisResult.analysis.communicationMetrics.patterns;
      const relationshipDynamics = analysisResult.analysis.relationshipDynamics;
      const attachmentInsights = analysisResult.analysis.attachmentInsights;
      const relationshipCategories = Object.entries(relationshipAnalysis.categories);
      const relationshipHealth = relationshipAnalysis.overallHealth;

      // Add insights to the success message if available
      if (success && (communicationPatterns?.length > 0 || relationshipDynamics?.recommendations?.length > 0)) {
        const aiMessage = [
          communicationPatterns?.length > 0 ? `\n\nPadrões de Comunicação:\n${communicationPatterns.join('\n')}` : '',
          attachmentInsights?.behaviors?.length > 0 ? `\n\nComportamentos de Apego:\n${attachmentInsights.behaviors.join('\n')}` : '',
          attachmentInsights?.suggestions?.length > 0 ? `\n\nSugestões de Melhoria:\n${attachmentInsights.suggestions.join('\n')}` : '',
          relationshipCategories.length > 0 ? `\n\nAnálise por Categoria:\n${relationshipCategories.map(([category, data]) => 
            `- ${category}: ${data.insights.join(', ')} (Tendência: ${data.trend})`
          ).join('\n')}`
          : '',
          `\n\nSaúde Geral do Relacionamento:\nScore: ${relationshipHealth.score.toFixed(1)}/10\nTendência: ${relationshipHealth.trend}\nConfiança: ${(relationshipHealth.confidence * 100).toFixed(0)}%`
        ].join('');

        setSuccess(prev => {
          // Only update if the AI message isn't already included
          return prev.includes('Padrões de Comunicação') ? prev : prev + aiMessage;
        });
      }
    }
  }, [analysisResult, relationshipAnalysis, success]);

  const handleRatingChange = (categoryId: keyof CategoryRatings) => (value: number | null) => {
    setRatings(prev => ({
      ...prev,
      [categoryId]: value !== null && value >= 0 && value <= 10 ? value : prev[categoryId]
    }));
  };

  const handleMoodChange = (field: keyof Mood) => (
    event: React.ChangeEvent<HTMLInputElement> | { target: { value: string | number } }
  ) => {
    setMood(prev => {
      const value = event.target.value;
      
      // Type guard for mood type
      if (field === 'primary' && typeof value === 'string') {
        const moodType = Object.values(MOOD_TYPES).find(type => type === value) as MoodType;
        if (!moodType) return prev;
        return { ...prev, [field]: moodType };
      }
      
      // Type guard for intensity
      if (field === 'intensity' && typeof value === 'number') {
        if (value < 1 || value > 5) return prev;
        return { ...prev, [field]: value };
      }
      
      // Type guard for notes
      if (field === 'notes' && typeof value === 'string') {
        return { ...prev, [field]: value };
      }
      
      return prev;
    });
  };

  // Helper function to validate mood type
  const isValidMoodType = (value: string): value is MoodType => {
    return Object.values(MOOD_TYPES).includes(value as MoodType);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateForm = (formData: DailyAssessmentForm): { success: boolean; message?: string } => {
    // Check for user and partner IDs
    if (!formData.userId || !formData.partnerId) {
      return {
        success: false,
        message: 'Informações de usuário incompletas.'
      };
    }

    // Check if at least one rating is provided
    const hasAnyRating = Object.values(formData.ratings).some(rating => rating > 0);
    if (!hasAnyRating) {
      return {
        success: false,
        message: 'Por favor, avalie pelo menos uma categoria antes de enviar.'
      };
    }

    // Validate rating values
    const hasInvalidRating = Object.values(formData.ratings).some(
      rating => rating < 0 || rating > 10
    );
    if (hasInvalidRating) {
      return {
        success: false,
        message: 'Todas as avaliações devem estar entre 0 e 10.'
      };
    }

    // Validate mood
    if (!formData.mood) {
      return {
        success: false,
        message: 'Por favor, selecione um humor.'
      };
    }

    if (!formData.mood.primary || !isValidMoodType(formData.mood.primary)) {
      return {
        success: false,
        message: 'Por favor, selecione um humor válido.'
      };
    }

    if (formData.mood.intensity < 1 || formData.mood.intensity > 5) {
      return {
        success: false,
        message: 'A intensidade do humor deve estar entre 1 e 5.'
      };
    }

    // Validate date
    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      return {
        success: false,
        message: 'Data inválida.'
      };
    }

    return { success: true };
  };

  // Add helper functions
  const determineAttachmentStyle = (ratings: CategoryRatings): AttachmentStyle => {
    const security = ratings.segurancaRelacionamento || 0;
    const intimacy = ratings.intimidade || 0;
    
    if (security >= 7 && intimacy >= 7) return 'secure';
    if (security < 5 && intimacy >= 7) return 'anxious';
    if (security >= 7 && intimacy < 5) return 'avoidant';
    return 'disorganized';
  };

  const calculateConfidence = (ratings: CategoryRatings): number => {
    const filledRatings = Object.values(ratings).filter(r => r > 0).length;
    const totalRatings = Object.keys(ratings).length;
    return filledRatings / totalRatings;
  };

  const createMoodEntry = (userId: string, mood: Mood): MoodEntry => ({
    id: `mood_${userId}_${new Date().getTime()}`,
    userId,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    mood: {
      ...mood,
      notes: mood.notes || ''
    },
    context: {
      activities: [],
      triggers: [],
      location: '',
      socialContext: [],
      intensity: mood.intensity,
      duration: 0
    }
  });

  // Validate mood entry before submission
  const validateMoodEntry = (entry: MoodEntry): boolean => {
    if (!entry.userId || !entry.timestamp || !entry.mood) {
      return false;
    }

    if (!isValidMoodType(entry.mood.primary)) {
      return false;
    }

    if (entry.mood.intensity < 1 || entry.mood.intensity > 5) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (!currentUser?.uid) {
      setError('Por favor, faça login para continuar.');
      navigate('/login');
      return;
    }

    if (!userData?.partnerId) {
      setError('Por favor, configure seu perfil com as informações do parceiro primeiro.');
      return;
    }

    // Create and validate mood entry first
    const moodEntry = createMoodEntry(currentUser.uid, mood);
    if (!validateMoodEntry(moodEntry)) {
      setError('Dados de humor inválidos. Por favor, verifique suas seleções.');
      return;
    }

    // Validate ratings first
    const hasValidRatings = Object.values(ratings).some(rating => rating > 0);
    if (!hasValidRatings) {
      setError('Por favor, forneça pelo menos uma avaliação válida.');
      return;
    }

    const formData: DailyAssessmentForm = {
      ratings,
      comments,
      gratitude,
      userId: currentUser.uid,
      partnerId: userData.partnerId || '',
      date: new Date().toISOString(),
      mood
    };

    const validation = validateForm(formData);
    if (!validation.success) {
      setError(validation.message || 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Create the daily assessment object with validated data
    const dailyAssessment: IDailyAssessment = {
      id: `assessment_${new Date().getTime()}`,
      userId: currentUser.uid,
      partnerId: userData.partnerId || '',
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      type: 'daily' as AssessmentType,
      emotionalSecurity: ratings.segurancaRelacionamento || 0,
      intimacy: ratings.intimidade || 0,
      communication: ratings.comunicacao || 0,
      trust: ratings.transparenciaConfianca || 0,
      mood: {
        primary: mood.primary,
        intensity: mood.intensity,
        notes: mood.notes
      },
      context: {
        communication: {
          hadMeaningfulTalk: ratings.comunicacao > 7,
          feltUnderstood: ratings.comunicacao > 7,
          topics: ratings.comunicacao > 7 ? ['daily_life', 'emotions', 'future'] : ['concerns'],
          quality: ratings.comunicacao || 0
        },
        conflict: {
          hadConflict: ratings.resolucaoConflitos < 5,
          resolvedSameDay: ratings.resolucaoConflitos > 7,
          impactOnMood: Math.abs(5 - (ratings.resolucaoConflitos || 5))
        },
        support: {
          neededSupport: ratings.apoioMutuo < 5,
          receivedSupport: ratings.apoioMutuo > 7,
          supportType: ratings.conexaoEmocional > ratings.apoioMutuo ? ['emotional'] : ['practical']
        },
        activities: {
          didActivity: ratings.qualidadeTempo > 7,
          type: ratings.qualidadeTempo > 7 ? ['quality_time', 'conversation'] : [],
          enjoyment: ratings.qualidadeTempo || 0
        },
        crisis: {
          hadSignificantCrises: ratings.resolucaoConflitos < 5 || ratings.comunicacao < 5,
          crisisType: ratings.comunicacao < 5 ? 'communication' : ratings.transparenciaConfianca < 5 ? 'trust' : ratings.intimidade < 5 ? 'intimacy' : 'emotional',
          attemptedSolutions: ratings.resolucaoConflitos > 3,
          solutionType: ratings.apoioMutuo > 5 ? ['conversation', 'compromise'] : ['timeApart'],
          impactLevel: ratings.resolucaoConflitos < 3 ? 'high' : ratings.resolucaoConflitos < 6 ? 'moderate' : 'low',
          resolutionStatus: ratings.resolucaoConflitos > 7 ? 'resolved' : ratings.resolucaoConflitos > 4 ? 'partially_resolved' : 'unresolved'
        }
      },
      validatedScales: {
        das: {
          total: (ratings.satisfacaoGeral + ratings.alinhamentoObjetivos + ratings.apoioMutuo + ratings.conexaoEmocional) / 4,
          consenso: ratings.alinhamentoObjetivos || 0,
          satisfacao: ratings.satisfacaoGeral || 0,
          coesao: ratings.apoioMutuo || 0,
          expressaoAfetiva: ratings.conexaoEmocional || 0
        },
        gottman: {
          fourHorsemen: {
            critica: Math.max(0, 10 - (ratings.comunicacao || 0)),
            defensividade: Math.max(0, 10 - (ratings.resolucaoConflitos || 0)),
            desprezo: Math.max(0, 10 - (ratings.transparenciaConfianca || 0)),
            stonewalling: Math.max(0, 10 - (ratings.comunicacao || 0))
          },
          bidsForConnection: {
            tentativas: ratings.conexaoEmocional || 0,
            respostasPositivas: ratings.apoioMutuo || 0,
            respostasNegativas: Math.max(0, 10 - (ratings.apoioMutuo || 0)),
            respostasNeutras: 0
          },
          resolucaoConflitos: ratings.resolucaoConflitos || 0,
          significadoCompartilhado: ratings.alinhamentoObjetivos || 0,
          reparacao: ratings.apoioMutuo || 0,
          influenciaPositiva: ratings.apoioMutuo || 0
        },
        attachment: {
          ecr: {
            anxiety: Math.max(0, 10 - (ratings.segurancaRelacionamento || 0)),
            avoidance: Math.max(0, 10 - (ratings.intimidade || 0))
          },
          securityLevel: (ratings.segurancaRelacionamento || 0) / 10,
          attachmentStyle: determineAttachmentStyle(ratings)
        }
      },
      ratings,
      createdAt: new Date().toISOString(),
      metadata: {
        assessmentCount: 1,
        timeSpan: 'daily',
        confidence: calculateConfidence(ratings),
        lastUpdate: new Date().toISOString(),
        description: comments || '',
        category: 'daily_assessment'
      }
    };

    // Validate the assessment object
    const hasRequiredFields = dailyAssessment.userId && 
                            dailyAssessment.partnerId && 
                            dailyAssessment.date && 
                            dailyAssessment.type && 
                            dailyAssessment.mood?.primary && 
                            dailyAssessment.ratings;

    if (!hasRequiredFields) {
      setError('Dados da avaliação incompletos. Por favor, verifique todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      // Process mood tracking using validated MoodEntry
      const moodResult = await orchestrator.processFormSubmission(
        currentUser.uid,
        moodEntry,
        'mood_tracking'
      );

      if (!moodResult.success) {
        throw new Error(moodResult.error?.message || 'Failed to submit mood tracking');
      }

      // Display any warnings from mood submission
      const moodWarnings = moodResult.warnings ?? [];
      if (moodWarnings.length > 0) {
        moodWarnings.forEach(warning => {
          console.warn('Mood tracking warning:', warning);
        });
      }

      // Save the assessment
      const result = await addDoc(collection(db, 'assessments'), dailyAssessment);
      
      if (!result) {
        throw new Error('Failed to save assessment');
      }

      // Process the assessment
      const assessmentResult = await orchestrator.processFormSubmission(
        currentUser.uid,
        { ...dailyAssessment, id: result.id },
        'daily_assessment'
      );

      if (!assessmentResult.success) {
        const errorDetails = assessmentResult.error?.details ? `\n${assessmentResult.error.details}` : '';
        const errorOperation = assessmentResult.error?.operation ? ` during ${assessmentResult.error.operation}` : '';
        throw new Error(`${assessmentResult.error?.message || 'Failed to process assessment'}${errorOperation}${errorDetails}`);
      }

      // Display any warnings from assessment submission
      const assessmentWarnings = assessmentResult.warnings ?? [];
      if (assessmentWarnings.length > 0) {
        assessmentWarnings.forEach(warning => {
          console.warn('Assessment warning:', warning);
        });
      }

      // Update assessment status with user's submission
      setAssessmentStatus(prev => ({
        ...prev,
        userSubmitted: true,
        completeness: {
          ...prev.completeness,
          user: calculateCompleteness(dailyAssessment)
        }
      }));

      // Store the submitted assessment for later use
      setSubmittedAssessment(dailyAssessment);

      // Check for partner's assessment
      const partnerAssessment = await checkPartnerAssessment();

      // Get the latest GPT analysis and relationship analysis
      try {
        const [latestAnalysis, comprehensiveAnalysisResult] = await Promise.all([
          getLatestAnalysis(currentUser.uid, userData.partnerId).catch(error => {
            console.error('Error getting latest analysis:', error);
            if (error.message?.includes('401')) {
              console.warn('OpenAI API authentication error - proceeding without GPT analysis');
            }
            return null;
          }),
          orchestrator.generateComprehensiveAnalysis(
            currentUser.uid,
            {
              id: `context_${currentUser.uid}_${new Date().getTime()}`,
              userId: currentUser.uid,
              partnerId: userData.partnerId || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              type: 'daily_assessment',
              duration: '0-6 months',
              status: 'dating',
              relationshipStyle: 'monogamous',
              currentDynamics: ratings.comunicacao > 7 ? 'positive' : 'needs_attention',
              userEmotionalState: mood.primary,
              partnerEmotionalState: partnerAssessment?.mood?.primary || 'unknown',
              hadSignificantCrises: false,
              crisisDescription: '',
              attemptedSolutions: false,
              solutionsDescription: '',
              routineImpact: ratings.qualidadeTempo > 7 ? 'positive' : 'needs_attention',
              relationshipStatus: 'active',
              livingArrangement: 'unknown',
              communicationStyle: ratings.comunicacao > 7 ? 'open' : 'needs_improvement',
              sharedActivities: [],
              supportSystem: [],
              futureExpectations: '',
              challengeAreas: [],
              strengthAreas: [],
              values: [],
              goals: [],
              challenges: [],
              strengths: [],
              appGoals: [],
              timeSpentTogether: ratings.qualidadeTempo > 7 ? 'sufficient' : 'insufficient',
              qualityTime: ratings.qualidadeTempo > 7 ? 'yes' : 'no',
              qualityTimeDescription: '',
              physicalIntimacy: ratings.intimidadeFisica > 7 ? 'yes' : 'no',
              attachmentStyle: mapAttachmentStyle(determineAttachmentStyle(ratings)),
              intimacyImprovements: [],
              additionalInfo: '',
              areasNeedingAttention: Object.entries(ratings)
                .filter(([_, value]) => value < 5)
                .map(([key]) => ASSESSMENT_CATEGORIES[key as keyof typeof ASSESSMENT_CATEGORIES].label)
            },
            {
              assessments: partnerAssessment ? [dailyAssessment, partnerAssessment] : [dailyAssessment],
              consensusForms: [],
              moodEntries: [moodEntry],
              gottmanAssessment: undefined,
              validatedScales: dailyAssessment.validatedScales
            }
          ).catch(error => {
            console.error('Error generating comprehensive analysis:', error);
            if (error.message?.includes('401')) {
              throw new Error('Temporariamente indisponível: O serviço de análise está em manutenção. Sua avaliação foi salva e será analisada assim que o serviço for restaurado.');
            }
            throw error;
          })
        ]);

        if (!comprehensiveAnalysisResult.success || !comprehensiveAnalysisResult.data) {
          throw new Error(comprehensiveAnalysisResult.error?.message || 'Failed to generate comprehensive analysis');
        }

        const analysisData = comprehensiveAnalysisResult.data;
        
        // Only set GPT analysis if available
        if (latestAnalysis) {
          setAnalysisResult(latestAnalysis);
        }
        
        setRelationshipAnalysis(analysisData.relationshipAnalysis);
        setAssessmentStatus(prev => ({
          ...prev,
          analysisConfidence: analysisData.relationshipAnalysis.metadata.confidence
        }));

        // Show combined insights from all analyses
        const gptInsights = latestAnalysis?.analysis.relationshipDynamics;
        const relationshipInsights = analysisData.relationshipAnalysis.strengthsAndChallenges;
        const communicationPatterns = latestAnalysis?.analysis.communicationMetrics.patterns || [];
        const attachmentInsights = latestAnalysis?.analysis.attachmentInsights;
        const relationshipCategories = Object.entries(analysisData.relationshipAnalysis.categories);
        const relationshipHealth = analysisData.relationshipAnalysis.overallHealth;

        // Create ValidatedScalesAnalysis
        const validatedScalesAnalysis: ValidatedScalesAnalysis = {
          das: analysisData.validatedScales?.das,
          csi: analysisData.validatedScales?.csi,
          gottman: analysisData.validatedScales?.gottman,
          attachment: analysisData.validatedScales?.attachment,
          insights: [],
          recommendations: [],
          analysisDate: new Date().toISOString(),
          confidence: partnerAssessment ? 0.85 : 0.5, // Higher confidence if partner submitted
          trends: {
            das: { direction: 'stable', significance: 'medium' },
            gottman: { direction: 'improving', significance: 'high' },
            attachment: { direction: 'stable', significance: 'medium' }
          }
        };

        setScalesAnalysis(validatedScalesAnalysis);

        // Build message components
        const partnerStatusMessage = partnerAssessment 
          ? '\n\nAnálise completa baseada nas avaliações de ambos os parceiros.'
          : '\n\nNota: Esta é uma análise parcial baseada apenas na sua avaliação. A análise será atualizada quando seu parceiro submeter a avaliação.';

        const strengthsMessage = [
          ...(gptInsights?.strengths || []),
          ...(relationshipInsights?.strengths || [])
        ].length > 0 
          ? `\n\nPontos fortes identificados:\n${[
              ...(gptInsights?.strengths || []),
              ...(relationshipInsights?.strengths || [])
            ].join('\n')}`
          : '';

        const patternsMessage = communicationPatterns.length > 0
          ? `\n\nPadrões de Comunicação:\n${communicationPatterns.join('\n')}`
          : '';

        const categoriesMessage = relationshipCategories.length > 0
          ? `\n\nAnálise por Categoria:\n${relationshipCategories.map(([category, data]) => 
              `- ${category}: ${data.insights.join(', ')} (Tendência: ${data.trend})`
            ).join('\n')}`
          : '';

        const healthMessage = `\n\nSaúde Geral do Relacionamento:\nScore: ${relationshipHealth.score.toFixed(1)}/10\nTendência: ${relationshipHealth.trend}\nConfiança: ${(relationshipHealth.confidence * 100).toFixed(0)}%`;

        const attachmentMessage = attachmentInsights?.behaviors && attachmentInsights.behaviors.length > 0
          ? `\n\nComportamentos de Apego:\n${attachmentInsights.behaviors.join('\n')}`
          : '';
        
        const recommendationsMessage = [
          ...(gptInsights?.recommendations || []),
          ...(analysisData.relationshipAnalysis.relationshipDynamics.recommendations || []),
          ...(attachmentInsights?.suggestions || []),
          ...validatedScalesAnalysis.recommendations
        ].length > 0
          ? `\n\nRecomendações:\n${[
              ...(gptInsights?.recommendations || []),
              ...(analysisData.relationshipAnalysis.relationshipDynamics.recommendations || []),
              ...(attachmentInsights?.suggestions || []),
              ...validatedScalesAnalysis.recommendations
            ].join('\n')}`
          : '';

        // Build success message with available insights
        const successMessage = `Avaliação diária enviada com sucesso!${
          moodWarnings.length ? `\n\nAlertas do registro de humor:\n${moodWarnings.join('\n')}` : ''
        }${
          assessmentWarnings.length ? `\n\nAlertas da avaliação:\n${assessmentWarnings.join('\n')}` : ''
        }`;

        // Only add GPT insights if available
        const analysisMessage = latestAnalysis 
          ? `${strengthsMessage}${patternsMessage}${categoriesMessage}${healthMessage}${attachmentMessage}${recommendationsMessage}`
          : '\n\nNota: A análise detalhada estará disponível em breve.';

        setSuccess(`${successMessage}${analysisMessage}${partnerStatusMessage}`);

        // Reset form
        setActiveStep(0);
        setHasSubmittedToday(true);
        setRatings({
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
        });
        setMood({
          primary: 'neutral',
          intensity: 3,
          notes: ''
        });
        setComments('');
        setGratitude('');
        
      } catch (error) {
        console.error('Error submitting assessment:', error);
        if (error instanceof Error && error.message.includes('permission-denied')) {
          setError('Erro de permissão. Por favor, faça login novamente.');
          navigate('/login');
        } else {
          setError(error instanceof Error ? error.message : 'Erro ao enviar avaliação. Por favor, tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      if (error instanceof Error && error.message.includes('permission-denied')) {
        setError('Erro de permissão. Por favor, faça login novamente.');
        navigate('/login');
      } else {
        setError(error instanceof Error ? error.message : 'Erro ao enviar avaliação. Por favor, tente novamente.');
      }
    }
  };

  const steps = [
    {
      label: 'Avaliação Diária',
      description: 'Avalie seu relacionamento hoje'
    },
    {
      label: 'Humor e Gratidão',
      description: 'Como você está se sentindo?'
    },
    {
      label: 'Revisão',
      description: 'Revise suas respostas'
    }
  ];

  // Add status indicator component
  const AssessmentStatusIndicator: React.FC = () => {
    if (!assessmentStatus.userSubmitted) return null;

    return (
      <Box mt={2} mb={2}>
        <Typography variant="h6" gutterBottom>
          Status da Avaliação
        </Typography>
        
        {assessmentStatus.checkingPartner && (
          <Box mb={1}>
            <LinearProgress />
          </Box>
        )}

        <Alert 
          severity={assessmentStatus.partnerSubmitted ? "success" : "info"}
          sx={{ mb: 1 }}
        >
          <AlertTitle>
            {assessmentStatus.partnerSubmitted 
              ? "Análise Completa" 
              : "Análise Parcial"}
          </AlertTitle>
          {assessmentStatus.partnerSubmitted ? (
            <>
              Ambos os parceiros submeteram suas avaliações.
              <Box mt={1}>
                <Typography variant="body2">
                  Confiança da análise: {(assessmentStatus.analysisConfidence * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2">
                  Completude: Você ({(assessmentStatus.completeness.user * 100).toFixed(0)}%) | 
                  Parceiro ({(assessmentStatus.completeness.partner * 100).toFixed(0)}%)
                </Typography>
              </Box>
            </>
          ) : (
            <>
              Aguardando a avaliação do seu parceiro.
              {assessmentStatus.lastCheck && (
                <Typography variant="body2">
                  Última verificação: {new Date(assessmentStatus.lastCheck).toLocaleTimeString()}
                </Typography>
              )}
            </>
          )}
        </Alert>

        {!assessmentStatus.partnerSubmitted && (
          <Alert severity="info">
            A análise será atualizada automaticamente quando seu parceiro submeter a avaliação.
          </Alert>
        )}
      </Box>
    );
  };

  if (hasSubmittedToday) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
              Avaliação Diária
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Você já completou sua avaliação hoje. 
              {assessmentStatus.partnerSubmitted ? (
                ' Ambos os parceiros já submeteram suas avaliações.'
              ) : (
                ' Aguardando a avaliação do seu parceiro.'
              )}
            </Alert>
            
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setHasSubmittedToday(false);
                  setSuccess('');
                  setError(null);
                  setActiveStep(0);
                  setAssessmentStatus({
                    userSubmitted: false,
                    partnerSubmitted: false,
                    lastCheck: null,
                    checkingPartner: false,
                    analysisConfidence: 0,
                    completeness: {
                      user: 0,
                      partner: 0
                    }
                  });
                  setRatings({
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
                  });
                  setMood({
                    primary: 'neutral',
                    intensity: 3,
                    notes: ''
                  });
                  setComments('');
                  setGratitude('');
                  setSubmittedAssessment(null);
                  setPartnerAssessment(undefined);
                  setHasCheckedPartnerAssessment(false);
                }}
                startIcon={<NavigateNext />}
              >
                Refazer Avaliação
              </Button>
            </Box>
            
            <AssessmentStatusIndicator />
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
                {renderScalesAnalysis()}
              </Alert>
            )}
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, my: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
              {renderScalesAnalysis()}
            </Alert>
          )}

          {hasSubmittedToday ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Você já enviou uma avaliação hoje. Volte amanhã para uma nova avaliação.
            </Alert>
          ) : loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>
                      <Typography variant="subtitle1">{step.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {index === 0 && (
                        <Box sx={{ mt: 2 }}>
                          {Object.entries(ratings).map(([category, value]) => {
                            const categoryInfo = ASSESSMENT_CATEGORIES[category as keyof typeof ASSESSMENT_CATEGORIES];
                            return (
                              <Box key={category} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle1">{categoryInfo.label}</Typography>
                                  <Tooltip title={categoryInfo.tip}>
                                    <IconButton size="small" sx={{ ml: 1 }}>
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {categoryInfo.description}
                                </Typography>
                                <Rating
                                  value={value}
                                  onChange={(_, newValue) => handleRatingChange(category as keyof CategoryRatings)(newValue || 0)}
                                  max={10}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      )}

                      {index === 1 && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Como você está se sentindo?
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                              <Box>
                                <Typography variant="subtitle2" color="success.main" gutterBottom>
                                  Humores Positivos
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {MOOD_CATEGORIES.POSITIVE.map((moodType) => (
                                    <Tooltip key={moodType} title={MOOD_DESCRIPTIONS[moodType]}>
                                      <Chip
                                        label={moodType}
                                        onClick={() => handleMoodChange('primary')({ target: { value: moodType } } as any)}
                                        color={mood.primary === moodType ? 'success' : 'default'}
                                        sx={{
                                          '&:hover': { opacity: 0.8 },
                                          bgcolor: mood.primary === moodType ? 'success.light' : 'default'
                                        }}
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" color="info.main" gutterBottom>
                                  Humor Neutro
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {MOOD_CATEGORIES.NEUTRAL.map((moodType) => (
                                    <Tooltip key={moodType} title={MOOD_DESCRIPTIONS[moodType]}>
                                      <Chip
                                        label={moodType}
                                        onClick={() => handleMoodChange('primary')({ target: { value: moodType } } as any)}
                                        color={mood.primary === moodType ? 'info' : 'default'}
                                        sx={{
                                          '&:hover': { opacity: 0.8 },
                                          bgcolor: mood.primary === moodType ? 'info.light' : 'default'
                                        }}
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              </Box>

                              <Box>
                                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                  Humores Desafiadores
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {MOOD_CATEGORIES.CHALLENGING.map((moodType) => (
                                    <Tooltip key={moodType} title={MOOD_DESCRIPTIONS[moodType]}>
                                      <Chip
                                        label={moodType}
                                        onClick={() => handleMoodChange('primary')({ target: { value: moodType } } as any)}
                                        color={mood.primary === moodType ? 'warning' : 'default'}
                                        sx={{
                                          '&:hover': { opacity: 0.8 },
                                          bgcolor: mood.primary === moodType ? 'warning.light' : 'default'
                                        }}
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Intensidade do Humor
                              </Typography>
                              <Rating
                                value={mood.intensity}
                                onChange={(_, value) => handleMoodChange('intensity')({ target: { value } } as any)}
                                max={5}
                                icon={<SentimentVerySatisfied sx={{ fontSize: '2rem' }} />}
                                emptyIcon={<SentimentVeryDissatisfied sx={{ fontSize: '2rem' }} />}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {INTENSITY_DESCRIPTIONS[mood.intensity]}
                              </Typography>
                            </Box>
                          </Box>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Notas sobre seu humor (opcional)"
                            value={mood.notes}
                            onChange={handleMoodChange('notes')}
                            sx={{ mb: 3 }}
                          />
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Do que você é grato hoje? (opcional)"
                            value={gratitude}
                            onChange={(e) => setGratitude(e.target.value)}
                          />
                        </Box>
                      )}

                      {index === 2 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Comentários Adicionais
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Algo mais que você gostaria de compartilhar? (opcional)"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                          />
                        </Box>
                      )}

                      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          startIcon={<NavigateBefore />}
                        >
                          Voltar
                        </Button>
                        {index === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                            endIcon={loading ? <CircularProgress size={20} /> : <Check />}
                          >
                            {loading ? 'Enviando...' : 'Enviar Avaliação'}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={<NavigateNext />}
                          >
                            Próximo
                          </Button>
                        )}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </form>
          )}
        </Paper>
      </Container>
    </Layout>
  );
};

// Helper function to map attachment style to context format
function mapAttachmentStyle(style?: AttachmentStyle): 'seguro' | 'ansioso' | 'evitativo' | 'desorganizado' {
  switch (style) {
    case 'secure': return 'seguro';
    case 'anxious': return 'ansioso';
    case 'avoidant': return 'evitativo';
    case 'disorganized': return 'desorganizado';
    default: return 'seguro'; // Default to secure if undefined
  }
}

export default DailyAssessment; 