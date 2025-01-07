import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import type { MoodAnalysis as MoodAnalysisType, MoodType, MoodSynchronyAnalysis } from '../types/index';

const moodEmojis: Record<MoodType, string> = {
  feliz: '😊',
  animado: '😃',
  grato: '🙏',
  calmo: '😌',
  satisfeito: '😊',
  amado: '🥰',
  ansioso: '😰',
  estressado: '😫',
  triste: '😢',
  irritado: '😠',
  frustrado: '😤',
  exausto: '😩',
  confuso: '😕',
  solitário: '😔',
  neutral: '😐',
  content: '🙂'
};

interface MoodAnalysisProps {
  analysis: MoodAnalysisType | MoodSynchronyAnalysis;
}

function isMoodAnalysis(analysis: MoodAnalysisType | MoodSynchronyAnalysis): analysis is MoodAnalysisType {
  return 'metrics' in analysis && !('emotionalSync' in analysis);
}

function isSyncAnalysis(analysis: MoodAnalysisType | MoodSynchronyAnalysis): analysis is MoodSynchronyAnalysis {
  return 'emotionalSync' in analysis && !('metrics' in analysis);
}

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
    }
  }
};

const getSliderColor = (value: number, ranges: typeof SCALE_RANGES.das[keyof typeof SCALE_RANGES.das]): 'success' | 'warning' | 'error' => {
  if (value >= ranges.healthy.min) return 'success';
  if (value >= ranges.moderate.min) return 'warning';
  return 'error';
};

export const MoodAnalysis: React.FC<MoodAnalysisProps> = ({ analysis }) => {
  return (
    <Box sx={{ p: 2 }}>
      {/* Métricas Emocionais */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <PsychologyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          {isSyncAnalysis(analysis) ? 'Sincronização Emocional' : 'Métricas Emocionais'}
        </Typography>
        <Grid container spacing={2}>
          {isSyncAnalysis(analysis) ? (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sincronização Emocional
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={typeof (analysis as MoodSynchronyAnalysis).emotionalSync === 'number' ? (analysis as MoodSynchronyAnalysis).emotionalSync * 100 : 0}
                    color={typeof (analysis as MoodSynchronyAnalysis).emotionalSync === 'number' && (analysis as MoodSynchronyAnalysis).emotionalSync > 0.7 ? 'success' : 'warning'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ) : (
            <>
              {isMoodAnalysis(analysis) && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Variabilidade Emocional
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={typeof analysis.metrics.emotionalVariability === 'number' ? analysis.metrics.emotionalVariability * 100 : 0}
                          color={typeof analysis.metrics.emotionalVariability === 'number' && analysis.metrics.emotionalVariability > 0.7 ? 'warning' : 'primary'}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Estabilidade de Humor
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={typeof analysis.metrics.moodStability === 'number' ? analysis.metrics.moodStability * 100 : 0}
                          color={typeof analysis.metrics.moodStability === 'number' && analysis.metrics.moodStability > 0.6 ? 'success' : 'warning'}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>
      </Paper>

      {/* Padrões de Humor ou Discrepâncias */}
      {!isSyncAnalysis(analysis) && isMoodAnalysis(analysis) && (
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
            Padrões de Humor
          </Typography>
          <Grid container spacing={2}>
            {analysis.patterns.dominantMoods.map((mood: { mood: MoodType; frequency: number; averageIntensity: number }, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" component="span" sx={{ mr: 1 }}>
                        {moodEmojis[mood.mood]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(mood.frequency * 100).toFixed(0)}% do tempo
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={typeof mood.averageIntensity === 'number' ? mood.averageIntensity * 20 : 0}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Insights */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <LightbulbIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Insights
        </Typography>
        <Timeline>
          {isSyncAnalysis(analysis) && analysis.insights ? (
            analysis.insights.map((insight, index: number) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color="info">
                    <LightbulbIcon />
                  </TimelineDot>
                  {index < analysis.insights.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      {insight.description}
                    </Typography>
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {insight.actionItems[0]}
                      </Typography>
                    )}
                  </Alert>
                </TimelineContent>
              </TimelineItem>
            ))
          ) : isMoodAnalysis(analysis) && analysis.insights ? (
            analysis.insights.map((insight, index: number) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color={insight.type === 'warning' ? 'error' : 'info'}>
                    {insight.type === 'warning' ? <WarningIcon /> : <LightbulbIcon />}
                  </TimelineDot>
                  {index < analysis.insights.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Alert severity={insight.type === 'warning' ? 'warning' : 'info'} sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      {insight.description}
                    </Typography>
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {insight.actionItems[0]}
                      </Typography>
                    )}
                  </Alert>
                </TimelineContent>
              </TimelineItem>
            ))
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                Nenhum insight disponível no momento.
              </Typography>
            </Alert>
          )}
        </Timeline>
      </Paper>
    </Box>
  );
}; 