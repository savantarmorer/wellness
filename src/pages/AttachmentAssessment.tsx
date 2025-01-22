import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  Container,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AttachmentMetricsTab } from '../components/AttachmentMetricsTab';
import { analyzeAttachmentStyle } from '../services/psychologicalAnalysisService';
import { Layout } from '../components/Layout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import { AttachmentStyle, MoodType, ValidatedScaleAssessmentData, AttachmentAnalysis } from '../types';

interface AttachmentFormData {
  emotionalExpression: number;
  intimacyComfort: number;
  trustLevel: number;
  independenceComfort: number;
  separationAnxiety: number;
  pastExperiences: string;
}

const INITIAL_FORM_DATA: AttachmentFormData = {
  emotionalExpression: 3,
  intimacyComfort: 3,
  trustLevel: 3,
  independenceComfort: 3,
  separationAnxiety: 3,
  pastExperiences: '',
};

const RATING_LABELS = {
  1: 'Muito baixo',
  2: 'Baixo',
  3: 'Moderado',
  4: 'Alto',
  5: 'Muito alto'
};

const QUESTIONS = [
  {
    field: 'emotionalExpression',
    label: 'Expressão Emocional',
    description: 'Como você se sente ao expressar emoções com seu parceiro?',
    tooltip: 'Avalie sua capacidade e conforto em compartilhar sentimentos e emoções com seu parceiro',
    legend: {
      1: 'Muita dificuldade em expressar emoções',
      2: 'Alguma resistência em compartilhar',
      3: 'Expressão moderada de emoções',
      4: 'Boa capacidade de expressão',
      5: 'Expressão emocional muito aberta e confortável'
    }
  },
  {
    field: 'intimacyComfort',
    label: 'Conforto com Intimidade',
    description: 'Qual seu nível de conforto com proximidade emocional?',
    tooltip: 'Avalie como você se sente em momentos de intimidade emocional e vulnerabilidade',
    legend: {
      1: 'Muito desconfortável com proximidade',
      2: 'Algum desconforto com intimidade',
      3: 'Conforto moderado',
      4: 'Boa aceitação da intimidade',
      5: 'Muito confortável com proximidade'
    }
  },
  {
    field: 'trustLevel',
    label: 'Nível de Confiança',
    description: 'Quanto você confia em seu parceiro?',
    tooltip: 'Avalie seu nível de confiança e segurança no relacionamento',
    legend: {
      1: 'Muita dificuldade em confiar',
      2: 'Confiança limitada',
      3: 'Confiança moderada',
      4: 'Boa confiança',
      5: 'Confiança muito forte'
    }
  },
  {
    field: 'independenceComfort',
    label: 'Conforto com Independência',
    description: 'Como você lida com momentos de independência no relacionamento?',
    tooltip: 'Avalie como você se sente quando seu parceiro busca espaço pessoal ou independência',
    legend: {
      1: 'Muito desconfortável com independência',
      2: 'Algum desconforto com espaço',
      3: 'Aceitação moderada',
      4: 'Boa aceitação da independência',
      5: 'Muito confortável com autonomia'
    }
  },
  {
    field: 'separationAnxiety',
    label: 'Ansiedade de Separação',
    description: 'Como você se sente quando está separado do seu parceiro?',
    tooltip: 'Avalie seu nível de ansiedade ou preocupação durante períodos de separação',
    legend: {
      1: 'Ansiedade muito intensa',
      2: 'Ansiedade considerável',
      3: 'Ansiedade moderada',
      4: 'Pouca ansiedade',
      5: 'Muito tranquilo com separações'
    }
  }
];

const AttachmentAssessment: React.FC = () => {
  const [formData, setFormData] = useState<AttachmentFormData>(INITIAL_FORM_DATA);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attachmentMetrics, setAttachmentMetrics] = useState<AttachmentAnalysis | null>(null);
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const handleInputChange = (field: keyof AttachmentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: field === 'pastExperiences' ? event.target.value : Number(event.target.value),
    });
  };

  const handleSubmit = async () => {
    if (!currentUser || !userData?.partnerId) {
      setError('Dados do usuário não encontrados. Por favor, faça login novamente.');
      return;
    }

    // Validate form data
    if (Object.values(formData).some(value => 
      typeof value === 'number' && (value < 1 || value > 5))
    ) {
      setError('Por favor, preencha todas as questões com valores válidos (1-5)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const assessmentData: ValidatedScaleAssessmentData = {
        id: `attachment_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId,
        date: new Date().toISOString(),
        type: 'individual',
        emotionalSecurity: formData.emotionalExpression,
        intimacy: formData.intimacyComfort,
        communication: formData.emotionalExpression,
        trust: formData.trustLevel,
        mood: {
          primary: 'neutral' as MoodType,
          intensity: 3
        },
        ratings: {
          satisfacaoGeral: formData.emotionalExpression,
          alinhamentoObjetivos: formData.trustLevel,
          conexaoEmocional: formData.intimacyComfort,
          apoioMutuo: formData.independenceComfort,
          segurancaRelacionamento: formData.trustLevel,
          comunicacao: formData.emotionalExpression,
          intimidade: formData.intimacyComfort,
          resolucaoConflitos: formData.independenceComfort,
          transparenciaConfianca: formData.trustLevel,
          intimidadeFisica: formData.intimacyComfort,
          saudeMental: formData.emotionalExpression,
          autocuidado: formData.independenceComfort,
          gratidao: formData.trustLevel,
          qualidadeTempo: formData.intimacyComfort
        },
        validatedScales: {
          das: {
            consenso: formData.trustLevel,
            satisfacao: formData.emotionalExpression,
            coesao: formData.intimacyComfort,
            expressaoAfetiva: formData.independenceComfort,
            total: (formData.trustLevel + formData.emotionalExpression + formData.intimacyComfort + formData.independenceComfort) / 4
          },
          csi: {
            satisfacaoGlobal: formData.emotionalExpression,
            estabilidade: formData.trustLevel,
            comprometimento: formData.intimacyComfort,
            comunicacao: formData.independenceComfort,
            gestaoConflitos: formData.trustLevel,
            atividadesCompartilhadas: formData.intimacyComfort,
            total: (formData.emotionalExpression + formData.trustLevel + formData.intimacyComfort + formData.independenceComfort) / 4
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
            resolucaoConflitos: formData.trustLevel,
            significadoCompartilhado: formData.emotionalExpression,
            reparacao: formData.intimacyComfort,
            influenciaPositiva: formData.independenceComfort
          },
          attachment: {
            ecr: {
              anxiety: formData.separationAnxiety,
              avoidance: 7 - formData.intimacyComfort
            },
            securityLevel: formData.trustLevel,
            attachmentStyle: 'secure' as AttachmentStyle
          }
        },
        metadata: {
          assessmentCount: 1,
          timeSpan: '1 day',
          confidence: 0.8,
          lastUpdate: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const attachmentAnalysis = await analyzeAttachmentStyle(assessmentData, assessmentData);
      // Convert attachment style to metrics format
      const metrics: AttachmentAnalysis = {
        userAttachment: attachmentAnalysis.primary,
        partnerAttachment: attachmentAnalysis.primary, // Same for self-assessment
        compatibilityScore: assessmentData.validatedScales?.attachment?.securityLevel ?? 0.5,
        insights: attachmentAnalysis.recommendations,
        validatedMetrics: {
          ecr: {
            anxiety: assessmentData.validatedScales?.attachment?.ecr?.anxiety ?? 0,
            avoidance: assessmentData.validatedScales?.attachment?.ecr?.avoidance ?? 0
          }
        }
      };
      setAttachmentMetrics(metrics);
      setSuccess('Avaliação enviada com sucesso!');
    } catch (error) {
      console.error('Error submitting attachment assessment:', error);
      setError('Erro ao enviar avaliação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Avaliação Básica', 'Experiências Passadas', 'Revisão'];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {QUESTIONS.map(({ field, label, description, tooltip, legend }) => (
              <Grid item xs={12} key={field}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3,
                    background: (theme) => alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormLabel component="legend" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {label}
                    </FormLabel>
                    <Tooltip title={tooltip}>
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    {description}
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      row
                      value={formData[field as keyof AttachmentFormData]}
                      onChange={handleInputChange(field as keyof AttachmentFormData)}
                      sx={{
                        justifyContent: 'space-between',
                        mb: 2
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Box key={value} sx={{ textAlign: 'center' }}>
                          <FormControlLabel
                            value={value}
                            control={<Radio />}
                            label={
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {RATING_LABELS[value as keyof typeof RATING_LABELS]}
                              </Typography>
                            }
                            sx={{ flexDirection: 'column' }}
                          />
                        </Box>
                      ))}
                    </RadioGroup>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Legenda para {label}:
                      </Typography>
                      {Object.entries(legend).map(([value, description]) => (
                        <Typography key={value} variant="caption" display="block" color="text.secondary">
                          {value}: {description}
                        </Typography>
                      ))}
                    </Box>
                  </FormControl>
                </Paper>
              </Grid>
            ))}
          </Grid>
        );
      case 1:
        return (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <FormControl fullWidth>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormLabel sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Experiências Passadas em Relacionamentos
                </FormLabel>
                <Tooltip title="Compartilhe experiências significativas que influenciaram sua forma de se relacionar">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Descreva suas experiências passadas em relacionamentos e como elas influenciam seu comportamento atual
              </Typography>
              
              <TextField
                multiline
                rows={6}
                value={formData.pastExperiences}
                onChange={handleInputChange('pastExperiences')}
                placeholder="Compartilhe suas experiências..."
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  }
                }}
              />
            </FormControl>
          </Paper>
        );
      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Por favor, revise suas respostas antes de enviar. Esta avaliação nos ajudará a entender melhor seu estilo de apego.
            </Alert>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3,
                background: (theme) => alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                Resumo da Avaliação
              </Typography>
              <Grid container spacing={2}>
                {QUESTIONS.map(({ field, label }) => (
                  <Grid item xs={12} key={field}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        {label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nível: {RATING_LABELS[formData[field as keyof AttachmentFormData] as keyof typeof RATING_LABELS]}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
                {formData.pastExperiences && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Experiências Passadas
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.pastExperiences}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
            {attachmentMetrics && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Resultados da Análise de Apego
                </Typography>
                <AttachmentMetricsTab analysis={attachmentMetrics} />
              </Box>
            )}
          </Alert>
        )}

        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Avaliação de Estilo de Apego
          </Typography>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 4 },
            background: (theme) => alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            opacity: loading ? 0.7 : 1,
            pointerEvents: loading ? 'none' : 'auto',
            transition: 'opacity 0.3s ease'
          }}
        >
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 4,
              '& .MuiStepLabel-root .Mui-completed': {
                color: 'secondary.main',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: 'primary.main',
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => setActiveStep((prev) => prev - 1)}
              disabled={loading}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : () => setActiveStep((prev) => prev + 1)}
              disabled={loading}
              sx={{
                background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                }
              }}
            >
              {loading ? 'Enviando...' : activeStep === steps.length - 1 ? 'Enviar' : 'Próximo'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export default AttachmentAssessment; 