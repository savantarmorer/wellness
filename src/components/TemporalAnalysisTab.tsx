import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Info,
} from '@mui/icons-material';
import { TemporalAnalysis } from '../types';

interface Props {
  analysis: TemporalAnalysis;
}

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving':
      return <TrendingUp color="success" />;
    case 'declining':
      return <TrendingDown color="error" />;
    default:
      return <TrendingFlat color="info" />;
  }
};

const getConvergenceColor = (convergence: 'converging' | 'stable' | 'diverging') => {
  switch (convergence) {
    case 'converging':
      return 'success';
    case 'diverging':
      return 'error';
    default:
      return 'info';
  }
};

export const TemporalAnalysisTab: React.FC<Props> = ({ analysis }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Análise Temporal
      </Typography>

      {/* Trends Section */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
          Tendências por Categoria
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(analysis.trends).map(([category, data]) => (
            <Grid item xs={12} sm={6} key={category}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {category}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Você:
                  </Typography>
                  {getTrendIcon(data.userTrend?.trend || 'stable')}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Parceiro:
                  </Typography>
                  {getTrendIcon(data.partnerTrend?.trend || 'stable')}
                </Box>
                <Chip
                  label={`Tendência: ${data.trend || 'stable'}`}
                  color={getConvergenceColor(data.trend === 'improving' ? 'converging' : data.trend === 'declining' ? 'diverging' : 'stable')}
                  size="small"
                  sx={{ mt: 1 }}
                />
                {(data.magnitude || 0) > 0.5 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Alta magnitude detectada
                  </Alert>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Patterns Section */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Padrões Identificados
        </Typography>
        
        {/* Cyclical Patterns */}
        {analysis.patterns.cyclical.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Padrões Cíclicos
            </Typography>
            <List>
              {analysis.patterns.cyclical.map((pattern, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Timeline color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={pattern} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Persistent Patterns */}
        {analysis.patterns.persistent.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom>
              Padrões Persistentes
            </Typography>
            <List>
              {analysis.patterns.persistent.map((pattern, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={pattern} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Emerging Patterns */}
        {analysis.patterns.emerging.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              Padrões Emergentes
            </Typography>
            <List>
              {analysis.patterns.emerging.map((pattern, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText primary={pattern} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>

      {/* Timeframes Analysis */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Análise por Período
        </Typography>
        
        {/* Daily Analysis */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Análise Diária
          </Typography>
          {Object.entries(analysis.timeframes.daily.averageScores).map(([category, score]) => (
            <Box key={category} sx={{ mb: 1 }}>
              <Typography variant="body2" gutterBottom>
                {category}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={score * 10}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
          {analysis.timeframes.daily.insights.map((insight, index) => (
            <Alert severity={insight.type === 'improvement' ? 'success' : 'warning'}>
              <Typography>
                {insight.category}: {insight.description}
              </Typography>
            </Alert>
          ))}
        </Box>

        {/* Weekly Analysis */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Análise Semanal
          </Typography>
          {Object.entries(analysis.timeframes.weekly.averageScores).map(([category, score]) => (
            <Box key={category} sx={{ mb: 1 }}>
              <Typography variant="body2" gutterBottom>
                {category}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={score * 10}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
          {analysis.timeframes.weekly.insights.map((insight, index) => (
            <Alert severity={insight.type === 'improvement' ? 'success' : 'warning'}>
              <Typography>
                {insight.category}: {insight.description}
              </Typography>
            </Alert>
          ))}
        </Box>

        {/* Monthly Analysis */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Análise Mensal
          </Typography>
          {Object.entries(analysis.timeframes.monthly.averageScores).map(([category, score]) => (
            <Box key={category} sx={{ mb: 1 }}>
              <Typography variant="body2" gutterBottom>
                {category}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={score * 10}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
          {analysis.timeframes.monthly.insights.map((insight, index) => (
            <Alert severity={insight.type === 'improvement' ? 'success' : 'warning'}>
              <Typography>
                {insight.category}: {insight.description}
              </Typography>
            </Alert>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}; 