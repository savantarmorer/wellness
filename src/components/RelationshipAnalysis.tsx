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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  LinearProgress,
  Alert,
  Tooltip,
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
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { ComprehensiveAnalysis, EmotionalDynamics, GottmanMetrics } from '../types';

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
  analysis: ComprehensiveAnalysis;
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

  // Type guard to check if analysis has required properties
  const isRelationshipAnalysis = (analysis: ComprehensiveAnalysis | string): analysis is ComprehensiveAnalysis => {
    if (typeof analysis === 'string') {
      try {
        const parsedAnalysis = JSON.parse(analysis);
        return (
          typeof parsedAnalysis === 'object' &&
          parsedAnalysis !== null &&
          'relationshipAnalysis' in parsedAnalysis &&
          typeof parsedAnalysis.relationshipAnalysis === 'object' &&
          'overallHealth' in parsedAnalysis.relationshipAnalysis &&
          'categories' in parsedAnalysis.relationshipAnalysis &&
          'strengthsAndChallenges' in parsedAnalysis.relationshipAnalysis &&
          'relationshipDynamics' in parsedAnalysis.relationshipAnalysis
        );
      } catch {
        return false;
      }
    }
    
    if (!analysis) return false;
    
    const hasRequiredProperties = typeof analysis === 'object' && 
           'relationshipAnalysis' in analysis &&
           typeof analysis.relationshipAnalysis === 'object' &&
           'overallHealth' in analysis.relationshipAnalysis &&
           'categories' in analysis.relationshipAnalysis &&
           'strengthsAndChallenges' in analysis.relationshipAnalysis &&
           'relationshipDynamics' in analysis.relationshipAnalysis;

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

  const hasEmotionalDynamics = (analysis: ComprehensiveAnalysis): boolean => {
    return analysis?.emotionalDynamics !== undefined && 
      typeof analysis.emotionalDynamics === 'object' &&
      analysis.emotionalDynamics !== null &&
      'emotionalSecurity' in analysis.emotionalDynamics &&
      'intimacyBalance' in analysis.emotionalDynamics &&
      'conflictResolution' in analysis.emotionalDynamics;
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Try to parse string analysis
  let parsedAnalysis: ComprehensiveAnalysis;
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

  const { relationshipAnalysis, emotionalDynamics } = analysis;

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
      strengths: [],
      challenges: [],
      recommendations: []
    },
  } = relationshipAnalysis;

  const getScaleDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      consenso: 'Nível de acordo em questões importantes do relacionamento',
      satisfacao: 'Grau de satisfação com o relacionamento atual',
      coesao: 'Conexão e atividades compartilhadas',
      expressaoAfetiva: 'Demonstrações de afeto e intimidade'
    };
    return descriptions[key] || '';
  };

  const getMaxScore = (key: string): number => {
    const maxScores: Record<string, number> = {
      consenso: 65,
      satisfacao: 50,
      coesao: 24,
      expressaoAfetiva: 12
    };
    return maxScores[key] || 100;
  };

  const getScoreColor = (key: string, value: number): string => {
    const score = (value / getMaxScore(key)) * 100;
    return score >= 70 ? '#4caf50' : score >= 40 ? '#ff9800' : '#f44336';
  };

  const getScoreSeverity = (key: string, value: number): 'success' | 'warning' | 'error' => {
    const score = (value / getMaxScore(key)) * 100;
    return score >= 70 ? 'success' : score >= 40 ? 'warning' : 'error';
  };

  const getRecommendation = (key: string, value: number): string => {
    const score = (value / getMaxScore(key)) * 100;
    if (score < 40) {
      return 'Considere buscar apoio profissional para trabalhar nesta área.';
    } else if (score < 70) {
      return 'Há espaço para melhorias. Tente as sugestões personalizadas.';
    }
    return '';
  };

  const getFourHorsemenDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      critica: 'Frequência com que seu parceiro critica seu caráter em vez de um comportamento específico',
      defensividade: 'Frequência com que seu parceiro contra-ataca em vez de ouvir e reconhecer',
      desprezo: 'Frequência com que seu parceiro demonstra superioridade ou zomba de você',
      stonewalling: 'Frequência com que seu parceiro se retira ou se fecha durante conflitos'
    };
    return descriptions[key] || '';
  };

  const getFourHorsemenColor = (value: number): string => {
    return value <= 3 ? '#4caf50' : value <= 6 ? '#ff9800' : '#f44336';
  };

  const calculatePositiveResponseRate = (bids: GottmanMetrics['bidsForConnection']): number => {
    const total = bids.respostasPositivas + bids.respostasNegativas + bids.respostasNeutras;
    return total > 0 ? Math.round((bids.respostasPositivas / total) * 100) : 0;
  };

  const getResponseRateSeverity = (bids: GottmanMetrics['bidsForConnection']): 'success' | 'warning' | 'error' => {
    const rate = calculatePositiveResponseRate(bids);
    return rate >= 70 ? 'success' : rate >= 40 ? 'warning' : 'error';
  };

  const getBidsDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      tentativas: 'Frequência com que seu parceiro tenta criar momentos de conexão com você',
      respostasPositivas: 'Frequência com que seu parceiro responde positivamente às suas tentativas de conexão',
      respostasNegativas: 'Frequência com que seu parceiro ignora ou responde negativamente às suas tentativas',
      respostasNeutras: 'Frequência com que seu parceiro responde sem real engajamento às suas tentativas'
    };
    return descriptions[key] || '';
  };

  const getResponseRateRecommendation = (bids: GottmanMetrics['bidsForConnection']): string => {
    const rate = calculatePositiveResponseRate(bids);
    if (rate < 40) {
      return 'Preocupante: Considere trabalhar na responsividade às tentativas de conexão do parceiro';
    } else if (rate < 70) {
      return 'Moderado: Continue melhorando o reconhecimento e resposta às tentativas de conexão';
    }
    return 'Saudável: Mantenha o alto nível de responsividade às tentativas de conexão';
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
              color: overallHealth.trend === 'improving' 
                ? 'success.main' 
                : overallHealth.trend === 'declining' 
                ? 'error.main' 
                : 'text.secondary'
            }}>
              {overallHealth.trend === 'improving' ? (
                <TrendingUpIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              ) : overallHealth.trend === 'declining' ? (
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
                  {category.trend === 'improving' ? (
                    <TrendingUpIcon color="success" sx={{ fontSize: '1rem' }} />
                  ) : category.trend === 'declining' ? (
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
              <Typography variant="h6" gutterBottom>
                Pontos Fortes
              </Typography>
              <List dense sx={{ py: 0 }}>
                {relationshipDynamics.strengths.map((pattern: string, index: number) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <StarIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
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
              <Typography variant="h6" gutterBottom>
                Desafios
              </Typography>
              <List dense sx={{ py: 0 }}>
                {relationshipDynamics.challenges.map((pattern: string, index: number) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
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
              <Typography variant="h6" gutterBottom>
                Recomendações
              </Typography>
              <List dense sx={{ py: 0 }}>
                {relationshipDynamics.recommendations.map((pattern: string, index: number) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LightbulbIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      </Card>

      {/* Emotional Dynamics */}
      {hasEmotionalDynamics(analysis) && (
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
            <Grid item xs={12} sm={6}>
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
                    value={emotionalDynamics.emotionalSecurity}
                    size={isMobile ? 48 : 60}
                    thickness={4}
                    sx={{
                      color: (theme) => {
                        const security = emotionalDynamics.emotionalSecurity;
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
                    {emotionalDynamics.emotionalSecurity}%
                  </Typography>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
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
                  Efetividade: {emotionalDynamics.conflictResolution.effectiveness}%
                </Typography>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 1,
                    fontSize: { xs: '0.75rem', sm: '0.813rem' },
                  }}
                >
                  Confiança: {emotionalDynamics.conflictResolution.confidence}%
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {emotionalDynamics.conflictResolution.patterns.map((pattern: string, index: number) => (
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

      {/* Validated Scales Analysis */}
      <Card 
        id="validated-scales"
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
          Métricas Validadas
        </Typography>

        {/* DAS Section */}
        <Accordion defaultExpanded={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1">Escala de Ajuste Diádico (DAS)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Uma medida validada do ajuste no relacionamento, incluindo consenso, satisfação, coesão e expressão afetiva">
                <IconButton size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {analysis.validatedScales?.das && Object.entries(analysis.validatedScales.das).map(([key, value]) => (
                key !== 'total' && (
                  <Grid item xs={12} sm={6} key={key}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {key}
                        </Typography>
                        <Tooltip title={getScaleDescription(key)}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={((value as number) / getMaxScore(key)) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: getScoreColor(key, value),
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {value}/{getMaxScore(key)}
                        </Typography>
                      </Box>
                      {getRecommendation(key, value) && (
                        <Alert 
                          severity={getScoreSeverity(key, value)} 
                          sx={{ mt: 1, '& .MuiAlert-message': { fontSize: '0.75rem' } }}
                        >
                          {getRecommendation(key, value)}
                        </Alert>
                      )}
                    </Box>
                  </Grid>
                )
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Gottman Metrics Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1">Métricas Gottman</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Análise baseada na pesquisa dos Quatro Cavaleiros e Tentativas de Conexão">
                <IconButton size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Four Horsemen */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Os Quatro Cavaleiros</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {analysis.validatedScales?.gottman?.fourHorsemen && 
                   Object.entries(analysis.validatedScales.gottman.fourHorsemen).map(([key, value]) => (
                    <Box key={key} sx={{ minWidth: 150, flex: 1 }}>
                      <Tooltip title={getFourHorsemenDescription(key)}>
                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                            {key}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getFourHorsemenColor(value),
                              }}
                            />
                            <Typography variant="body2">{value}/10</Typography>
                          </Box>
                        </Box>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Bids for Connection */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Tentativas de Conexão</Typography>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {analysis.validatedScales?.gottman?.bidsForConnection && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Taxa de Resposta Positiva: {calculatePositiveResponseRate(analysis.validatedScales.gottman.bidsForConnection)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={calculatePositiveResponseRate(analysis.validatedScales.gottman.bidsForConnection)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                      <Alert severity={getResponseRateSeverity(analysis.validatedScales.gottman.bidsForConnection)}>
                        {getResponseRateRecommendation(analysis.validatedScales.gottman.bidsForConnection)}
                      </Alert>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>
    </Stack>
  );
}; 