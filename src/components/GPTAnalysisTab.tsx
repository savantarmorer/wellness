import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
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
  Timeline,
  Star,
  Error,
  CheckCircle,
} from '@mui/icons-material';
import type { RelationshipAnalysis } from '../types/index';

interface GPTAnalysisTabProps {
  analysis: RelationshipAnalysis;
}

export const GPTAnalysisTab: React.FC<GPTAnalysisTabProps> = ({ analysis }) => {
  return (
    <Box sx={{ p: 2 }}>
      {/* Saúde Geral do Relacionamento */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Psychology sx={{ verticalAlign: 'middle', mr: 1 }} />
          Saúde Geral do Relacionamento
        </Typography>
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={analysis.overallHealth.score * 100}
            color={analysis.overallHealth.score > 0.6 ? 'success' : analysis.overallHealth.score > 0.4 ? 'warning' : 'error'}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Tendência: {analysis.overallHealth.trend === 'improving' ? 'Melhorando' : 
                     analysis.overallHealth.trend === 'stable' ? 'Estável' : 'Em declínio'}
        </Typography>
      </Paper>

      {/* Pontos Fortes e Desafios */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <Star sx={{ verticalAlign: 'middle', mr: 1 }} />
              Pontos Fortes
            </Typography>
            <List>
              {analysis.strengthsAndChallenges.strengths.map((strength: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="success" sx={{ width: '100%' }}>
                    {strength}
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
              Desafios
            </Typography>
            <List>
              {analysis.strengthsAndChallenges.challenges.map((challenge: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    {challenge}
                  </Alert>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Dinâmicas do Relacionamento */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
          Dinâmicas do Relacionamento
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Padrões Positivos
            </Typography>
            <List>
              {analysis.relationshipDynamics.positivePatterns.map((pattern: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="success" sx={{ width: '100%' }}>
                    {pattern}
                  </Alert>
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Padrões Preocupantes
            </Typography>
            <List>
              {analysis.relationshipDynamics.concerningPatterns.map((pattern: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {pattern}
                  </Alert>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Recomendações e Ações */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <Recommend sx={{ verticalAlign: 'middle', mr: 1 }} />
              Sugestões de Comunicação
            </Typography>
            <List>
              {analysis.communicationSuggestions.map((suggestion: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="info" sx={{ width: '100%' }}>
                    {suggestion}
                  </Alert>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <CheckCircle sx={{ verticalAlign: 'middle', mr: 1 }} />
              Ações Sugeridas
            </Typography>
            <List>
              {analysis.actionItems.map((action: string, index: number) => (
                <ListItem key={index}>
                  <Alert severity="info" sx={{ width: '100%' }}>
                    {action}
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