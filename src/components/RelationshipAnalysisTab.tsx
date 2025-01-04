import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Warning,
  Insights,
  Psychology,
  Recommend,
  CompareArrows,
  Timeline,
} from '@mui/icons-material';
import type { RelationshipAnalysis, RelationshipContext, MoodType } from '../types/index';
import { MOOD_EMOJIS } from './MoodTracker';

const moodEmojis = MOOD_EMOJIS as Record<MoodType, string>;

interface RelationshipAnalysisTabProps {
  analysis: RelationshipAnalysis;
  relationshipContext: RelationshipContext;
}

interface MoodDiscrepancy {
  userMood: {
    primary: MoodType;
    intensity: number;
    secondary?: MoodType[];
  };
  partnerMood: {
    primary: MoodType;
    intensity: number;
    secondary?: MoodType[];
  };
  impact: 'alto' | 'médio' | 'baixo';
  timestamp: string;
}

interface Insight {
  type: 'warning' | 'improvement' | 'info';
  description: string;
  recommendation: string;
}

export const RelationshipAnalysisTab: React.FC<RelationshipAnalysisTabProps> = ({
  analysis,
  relationshipContext,
}) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const emotionalSync = analysis.emotionalSync ?? 0;
  const moodDiscrepancies = analysis.moodDiscrepancies ?? [];
  const insights = analysis.insights ?? [];
  const riskFactors = analysis.riskFactors ?? [];
  const recommendations = analysis.recommendations ?? [];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Análise do Relacionamento com {relationshipContext.partnerName ?? 'Parceiro(a)'}
      </Typography>

      {/* Sincronização Emocional */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Psychology sx={{ verticalAlign: 'middle', mr: 1 }} />
          Sincronização Emocional
        </Typography>
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={emotionalSync * 100}
            color={emotionalSync > 0.6 ? 'success' : emotionalSync > 0.4 ? 'warning' : 'error'}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {emotionalSync > 0.6
            ? 'Boa sincronização emocional'
            : emotionalSync > 0.4
            ? 'Sincronização emocional moderada'
            : 'Baixa sincronização emocional'}
        </Typography>
      </Paper>

      {/* Discrepâncias de Humor */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <CompareArrows sx={{ verticalAlign: 'middle', mr: 1 }} />
          Discrepâncias Significativas
        </Typography>
        <List>
          {moodDiscrepancies.map((discrepancy: MoodDiscrepancy, index: number) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Timeline color={
                    discrepancy.impact === 'alto' ? 'error' :
                    discrepancy.impact === 'médio' ? 'warning' : 'info'
                  } />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      <Typography component="span" mr={1}>
                        Você: {moodEmojis[discrepancy.userMood.primary] ?? '😐'}
                      </Typography>
                      <Typography component="span" mx={1}>
                        vs
                      </Typography>
                      <Typography component="span" ml={1}>
                        Parceiro: {moodEmojis[discrepancy.partnerMood.primary] ?? '😐'}
                      </Typography>
                    </Box>
                  }
                  secondary={`${formatDate(discrepancy.timestamp)} - Impacto ${discrepancy.impact}`}
                />
              </ListItem>
              {index < moodDiscrepancies.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Insights e Recomendações */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <Insights sx={{ verticalAlign: 'middle', mr: 1 }} />
              Insights
            </Typography>
            <List>
              {insights.map((insight: Insight, index: number) => (
                <ListItem key={index}>
                  <Alert
                    severity={
                      insight.type === 'warning' ? 'warning' :
                      insight.type === 'improvement' ? 'success' : 'info'
                    }
                    sx={{ width: '100%' }}
                  >
                    <Typography variant="body2" gutterBottom>
                      {insight.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {insight.recommendation}
                    </Typography>
                  </Alert>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
              Fatores de Risco
            </Typography>
            <List>
              {riskFactors.map((risk: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    {risk}
                  </Alert>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              <Recommend sx={{ verticalAlign: 'middle', mr: 1 }} />
              Recomendações
            </Typography>
            <List>
              {recommendations.map((recommendation: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="info" sx={{ width: '100%' }}>
                    {recommendation}
                  </Alert>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 