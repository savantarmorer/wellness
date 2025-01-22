import React, { ReactNode } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Recommend as RecommendIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import type { GPTAnalysis, AnalysisHistoryItem } from '../types';
import { ErrorBoundary } from './ErrorBoundary';

interface CategoryAnalysis {
  score: number;
  trend: string;
  insights: string[];
}

interface AnalysisData {
  overallHealth: number;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  actionItems: string[];
  categoryAnalysis: Record<string, CategoryAnalysis>;
  relationshipDynamics?: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
  };
}

interface Props {
  analysis: GPTAnalysis | AnalysisHistoryItem;
  isLoading?: boolean;
}

const RelationshipAnalysisContent: React.FC<Props> = ({ analysis, isLoading = false }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analysis) {
    return null;
  }

  // Handle individual analysis with insight
  if ('insight' in analysis && analysis.insight) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Insight Individual
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {analysis.insight || 'Nenhum insight disponível'}
        </Typography>
      </Box>
    );
  }

  // Extract analysis data
  const analysisData = analysis.analysis as AnalysisData;
  const {
    overallHealth,
    strengths = [],
    challenges = [],
    recommendations = [],
    actionItems = [],
    categoryAnalysis = {},
  } = analysisData;

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return <RemoveIcon color="warning" />;
    }
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        mb: { xs: 3, sm: 4 }
      }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={overallHealth}
            size={80}
            thickness={4}
            sx={{
              color: (theme) =>
                overallHealth >= 70
                  ? theme.palette.success.main
                  : overallHealth >= 40
                  ? theme.palette.warning.main
                  : theme.palette.error.main,
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" component="div">
              {overallHealth}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="h6" gutterBottom align="center">
          Saúde Geral do Relacionamento
        </Typography>
      </Box>

      <List sx={{ width: '100%' }}>
        {Array.isArray(strengths) && strengths.length > 0 && (
          <>
            <ListItem>
              <ListItemIcon>
                <StarIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Pontos Fortes
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {strengths.map((strength: string, index: number) => (
                      <Chip
                        key={index}
                        label={strength}
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      />
                    ))}
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </>
        )}

        {Array.isArray(challenges) && challenges.length > 0 && (
          <>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="error" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Desafios
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {challenges.map((challenge: string, index: number) => (
                      <Chip
                        key={index}
                        label={challenge}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      />
                    ))}
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </>
        )}

        {Array.isArray(recommendations) && recommendations.length > 0 && (
          <>
            <ListItem>
              <ListItemIcon>
                <RecommendIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Recomendações
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {recommendations.map((rec: string, index: number) => (
                      <Typography 
                        key={index} 
                        component="div" 
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </>
        )}

        {Array.isArray(actionItems) && actionItems.length > 0 && (
          <>
            <ListItem>
              <ListItemIcon>
                <AssignmentIcon color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Ações Sugeridas
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {actionItems.map((item: string, index: number) => (
                      <Typography 
                        key={index} 
                        component="div" 
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        • {item}
                      </Typography>
                    ))}
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </>
        )}

        {categoryAnalysis && Object.keys(categoryAnalysis).length > 0 && (
          Object.entries(categoryAnalysis).map(([category, data]: [string, CategoryAnalysis]) => (
            <React.Fragment key={category}>
              <ListItem>
                <ListItemIcon>
                  {getTrendIcon(data.trend)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {category}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography 
                          component="span" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          Pontuação: {data.score}/10
                        </Typography>
                      </Box>
                      {Array.isArray(data.insights) && data.insights.map((insight: string, index: number) => (
                        <Typography 
                          key={index} 
                          component="div" 
                          sx={{ 
                            mb: 0.5,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          • {insight}
                        </Typography>
                      ))}
                    </Box>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
};

export const RelationshipAnalysis: React.FC<Props> = (props) => {
  return (
    <ErrorBoundary>
      <RelationshipAnalysisContent {...props} />
    </ErrorBoundary>
  );
}; 