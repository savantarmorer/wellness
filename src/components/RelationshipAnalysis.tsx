import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  Recommend as RecommendIcon,
} from '@mui/icons-material';

interface Category {
  score: number;
  trend: string;
  insights: string[];
}

interface RelationshipAnalysisData {
  overallHealth: {
    score: number;
    trend: string;
  };
  categories: {
    [key: string]: Category;
  };
  strengthsAndChallenges: {
    strengths: string[];
    challenges: string[];
  };
  communicationSuggestions: string[];
  actionItems: string[];
  relationshipDynamics: {
    positivePatterns: string[];
    concerningPatterns: string[];
    growthAreas: string[];
  };
}

interface Props {
  analysis: RelationshipAnalysisData | string;
  isLoading?: boolean;
}

const CATEGORY_LABELS: { [key: string]: string } = {
  comunicacao: 'Comunicação',
  conexaoEmocional: 'Conexão Emocional',
  apoioMutuo: 'Apoio Mútuo',
  transparenciaConfianca: 'Transparência e Confiança',
  intimidadeFisica: 'Intimidade Física',
  saudeMental: 'Saúde Mental',
  resolucaoConflitos: 'Resolução de Conflitos',
  segurancaRelacionamento: 'Segurança no Relacionamento',
  satisfacaoGeral: 'Satisfação Geral',
  gratidao: 'Gratidão',
  autocuidado: 'Autocuidado',
  qualidadeTempo: 'Qualidade do Tempo',
  alinhamentoObjetivos: 'Alinhamento de Objetivos',
};

export const RelationshipAnalysis: React.FC<Props> = ({ analysis, isLoading = false }) => {
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

  // If it's a string, display it directly
  if (typeof analysis === 'string') {
    return (
      <Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {analysis}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Ensure we have all required properties
  const {
    overallHealth = { score: 0, trend: 'stable' },
    categories = {},
    strengthsAndChallenges = { strengths: [], challenges: [] },
    communicationSuggestions = [],
    actionItems = [],
    relationshipDynamics = {
      positivePatterns: [],
      concerningPatterns: [],
      growthAreas: [],
    },
  } = analysis;

  return (
    <Box>
      {/* Overall Health Score */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Saúde Geral do Relacionamento
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress
              variant="determinate"
              value={overallHealth.score}
              size={80}
              thickness={4}
              sx={{
                color: (theme) =>
                  overallHealth.score >= 70
                    ? theme.palette.success.main
                    : overallHealth.score >= 40
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
              <Typography variant="h6">
                {overallHealth.score}%
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tendência:
            </Typography>
            {overallHealth.trend === 'up' ? (
              <TrendingUpIcon color="success" />
            ) : overallHealth.trend === 'down' ? (
              <TrendingDownIcon color="error" />
            ) : (
              <span>→</span>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Strengths and Challenges */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StarIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Pontos Fortes</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {strengthsAndChallenges.strengths.map((strength, index) => (
                <Chip
                  key={index}
                  label={strength}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Desafios</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {strengthsAndChallenges.challenges.map((challenge, index) => (
                <Chip
                  key={index}
                  label={challenge}
                  color="error"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Categories Analysis */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Análise por Categoria
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(categories).map(([key, category]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {CATEGORY_LABELS[key] || key}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Score: {category.score}
                  </Typography>
                  {category.trend === 'up' ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : category.trend === 'down' ? (
                    <TrendingDownIcon color="error" fontSize="small" />
                  ) : (
                    <span>→</span>
                  )}
                </Box>
                <List dense>
                  {category.insights.map((insight, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={insight}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Action Items and Suggestions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Ações Sugeridas</Typography>
            </Box>
            <List>
              {actionItems.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>•</ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RecommendIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Sugestões de Comunicação</Typography>
            </Box>
            <List>
              {communicationSuggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>•</ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Relationship Dynamics */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dinâmicas do Relacionamento
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="success.main" gutterBottom>
                Padrões Positivos
              </Typography>
              <List dense>
                {relationshipDynamics.positivePatterns.map((pattern, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <StarIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="warning.main" gutterBottom>
                Áreas de Crescimento
              </Typography>
              <List dense>
                {relationshipDynamics.growthAreas.map((area, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <PsychologyIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={area} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="error.main" gutterBottom>
                Padrões Preocupantes
              </Typography>
              <List dense>
                {relationshipDynamics.concerningPatterns.map((pattern, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}; 