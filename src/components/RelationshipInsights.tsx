import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  List,
  useTheme,
  alpha,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  CompareArrows as CompareArrowsIcon,
  Lightbulb as LightbulbIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { DiscrepancyAnalysis } from '../services/insightService';

interface Props {
  discrepancies: DiscrepancyAnalysis[];
}

/**
 * Mapping of category keys to their display labels in Portuguese.
 * Used across multiple components for consistent category naming.
 * @see RelationshipAnalysis.tsx for shared usage
 */
const CATEGORY_LABELS: Record<string, string> = {
  comunicacao: 'Comunicação',
  conexaoEmocional: 'Conexão Emocional',
  apoioMutuo: 'Apoio Mútuo',
  transparenciaConfianca: 'Transparência e Confiança',
  intimidadeFisica: 'Intimidade Física',
  saudeMental: 'Saúde Mental',
  resolucaoConflitos: 'Resolução de Conflitos',
  segurancaRelacionamento: 'Segurança no Relacionamento',
  satisfacaoGeral: 'Satisfação Geral',
};

/**
 * RelationshipInsights Component
 * 
 * Displays relationship discrepancies between partners' assessments.
 * Used in the Discrepancies page to visualize differences in relationship perceptions.
 * 
 * @component
 * @param {Props} props - Component props
 * @param {DiscrepancyAnalysis[]} props.discrepancies - Array of analyzed discrepancies
 * 
 * @dependencies
 * - insightService.ts: Provides DiscrepancyAnalysis type and analysis logic
 * - Material-UI: For UI components and theming
 * 
 * @usage
 * ```tsx
 * <RelationshipInsights discrepancies={discrepancyData} />
 * ```
 */
export const RelationshipInsights: React.FC<Props> = ({ discrepancies }): React.ReactElement => {
  const theme = useTheme();

  /**
   * Maps significance levels to theme colors for consistent visual feedback.
   * Used for styling chips, borders, and icons throughout the component.
   * 
   * @param {('high'|'medium'|'low')} significance - The significance level of the discrepancy
   * @returns {string} The corresponding theme color
   */
  const getSignificanceColor = (significance: 'high' | 'medium' | 'low'): string => {
    switch (significance) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };

  /**
   * Translates significance levels to user-friendly Portuguese labels.
   * Used in Chip components to display discrepancy levels.
   * 
   * @param {('high'|'medium'|'low')} significance - The significance level of the discrepancy
   * @returns {string} The translated label
   */
  const getSignificanceLabel = (significance: 'high' | 'medium' | 'low'): string => {
    switch (significance) {
      case 'high':
        return 'Alta Discrepância';
      case 'medium':
        return 'Média Discrepância';
      case 'low':
        return 'Baixa Discrepância';
      default:
        return '';
    }
  };

  return (
    <List sx={{ width: '100%', p: 0 }}>
      {discrepancies.map((discrepancy) => (
        <Card
          key={discrepancy.category}
          sx={{
            mb: 2,
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4]
            }
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3
            }}>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1
                  }}
                >
                  {CATEGORY_LABELS[discrepancy.category] || discrepancy.category}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CompareArrowsIcon />}
                    label={getSignificanceLabel(discrepancy.significance)}
                    color={
                      discrepancy.significance === 'high' ? 'error' :
                      discrepancy.significance === 'medium' ? 'warning' : 'info'
                    }
                    size="small"
                    sx={{ 
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        px: 2
                      }
                    }}
                  />
                  <Chip
                    label={`Diferença: ${discrepancy.difference.toFixed(1)} pontos`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        px: 2
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ArrowUpIcon 
                        sx={{ 
                          color: theme.palette.primary.main,
                          mr: 1
                        }} 
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Sua Avaliação
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={discrepancy.userRating * 10}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.primary.main,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {discrepancy.userRating.toFixed(1)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: alpha(theme.palette.secondary.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ArrowDownIcon 
                        sx={{ 
                          color: theme.palette.secondary.main,
                          mr: 1
                        }} 
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Avaliação do Parceiro
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={discrepancy.partnerRating * 10}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.secondary.main,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {discrepancy.partnerRating.toFixed(1)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                background: alpha(getSignificanceColor(discrepancy.significance), 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(getSignificanceColor(discrepancy.significance), 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <LightbulbIcon 
                  sx={{ 
                    color: getSignificanceColor(discrepancy.significance),
                    fontSize: 24
                  }} 
                />
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: getSignificanceColor(discrepancy.significance),
                      mb: 0.5,
                      fontWeight: 600
                    }}
                  >
                    Recomendação
                  </Typography>
                  <Typography variant="body2">
                    {discrepancy.recommendation}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </CardContent>
        </Card>
      ))}
    </List>
  );
}; 