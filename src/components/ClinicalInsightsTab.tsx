import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { ClinicalSignificance } from '../types';

interface Props {
  analysis: ClinicalSignificance;
}

const SEVERITY_COLORS = {
  low: 'success',
  moderate: 'warning',
  high: 'error'
} as const;

const DIMENSION_DESCRIPTIONS = {
  emotionalSecurity: 'Nível de segurança emocional no relacionamento',
  intimacy: 'Profundidade da conexão íntima',
  communication: 'Eficácia da comunicação',
  trust: 'Nível de confiança mútua',
  conflictResolution: 'Capacidade de resolver conflitos',
  attachment: 'Padrões de apego',
  satisfaction: 'Satisfação geral com o relacionamento',
  commitment: 'Nível de comprometimento',
  stability: 'Estabilidade do relacionamento'
};

export const ClinicalInsightsTab: React.FC<Props> = ({ analysis }) => {
  const getSeverityColor = (severity: 'low' | 'moderate' | 'high') => {
    return SEVERITY_COLORS[severity];
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Insights Clínicos
      </Typography>

      {/* Clinical Gaps Analysis */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HealthIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Análise de Lacunas Clínicas
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {analysis.gaps.map((gap, index) => (
            <Grid item xs={12} key={index}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    {gap.dimension}
                  </Typography>
                  <Tooltip title={DIMENSION_DESCRIPTIONS[gap.dimension as keyof typeof DIMENSION_DESCRIPTIONS] || ''}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Chip
                    icon={<WarningIcon />}
                    label={gap.severity}
                    color={getSeverityColor(gap.severity)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Score Atual
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={gap.score * 10}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Score Normativo
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={gap.normativeScore * 10}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Grid>
                </Grid>

                {gap.isSignificant && (
                  <Alert 
                    severity={gap.severity === 'high' ? 'error' : gap.severity === 'moderate' ? 'warning' : 'info'}
                    sx={{ mt: 2 }}
                  >
                    Diferença significativa de {Math.abs(gap.difference * 100).toFixed(1)}% em relação ao esperado
                  </Alert>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Clinical Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PsychologyIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              Recomendações Clínicas
            </Typography>
          </Box>

          {analysis.recommendations.map((recommendation, index) => (
            <Alert 
              severity="info" 
              sx={{ mb: index < analysis.recommendations.length - 1 ? 2 : 0 }}
              key={index}
            >
              {recommendation}
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  );
}; 