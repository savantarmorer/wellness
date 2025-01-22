import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import type { GPTAnalysis, AnalysisHistoryItem } from '../types';

interface Props {
  analysis: GPTAnalysis | AnalysisHistoryItem;
}

const RelationshipAnalysisContent: React.FC<Props> = ({ analysis }) => {
  const theme = useTheme();

  if (!analysis) {
    return null;
  }

  // Handle individual analysis
  if ('type' in analysis && analysis.type === 'individual') {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Insight Individual
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {analysis.insight}
        </Typography>
      </Box>
    );
  }

  // Handle combined analysis
  const analysisData = 'analysis' in analysis ? analysis.analysis : analysis;
  const {
    overallHealth,
    strengths = [],
    challenges = [],
    recommendations = [],
    actionItems = [],
    categoryAnalysis = {},
  } = analysisData;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Overall Health */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: '16px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Saúde Geral do Relacionamento
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography variant="h3" color="primary">
                {typeof overallHealth === 'number' ? `${overallHealth}%` : overallHealth}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Strengths and Challenges */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: '16px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pontos Fortes
            </Typography>
            <List>
              {strengths.map((strength, index) => (
                <ListItem key={index}>
                  <ListItemText primary={strength} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: '16px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Desafios
            </Typography>
            <List>
              {challenges.map((challenge, index) => (
                <ListItem key={index}>
                  <ListItemText primary={challenge} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: '16px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recomendações
            </Typography>
            <List>
              {recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemText primary={recommendation} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Action Items */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: '16px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ações Práticas
            </Typography>
            <List>
              {actionItems.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Category Analysis */}
        {Object.entries(categoryAnalysis).map(([category, data]) => (
          <Grid item xs={12} md={6} key={category}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                background: alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: '16px',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {category}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Pontuação: {data.score}
                </Typography>
                <Chip
                  label={`Tendência: ${data.trend}`}
                  color={data.trend === 'up' ? 'success' : data.trend === 'down' ? 'error' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              <List>
                {data.insights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export const RelationshipAnalysis: React.FC<Props> = ({ analysis }) => {
  if (!analysis) {
    return null;
  }

  return <RelationshipAnalysisContent analysis={analysis} />;
}; 