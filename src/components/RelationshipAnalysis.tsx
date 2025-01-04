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
  Card,
  Stack,
  alpha,
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Stack 
      spacing={{ xs: 2, sm: 3 }}
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        '& *': {
          maxWidth: '100%',
          boxSizing: 'border-box',
        }
      }}
    >
      {/* Overall Health Score */}
      <Card 
        id="saude-geral"
        elevation={0}
        sx={{ 
          p: { xs: 1.5, sm: 3 },
          background: (theme) => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          scrollMarginTop: { xs: '56px', sm: '64px' },
          maxWidth: '100%',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              fontWeight: 600,
            }}
          >
            Saúde Geral do Relacionamento
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 2 },
            mt: { xs: 1, sm: 2 }
          }}>
            <Typography 
              variant="h4" 
              color="primary"
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem' },
                fontWeight: 700,
              }}
            >
              {overallHealth.score}%
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: overallHealth.trend === 'up' 
                ? 'success.main' 
                : overallHealth.trend === 'down' 
                ? 'error.main' 
                : 'text.secondary'
            }}>
              {overallHealth.trend === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              ) : overallHealth.trend === 'down' ? (
                <TrendingDownIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              ) : null}
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Strengths and Challenges */}
      <Grid id="pontos-fortes" container spacing={{ xs: 2, sm: 3 }} sx={{ scrollMarginTop: { xs: '56px', sm: '64px' } }}>
        <Grid item xs={12} sm={6}>
          <Card 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 },
              height: '100%',
              background: (theme) => alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
              <StarIcon color="success" sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="h6" 
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Pontos Fortes
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: { xs: 0.5, sm: 0.75 } 
            }}>
              {strengthsAndChallenges.strengths.map((strength, index) => (
                <Chip
                  key={index}
                  label={strength}
                  color="success"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.813rem' },
                    height: { xs: 24, sm: 32 },
                    m: 0.25,
                  }}
                />
              ))}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 },
              height: '100%',
              background: (theme) => alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
              <WarningIcon color="error" sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="h6" 
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Desafios
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: { xs: 0.5, sm: 0.75 } 
            }}>
              {strengthsAndChallenges.challenges.map((challenge, index) => (
                <Chip
                  key={index}
                  label={challenge}
                  color="error"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.813rem' },
                    height: { xs: 24, sm: 32 },
                    m: 0.25,
                  }}
                />
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Categories Analysis */}
      <Card 
        id="categorias"
        elevation={0}
        sx={{ 
          p: { xs: 1.5, sm: 3 },
          background: (theme) => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          scrollMarginTop: { xs: '56px', sm: '64px' },
          maxWidth: '100%',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            mb: { xs: 2, sm: 3 },
          }}
        >
          Análise por Categoria
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {Object.entries(categories).map(([key, category]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 3 },
                  background: 'transparent',
                  maxWidth: '100%',
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {CATEGORY_LABELS[key] || key}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mr: 1,
                      fontSize: { xs: '0.75rem', sm: '0.813rem' },
                    }}
                  >
                    Score: {category.score}
                  </Typography>
                  {category.trend === 'up' ? (
                    <TrendingUpIcon color="success" sx={{ fontSize: '1rem' }} />
                  ) : category.trend === 'down' ? (
                    <TrendingDownIcon color="error" sx={{ fontSize: '1rem' }} />
                  ) : (
                    <span>→</span>
                  )}
                </Box>
                <List dense sx={{ py: 0 }}>
                  {category.insights?.map((insight, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemText
                        primary={insight}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                          sx: { fontSize: { xs: '0.75rem', sm: '0.813rem' } },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Communication Suggestions */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card 
            id="comunicacao"
            elevation={0}
            sx={{ 
              height: '100%',
              background: (theme) => alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              scrollMarginTop: { xs: '56px', sm: '64px' },
              maxWidth: '100%',
            }}
          >
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                p: { xs: 1.5, sm: 3 },
                bgcolor: theme.palette.primary.main, 
                color: 'white',
                borderRadius: '8px 8px 0 0',
                maxWidth: '100%',
                '& > *': {
                  maxWidth: '100%',
                }
              }}
            >
              <RecommendIcon sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="h6"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Sugestões de Comunicação
              </Typography>
            </Box>
            <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                {Array.isArray(communicationSuggestions) && communicationSuggestions.map((suggestion, index) => (
                  <Box key={index} sx={{ maxWidth: '100%' }}>
                    {typeof suggestion === 'string' ? (
                      <Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium',
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            mb: 0.5,
                          }}
                        >
                          Sugestão {index + 1}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                        >
                          {suggestion}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 'bold', 
                              flex: 1,
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                            }}
                          >
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
                                textTransform: 'capitalize',
                                height: { xs: 20, sm: 24 },
                                fontSize: { xs: '0.688rem', sm: '0.75rem' },
                              }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                        >
                          {(suggestion as CommunicationSuggestion).description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Action Items */}
        <Grid item xs={12} sm={6}>
          <Card 
            id="acoes"
            elevation={0}
            sx={{ 
              height: '100%',
              background: (theme) => alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              scrollMarginTop: { xs: '56px', sm: '64px' },
              maxWidth: '100%',
            }}
          >
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                p: { xs: 1.5, sm: 3 },
                bgcolor: theme.palette.secondary.main, 
                color: 'white',
                borderRadius: '8px 8px 0 0',
                maxWidth: '100%',
                '& > *': {
                  maxWidth: '100%',
                }
              }}
            >
              <AssignmentIcon sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="h6"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Ações Sugeridas
              </Typography>
            </Box>
            <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                {Array.isArray(actionItems) && actionItems.map((action, index) => (
                  <Box key={index} sx={{ maxWidth: '100%' }}>
                    {typeof action === 'string' ? (
                      <Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium',
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            mb: 0.5,
                          }}
                        >
                          Ação {index + 1}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                        >
                          {action}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            {(action as ActionItem).category && (
                              <Box 
                                sx={{ 
                                  mr: 1, 
                                  display: 'flex',
                                  alignItems: 'center',
                                  '& .MuiSvgIcon-root': {
                                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                                  },
                                }}
                              >
                                {getCategoryIcon((action as ActionItem).category!)}
                              </Box>
                            )}
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                              }}
                            >
                              {(action as ActionItem).title}
                            </Typography>
                          </Box>
                          {(action as ActionItem).timeframe && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                ml: 1,
                                '& .MuiSvgIcon-root': {
                                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                                },
                              }}
                            >
                              {getTimeframeIcon((action as ActionItem).timeframe!)}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  ml: 0.5, 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '0.688rem', sm: '0.75rem' },
                                }}
                              >
                                {(action as ActionItem).timeframe}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                        >
                          {(action as ActionItem).description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Relationship Dynamics */}
      <Card 
        id="dinamicas"
        elevation={0}
        sx={{ 
          p: { xs: 1.5, sm: 3 },
          background: (theme) => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          scrollMarginTop: { xs: '56px', sm: '64px' },
          maxWidth: '100%',
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            mb: { xs: 2, sm: 3 },
          }}
        >
          Dinâmicas do Relacionamento
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 },
                background: 'transparent',
              }}
            >
              <Typography 
                variant="subtitle1" 
                color="success.main" 
                gutterBottom
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Padrões Positivos
              </Typography>
              <List dense sx={{ py: 0 }}>
                {relationshipDynamics.positivePatterns.map((pattern, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <StarIcon color="success" sx={{ fontSize: '1.125rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={pattern}
                      primaryTypographyProps={{
                        sx: { fontSize: { xs: '0.75rem', sm: '0.813rem' } },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 },
                background: 'transparent',
              }}
            >
              <Typography 
                variant="subtitle1" 
                color="warning.main" 
                gutterBottom
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Áreas de Crescimento
              </Typography>
              <List dense sx={{ py: 0 }}>
                {relationshipDynamics.growthAreas.map((area, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <PsychologyIcon color="warning" sx={{ fontSize: '1.125rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={area}
                      primaryTypographyProps={{
                        sx: { fontSize: { xs: '0.75rem', sm: '0.813rem' } },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 },
                background: 'transparent',
              }}
            >
              <Typography 
                variant="subtitle1" 
                color="error.main" 
                gutterBottom
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Padrões Preocupantes
              </Typography>
              <List dense sx={{ py: 0 }}>
                {relationshipDynamics.concerningPatterns.map((pattern, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon color="error" sx={{ fontSize: '1.125rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={pattern}
                      primaryTypographyProps={{
                        sx: { fontSize: { xs: '0.75rem', sm: '0.813rem' } },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      </Card>

      {/* Emotional Dynamics */}
      {isRelationshipAnalysis(analysis) && hasEmotionalDynamics(analysis) && (
        <Card 
          id="emocional"
          elevation={0}
          sx={{ 
            p: { xs: 1.5, sm: 3 },
            background: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            scrollMarginTop: { xs: '56px', sm: '64px' },
            maxWidth: '100%',
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              mb: { xs: 2, sm: 3 },
            }}
          >
            Dinâmicas Emocionais
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={4}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  background: 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SecurityIcon 
                    color="primary" 
                    sx={{ 
                      mr: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }} 
                  />
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    Segurança Emocional
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={analysis.emotionalDynamics.emotionalSecurity}
                    size={isMobile ? 48 : 60}
                    thickness={4}
                    sx={{
                      color: (theme) => {
                        const security = analysis.emotionalDynamics.emotionalSecurity;
                        return security >= 70
                          ? theme.palette.success.main
                          : security >= 40
                          ? theme.palette.warning.main
                          : theme.palette.error.main;
                      },
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      ml: 1,
                      fontSize: { xs: '0.75rem', sm: '0.813rem' },
                    }}
                  >
                    {analysis.emotionalDynamics.emotionalSecurity}%
                  </Typography>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  background: 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FavoriteIcon 
                    color="primary" 
                    sx={{ 
                      mr: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }} 
                  />
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    Equilíbrio de Intimidade
                  </Typography>
                </Box>
                <List dense sx={{ py: 0 }}>
                  {Object.entries(analysis.emotionalDynamics.intimacyBalance.areas).map(([key, value]) => (
                    <ListItem key={key} sx={{ px: 0, py: 0.5 }}>
                      <ListItemText 
                        primary={key.charAt(0).toUpperCase() + key.slice(1)} 
                        secondary={`${value}%`}
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.75rem', sm: '0.813rem' } },
                        }}
                        secondaryTypographyProps={{
                          sx: { fontSize: { xs: '0.688rem', sm: '0.75rem' } },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  background: 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BalanceIcon 
                    color="primary" 
                    sx={{ 
                      mr: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }} 
                  />
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    Resolução de Conflitos
                  </Typography>
                </Box>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 1,
                    fontSize: { xs: '0.75rem', sm: '0.813rem' },
                  }}
                >
                  Estilo: {analysis.emotionalDynamics.conflictResolution.style}
                </Typography>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 1,
                    fontSize: { xs: '0.75rem', sm: '0.813rem' },
                  }}
                >
                  Efetividade: {analysis.emotionalDynamics.conflictResolution.effectiveness}%
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {analysis.emotionalDynamics.conflictResolution.patterns.map((pattern, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <TimelineIcon 
                          fontSize="small" 
                          sx={{ fontSize: '1.125rem' }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={pattern}
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.75rem', sm: '0.813rem' } },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
          </Grid>
        </Card>
      )}
    </Stack>
  );
}; 