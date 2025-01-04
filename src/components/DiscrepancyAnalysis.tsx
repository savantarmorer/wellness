import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import type { RelationshipAnalysis } from '../services/gptService';

interface DiscrepancyAnalysisProps {
  analysis: RelationshipAnalysis;
  period: 'daily' | 'weekly' | 'monthly';
}

export const DiscrepancyAnalysis: React.FC<DiscrepancyAnalysisProps> = ({ analysis, period }) => {
  const theme = useTheme();

  const calculateDiscrepancy = (category: string) => {
    const userScore = analysis.categories[category]?.score || 0;
    const partnerScore = analysis.categories[category]?.partnerScore || 0;
    return Math.abs(userScore - partnerScore);
  };

  const getDiscrepancyColor = (discrepancy: number) => {
    if (discrepancy <= 2) return theme.palette.success.main;
    if (discrepancy <= 4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getDiscrepancyLabel = (discrepancy: number) => {
    if (discrepancy <= 2) return 'Baixa';
    if (discrepancy <= 4) return 'Moderada';
    return 'Alta';
  };

  const categories = [
    { id: 'comunicacao', label: 'Comunicação' },
    { id: 'conexaoEmocional', label: 'Conexão Emocional' },
    { id: 'apoioMutuo', label: 'Apoio Mútuo' },
    { id: 'transparenciaConfianca', label: 'Transparência e Confiança' },
    { id: 'intimidadeFisica', label: 'Intimidade Física' },
    { id: 'saudeMental', label: 'Saúde Mental' },
    { id: 'resolucaoConflitos', label: 'Resolução de Conflitos' },
    { id: 'segurancaRelacionamento', label: 'Segurança no Relacionamento' },
    { id: 'alinhamentoObjetivos', label: 'Alinhamento de Objetivos' },
    { id: 'satisfacaoGeral', label: 'Satisfação Geral' },
  ];

  const periodLabel = {
    daily: 'hoje',
    weekly: 'esta semana',
    monthly: 'este mês'
  }[period];

  return (
    <Box>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        paragraph
        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Análise das diferenças de percepção entre você e seu parceiro {periodLabel}.
      </Typography>

      <Grid container spacing={2}>
        {categories.map(category => {
          const discrepancy = calculateDiscrepancy(category.id);
          const color = getDiscrepancyColor(discrepancy);
          const label = getDiscrepancyLabel(discrepancy);

          return (
            <Grid item xs={12} sm={6} key={category.id}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 1, sm: 2 },
                  backgroundColor: theme.palette.background.default
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500
                  }}
                >
                  {category.label}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        mr: 1
                      }}
                    >
                      Discrepância:
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: 500
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>

                  <Tooltip title={`Diferença de ${discrepancy.toFixed(1)} pontos`}>
                    <LinearProgress
                      variant="determinate"
                      value={(discrepancy / 10) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: color,
                        },
                      }}
                    />
                  </Tooltip>

                  {discrepancy > 4 && (
                    <Typography 
                      variant="body2" 
                      color="error"
                      sx={{ 
                        mt: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Atenção: Alta discrepância de percepção nesta área.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {analysis.relationshipDynamics?.discrepancyInsights && (
        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              mb: { xs: 2, sm: 3 }
            }}
          >
            Insights sobre Discrepâncias
          </Typography>
          <Typography 
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            {analysis.relationshipDynamics.discrepancyInsights}
          </Typography>
        </Box>
      )}

      {analysis.relationshipDynamics?.positivePatterns && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Padrões Positivos
          </Typography>
          <Typography>
            {analysis.relationshipDynamics.positivePatterns.join(', ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}; 