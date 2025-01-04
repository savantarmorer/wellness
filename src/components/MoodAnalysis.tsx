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
import type { MoodAnalysis as MoodAnalysisType, MoodType } from '../types/index';

const MOOD_EMOJIS: Record<MoodType, string> = {
  'feliz': '😊',
  'animado': '🤗',
  'grato': '🙏',
  'calmo': '😌',
  'satisfeito': '😃',
  'ansioso': '😰',
  'estressado': '😫',
  'triste': '😢',
  'irritado': '😠',
  'frustrado': '😤',
  'exausto': '😩',
  'esperançoso': '🤔',
  'confuso': '😕',
  'solitário': '😔',
  'amado': '🥰'
};

interface MoodAnalysisProps {
  analysis: MoodAnalysisType;
}

export const MoodAnalysis: React.FC<MoodAnalysisProps> = ({ analysis }) => {
  return (
    <Box sx={{ p: 2 }}>
      {/* Métricas Emocionais */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <PsychologyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Métricas Emocionais
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Variabilidade Emocional
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analysis.metrics.emotionalVariability * 100}
                  color={analysis.metrics.emotionalVariability > 0.7 ? 'warning' : 'primary'}
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
                  value={analysis.metrics.moodStability * 100}
                  color={analysis.metrics.moodStability > 0.6 ? 'success' : 'warning'}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Padrões de Humor */}
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
                      {MOOD_EMOJIS[mood.mood]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(mood.frequency * 100).toFixed(0)}% do tempo
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={mood.averageIntensity * 20}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Insights */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <LightbulbIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Insights
        </Typography>
        <Timeline>
          {analysis.insights.map((insight: { type: string; description: string; confidence: number; recommendation?: string }, index: number) => (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineDot color={
                  insight.type === 'warning' ? 'error' :
                  insight.type === 'improvement' ? 'success' :
                  insight.type === 'pattern' ? 'primary' : 'info'
                }>
                  {insight.type === 'warning' ? <WarningIcon /> :
                   insight.type === 'improvement' ? <TrendingUpIcon /> :
                   <LightbulbIcon />}
                </TimelineDot>
                {index < analysis.insights.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Alert
                  severity={
                    insight.type === 'warning' ? 'warning' :
                    insight.type === 'improvement' ? 'success' : 'info'
                  }
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" gutterBottom>
                    {insight.description}
                  </Typography>
                  {insight.recommendation && (
                    <Typography variant="body2" color="text.secondary">
                      {insight.recommendation}
                    </Typography>
                  )}
                </Alert>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>
    </Box>
  );
}; 