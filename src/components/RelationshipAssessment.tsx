import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  Grid,
  Paper,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  Chip,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  Chat as ChatIcon,
  Security as SecurityIcon,
  EmojiEmotions as EmojiIcon,
  Info as InfoIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  ExpandMore as ExpandMoreIcon,
  SentimentVerySatisfied as HappyIcon,
  SentimentSatisfied,
  SentimentDissatisfied as SadIcon,
  SentimentVeryDissatisfied as StressedIcon,
  Favorite as LovedIcon,
  Psychology as AnxiousIcon,
  EmojiObjects as HopefulIcon,
  Block as FrustratedIcon,
  Help as ConfusedIcon,
  Mood as WorriedIcon,
} from '@mui/icons-material';
import { DyadicAdjustmentScale, CouplesSatisfactionIndex, GottmanMetrics, AttachmentMetrics } from '../types';

interface AssessmentData {
  emotionalSecurity: number;
  intimacy: number;
  communication: number;
  trust: number;
  mood: {
    primary: string;
    intensity: number;
    notes?: string;
  };
  goals: string[];
  challenges: string[];
  validatedScales?: {
    das?: DyadicAdjustmentScale;
    csi?: CouplesSatisfactionIndex;
    gottman?: GottmanMetrics;
    attachment?: AttachmentMetrics;
  };
  clinicalSignificance?: {
    gaps: Array<{
      dimension: string;
      score: number;
      normativeScore: number;
      difference: number;
      isSignificant: boolean;
      severity: 'low' | 'moderate' | 'high';
    }>;
    recommendations: string[];
  };
  temporalAnalysis?: {
    correlation: number;
    trends: {
      [key: string]: {
        slope: number;
        rSquared: number;
        pValue: number;
        isSignificant: boolean;
      };
    };
  };
}

interface Props {
  onSubmit: (data: AssessmentData) => void;
  initialData?: Partial<AssessmentData>;
}

const MOOD_OPTIONS = [
  'Feliz', 'Ansioso', 'Calmo', 'Estressado', 'Esperançoso',
  'Frustrado', 'Amado', 'Preocupado', 'Satisfeito', 'Confuso'
];

const MOOD_ICONS = {
  'Feliz': <HappyIcon />,
  'Calmo': <SentimentSatisfied />,
  'Ansioso': <AnxiousIcon />,
  'Estressado': <StressedIcon />,
  'Esperançoso': <HopefulIcon />,
  'Frustrado': <FrustratedIcon />,
  'Amado': <LovedIcon />,
  'Preocupado': <WorriedIcon />,
  'Satisfeito': <SentimentSatisfied />,
  'Confuso': <ConfusedIcon />
};

const calculateDASTotal = (das: Partial<DyadicAdjustmentScale>): number => {
  const { consenso = 0, satisfacao = 0, coesao = 0, expressaoAfetiva = 0 } = das;
  return consenso + satisfacao + coesao + expressaoAfetiva;
};

const calculateCSITotal = (csi: Partial<CouplesSatisfactionIndex>): number => {
  const { satisfacaoGlobal = 0, comunicacao = 0, gestaoConflitos = 0, atividadesCompartilhadas = 0 } = csi;
  return satisfacaoGlobal + comunicacao + gestaoConflitos + atividadesCompartilhadas;
};

const calculateGottmanMetrics = (metrics: Partial<GottmanMetrics>): GottmanMetrics => {
  const fourHorsemen = metrics.fourHorsemen ?? {
    critica: 0,
    defensividade: 0,
    desprezo: 0,
    stonewalling: 0
  };
  
  const bidsForConnection = metrics.bidsForConnection ?? {
    tentativas: 0,
    respostasPositivas: 0,
    respostasNegativas: 0,
    respostasNeutras: 0
  };

  // Calculate response ratio for partner's responses to your bids
  const totalResponses = bidsForConnection.respostasPositivas + 
    bidsForConnection.respostasNegativas + 
    bidsForConnection.respostasNeutras;
  
  const responseRatio = totalResponses > 0 
    ? bidsForConnection.respostasPositivas / totalResponses 
    : 0;

  // Calculate negative interaction ratio from partner's behavior
  const totalNegative = fourHorsemen.critica + fourHorsemen.defensividade + 
    fourHorsemen.desprezo + fourHorsemen.stonewalling;

  // Gottman's magic ratio is 5:1 (positive:negative)
  // Here we're measuring the partner's positive influence
  const influenciaPositiva = Math.min(10, (responseRatio * 10));

  return {
    fourHorsemen,
    bidsForConnection,
    reparacao: metrics.reparacao ?? 0,
    influenciaPositiva,
    resolucaoConflitos: metrics.resolucaoConflitos ?? 0,
    significadoCompartilhado: metrics.significadoCompartilhado ?? 0
  };
};

const STEPS = [
  'Avaliação Emocional',
  'Humor e Notas',
  'Metas e Desafios',
  'Escalas Validadas'
];

const TOOLTIPS = {
  emotionalSecurity: 'Quão seguro e confortável você se sente ao compartilhar seus sentimentos com seu parceiro?',
  intimacy: 'Quão conectado emocionalmente você se sente com seu parceiro?',
  communication: 'Como você avalia a qualidade e efetividade da comunicação no relacionamento?',
  trust: 'Qual o nível de confiança que você sente no seu parceiro e no relacionamento?'
};

const SCALE_LABELS = {
  emotionalSecurity: ['Muito inseguro', 'Inseguro', 'Neutro', 'Seguro', 'Muito seguro'],
  intimacy: ['Muito distante', 'Distante', 'Neutro', 'Próximo', 'Muito próximo'],
  communication: ['Muito difícil', 'Difícil', 'Moderada', 'Boa', 'Excelente'],
  trust: ['Muito baixa', 'Baixa', 'Moderada', 'Alta', 'Muito alta']
};

// Add scale tooltips
const SCALE_TOOLTIPS = {
  das: {
    consenso: 'Avalia o nível de concordância entre o casal em questões importantes como finanças, lazer, religião, amizades, etc.',
    satisfacao: 'Mede o grau de satisfação com o relacionamento e a frequência de interações positivas vs. negativas',
    coesao: 'Avalia o envolvimento mútuo em atividades externas e a troca de ideias estimulantes',
    expressaoAfetiva: 'Mede a satisfação com expressões de afeto e relações íntimas no relacionamento'
  },
  gottman: {
    fourHorsemen: {
      critica: 'Atacar o caráter do parceiro em vez do comportamento específico (ex: "Você sempre é egoísta" vs. "Me sinto ignorado")',
      defensividade: 'Contra-atacar ou se vitimizar em vez de aceitar responsabilidade parcial e dialogar',
      desprezo: 'Demonstrar superioridade moral, sarcasmo ou desrespeito (ex: revirar os olhos, zombar)',
      stonewalling: 'Se fechar ou se retirar completamente da interação quando há conflito'
    },
    bidsForConnection: {
      tentativas: 'Pequenos momentos onde um parceiro tenta criar conexão (ex: mostrar algo interessante, buscar atenção)',
      respostasPositivas: 'Responder com interesse e entusiasmo às tentativas de conexão do parceiro',
      respostasNegativas: 'Ignorar ou responder com hostilidade às tentativas de conexão',
      respostasNeutras: 'Responder minimamente, sem engajamento real'
    },
    reparacao: 'Capacidade de fazer reparações após conflitos e retomar o diálogo de forma construtiva',
    influenciaPositiva: 'Proporção entre interações positivas e negativas (ideal é 5 positivas para cada negativa)'
  }
};

// Add range indicators
const SCALE_RANGES = {
  das: {
    consenso: {
      concerning: { min: 0, max: 30 },
      moderate: { min: 31, max: 45 },
      healthy: { min: 46, max: 65 }
    },
    satisfacao: {
      concerning: { min: 0, max: 20 },
      moderate: { min: 21, max: 35 },
      healthy: { min: 36, max: 50 }
    },
    coesao: {
      concerning: { min: 0, max: 10 },
      moderate: { min: 11, max: 17 },
      healthy: { min: 18, max: 24 }
    },
    expressaoAfetiva: {
      concerning: { min: 0, max: 5 },
      moderate: { min: 6, max: 8 },
      healthy: { min: 9, max: 12 }
    },
    total: {
      concerning: { min: 0, max: 97 },
      moderate: { min: 98, max: 120 },
      healthy: { min: 121, max: 151 }
    }
  },
  gottman: {
    fourHorsemen: {
      concerning: { min: 7, max: 10 },
      moderate: { min: 4, max: 6 },
      healthy: { min: 0, max: 3 }
    },
    bidsForConnection: {
      concerning: { min: 0, max: 7 },
      moderate: { min: 8, max: 14 },
      healthy: { min: 15, max: 20 }
    }
  }
};

const getSliderColor = (value: unknown, ranges: typeof SCALE_RANGES.das.consenso) => {
  const numericValue = typeof value === 'number' ? value : 0;
  if (numericValue >= ranges.healthy.min && numericValue <= ranges.healthy.max) {
    return 'success.main';
  }
  if (numericValue >= ranges.moderate.min && numericValue <= ranges.moderate.max) {
    return 'warning.main';
  }
  return 'error.main';
};

export const RelationshipAssessment: React.FC<Props> = ({ onSubmit, initialData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    emotionalSecurity: initialData?.emotionalSecurity ?? 50,
    intimacy: initialData?.intimacy ?? 50,
    communication: initialData?.communication ?? 50,
    trust: initialData?.trust ?? 50,
    mood: initialData?.mood ?? {
      primary: 'Feliz',
      intensity: 3,
      notes: '',
    },
    goals: initialData?.goals ?? [],
    challenges: initialData?.challenges ?? [],
    validatedScales: initialData?.validatedScales ?? {
      das: {
        consenso: 0,
        satisfacao: 0,
        coesao: 0,
        expressaoAfetiva: 0,
        total: 0
      },
      csi: {
        satisfacaoGlobal: 0,
        comunicacao: 0,
        gestaoConflitos: 0,
        atividadesCompartilhadas: 0,
        total: 0,
        estabilidade: 0,
        comprometimento: 0
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
        reparacao: 0,
        influenciaPositiva: 0,
        resolucaoConflitos: 0,
        significadoCompartilhado: 0
      }
    },
    clinicalSignificance: initialData?.clinicalSignificance ?? {
      gaps: [],
      recommendations: []
    },
    temporalAnalysis: initialData?.temporalAnalysis ?? {
      correlation: 0,
      trends: {}
    }
  });

  const [newGoal, setNewGoal] = useState('');
  const [newChallenge, setNewChallenge] = useState('');

  const handleSliderChange = (field: keyof AssessmentData) => (_: Event, value: number | number[], activeThumb: number) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMoodChange = (field: keyof typeof assessmentData.mood) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAssessmentData(prev => ({
      ...prev,
      mood: {
        ...prev.mood,
        [field]: field === 'intensity' ? Number(event.target.value) : event.target.value,
      },
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setAssessmentData(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()],
      }));
      setNewGoal('');
    }
  };

  const addChallenge = () => {
    if (newChallenge.trim()) {
      setAssessmentData(prev => ({
        ...prev,
        challenges: [...prev.challenges, newChallenge.trim()],
      }));
      setNewChallenge('');
    }
  };

  const removeGoal = (index: number) => {
    setAssessmentData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const removeChallenge = (index: number) => {
    setAssessmentData(prev => ({
      ...prev,
      challenges: prev.challenges.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    onSubmit(assessmentData);
  };

  const updateDAS = (field: keyof DyadicAdjustmentScale, value: number) => {
    setAssessmentData(prev => {
      const updatedDAS = {
        ...prev.validatedScales?.das,
        [field]: value
      } as DyadicAdjustmentScale;
      
      updatedDAS.total = calculateDASTotal(updatedDAS);

      return {
        ...prev,
        validatedScales: {
          ...prev.validatedScales,
          das: updatedDAS
        }
      };
    });
  };

  const updateCSI = (field: keyof CouplesSatisfactionIndex, value: number) => {
    setAssessmentData(prev => {
      const updatedCSI = {
        ...prev.validatedScales?.csi,
        [field]: value
      } as CouplesSatisfactionIndex;
      
      updatedCSI.total = calculateCSITotal(updatedCSI);

      return {
        ...prev,
        validatedScales: {
          ...prev.validatedScales,
          csi: updatedCSI
        }
      };
    });
  };

  const updateGottmanMetrics = (
    category: 'fourHorsemen' | 'bidsForConnection' | 'reparacao',
    field: string,
    value: number
  ) => {
    setAssessmentData(prev => {
      const currentGottman = prev.validatedScales?.gottman ?? {
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
        reparacao: 0,
        influenciaPositiva: 0,
        resolucaoConflitos: 0,
        significadoCompartilhado: 0
      };

      let updatedGottman: GottmanMetrics;

      if (category === 'fourHorsemen') {
        updatedGottman = {
          ...currentGottman,
          fourHorsemen: {
            ...currentGottman.fourHorsemen,
            [field]: value
          }
        };
      } else if (category === 'bidsForConnection') {
        updatedGottman = {
          ...currentGottman,
          bidsForConnection: {
            ...currentGottman.bidsForConnection,
            [field]: value
          }
        };
      } else {
        updatedGottman = {
          ...currentGottman,
          [field]: value
        };
      }

      // Recalculate metrics
      updatedGottman = calculateGottmanMetrics(updatedGottman);

      return {
        ...prev,
        validatedScales: {
          ...prev.validatedScales,
          gottman: updatedGottman
        }
      };
    });
  };

  const handleNext = () => {
    if (activeStep === STEPS.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getScaleLabel = (field: keyof typeof SCALE_LABELS, value: number): string => {
    const normalizedIndex = Math.floor((value / 100) * 4);
    return SCALE_LABELS[field][normalizedIndex] || '';
  };

  const renderEmotionalSliders = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Suas avaliações nos ajudam a identificar áreas que precisam de atenção.
        Seja honesto e reflita sobre como você tem se sentido recentemente.
      </Typography>
      <Stack spacing={4}>
        {Object.entries(TOOLTIPS).map(([field, tooltip]) => (
          <Box key={field}>
            <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              {getFieldIcon(field)}
              {getFieldLabel(field)}
              <Tooltip title={tooltip}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={assessmentData[field as keyof AssessmentData] as number}
              onChange={handleSliderChange(field as keyof AssessmentData)}
              valueLabelDisplay="auto"
              marks
              min={0}
              max={100}
              valueLabelFormat={(value) => getScaleLabel(field as keyof typeof SCALE_LABELS, value)}
            />
            <Typography variant="caption" color="textSecondary">
              {getScaleLabel(field as keyof typeof SCALE_LABELS, assessmentData[field as keyof AssessmentData] as number)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );

  const renderMoodAndNotes = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography gutterBottom variant="subtitle1">
        <EmojiIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Seu Humor Hoje
      </Typography>

      <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
        <FormLabel component="legend">Humor Principal</FormLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {MOOD_OPTIONS.map((mood) => (
            <Chip
              key={mood}
              icon={MOOD_ICONS[mood as keyof typeof MOOD_ICONS]}
              label={mood}
              onClick={() => handleMoodChange('primary')({ target: { value: mood } } as any)}
              color={assessmentData.mood.primary === mood ? 'primary' : 'default'}
              sx={{
                '& .MuiChip-icon': {
                  color: assessmentData.mood.primary === mood ? 'inherit' : 'action.active',
                },
              }}
            />
          ))}
        </Box>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel>Intensidade do Humor (1-5)</FormLabel>
        <Slider
          value={assessmentData.mood.intensity}
          onChange={(_, value) => 
            handleMoodChange('intensity')({ target: { value } } as any)
          }
          min={1}
          max={5}
          marks
          valueLabelDisplay="auto"
        />
      </FormControl>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Notas sobre seu humor"
        value={assessmentData.mood.notes}
        onChange={handleMoodChange('notes')}
        sx={{ mb: 3 }}
      />
    </Paper>
  );

  const renderGoalsAndChallenges = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      {/* Metas */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Metas do Relacionamento
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Adicionar nova meta"
            fullWidth
          />
          <Button variant="outlined" onClick={addGoal}>
            Adicionar
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {assessmentData.goals.map((goal, index) => (
            <Chip
              key={index}
              label={goal}
              onDelete={() => removeGoal(index)}
            />
          ))}
        </Box>
      </Box>

      {/* Desafios */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Desafios Atuais
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            value={newChallenge}
            onChange={(e) => setNewChallenge(e.target.value)}
            placeholder="Adicionar novo desafio"
            fullWidth
          />
          <Button variant="outlined" onClick={addChallenge}>
            Adicionar
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {assessmentData.challenges.map((challenge, index) => (
            <Chip
              key={index}
              label={challenge}
              onDelete={() => removeChallenge(index)}
              color="error"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );

  const renderValidatedScales = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h6" gutterBottom>
        Escalas Validadas
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Estas são ferramentas cientificamente validadas que nos ajudam a avaliar diferentes aspectos do seu relacionamento.
      </Typography>
      
      {/* Dyadic Adjustment Scale */}
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: 'background.default' }}
        >
          <Box>
            <Typography variant="subtitle1">
              Escala de Ajustamento Diádico (DAS)
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Avalia o nível de ajustamento e satisfação no relacionamento
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(SCALE_TOOLTIPS.das).map(([field, tooltip]) => (
              <Grid item xs={12} sm={6} key={field}>
                <FormControl fullWidth>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormLabel>{getFieldLabel(field)}</FormLabel>
                    <Tooltip title={
                      <Box>
                        <Typography variant="body2">{tooltip}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.light' }}>
                          Faixa saudável: {SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].healthy.min}-
                          {SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].healthy.max}
                        </Typography>
                      </Box>
                    }>
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Slider
                    value={Number(assessmentData.validatedScales?.das?.[field as keyof DyadicAdjustmentScale] ?? 0)}
                    onChange={(_, value) => updateDAS(field as keyof DyadicAdjustmentScale, value as number)}
                    min={0}
                    max={field === 'consenso' ? 65 : field === 'satisfacao' ? 50 : field === 'coesao' ? 24 : 12}
                    marks={[
                      { value: 0, label: '0' },
                      { 
                        value: SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].concerning.max,
                        label: 'Preocupante'
                      },
                      {
                        value: SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].moderate.max,
                        label: 'Moderado'
                      },
                      {
                        value: SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].healthy.max,
                        label: 'Saudável'
                      }
                    ]}
                    sx={{
                      '& .MuiSlider-track': {
                        color: getSliderColor(
                          assessmentData.validatedScales?.das?.[field as keyof DyadicAdjustmentScale] ?? 0,
                          SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das]
                        )
                      },
                      '& .MuiSlider-thumb': {
                        color: getSliderColor(
                          assessmentData.validatedScales?.das?.[field as keyof DyadicAdjustmentScale] ?? 0,
                          SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das]
                        )
                      }
                    }}
                    valueLabelDisplay="auto"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="error.main">Preocupante</Typography>
                    <Typography variant="caption" color="warning.main">Moderado</Typography>
                    <Typography variant="caption" color="success.main">Saudável</Typography>
                  </Box>
                </FormControl>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Total DAS: {assessmentData.validatedScales?.das?.total ?? 0}/151
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Gottman Metrics */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: 'background.default' }}
        >
          <Box>
            <Typography variant="subtitle1">
              Métricas de Gottman
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Analisa padrões de interação e comportamentos no relacionamento
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Four Horsemen */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography variant="subtitle2">
                      Os Quatro Cavaleiros
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Padrões negativos de interação que podem prejudicar o relacionamento
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {Object.entries(SCALE_TOOLTIPS.gottman.fourHorsemen).map(([field, tooltip]) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <FormControl fullWidth>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormLabel>{getFieldLabel(field)}</FormLabel>
                            <Tooltip title={
                              <Box>
                                <Typography variant="body2">{tooltip}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.light' }}>
                                  Faixa saudável: 0-3 (Quanto menor, melhor)
                                </Typography>
                              </Box>
                            }>
                              <IconButton size="small" sx={{ ml: 1 }}>
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Slider
                            value={assessmentData.validatedScales?.gottman?.fourHorsemen[field as keyof typeof assessmentData.validatedScales.gottman.fourHorsemen] ?? 0}
                            onChange={(_, value) => updateGottmanMetrics('fourHorsemen', field, value as number)}
                            min={0}
                            max={10}
                            marks={[
                              { value: 0, label: '0' },
                              { value: 3, label: 'Saudável' },
                              { value: 6, label: 'Moderado' },
                              { value: 10, label: 'Preocupante' }
                            ]}
                            sx={{
                              '& .MuiSlider-track': {
                                color: getSliderColor(
                                  assessmentData.validatedScales?.gottman?.fourHorsemen[field as keyof typeof assessmentData.validatedScales.gottman.fourHorsemen] ?? 0,
                                  SCALE_RANGES.gottman.fourHorsemen
                                )
                              },
                              '& .MuiSlider-thumb': {
                                color: getSliderColor(
                                  assessmentData.validatedScales?.gottman?.fourHorsemen[field as keyof typeof assessmentData.validatedScales.gottman.fourHorsemen] ?? 0,
                                  SCALE_RANGES.gottman.fourHorsemen
                                )
                              }
                            }}
                            valueLabelDisplay="auto"
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="success.main">Saudável</Typography>
                            <Typography variant="caption" color="warning.main">Moderado</Typography>
                            <Typography variant="caption" color="error.main">Preocupante</Typography>
                          </Box>
                        </FormControl>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Bids for Connection */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography variant="subtitle2">
                      Tentativas de Conexão
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Como vocês respondem às tentativas mútuas de criar conexão
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {Object.entries(SCALE_TOOLTIPS.gottman.bidsForConnection).map(([field, tooltip]) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <FormControl fullWidth>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormLabel>{getFieldLabel(field)}</FormLabel>
                            <Tooltip title={
                              <Box>
                                <Typography variant="body2">{tooltip}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.light' }}>
                                  Faixa saudável: 0-20 (Quanto menor, melhor)
                                </Typography>
                              </Box>
                            }>
                              <IconButton size="small" sx={{ ml: 1 }}>
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Slider
                            value={assessmentData.validatedScales?.gottman?.bidsForConnection[field as keyof typeof assessmentData.validatedScales.gottman.bidsForConnection] ?? 0}
                            onChange={(_, value) => updateGottmanMetrics('bidsForConnection', field, value as number)}
                            min={0}
                            max={20}
                            marks={[
                              { value: 0, label: '0' },
                              { value: 15, label: 'Moderado' },
                              { value: 20, label: 'Preocupante' }
                            ]}
                            sx={{
                              '& .MuiSlider-track': {
                                color: getSliderColor(
                                  assessmentData.validatedScales?.gottman?.bidsForConnection[field as keyof typeof assessmentData.validatedScales.gottman.bidsForConnection] ?? 0,
                                  SCALE_RANGES.gottman.bidsForConnection
                                )
                              },
                              '& .MuiSlider-thumb': {
                                color: getSliderColor(
                                  assessmentData.validatedScales?.gottman?.bidsForConnection[field as keyof typeof assessmentData.validatedScales.gottman.bidsForConnection] ?? 0,
                                  SCALE_RANGES.gottman.bidsForConnection
                                )
                              }
                            }}
                            valueLabelDisplay="auto"
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="success.main">Saudável</Typography>
                            <Typography variant="caption" color="warning.main">Moderado</Typography>
                            <Typography variant="caption" color="error.main">Preocupante</Typography>
                          </Box>
                        </FormControl>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderEmotionalSliders();
      case 1:
        return renderMoodAndNotes();
      case 2:
        return renderGoalsAndChallenges();
      case 3:
        return renderValidatedScales();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Voltar
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={<NextIcon />}
        >
          {activeStep === STEPS.length - 1 ? 'Finalizar' : 'Próximo'}
        </Button>
      </Box>
    </Box>
  );
};

const getFieldIcon = (field: string) => {
  switch (field) {
    case 'emotionalSecurity':
      return <SecurityIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
    case 'intimacy':
      return <FavoriteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
    case 'communication':
      return <ChatIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
    case 'trust':
      return <PsychologyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
    default:
      return null;
  }
};

const getFieldLabel = (field: string) => {
  switch (field) {
    case 'emotionalSecurity':
      return 'Segurança Emocional';
    case 'intimacy':
      return 'Intimidade';
    case 'communication':
      return 'Comunicação';
    case 'trust':
      return 'Confiança';
    default:
      return field;
  }
}; 