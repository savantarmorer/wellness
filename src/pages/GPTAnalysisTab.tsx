import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid, LinearProgress, Chip, Alert, Tooltip, IconButton } from '@mui/material';
import { Favorite as FavoriteIcon, Psychology as PsychologyIcon, Info as InfoIcon, CompareArrows as CompareArrowsIcon } from '@mui/icons-material';
import { 
  UnifiedAnalysis, 
  GPTAnalysis, 
  MoodType, 
  CommunicationPatterns,
  TemporalAnalysis,
  RelationshipAnalysis,
  AttachmentStyle,
  MoodSynchronyAnalysis
} from '../types';

interface Props {
  analysis: UnifiedAnalysis;
}

const createDefaultMoodFrequency = (): Record<MoodType, number> => ({
  'feliz': 0,
  'triste': 0,
  'irritado': 0,
  'animado': 0,
  'grato': 0,
  'calmo': 0,
  'satisfeito': 0,
  'amado': 0,
  'ansioso': 0,
  'estressado': 0,
  'frustrado': 0,
  'exausto': 0,
  'confuso': 0,
  'solitário': 0,
  'neutral': 0,
  'content': 0
});

const createDefaultMoodAnalysis = (): MoodSynchronyAnalysis => ({
  patterns: {
    dominantMoods: [],
    moodTransitions: [],
    timePatterns: {},
    daily: [],
    weekly: [],
    monthly: []
  },
  insights: [],
  trends: {
    overall: {
      direction: 'stable',
      significance: 'low'
    },
    emotional: {
      direction: 'stable',
      significance: 'low'
    }
  },
  metrics: {
    emotionalVariability: 0,
    positiveNegativeRatio: 0,
    recoveryResilience: 0,
    moodStability: 0
  },
  emotionalSync: 0,
  moodDiscrepancies: []
});

const createDefaultTimeframe = () => ({
  start: new Date().toISOString(),
  end: new Date().toISOString(),
  duration: '1 day'
});

const createDefaultCategoryRatings = () => ({
  satisfacaoGeral: 0,
  alinhamentoObjetivos: 0,
  conexaoEmocional: 0,
  apoioMutuo: 0,
  segurancaRelacionamento: 0,
  transparenciaConfianca: 0,
  comunicacao: 0,
  intimidade: 0,
  resolucaoConflitos: 0,
  intimidadeFisica: 0,
  crescimentoIndividual: 0,
  atividadesLazer: 0,
  gestaoFinanceira: 0,
  tomadaDecisoes: 0,
  saudeMental: 0,
  autocuidado: 0,
  gratidao: 0,
  qualidadeTempo: 0
});

const createDefaultTemporalAnalysis = (): TemporalAnalysis => ({
  correlation: 0,
  trends: {
    overall: {
      slope: 0,
      rSquared: 0,
      pValue: 0,
      isSignificant: false,
      trend: 'stable',
      confidence: 0.8,
      timeframe: '1 day',
      dataPoints: 0,
      category: 'mood',
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
    }
  },
  patterns: {
    cyclical: [],
    persistent: [],
    emerging: []
  },
  timeframes: {
    daily: {
      averageScores: createDefaultCategoryRatings(),
      discrepancies: [],
      insights: [],
      confidence: 0.8,
      trends: {}
    },
    weekly: {
      averageScores: createDefaultCategoryRatings(),
      discrepancies: [],
      insights: [],
      confidence: 0.8,
      trends: {}
    },
    monthly: {
      averageScores: createDefaultCategoryRatings(),
      discrepancies: [],
      insights: [],
      confidence: 0.8,
      trends: {}
    }
  },
  seasonality: 0,
  volatility: 0,
  confidence: 0.8,
  analysisDate: new Date().toISOString()
});

const createDefaultAttachmentAnalysis = () => ({
  userAttachment: 'secure' as AttachmentStyle,
  partnerAttachment: 'secure' as AttachmentStyle,
  compatibilityScore: 0.5,
  insights: ['Initial assessment pending'],
  validatedMetrics: {
    ecr: {
      anxiety: 0,
      avoidance: 0
    }
  }
});

const createDefaultCommunicationPatterns = (): CommunicationPatterns => ({
  style: 'balanced',
  effectiveness: 0.5,
  patterns: [],
  confidence: 0.5
});

const createDefaultGPTAnalysis = (): GPTAnalysis => ({
  id: `gpt_${new Date().getTime()}`,
  userId: '',
  partnerId: '',
  date: new Date().toISOString(),
  type: 'individual',
  analysis: {
    moodPatterns: {
      user: {
        dominant: 'neutral' as MoodType,
        frequency: createDefaultMoodFrequency(),
        transitions: {}
      },
      partner: {
        dominant: 'neutral' as MoodType,
        frequency: createDefaultMoodFrequency(),
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
});

const createDefaultRelationshipAnalysis = (): RelationshipAnalysis => ({
  id: `rel_${new Date().getTime()}`,
  userId: '',
  partnerId: '',
  date: new Date().toISOString(),
  type: 'individual',
  overallHealth: {
    score: 0,
    trend: 'stable',
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
        frequency: createDefaultMoodFrequency(),
        transitions: {}
      },
      partner: {
        dominant: 'neutral' as MoodType,
        frequency: createDefaultMoodFrequency(),
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
    }
  },
  gptAnalysis: createDefaultGPTAnalysis(),
  metadata: {
    assessmentCount: 1,
    timeSpan: '1 day',
    confidence: 0.8,
    lastUpdate: new Date().toISOString()
  },
  clinicalSignificance: {
    severity: 'low',
    confidence: 0.8,
    gaps: [],
    riskFactors: [],
    protectiveFactors: [],
    recommendations: []
  }
});

export const GPTAnalysisTab: React.FC<Props> = ({ analysis }) => {
  const { gptAnalysis } = analysis;
  
  // Create fallback mood analysis if needed
  const moodAnalysis = useMemo(() => {
    return analysis.moodAnalysis || createDefaultMoodAnalysis();
  }, [analysis.moodAnalysis]);
  
  if (!gptAnalysis) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No GPT analysis available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Relationship Analysis
      </Typography>

      {/* Mood Patterns Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Mood Patterns
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">User's Dominant Mood</Typography>
            <Chip 
              label={gptAnalysis.analysis.moodPatterns.user.dominant}
              color="primary"
              sx={{ mt: 1 }}
            />
            {moodAnalysis.metrics && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Variability: {Math.round(moodAnalysis.metrics.emotionalVariability * 100)}%
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Partner's Dominant Mood</Typography>
            <Chip 
              label={gptAnalysis.analysis.moodPatterns.partner.dominant}
              color="secondary"
              sx={{ mt: 1 }}
            />
            {moodAnalysis.metrics && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Stability: {Math.round(moodAnalysis.metrics.moodStability * 100)}%
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Emotional Synchronicity</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={gptAnalysis.analysis.moodPatterns.overall.synchronicity * 100} 
                  color="primary"
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(gptAnalysis.analysis.moodPatterns.overall.synchronicity * 100)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Communication Metrics Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              <CompareArrowsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Communication Metrics
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Quality</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={gptAnalysis.analysis.communicationMetrics.quality * 100}
                  color="success"
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(gptAnalysis.analysis.communicationMetrics.quality * 100)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Frequency</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={gptAnalysis.analysis.communicationMetrics.frequency * 100}
                  color="info"
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(gptAnalysis.analysis.communicationMetrics.frequency * 100)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Depth</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={gptAnalysis.analysis.communicationMetrics.depth * 100}
                  color="warning"
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(gptAnalysis.analysis.communicationMetrics.depth * 100)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Relationship Dynamics Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Relationship Dynamics
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>Strengths</Typography>
            {gptAnalysis.analysis.relationshipDynamics.strengths.map((strength, index) => (
              <Chip
                key={index}
                label={strength}
                color="success"
                sx={{ m: 0.5 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>Challenges</Typography>
            {gptAnalysis.analysis.relationshipDynamics.challenges.map((challenge, index) => (
              <Chip
                key={index}
                label={challenge}
                color="error"
                sx={{ m: 0.5 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>Recommendations</Typography>
            {gptAnalysis.analysis.relationshipDynamics.recommendations.map((recommendation, index) => (
              <Chip
                key={index}
                label={recommendation}
                color="info"
                sx={{ m: 0.5 }}
              />
            ))}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default GPTAnalysisTab; 