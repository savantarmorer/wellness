import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  LinearProgress,
  Grid,
  Alert,
  Slider,
  Chip,
  useTheme,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  NavigateNext,
  NavigateBefore,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  ThumbUp,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { saveAnalysis } from '../services/analysisHistoryService';
import { useAuth } from '../contexts/AuthContext';
import { analyzeConsensusForm } from '../services/gptService';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { ConsensusFormData } from '../types';
import { getAuth } from 'firebase/auth';

const isBrowser = typeof window !== 'undefined';

const getLocalStorage = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setLocalStorage = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    console.error('Failed to save to localStorage');
  }
};

const removeLocalStorage = (key: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    console.error('Failed to remove from localStorage');
  }
};

interface FormSection {
  title: string;
  questions: {
    id: string;
    question: string;
    type: 'likert' | 'frequency' | 'yesno';
    options?: string[];
  }[];
}

const FORM_SECTIONS: FormSection[] = [
  {
    title: 'Consenso',
    questions: [
      {
        id: 'finances',
        question: 'Quão bem vocês concordam sobre como manejar as finanças familiares?',
        type: 'likert',
      },
      {
        id: 'recreation',
        question: 'Vocês concordam sobre como se divertir juntos?',
        type: 'likert',
      },
      {
        id: 'religion',
        question: 'Vocês concordam sobre a prática ou a importância da religião no relacionamento?',
        type: 'likert',
      },
      {
        id: 'friendships',
        question: 'Vocês concordam sobre a importância das amizades externas ao relacionamento?',
        type: 'likert',
      },
      {
        id: 'conventions',
        question: 'Quão alinhados vocês estão sobre valores e convenções sociais?',
        type: 'likert',
      },
    ],
  },
  {
    title: 'Afeto',
    questions: [
      {
        id: 'affection_demonstration',
        question: 'Com que frequência você demonstra afeto ao seu parceiro?',
        type: 'frequency',
        options: ['Diariamente', 'Quase todos os dias', 'Raramente', 'Nunca'],
      },
      {
        id: 'kissing',
        question: 'Com que frequência vocês se beijam?',
        type: 'frequency',
        options: ['Todos os dias', 'Quase todos os dias', 'Raramente', 'Nunca'],
      },
      {
        id: 'sexual_satisfaction',
        question: 'Vocês estão satisfeitos com a frequência e qualidade das relações sexuais?',
        type: 'likert',
      },
    ],
  },
  {
    title: 'Coesão',
    questions: [
      {
        id: 'time_together',
        question: 'Você acha que passa tempo suficiente com seu parceiro?',
        type: 'likert',
      },
      {
        id: 'stimulating_ideas',
        question: 'Com que frequência vocês trocam ideias estimulantes?',
        type: 'frequency',
        options: ['Uma vez por dia', 'Algumas vezes por semana', 'Raramente', 'Nunca'],
      },
      {
        id: 'projects_together',
        question: 'Com que frequência vocês realizam atividades ou projetos juntos?',
        type: 'frequency',
        options: ['Frequentemente', 'Às vezes', 'Raramente', 'Nunca'],
      },
    ],
  },
  {
    title: 'Satisfação',
    questions: [
      {
        id: 'divorce_thoughts',
        question: 'Nos últimos meses, com que frequência você pensou em divórcio ou separação?',
        type: 'frequency',
        options: ['Nunca', 'Raramente', 'Às vezes', 'Quase todos os dias'],
      },
      {
        id: 'regret',
        question: 'Você já se arrependeu de ter se casado ou de estar em um relacionamento com seu parceiro?',
        type: 'yesno',
      },
      {
        id: 'arguments',
        question: 'Quão frequentes são as discussões entre vocês?',
        type: 'frequency',
        options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'],
      },
    ],
  },
  {
    title: 'Conflito',
    questions: [
      {
        id: 'leave_after_fight',
        question: 'Você ou seu parceiro costumam sair de casa após uma discussão?',
        type: 'frequency',
        options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'],
      },
      {
        id: 'calm_discussion',
        question: 'Vocês conseguem conversar calmamente sobre temas difíceis?',
        type: 'likert',
      },
      {
        id: 'lose_patience',
        question: 'Com que frequência você faz ou sente que o outro faz você perder a paciência?',
        type: 'frequency',
        options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'],
      },
    ],
  },
  {
    title: 'Questões Gerais',
    questions: [
      {
        id: 'too_tired',
        question: 'Nos últimos meses, houve momentos em que você ou seu parceiro estavam cansados demais para fazer amor?',
        type: 'yesno',
      },
      {
        id: 'lack_affection',
        question: 'Você sente falta de demonstrações afetivas no relacionamento?',
        type: 'yesno',
      },
    ],
  },
];

const FORM_CACHE_KEY = 'consensus_form_draft';

interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

const validateAnswers = (answers: Record<string, { rating: number; notes?: string }>): ValidationResult => {
  const issues: string[] = [];
  
  // Check for extreme answers that might need attention
  const extremeAnswers = Object.entries(answers).filter(
    ([_, value]) => value.rating === 1 || value.rating === 5
  );
  
  if (extremeAnswers.length > 5) {
    issues.push('Você tem muitas respostas extremas. Considere revisar suas respostas.');
  }

  // Check for consistency in satisfaction-related questions
  const satisfactionAnswers = ['satisfaction', 'regret', 'arguments'].map(
    id => answers[id]?.rating
  );
  
  if (satisfactionAnswers.every(rating => rating === satisfactionAnswers[0])) {
    issues.push('Suas respostas parecem muito uniformes. Por favor, considere cada questão individualmente.');
  }

  // Check for rapid responses
  const hasAllAnswers = FORM_SECTIONS.every(section =>
    section.questions.every(q => answers[q.id]?.rating !== undefined)
  );

  return {
    isValid: issues.length === 0,
    issues
  };
};

const customIcons: Record<number, React.ReactElement> = {
  1: <SentimentVeryDissatisfied color="error" />,
  2: <SentimentDissatisfied color="warning" />,
  3: <SentimentNeutral color="action" />,
  4: <SentimentSatisfied color="info" />,
  5: <SentimentVerySatisfied color="success" />,
};

const MemoizedQuestion = memo(({ 
  question, 
  value, 
  onChange 
}: { 
  question: FormSection['questions'][0];
  value?: number;
  onChange: (value: number) => void;
}) => {
  const renderFrequencyOptions = useCallback((questionId: string, options: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
      {options.map((option, index) => (
        <Chip
          key={option}
          label={option}
          onClick={() => onChange(index + 1)}
          color={value === index + 1 ? 'primary' : 'default'}
          sx={{
            fontSize: '0.9rem',
            py: 2.5,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 1,
            },
          }}
        />
      ))}
    </Box>
  ), [value, onChange]);

  const renderYesNo = useCallback((questionId: string) => (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      {['1', '0'].map((option) => (
        <Button
          key={option}
          variant={value === Number(option) ? 'contained' : 'outlined'}
          onClick={() => onChange(Number(option))}
          color={value === Number(option) ? 'primary' : 'inherit'}
          sx={{
            minWidth: '120px',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          }}
        >
          {option === '1' ? 'Sim' : 'Não'}
        </Button>
      ))}
    </Box>
  ), [value, onChange]);

  const renderQuestion = useCallback(() => {
    switch (question.type) {
      case 'likert':
        return (
          <Box 
            sx={{ width: '100%', mt: 2 }}
            role="radiogroup"
            aria-label={`Escala de 1 a 5 para ${question.question}`}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  {Object.entries(customIcons).map(([score, icon]) => (
                    <Box
                      key={score}
                      onClick={() => onChange(Number(score))}
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onChange(Number(score));
                        }
                      }}
                      role="radio"
                      aria-checked={value === Number(score)}
                      tabIndex={0}
                      sx={{
                        cursor: 'pointer',
                        transform: value === Number(score) ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.2)' },
                      }}
                    >
                      {icon}
                    </Box>
                  ))}
                </Box>
                <Slider
                  value={value || 0}
                  onChange={(_, newValue) => onChange(Number(newValue))}
                  min={1}
                  max={5}
                  step={1}
                  marks
                  aria-label={question.question}
                  sx={{
                    '& .MuiSlider-mark': {
                      height: '10px',
                    },
                    '& .MuiSlider-thumb': {
                      width: '20px',
                      height: '20px',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 'frequency':
        return renderFrequencyOptions(question.id, question.options || []);
      case 'yesno':
        return renderYesNo(question.id);
      default:
        return null;
    }
  }, [question, value, onChange, renderFrequencyOptions, renderYesNo]);

  return (
    <Box
      sx={{
        mb: { xs: 2, sm: 4 },
        p: { xs: 2, sm: 3 },
        borderRadius: { xs: 1, sm: 2 },
        backgroundColor: 'background.paper',
        boxShadow: 1,
        '&:hover': {
          boxShadow: 2,
        },
        transition: 'box-shadow 0.3s',
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: { xs: 1.5, sm: 2 },
          color: 'text.primary',
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.4
        }}
      >
        {question.question}
      </Typography>
      {renderQuestion()}
    </Box>
  );
});

MemoizedQuestion.displayName = 'MemoizedQuestion';

const RelationshipConsensusForm: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { rating: number; notes?: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load cached form data
  useEffect(() => {
    const cached = getLocalStorage(FORM_CACHE_KEY);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        setAnswers(parsedCache);
        setUnsavedChanges(true);
      } catch (e) {
        console.error('Error loading cached form:', e);
      }
    }
  }, []);

  // Save form data to cache when it changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      setLocalStorage(FORM_CACHE_KEY, JSON.stringify(answers));
      setUnsavedChanges(true);
    }
  }, [answers]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: any) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    if (isBrowser) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [unsavedChanges]);

  const handleAnswer = useCallback((questionId: string, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { rating: Number(value) },
    }));
    setUnsavedChanges(true);
  }, []);

  const isStepComplete = (stepIndex: number) => {
    const currentSection = FORM_SECTIONS[stepIndex];
    return currentSection.questions.every((q) => answers[q.id]?.rating !== undefined);
  };

  const handleNext = () => {
    if (isStepComplete(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setError(null);
    } else {
      setError('Por favor, responda todas as perguntas antes de continuar.');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('Você precisa estar logado para enviar o formulário.');
      return;
    }

    const validation = validateAnswers(answers);
    if (!validation.isValid) {
      setError(validation.issues.join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify authentication state
      const auth = getAuth();
      if (!auth.currentUser) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      // Ensure we have a valid token before proceeding
      try {
        await auth.currentUser.getIdToken(true);
      } catch (tokenError) {
        console.error('Failed to get authentication token:', tokenError);
        setError('Erro de autenticação. Por favor, faça login novamente.');
        return;
      }

      // Get historical data
      const history = await getAnalysisHistory(currentUser.uid);
      const previousForms = history
        .filter(record => 
          typeof record.analysis === 'object' && 
          'type' in record.analysis && 
          record.analysis.type === 'consensus_form'
        )
        .map(record => record.analysis) as ConsensusFormData[];

      const assessments = history
        .filter(record => typeof record.analysis === 'string')
        .map(record => ({
          date: record.date,
          analysis: record.analysis
        }));

      const previousAnalyses = history
        .filter(record => 
          typeof record.analysis === 'object' && 
          'overallHealth' in record.analysis
        )
        .map(record => ({
          date: record.date,
          analysis: record.analysis
        }));

      // Get partner's form if available
      const partnerForm = previousForms.find(form => 
        form.date === new Date().toISOString().split('T')[0] &&
        JSON.stringify(form.responses) !== JSON.stringify(answers)
      );

      // Prepare form data
      const formData: ConsensusFormData = {
        type: 'consensus_form',
        userId: currentUser.uid,
        partnerId: currentUser.uid, // TODO: Update with actual partner ID
        responses: Object.entries(answers).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: { rating: value.rating }
        }), {}),
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Analyze form data
      let formAnalysis;
      try {
        // Filter out any invalid previous forms
        const validPreviousForms = previousForms.filter(form => 
          form && form.responses && Object.keys(form.responses).length > 0
        );

        // Filter out any invalid assessments
        const validAssessments = assessments.filter(assessment => 
          assessment && assessment.date && assessment.analysis
        );

        // Filter out any invalid analyses
        const validPreviousAnalyses = previousAnalyses.filter(analysis => 
          analysis && analysis.date && analysis.analysis
        );

        formAnalysis = await analyzeConsensusForm(
          formData,
          partnerForm,
          {
            previousForms: validPreviousForms.slice(-5), // Last 5 forms
            assessments: validAssessments.slice(-30), // Last 30 days
            previousAnalyses: validPreviousAnalyses.slice(-10), // Last 10 analyses
          }
        );
      } catch (analysisError) {
        console.error('Error analyzing form:', analysisError);
        let errorMessage = 'Erro ao analisar o formulário. Por favor, tente novamente.';
        
        if (analysisError instanceof Error) {
          switch (analysisError.message) {
            case 'Failed to get response from analysis service':
              errorMessage = 'Erro de conexão com o serviço de análise. Por favor, verifique sua conexão e tente novamente.';
              break;
            case 'Invalid response from analysis service':
            case 'Invalid response format from analysis service':
              errorMessage = 'Erro no processamento da análise. Nossa equipe foi notificada e está trabalhando na solução.';
              break;
            case 'Incomplete analysis response':
              errorMessage = 'A análise não pôde ser completada. Por favor, tente novamente.';
              break;
            case 'Failed to parse analysis response':
              errorMessage = 'Erro ao processar a resposta da análise. Por favor, tente novamente.';
              break;
          }
        }
        
        setError(errorMessage);
        return;
      }

      // Save form data with analysis
      try {
        await saveAnalysis(currentUser.uid, 'individual', {
          ...formData,
          analysis: formAnalysis,
        } as ConsensusFormData & { analysis: any });
      } catch (saveError) {
        console.error('Error saving form:', saveError);
        setError('Erro ao salvar o formulário. Por favor, tente novamente.');
        return;
      }

      setUnsavedChanges(false);
      removeLocalStorage(FORM_CACHE_KEY);
      
      setAnalysis(formAnalysis);
      setShowAnalysis(true);
      setSuccess('Formulário enviado com sucesso! Suas respostas foram salvas.');

      // Reset form but keep analysis visible
      setAnswers({});
      setActiveStep(0);
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar o formulário. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    return (
      <Dialog 
        open={showAnalysis} 
        onClose={() => {
          setShowAnalysis(false);
          setAnalysis(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Análise do Formulário
          {analysis.overallAnalysis.riskLevel !== 'low' && (
            <Chip
              label={`Risco ${analysis.overallAnalysis.riskLevel === 'high' ? 'Alto' : 'Moderado'}`}
              color={analysis.overallAnalysis.riskLevel === 'high' ? 'error' : 'warning'}
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumo Geral
            </Typography>
            <Typography>
              {analysis.overallAnalysis.summary}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress
                variant="determinate"
                value={analysis.overallAnalysis.score}
                size={60}
                thickness={4}
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Score Geral: {analysis.overallAnalysis.score}%
                <br />
                Tendência: {analysis.overallAnalysis.trend === 'improving' ? 'Melhorando' : 
                           analysis.overallAnalysis.trend === 'stable' ? 'Estável' : 'Preocupante'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Insights Terapêuticos
            </Typography>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Ações Imediatas
            </Typography>
            <List>
              {analysis.therapeuticInsights.immediateActions.map((action: string, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <PsychologyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Questões Subjacentes
            </Typography>
            <List>
              {analysis.therapeuticInsights.underlyingIssues.map((issue: string, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recomendações
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Exercícios Práticos
                </Typography>
                <List>
                  {analysis.recommendations.exercises.map((exercise: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <StarIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={exercise} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Sugestões de Comunicação
                </Typography>
                <List>
                  {analysis.recommendations.communication.map((suggestion: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ThumbUp color="success" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Box>

          {analysis.recommendations.professionalSupport.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="h6" gutterBottom color="warning.main">
                  Suporte Profissional Recomendado
                </Typography>
                <List>
                  {analysis.recommendations.professionalSupport.map((support: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AssignmentIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={support} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box 
      sx={{ width: '100%', mb: 4 }}
      role="form"
      aria-label="Formulário de Consenso do Relacionamento"
    >
      <Stepper 
        activeStep={activeStep} 
        orientation={window.innerWidth < 600 ? 'vertical' : 'horizontal'}
        sx={{ 
          mb: { xs: 2, sm: 4 },
          '& .MuiStepLabel-root': {
            color: theme.palette.text.secondary,
          },
          '& .MuiStepLabel-active': {
            color: theme.palette.primary.main,
          },
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }
        }}
      >
        {FORM_SECTIONS.map((section) => (
          <Step key={section.title}>
            <StepLabel>{section.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === FORM_SECTIONS.length ? (
        <Paper 
          elevation={3}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            textAlign: 'center',
            background: theme.palette.background.default,
            borderRadius: { xs: 2, sm: 3 },
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            {success || 'Todas as perguntas foram respondidas!'}
          </Typography>
          {!success && (
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ 
                mt: 2,
                minWidth: { xs: '100%', sm: 200 },
                borderRadius: { xs: 2, sm: 8 },
                py: { xs: 1.5, sm: 2 }
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Enviar Respostas'
              )}
            </Button>
          )}
        </Paper>
      ) : (
        <Paper 
          elevation={3}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            background: theme.palette.background.default,
            borderRadius: { xs: 2, sm: 3 },
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 'medium',
              mb: 3,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            {FORM_SECTIONS[activeStep].title}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {FORM_SECTIONS[activeStep].questions.map((question) => (
            <MemoizedQuestion
              key={question.id}
              question={question}
              value={answers[question.id]?.rating}
              onChange={(value) => handleAnswer(question.id, value)}
            />
          ))}

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            gap: { xs: 2, sm: 0 },
            mt: { xs: 3, sm: 4 },
          }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<NavigateBefore />}
              variant="outlined"
              fullWidth={window.innerWidth < 600}
              sx={{ 
                borderRadius: { xs: 2, sm: 8 },
                minWidth: { sm: 120 },
                order: { xs: 2, sm: 1 }
              }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NavigateNext />}
              fullWidth={window.innerWidth < 600}
              sx={{ 
                borderRadius: { xs: 2, sm: 8 },
                minWidth: { sm: 120 },
                order: { xs: 1, sm: 2 }
              }}
            >
              {activeStep === FORM_SECTIONS.length - 1 ? 'Finalizar' : 'Próximo'}
            </Button>
          </Box>

          <LinearProgress
            variant="determinate"
            value={(activeStep / FORM_SECTIONS.length) * 100}
            sx={{ 
              mt: { xs: 3, sm: 4 },
              height: { xs: 6, sm: 8 },
              borderRadius: { xs: 3, sm: 4 },
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: { xs: 3, sm: 4 },
              },
            }}
          />
        </Paper>
      )}

      {renderAnalysis()}
    </Box>
  );
};

export default memo(RelationshipConsensusForm); 