import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  alpha,
  Button
} from '@mui/material';
import MoodIcon from '@mui/icons-material/Mood';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScaleIcon from '@mui/icons-material/Scale';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { MoodAnalysis } from './MoodAnalysis';
import { RelationshipAnalysisTab } from './RelationshipAnalysisTab';
import { GPTAnalysisTab } from './GPTAnalysisTab';
import { TemporalAnalysisTab } from '../components/TemporalAnalysisTab';
import { ValidatedScalesTab } from '../components/ValidatedScalesTab';
import { AttachmentMetricsTab } from '../components/AttachmentMetricsTab';
import { ClinicalInsightsTab } from '../components/ClinicalInsightsTab';
import type {
  RelationshipContext,
  GPTAnalysis,
  MoodAnalysis as MoodAnalysisType,
  RelationshipAnalysis,
  MoodSynchronyAnalysis,
  TemporalAnalysis,
  ValidatedScalesAnalysis,
  AttachmentAnalysis,
  ClinicalSignificance,
  MoodType
} from '../types/index';
import { Link } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-controls={`analysis-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: { xs: 1.5, sm: 3 },
          '& > *': {
            maxWidth: '100%',
            overflowX: 'hidden',
          }
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analysis-tab-${index}`,
    'aria-controls': `analysis-tabpanel-${index}`,
  };
}

interface AnalysisTabsProps {
  analysis: GPTAnalysis | null;
  relationshipContext: RelationshipContext | null;
  dailyInsight: string;
  moodAnalysis?: MoodAnalysisType | MoodSynchronyAnalysis;
  relationshipAnalysis?: RelationshipAnalysis;
  temporalAnalysis?: TemporalAnalysis;
  validatedScales?: ValidatedScalesAnalysis;
  attachmentAnalysis?: AttachmentAnalysis;
  clinicalSignificance?: ClinicalSignificance;
}

const convertGPTAnalysisToRelationshipAnalysis = (gptAnalysis: GPTAnalysis): RelationshipAnalysis => {
  if (!gptAnalysis || !gptAnalysis.analysis) {
    return {
      id: `analysis_${new Date().getTime()}`,
      userId: gptAnalysis?.userId || '',
      partnerId: gptAnalysis?.partnerId || '',
      date: new Date().toISOString(),
      type: 'individual',
      overallHealth: { score: 0, trend: 'stable' as const, confidence: 0.8 },
      categories: {},
      strengthsAndChallenges: { strengths: [], challenges: [] },
      communicationSuggestions: [],
      actionItems: [],
      relationshipDynamics: {
        strengths: [],
        challenges: [],
        recommendations: []
      },
      emotionalDynamics: {
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
          effectiveness: 0,
          patterns: [],
          confidence: 0.8
        },
        synchronicity: 0.8,
        stability: 0.7,
        patterns: {
          user: {
            dominant: 'feliz' as MoodType,
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
            dominant: 'feliz' as MoodType,
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
      emotionalSync: 0,
      moodDiscrepancies: [],
      insights: [{
        id: `insight_${new Date().getTime()}`,
        type: 'pattern',
        category: 'attachment',
        description: 'Initial analysis',
        confidence: 0.8,
        impact: 'medium',
        timestamp: new Date().toISOString()
      }],
      riskFactors: [],
      recommendations: [],
      validatedScales: {
        consistency: {
          default: {
            score: 0.8,
            confidence: 0.9,
            flags: []
          }
        },
        reliability: 0.85,
        completeness: 0.9,
        recommendations: [],
        isValid: true,
        errors: [],
        attachment: {
          ecr: {
            ansiedade: 0,
            evitacao: 0,
            anxiety: 0,
            avoidance: 0
          },
          securityLevel: 0,
          attachmentStyle: {
            primary: 'secure',
            description: 'Secure attachment style',
            recommendations: ['Continue fostering trust and open communication']
          },
          padraoApego: {
            primary: 'secure',
            description: 'Padrão de apego seguro',
            recommendations: ['Manter comunicação aberta e confiança']
          },
          compatibilidadeApego: 0
        },
        das: {
          consenso: 0,
          satisfacao: 0,
          coesao: 0,
          expressaoAfetiva: 0,
          total: 0
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
        }
      },
      gptAnalysis: gptAnalysis || {
        id: '',
        userId: '',
        partnerId: '',
        date: new Date().toISOString(),
        type: 'individual',
        analysis: {
          moodPatterns: {
            user: { dominant: 'neutral', frequency: {}, transitions: {} },
            partner: { dominant: 'neutral', frequency: {}, transitions: {} },
            overall: { synchronicity: 0, stability: 0, variability: 0 }
          },
          communicationMetrics: { quality: 0, frequency: 0, depth: 0, patterns: [] },
          relationshipDynamics: { strengths: [], challenges: [], recommendations: [] },
          attachmentInsights: { style: '', behaviors: [], triggers: [], suggestions: [] }
        },
        timestamp: new Date().toISOString(),
        version: '1.0',
        metadata: { assessmentCount: 0, timeSpan: '', confidence: 0 }
      },
      metadata: {
        assessmentCount: gptAnalysis?.metadata?.assessmentCount || 1,
        timeSpan: gptAnalysis?.metadata?.timeSpan || '1 day',
        confidence: gptAnalysis?.metadata?.confidence || 0.8,
        lastUpdate: gptAnalysis?.timestamp || new Date().toISOString()
      }
    };
  }

  return {
    id: `analysis_${new Date().getTime()}`,
    userId: gptAnalysis.userId,
    partnerId: gptAnalysis.partnerId,
    date: gptAnalysis.date,
    type: gptAnalysis.type,
    overallHealth: {
      score: gptAnalysis.analysis.overallHealth?.score || 0,
      trend: gptAnalysis.analysis.overallHealth?.trend || 'stable',
      confidence: 0.8
    },
    categories: gptAnalysis.analysis.categories || {},
    strengthsAndChallenges: {
      strengths: gptAnalysis.analysis.relationshipDynamics?.strengths || [],
      challenges: gptAnalysis.analysis.relationshipDynamics?.challenges || []
    },
    communicationSuggestions: gptAnalysis.analysis.communicationMetrics?.patterns || [],
    actionItems: gptAnalysis.analysis.attachmentInsights?.suggestions || [],
    relationshipDynamics: gptAnalysis.analysis.relationshipDynamics || {
      strengths: [],
      challenges: [],
      recommendations: []
    },
    emotionalDynamics: gptAnalysis.analysis.emotionalDynamics || {
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
        effectiveness: 0,
        patterns: [],
        confidence: 0.8
      },
      synchronicity: gptAnalysis.analysis.moodPatterns?.overall?.synchronicity || 0.8,
      stability: gptAnalysis.analysis.moodPatterns?.overall?.stability || 0.7,
      patterns: {
        user: gptAnalysis.analysis.moodPatterns?.user || {
          dominant: 'feliz' as MoodType,
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
        partner: gptAnalysis.analysis.moodPatterns?.partner || {
          dominant: 'feliz' as MoodType,
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
    emotionalSync: gptAnalysis.analysis.moodPatterns?.overall?.synchronicity || 0,
    moodDiscrepancies: [],
    insights: [{
      id: `insight_${new Date().getTime()}`,
      type: 'pattern',
      category: 'attachment',
      description: gptAnalysis.analysis.attachmentInsights?.style || 'Initial analysis',
      confidence: 0.8,
      impact: 'medium',
      timestamp: new Date().toISOString()
    }],
    riskFactors: [],
    recommendations: gptAnalysis.analysis.relationshipDynamics?.recommendations || [],
    validatedScales: {
      consistency: {
        default: {
          score: 0.8,
          confidence: 0.9,
          flags: []
        }
      },
      reliability: 0.85,
      completeness: 0.9,
      recommendations: [],
      isValid: true,
      errors: [],
      attachment: {
        ecr: {
          ansiedade: 0,
          evitacao: 0,
          anxiety: 0,
          avoidance: 0
        },
        securityLevel: 0,
        attachmentStyle: {
          primary: 'secure',
          description: 'Secure attachment style',
          recommendations: ['Continue fostering trust and open communication']
        },
        padraoApego: {
          primary: 'secure',
          description: 'Padrão de apego seguro',
          recommendations: ['Manter comunicação aberta e confiança']
        },
        compatibilidadeApego: 0
      },
      das: {
        consenso: 0,
        satisfacao: 0,
        coesao: 0,
        expressaoAfetiva: 0,
        total: 0
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
      }
    },
    gptAnalysis: gptAnalysis,
    metadata: {
      assessmentCount: gptAnalysis.metadata?.assessmentCount || 1,
      timeSpan: gptAnalysis.metadata?.timeSpan || '1 day',
      confidence: gptAnalysis.metadata?.confidence || 0.8,
      lastUpdate: gptAnalysis.timestamp || new Date().toISOString()
    }
  };
};

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  analysis: gptAnalysis,
  relationshipContext,
  dailyInsight,
  moodAnalysis,
  relationshipAnalysis,
  temporalAnalysis,
  validatedScales,
  attachmentAnalysis,
  clinicalSignificance
}) => {
  const [value, setValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AnalysisTabs] Received props:', {
      hasGPTAnalysis: !!gptAnalysis,
      hasContext: !!relationshipContext,
      hasMoodAnalysis: !!moodAnalysis,
      hasRelationshipAnalysis: !!relationshipAnalysis,
      hasTemporalAnalysis: !!temporalAnalysis,
      relationshipContextData: relationshipContext
    });

    // Validate required data
    if (!gptAnalysis && !relationshipAnalysis) {
      setError('No analysis data available');
      return;
    }

    if (!relationshipContext) {
      setError('Missing relationship context');
      return;
    }

    setError(null);
  }, [gptAnalysis, relationshipContext, relationshipAnalysis]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    console.log('[AnalysisTabs] Changed tab to:', newValue);
  };

  if (error) {
    return (
      <Paper 
        sx={{ 
          p: 4, 
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <InfoIcon 
            color="primary" 
            sx={{ fontSize: 48, mb: 2 }} 
          />
          <Typography variant="h5" color="primary" gutterBottom>
            {error === 'Missing relationship context' ? 'Contexto do Relacionamento Necessário' : 'Erro ao Carregar Análise'}
          </Typography>
          
          {error === 'Missing relationship context' ? (
            <>
              <Typography variant="body1" color="text.secondary" paragraph>
                Para fornecer uma análise precisa, precisamos entender melhor o contexto do seu relacionamento.
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" color="text.primary">
                  Por favor, complete os seguintes passos:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  alignItems: 'flex-start',
                  mx: 'auto',
                  textAlign: 'left'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowForwardIcon color="primary" fontSize="small" />
                    1. Acesse a página de Contexto do Relacionamento
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowForwardIcon color="primary" fontSize="small" />
                    2. Preencha as informações sobre seu relacionamento
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowForwardIcon color="primary" fontSize="small" />
                    3. Salve as informações para ver análises personalizadas
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/relationship"
                sx={{ mt: 4 }}
                endIcon={<ArrowForwardIcon />}
              >
                Configurar Contexto do Relacionamento
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary">
                {error}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                {relationshipContext ? (
                  <CheckCircleOutlineIcon color="success" />
                ) : (
                  <InfoIcon color="error" />
                )}
                <Typography variant="body2">
                  Context Status: {relationshipContext ? 'Available' : 'Missing'}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          background: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="analysis tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoodIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <Typography>Análise de Humor</Typography>
                </Box>
              }
              {...a11yProps(0)}
            />
            {gptAnalysis && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Análise Individual</Typography>
                  </Box>
                }
                {...a11yProps(1)}
              />
            )}
            {relationshipAnalysis && relationshipContext && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Análise do Relacionamento</Typography>
                  </Box>
                }
                {...a11yProps(2)}
              />
            )}
            {temporalAnalysis && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Análise Temporal</Typography>
                  </Box>
                }
                {...a11yProps(3)}
              />
            )}
            {validatedScales && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScaleIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Escalas Validadas</Typography>
                  </Box>
                }
                {...a11yProps(4)}
              />
            )}
            {attachmentAnalysis && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FavoriteIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Métricas de Apego</Typography>
                  </Box>
                }
                {...a11yProps(5)}
              />
            )}
            {clinicalSignificance && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthAndSafetyIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Insights Clínicos</Typography>
                  </Box>
                }
                {...a11yProps(6)}
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          {moodAnalysis && <MoodAnalysis analysis={moodAnalysis} />}
        </TabPanel>

        {gptAnalysis && (
          <TabPanel value={value} index={1}>
            <GPTAnalysisTab analysis={convertGPTAnalysisToRelationshipAnalysis(gptAnalysis)} />
          </TabPanel>
        )}

        {relationshipAnalysis && relationshipContext && (
          <TabPanel value={value} index={2}>
            <RelationshipAnalysisTab
              analysis={relationshipAnalysis}
              relationshipContext={relationshipContext}
            />
          </TabPanel>
        )}

        {temporalAnalysis && (
          <TabPanel value={value} index={3}>
            <TemporalAnalysisTab analysis={temporalAnalysis} />
          </TabPanel>
        )}

        {validatedScales && (
          <TabPanel value={value} index={4}>
            <ValidatedScalesTab analysis={validatedScales} />
          </TabPanel>
        )}

        {attachmentAnalysis && (
          <TabPanel value={value} index={5}>
            <AttachmentMetricsTab analysis={attachmentAnalysis} />
          </TabPanel>
        )}

        {clinicalSignificance && (
          <TabPanel value={value} index={6}>
            <ClinicalInsightsTab analysis={clinicalSignificance} />
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
}; 