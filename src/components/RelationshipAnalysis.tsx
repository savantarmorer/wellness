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
  Divider,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  Recommend as RecommendIcon,
  Schedule as ScheduleIcon,
  Chat as ChatIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  Favorite as FavoriteIcon,
  Balance as BalanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { RelationshipAnalysis as RelationshipAnalysisType } from '../services/gptService';

interface CommunicationSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActionItem {
  title: string;
  description: string;
  category?: string;
  timeframe?: 'immediate' | 'short-term' | 'long-term';
}

interface Props {
  analysis: RelationshipAnalysisType | string;
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
  const theme = useTheme();

  // Type guard to check if analysis is RelationshipAnalysisType and has required properties
  const isRelationshipAnalysis = (analysis: RelationshipAnalysisType | string): analysis is RelationshipAnalysisType => {
    if (typeof analysis === 'string') {
      try {
        const parsedAnalysis = JSON.parse(analysis);
        return (
          typeof parsedAnalysis === 'object' &&
          parsedAnalysis !== null &&
          'overallHealth' in parsedAnalysis &&
          'categories' in parsedAnalysis &&
          'strengthsAndChallenges' in parsedAnalysis &&
          'relationshipDynamics' in parsedAnalysis
        );
      } catch {
        return false;
      }
    }
    
    if (!analysis) return false;
    
    const hasRequiredProperties = typeof analysis === 'object' && 
           'overallHealth' in analysis &&
           'categories' in analysis &&
           'strengthsAndChallenges' in analysis &&
           'relationshipDynamics' in analysis;

    if (!hasRequiredProperties) return false;

    // Validate emotionalDynamics structure if present
    if ('emotionalDynamics' in analysis && analysis.emotionalDynamics) {
      const dynamics = analysis.emotionalDynamics;
      return typeof dynamics === 'object' &&
             'emotionalSecurity' in dynamics &&
             'intimacyBalance' in dynamics &&
             'conflictResolution' in dynamics;
    }

    return true;
  };

  // Early return if analysis is not the correct type or is loading
  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Try to parse string analysis
  let parsedAnalysis: RelationshipAnalysisType;
  if (typeof analysis === 'string') {
    try {
      const parsed = JSON.parse(analysis);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedAnalysis = parsed;
      } else {
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Análise não disponível
            </Typography>
          </Box>
        );
      }
    } catch {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Análise não disponível
          </Typography>
        </Box>
      );
    }
  } else {
    parsedAnalysis = analysis;
  }

  if (!isRelationshipAnalysis(parsedAnalysis)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Análise não disponível
        </Typography>
      </Box>
    );
  }

  analysis = parsedAnalysis;

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe.toLowerCase()) {
      case 'immediate':
        return <ScheduleIcon color="error" />;
      case 'short-term':
        return <ScheduleIcon color="warning" />;
      case 'long-term':
        return <ScheduleIcon color="info" />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'communication':
        return <ChatIcon />;
      case 'emotional':
        return <StarIcon />;
      case 'practical':
        return <AssignmentIcon />;
      case 'growth':
        return <TimelineIcon />;
      default:
        return <CategoryIcon />;
    }
  };

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

  const hasEmotionalDynamics = (analysis: RelationshipAnalysisType): boolean => {
    return analysis?.emotionalDynamics !== undefined && 
      typeof analysis.emotionalDynamics === 'object' &&
      analysis.emotionalDynamics !== null &&
      'emotionalSecurity' in analysis.emotionalDynamics &&
      'intimacyBalance' in analysis.emotionalDynamics &&
      'conflictResolution' in analysis.emotionalDynamics;
  };

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
        {/* Sugestões de Comunicação */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, bgcolor: theme.palette.primary.main, color: 'white', p: 1, borderRadius: 1 }}>
              <RecommendIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Sugestões de Comunicação</Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {Array.isArray(communicationSuggestions) && communicationSuggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    {typeof suggestion === 'string' ? (
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Sugestão {index + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {suggestion}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                            {(suggestion as CommunicationSuggestion).title}
                          </Typography>
                          {(suggestion as CommunicationSuggestion).priority && (
                            <Chip
                              label={(suggestion as CommunicationSuggestion).priority}
                              size="small"
                              sx={{
                                bgcolor: getPriorityColor((suggestion as CommunicationSuggestion).priority),
                                color: 'white',
                                ml: 1,
                                textTransform: 'capitalize'
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {(suggestion as CommunicationSuggestion).description}
                        </Typography>
                      </Box>
                    )}
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Ações Sugeridas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, bgcolor: theme.palette.secondary.main, color: 'white', p: 1, borderRadius: 1 }}>
              <AssignmentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Ações Sugeridas</Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {Array.isArray(actionItems) && actionItems.map((action, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    {typeof action === 'string' ? (
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Ação {index + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            {(action as ActionItem).category && (
                              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                {getCategoryIcon((action as ActionItem).category!)}
                              </Box>
                            )}
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {(action as ActionItem).title}
                            </Typography>
                          </Box>
                          {(action as ActionItem).timeframe && (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                              {getTimeframeIcon((action as ActionItem).timeframe!)}
                              <Typography variant="caption" sx={{ ml: 0.5, textTransform: 'capitalize' }}>
                                {(action as ActionItem).timeframe}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {(action as ActionItem).description}
                        </Typography>
                      </Box>
                    )}
                  </ListItem>
                </React.Fragment>
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

      {/* Emotional Dynamics */}
      {isRelationshipAnalysis(analysis) && hasEmotionalDynamics(analysis) && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dinâmicas Emocionais
          </Typography>
          <Grid container spacing={2}>
            {/* Emotional Security */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Segurança Emocional
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={analysis.emotionalDynamics.emotionalSecurity * 20}
                    size={60}
                    thickness={4}
                    sx={{
                      color: (theme) => {
                        const security = analysis.emotionalDynamics.emotionalSecurity;
                        return security >= 4
                          ? theme.palette.success.main
                          : security >= 3
                          ? theme.palette.warning.main
                          : theme.palette.error.main;
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {analysis.emotionalDynamics.emotionalSecurity.toFixed(1)}/5
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Intimacy Balance */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FavoriteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Equilíbrio de Intimidade
                  </Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Emocional" 
                      secondary={`${analysis.emotionalDynamics.intimacyBalance.areas.emotional.toFixed(1)}/5`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Física" 
                      secondary={`${analysis.emotionalDynamics.intimacyBalance.areas.physical.toFixed(1)}/5`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Intelectual" 
                      secondary={`${analysis.emotionalDynamics.intimacyBalance.areas.intellectual.toFixed(1)}/5`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Compartilhada" 
                      secondary={`${analysis.emotionalDynamics.intimacyBalance.areas.shared.toFixed(1)}/5`} 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Conflict Resolution */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BalanceIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Resolução de Conflitos
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Estilo: {analysis.emotionalDynamics.conflictResolution.style}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Efetividade: {analysis.emotionalDynamics.conflictResolution.effectiveness.toFixed(1)}/5
                </Typography>
                <List dense>
                  {analysis.emotionalDynamics.conflictResolution.patterns.map((pattern, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TimelineIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={pattern} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}; 