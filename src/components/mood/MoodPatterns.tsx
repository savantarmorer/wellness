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
  List,
  ListItem,
} from '@mui/material';
import { Timeline } from '@mui/icons-material';
import type { MoodAnalysis, MoodSynchronyAnalysis, MoodType } from '../../types';

interface MoodPatternsProps {
  analysis: MoodAnalysis | MoodSynchronyAnalysis;
}

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

function isSyncAnalysis(analysis: MoodAnalysis | MoodSynchronyAnalysis): analysis is MoodSynchronyAnalysis {
  return 'emotionalSync' in analysis;
}

export const MoodPatterns: React.FC<MoodPatternsProps> = ({ analysis }) => {
  if (isSyncAnalysis(analysis)) return null;

  const hasValidPatterns = analysis.patterns && (
    (analysis.patterns.dominantMoods && analysis.patterns.dominantMoods.length > 0) ||
    Object.keys(analysis.patterns.timePatterns || {}).length > 0
  );

  if (!hasValidPatterns) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Aguardando mais dados para identificar padrões de humor
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
        Padrões de Humor
      </Typography>

      <Grid container spacing={2}>
        {analysis.patterns.dominantMoods.map((mood, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" component="span" sx={{ mr: 1 }}>
                    {moodEmojis[mood.mood]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mood.frequency} ocorrências
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

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Padrões Temporais
        </Typography>
        <Grid container spacing={2}>
          {analysis.patterns.daily.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Padrões Diários
                  </Typography>
                  <List dense>
                    {analysis.patterns.daily.map((pattern, index) => (
                      <ListItem key={index}>
                        <Typography variant="body2">{pattern}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {analysis.patterns.weekly.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Padrões Semanais
                  </Typography>
                  <List dense>
                    {analysis.patterns.weekly.map((pattern, index) => (
                      <ListItem key={index}>
                        <Typography variant="body2">{pattern}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {analysis.patterns.moodTransitions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Transições de Humor
          </Typography>
          <Grid container spacing={1}>
            {analysis.patterns.moodTransitions.map((transition, index) => (
              <Grid item key={index}>
                <Chip
                  label={transition}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
}; 