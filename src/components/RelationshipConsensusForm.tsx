import React, { useState } from 'react';
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
import { ConsensusFormData } from '../services/analysisHistoryService';

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

const RelationshipConsensusForm: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const isStepComplete = (stepIndex: number) => {
    const currentSection = FORM_SECTIONS[stepIndex];
    return currentSection.questions.every((q) => answers[q.id]);
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

    setIsSubmitting(true);
    try {
      // Get historical data
      const history = await getAnalysisHistory(currentUser.uid);
      const previousForms = history
        .filter(record => 
          typeof record.analysis === 'object' && 
          'type' in record.analysis && 
          record.analysis.type === 'consensus_form'
        )
        .map(record => record.analysis) as ConsensusFormData[];

      const dailyAssessments = history
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
        form.answers !== answers
      );

      // Analyze form data
      const formAnalysis = await analyzeConsensusForm(
        {
          type: 'consensus_form',
          answers,
          date: new Date().toISOString(),
        },
        partnerForm,
        {
          previousForms: previousForms.slice(-5), // Last 5 forms
          dailyAssessments: dailyAssessments.slice(-30), // Last 30 days
          previousAnalyses: previousAnalyses.slice(-10), // Last 10 analyses
        }
      );

      // Save form data with analysis
      await saveAnalysis(currentUser.uid, 'individual', {
        type: 'consensus_form',
        answers,
        date: new Date().toISOString(),
        analysis: formAnalysis,
      });

      setAnalysis(formAnalysis);
      setShowAnalysis(true);
      setSuccess('Formulário enviado com sucesso! Suas respostas foram salvas.');

      // Reset form but keep analysis visible
      setAnswers({});
      setActiveStep(0);
    } catch (err) {
      setError('Erro ao salvar as respostas. Por favor, tente novamente.');
      console.error('Error saving consensus form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const customIcons = {
    1: <SentimentVeryDissatisfied color="error" />,
    2: <SentimentDissatisfied color="warning" />,
    3: <SentimentNeutral color="action" />,
    4: <SentimentSatisfied color="info" />,
    5: <SentimentVerySatisfied color="success" />,
  };

  const renderLikertScale = (questionId: string, value: string) => (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            {Object.entries(customIcons).map(([score, icon]) => (
              <Box
                key={score}
                onClick={() => handleAnswer(questionId, score)}
                sx={{
                  cursor: 'pointer',
                  transform: value === score ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              >
                {icon}
              </Box>
            ))}
          </Box>
          <Slider
            value={Number(value) || 0}
            onChange={(_, newValue) => handleAnswer(questionId, newValue.toString())}
            min={1}
            max={5}
            step={1}
            marks
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

  const renderFrequencyOptions = (questionId: string, options: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          onClick={() => handleAnswer(questionId, option)}
          color={answers[questionId] === option ? 'primary' : 'default'}
          variant={answers[questionId] === option ? 'filled' : 'outlined'}
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
  );

  const renderYesNo = (questionId: string) => (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      {['Sim', 'Não'].map((option) => (
        <Button
          key={option}
          variant={answers[questionId] === option ? 'contained' : 'outlined'}
          onClick={() => handleAnswer(questionId, option)}
          sx={{
            minWidth: '120px',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          }}
        >
          {option}
        </Button>
      ))}
    </Box>
  );

  const renderQuestion = (question: FormSection['questions'][0]) => {
    switch (question.type) {
      case 'likert':
        return renderLikertScale(question.id, answers[question.id] || '');
      case 'frequency':
        return renderFrequencyOptions(question.id, question.options || []);
      case 'yesno':
        return renderYesNo(question.id);
      default:
        return null;
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
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          mb: 4,
          '& .MuiStepLabel-root': {
            color: theme.palette.text.secondary,
          },
          '& .MuiStepLabel-active': {
            color: theme.palette.primary.main,
          },
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
            p: 4, 
            textAlign: 'center',
            background: theme.palette.background.default,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
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
                minWidth: 200,
                borderRadius: 8,
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
            p: 4,
            background: theme.palette.background.default,
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 'medium',
              mb: 3,
            }}
          >
            {FORM_SECTIONS[activeStep].title}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {FORM_SECTIONS[activeStep].questions.map((question, index) => (
            <Box
              key={question.id}
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
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
                  mb: 2,
                  color: theme.palette.text.primary,
                  fontSize: '1.1rem',
                }}
              >
                {`${index + 1}. ${question.question}`}
              </Typography>
              {renderQuestion(question)}
            </Box>
          ))}

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 4,
          }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<NavigateBefore />}
              variant="outlined"
              sx={{ 
                borderRadius: 8,
                minWidth: 120,
              }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NavigateNext />}
              sx={{ 
                borderRadius: 8,
                minWidth: 120,
              }}
            >
              {activeStep === FORM_SECTIONS.length - 1 ? 'Finalizar' : 'Próximo'}
            </Button>
          </Box>

          <LinearProgress
            variant="determinate"
            value={(activeStep / FORM_SECTIONS.length) * 100}
            sx={{ 
              mt: 4,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }}
          />
        </Paper>
      )}

      {renderAnalysis()}
    </Box>
  );
};

export default RelationshipConsensusForm; 