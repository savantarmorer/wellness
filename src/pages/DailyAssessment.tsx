import React, { useState, useEffect } from 'react';
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
  IconButton
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
  MoodTrackingForm,
  Mood,
  DailyAssessmentForm,
  DailyAssessment as DailyAssessmentType
} from '../types';
import { RelationshipOrchestrator } from '../services/relationshipOrchestratorNew';
import { collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
    MOOD_TYPES.LOVED,
    MOOD_TYPES.CONTENT
  ],
  NEUTRAL: [
    MOOD_TYPES.NEUTRAL
  ],
  CHALLENGING: [
    MOOD_TYPES.ANXIOUS,
    MOOD_TYPES.STRESSED,
    MOOD_TYPES.SAD,
    MOOD_TYPES.ANGRY,
    MOOD_TYPES.FRUSTRATED,
    MOOD_TYPES.TIRED,
    MOOD_TYPES.CONFUSED,
    MOOD_TYPES.LONELY
  ]
} as const;

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
  const orchestrator = new RelationshipOrchestrator();

  useEffect(() => {
    const checkTodaySubmission = async () => {
      if (!currentUser?.uid) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      try {
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
      }
    };

    checkTodaySubmission();
  }, [currentUser?.uid]);

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
        const moodType = Object.values(MOOD_TYPES).find(type => type === value);
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

    if (!formData.mood.primary || !Object.values(MOOD_TYPES).includes(formData.mood.primary)) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData?.partnerId) return;

    const formData: DailyAssessmentForm = {
      ratings,
      comments,
      gratitude,
      userId: currentUser.uid,
      partnerId: userData.partnerId,
      date: new Date().toISOString(),
      mood
    };

    const validation = validateForm(formData);
    if (!validation.success) {
      setError(validation.message || 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      // Ensure mood is defined before submitting
      const moodTrackingForm: MoodTrackingForm = {
        userId: currentUser.uid,
        mood,
        timestamp: new Date().toISOString()
      };

      // Process mood tracking first
      const moodResult = await orchestrator.processFormSubmission(
        currentUser.uid,
        moodTrackingForm,
        'mood_tracking'
      );

      if (!moodResult.success) {
        throw new Error(moodResult.error?.message || 'Failed to submit mood tracking');
      }

      // Save daily assessment
      const dailyAssessment: DailyAssessmentType = {
        id: `assessment_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId,
        date: new Date().toISOString(),
        type: 'individual',
        mood,
        ratings,
        comments,
        gratitude,
        createdAt: new Date().toISOString(),
        validatedScales: {
          das: {
            total: 0,
            consenso: 0,
            satisfacao: 0,
            coesao: 0,
            expressaoAfetiva: 0
          },
          gottman: {
            fourHorsemen: [],
            bidsForConnection: 0,
            reparacao: 0,
            influenciaPositiva: 0
          }
        },
        context: {
          activities: [],
          triggers: [],
          location: '',
          socialContext: [],
          intensity: mood.intensity,
          duration: 0
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        }
      };

      // Save to Firestore
      const assessmentsCollection = collection(db, 'assessments');
      await addDoc(assessmentsCollection, dailyAssessment);

      setSuccess('Avaliação enviada com sucesso!');
      setHasSubmittedToday(true);
      navigate('/analysis');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Ocorreu um erro ao salvar sua avaliação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
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

  if (hasSubmittedToday) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
              Avaliação Diária
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Você já completou sua avaliação hoje. Volte amanhã para uma nova avaliação!
            </Alert>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Avaliação Diária
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

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
        </Paper>
      </Container>
    </Layout>
  );
};

export default DailyAssessment; 