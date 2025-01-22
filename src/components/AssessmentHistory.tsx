import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { AssessmentWithMetadata } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  assessments: AssessmentWithMetadata[];
}

export const AssessmentHistory: React.FC<Props> = ({ assessments }) => {
  const theme = useTheme();

  const calculateTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };

  const renderScore = (score: number) => {
    let color = theme.palette.error.main;
    if (score >= 70) color = theme.palette.success.main;
    else if (score >= 40) color = theme.palette.warning.main;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(color, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
            },
            flex: 1,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {score}%
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Histórico de Avaliações
      </Typography>

      <List>
        {assessments.map((assessment, index) => {
          const prevAssessment = assessments[index + 1];
          const date = new Date(assessment.timestamp);

          return (
            <React.Fragment key={assessment.id}>
              <ListItem
                component={Paper}
                elevation={0}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  display: 'block',
                }}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ color: 'primary.main', fontWeight: 500 }}
                >
                  {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Typography>

                <Grid container spacing={2}>
                  {/* Scores */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Segurança Emocional"
                            secondary={renderScore(assessment.emotionalSecurity)}
                          />
                          {prevAssessment && renderTrendIcon(
                            calculateTrend(
                              assessment.emotionalSecurity,
                              prevAssessment.emotionalSecurity
                            )
                          )}
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Intimidade"
                            secondary={renderScore(assessment.intimacy)}
                          />
                          {prevAssessment && renderTrendIcon(
                            calculateTrend(
                              assessment.intimacy,
                              prevAssessment.intimacy
                            )
                          )}
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Comunicação"
                            secondary={renderScore(assessment.communication)}
                          />
                          {prevAssessment && renderTrendIcon(
                            calculateTrend(
                              assessment.communication,
                              prevAssessment.communication
                            )
                          )}
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Confiança"
                            secondary={renderScore(assessment.trust)}
                          />
                          {prevAssessment && renderTrendIcon(
                            calculateTrend(
                              assessment.trust,
                              prevAssessment.trust
                            )
                          )}
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  {/* Mood and Notes */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <EmojiIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Humor
                        </Typography>
                        {assessment.mood && (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={assessment.mood.type}
                                size="small"
                                color="primary"
                              />
                              <Typography variant="body2" color="text.secondary">
                                Intensidade: {assessment.mood.intensity}/5
                              </Typography>
                            </Box>
                            {assessment.mood.notes && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {assessment.mood.notes}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>

                      {/* Goals and Challenges */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Metas e Desafios
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {assessment.goals.map((goal, i) => (
                            <Chip
                              key={i}
                              label={goal}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {assessment.challenges.map((challenge, i) => (
                            <Chip
                              key={i}
                              label={challenge}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </ListItem>
              {index < assessments.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
}; 