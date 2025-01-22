import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  alpha,
  Button,
  CircularProgress
} from '@mui/material';
import MoodIcon from '@mui/icons-material/Mood';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScaleIcon from '@mui/icons-material/Scale';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
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
import { DiscrepancyAnalysis } from '../components/DiscrepancyAnalysis';
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
import { v4 as uuid } from 'uuid';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
      sx={{ 
        pt: { xs: 2, sm: 3 },
        minHeight: '400px'
      }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </Box>
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
  const { currentUser, userData } = useAuth();
  const [value, setValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('[AnalysisTabs] Received props:', {
      hasGPTAnalysis: !!gptAnalysis,
      hasContext: !!relationshipContext,
      hasMoodAnalysis: !!moodAnalysis,
      hasRelationshipAnalysis: !!relationshipAnalysis && typeof relationshipAnalysis === 'object',
      hasTemporalAnalysis: !!temporalAnalysis,
      relationshipContextData: relationshipContext
    });

    // Only show error if we're missing relationship context
    if (!relationshipContext) {
      setError('Missing relationship context');
      return;
    }

    setError(null);
  }, [gptAnalysis, relationshipContext, relationshipAnalysis]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setIsLoading(true);
    setValue(newValue);
    // Simulate loading state
    setTimeout(() => setIsLoading(false), 500);
  };

  const convertGPTAnalysisToRelationshipAnalysis = (gptAnalysis: GPTAnalysis): RelationshipAnalysis => {
    const defaultMoodFrequency = {
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
    };

    if (!currentUser || !userData || !gptAnalysis || !gptAnalysis.analysis) {
      return {
        id: uuid(),
        userId: userData?.id || '',
        partnerId: userData?.partnerId || '',
        date: new Date().toISOString(),
        type: 'individual' as const,
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
            effectiveness: 0,
            patterns: [],
            confidence: 0.8
          },
          patterns: {
            user: {
              dominant: 'neutral' as MoodType,
              frequency: defaultMoodFrequency,
              transitions: {}
            },
            partner: {
              dominant: 'neutral' as MoodType,
              frequency: defaultMoodFrequency,
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
        metadata: {
          assessmentCount: 0,
          timeSpan: '',
          confidence: 0,
          lastUpdate: new Date().toISOString()
        },
        clinicalSignificance: {
          gaps: [],
          riskFactors: [],
          protectiveFactors: [],
          recommendations: [],
          severity: 'low',
          confidence: 0.8
        },
        gptAnalysis: {
          id: uuid(),
          userId: userData?.id || '',
          partnerId: userData?.partnerId || '',
          date: new Date().toISOString(),
          type: 'individual',
          analysis: {
            moodPatterns: {
              user: {
                dominant: 'neutral',
                frequency: defaultMoodFrequency,
                transitions: {}
              },
              partner: {
                dominant: 'neutral',
                frequency: defaultMoodFrequency,
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
        }
      };
    }

    return {
      id: `analysis_${new Date().getTime()}`,
      userId: userData?.id || '',
      partnerId: userData?.partnerId || '',
      date: new Date().toISOString(),
      type: gptAnalysis.type,
      overallHealth: {
        score: gptAnalysis.analysis.overallHealth?.score || 0,
        trend: (gptAnalysis.analysis.overallHealth?.trend || 'stable') as 'improving' | 'stable' | 'declining',
        confidence: gptAnalysis.metadata?.confidence || 0.8,
        emotionalSync: gptAnalysis.analysis.moodPatterns?.overall?.synchronicity || 0.7
      },
      categories: gptAnalysis.analysis.categories || {},
      strengthsAndChallenges: {
        strengths: gptAnalysis.analysis.relationshipDynamics?.strengths || [],
        challenges: gptAnalysis.analysis.relationshipDynamics?.challenges || []
      },
      communicationSuggestions: gptAnalysis.analysis.communicationMetrics?.patterns || [],
      actionItems: gptAnalysis.analysis.attachmentInsights?.suggestions || [],
      relationshipDynamics: {
        strengths: gptAnalysis.analysis.relationshipDynamics?.strengths || [],
        challenges: gptAnalysis.analysis.relationshipDynamics?.challenges || [],
        recommendations: gptAnalysis.analysis.relationshipDynamics?.recommendations || []
      },
      emotionalDynamics: {
        synchronicity: gptAnalysis.analysis.moodPatterns?.overall?.synchronicity || 0,
        stability: gptAnalysis.analysis.moodPatterns?.overall?.stability || 0,
        emotionalSecurity: gptAnalysis.analysis.emotionalDynamics?.emotionalSecurity || 0,
        intimacyBalance: gptAnalysis.analysis.emotionalDynamics?.intimacyBalance || {
          score: 0,
          areas: {
            emotional: 0,
            physical: 0,
            intellectual: 0,
            shared: 0
          }
        },
        conflictResolution: gptAnalysis.analysis.emotionalDynamics?.conflictResolution || {
          style: 'collaborative',
          effectiveness: 0,
          patterns: [],
          confidence: 0.8
        },
        patterns: {
          user: {
            dominant: gptAnalysis.analysis.moodPatterns?.user?.dominant || 'neutral',
            frequency: gptAnalysis.analysis.moodPatterns?.user?.frequency || defaultMoodFrequency,
            transitions: gptAnalysis.analysis.moodPatterns?.user?.transitions || {}
          },
          partner: {
            dominant: gptAnalysis.analysis.moodPatterns?.partner?.dominant || 'neutral',
            frequency: gptAnalysis.analysis.moodPatterns?.partner?.frequency || defaultMoodFrequency,
            transitions: gptAnalysis.analysis.moodPatterns?.partner?.transitions || {}
          }
        },
        insights: gptAnalysis.analysis.emotionalDynamics?.insights || {
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
      metadata: {
        assessmentCount: gptAnalysis.metadata?.assessmentCount || 1,
        timeSpan: gptAnalysis.metadata?.timeSpan || '1 day',
        confidence: gptAnalysis.metadata?.confidence || 0.8,
        lastUpdate: new Date().toISOString()
      },
      clinicalSignificance: {
        gaps: [{
          dimension: 'communication',
          score: gptAnalysis.analysis.communicationMetrics?.quality || 0,
          normativeScore: 0.7,
          difference: Math.abs((gptAnalysis.analysis.communicationMetrics?.quality || 0) - 0.7),
          isSignificant: Math.abs((gptAnalysis.analysis.communicationMetrics?.quality || 0) - 0.7) > 0.2,
          severity: Math.abs((gptAnalysis.analysis.communicationMetrics?.quality || 0) - 0.7) > 0.3 ? 'high' : 'moderate'
        }],
        riskFactors: [],
        protectiveFactors: [],
        recommendations: [],
        severity: 'low',
        confidence: 0.8
      },
      gptAnalysis
    };
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
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minHeight: { xs: '48px', sm: '56px' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <Typography>Visão Geral</Typography>
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <Typography>Humor e Emoções</Typography>
                </Box>
              }
              {...a11yProps(1)}
            />
            {relationshipAnalysis && relationshipContext && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FavoriteIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Dinâmica do Relacionamento</Typography>
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
                    <Typography>Evolução e Tendências</Typography>
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
                    <Typography>Métricas Detalhadas</Typography>
                  </Box>
                }
                {...a11yProps(4)}
              />
            )}
            {attachmentAnalysis && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography>Padrões de Apego</Typography>
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
                    <Typography>Insights Profissionais</Typography>
                  </Box>
                }
                {...a11yProps(6)}
              />
            )}
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompareArrowsIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <Typography>Análise de Discrepâncias</Typography>
                </Box>
              }
              {...a11yProps(7)}
            />
          </Tabs>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={value} index={0}>
              {gptAnalysis && <GPTAnalysisTab analysis={{
                gptAnalysis,
                relationshipAnalysis: convertGPTAnalysisToRelationshipAnalysis(gptAnalysis),
                dailyInsight: '',
                stage: {
                  current: '',
                  nextSteps: [],
                  timelineEstimate: ''
                }
              }} />}
            </TabPanel>
            <TabPanel value={value} index={1}>
              <>{console.log('[AnalysisTabs] Mood Analysis Data:', moodAnalysis)}
              {moodAnalysis ? (
                <MoodAnalysis analysis={moodAnalysis} />
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nenhuma análise de humor disponível no momento.
                  </Typography>
                </Box>
              )}</>
            </TabPanel>
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
            <TabPanel value={value} index={7}>
              <DiscrepancyAnalysis 
                analysis={relationshipAnalysis || {
                  id: '',
                  userId: '',
                  partnerId: '',
                  date: new Date().toISOString(),
                  type: 'individual',
                  overallHealth: {
                    score: 0,
                    trend: 'stable' as const,
                    confidence: 0.8,
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
                      effectiveness: 0,
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
                    timeSpan: '',
                    confidence: 0,
                    lastUpdate: new Date().toISOString()
                  },
                  clinicalSignificance: {
                    gaps: [],
                    riskFactors: [],
                    protectiveFactors: [],
                    recommendations: [],
                    severity: 'low',
                    confidence: 0.8
                  },
                  gptAnalysis: {
                    id: '',
                    userId: '',
                    partnerId: '',
                    date: new Date().toISOString(),
                    type: 'individual',
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
                  }
                }}
                period="daily"
              />
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
}; 