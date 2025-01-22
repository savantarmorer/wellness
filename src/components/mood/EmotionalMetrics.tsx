import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
} from '@mui/material';
import { Psychology as PsychologyIcon } from '@mui/icons-material';
import type { MoodAnalysis, MoodSynchronyAnalysis } from '../../types';

interface EmotionalMetricsProps {
  analysis: MoodAnalysis | MoodSynchronyAnalysis;
}

function isSyncAnalysis(analysis: MoodAnalysis | MoodSynchronyAnalysis): analysis is MoodSynchronyAnalysis {
  return 'emotionalSync' in analysis;
}

export const EmotionalMetrics: React.FC<EmotionalMetricsProps> = ({ analysis }) => {
  const hasValidMetrics = analysis.metrics && (
    (isSyncAnalysis(analysis) && typeof analysis.emotionalSync === 'number') ||
    (!isSyncAnalysis(analysis) && (
      analysis.metrics.emotionalVariability > 0 ||
      analysis.metrics.moodStability > 0 ||
      analysis.metrics.recoveryResilience > 0
    ))
  );

  return (
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
                {typeof analysis.emotionalSync === 'number' ? (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={analysis.emotionalSync * 100}
                      color={analysis.emotionalSync > 0.7 ? 'success' : 'warning'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {analysis.emotionalSync > 0.7 ? 'Alta sincronização' :
                        analysis.emotionalSync > 0.4 ? 'Sincronização moderada' :
                          'Baixa sincronização'}
                    </Typography>
                  </>
                ) : (
                  <Alert severity="info">Aguardando mais dados para análise</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ) : (
          <>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Variabilidade Emocional
                  </Typography>
                  {hasValidMetrics && typeof analysis.metrics.emotionalVariability === 'number' ? (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.metrics.emotionalVariability * 100}
                        color={analysis.metrics.emotionalVariability > 0.7 ? 'warning' : 'primary'}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {analysis.metrics.emotionalVariability > 0.7 ? 'Alta variabilidade' :
                          analysis.metrics.emotionalVariability > 0.4 ? 'Variabilidade moderada' :
                            'Baixa variabilidade'}
                      </Typography>
                    </>
                  ) : (
                    <Alert severity="info">Aguardando mais dados para análise</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estabilidade de Humor
                  </Typography>
                  {hasValidMetrics && typeof analysis.metrics.moodStability === 'number' ? (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.metrics.moodStability * 100}
                        color={analysis.metrics.moodStability > 0.6 ? 'success' : 'warning'}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {analysis.metrics.moodStability > 0.6 ? 'Alta estabilidade' :
                          analysis.metrics.moodStability > 0.3 ? 'Estabilidade moderada' :
                            'Baixa estabilidade'}
                      </Typography>
                    </>
                  ) : (
                    <Alert severity="info">Aguardando mais dados para análise</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
}; 