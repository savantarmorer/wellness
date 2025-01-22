import { Box, Typography, Paper, Grid, Chip, LinearProgress, Card, CardContent, alpha, Tooltip, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import BalanceIcon from '@mui/icons-material/Balance';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import RecommendIcon from '@mui/icons-material/Recommend';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DescriptionIcon from '@mui/icons-material/Description';
import { useMetricsCalculation } from '../hooks/useMetricsCalculation';
import { useState } from 'react';
import { generateWrittenAnalysis } from '../services/gptAnalysisService';
import { UnifiedAnalysis, MoodType, RelationshipAnalysis } from '../types';

interface Props {
  analysis: UnifiedAnalysis;
}

export const GPTAnalysisTab: React.FC<Props> = ({ analysis }) => {
  const [openAnalysis, setOpenAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [writtenAnalysis, setWrittenAnalysis] = useState<string | null>(null);

  const initializeMoodFrequency = (): Record<MoodType, number> => ({
    'feliz': 0,
    'animado': 0,
    'grato': 0,
    'calmo': 0,
    'satisfeito': 0,
    'amado': 0,
    'ansioso': 0,
    'estressado': 0,
    'triste': 0,
    'irritado': 0,
    'frustrado': 0,
    'exausto': 0,
    'confuso': 0,
    'solitário': 0,
    'neutral': 0,
    'content': 0
  });

  const relationshipAnalysis = analysis.relationshipAnalysis || {
    id: '',
    userId: '',
    partnerId: '',
    date: new Date().toISOString(),
    type: 'individual',
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
        style: '',
        effectiveness: 0,
        patterns: [],
        confidence: 0
      },
      patterns: {
        user: {
          dominant: 'neutral' as MoodType,
          frequency: initializeMoodFrequency(),
          transitions: {}
        },
        partner: {
          dominant: 'neutral' as MoodType,
          frequency: initializeMoodFrequency(),
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
      }
    },
    metadata: {
      assessmentCount: 1,
      timeSpan: '1 day',
      confidence: 0.8,
      lastUpdate: new Date().toISOString()
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
            frequency: initializeMoodFrequency(),
            transitions: {}
          },
          partner: {
            dominant: 'neutral' as MoodType,
            frequency: initializeMoodFrequency(),
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
        },
        overallHealth: {
          score: 0,
          trend: 'stable',
          emotionalSync: 0
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
    clinicalSignificance: {
      gaps: [{
        dimension: 'communication',
        score: 0,
        normativeScore: 0,
        difference: 0,
        isSignificant: false,
        severity: 'low'
      }],
      riskFactors: [],
      protectiveFactors: [],
      recommendations: [],
      severity: 'low',
      confidence: 0.8
    },
    severity: 'low'
  } as RelationshipAnalysis;

  const { metrics, overallHealth, dynamics } = useMetricsCalculation(relationshipAnalysis);

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'improving':
        return <TrendingUpIcon />;
      case 'declining':
        return <TrendingDownIcon />;
      default:
        return undefined;
    }
  };

  const toPercentage = (value: number) => Math.round(value * 100);

  const handleOpenAnalysis = async () => {
    setOpenAnalysis(true);
    setLoading(true);
    
    try {
      const analysisContext: UnifiedAnalysis = {
        gptAnalysis: {
          id: `gpt_${new Date().getTime()}`,
          userId: relationshipAnalysis.userId,
          partnerId: relationshipAnalysis.partnerId || '',
          date: new Date().toISOString(),
          type: 'individual',
          analysis: {
            moodPatterns: {
              user: {
                dominant: 'neutral' as MoodType,
                frequency: initializeMoodFrequency(),
                transitions: {}
              },
              partner: {
                dominant: 'neutral' as MoodType,
                frequency: initializeMoodFrequency(),
                transitions: {}
              },
              overall: {
                synchronicity: metrics.emotionalSync || 0,
                stability: metrics.stability || 0,
                variability: 0
              }
            },
            communicationMetrics: {
              quality: metrics.communicationQuality || 0,
              frequency: 0,
              depth: 0,
              patterns: []
            },
            relationshipDynamics: {
              strengths: dynamics.strengths || [],
              challenges: dynamics.challenges || [],
              recommendations: dynamics.recommendations || []
            },
            attachmentInsights: {
              style: '',
              behaviors: [],
              triggers: [],
              suggestions: []
            },
            overallHealth: {
              score: overallHealth || 0,
              trend: 'stable',
              emotionalSync: metrics.emotionalSync || 0
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
        relationshipContext: analysis.relationshipContext,
        relationshipAnalysis: relationshipAnalysis,
        moodAnalysis: undefined,
        temporalAnalysis: undefined,
        attachmentAnalysis: undefined,
        communicationPatterns: undefined,
        dailyInsight: '',
        stage: {
          current: '',
          nextSteps: [],
          timelineEstimate: ''
        }
      };

      const analysisText = await generateWrittenAnalysis(analysisContext);
      setWrittenAnalysis(analysisText);
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      setWrittenAnalysis('Não foi possível gerar a análise no momento. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        GPT Analysis
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Health
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <LinearProgress
                  variant="determinate"
                  value={toPercentage(relationshipAnalysis.overallHealth.score)}
                  sx={{ flexGrow: 1, mr: 2 }}
                />
                <Typography variant="body2">
                  {toPercentage(relationshipAnalysis.overallHealth.score)}%
                </Typography>
              </Box>
              <Chip
                icon={getTrendIcon(relationshipAnalysis.overallHealth.trend)}
                label={relationshipAnalysis.overallHealth.trend}
                color={getTrendColor(relationshipAnalysis.overallHealth.trend) as any}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenAnalysis}
            disabled={loading}
          >
            Generate Written Analysis
          </Button>
        </Grid>
      </Grid>

      <Dialog
        open={openAnalysis}
        onClose={() => setOpenAnalysis(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>GPT Analysis</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography>{writtenAnalysis}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnalysis(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 