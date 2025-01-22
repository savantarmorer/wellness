import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  Info as InfoIcon,
  CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import { AttachmentAnalysis } from '../types';

interface Props {
  analysis: AttachmentAnalysis;
}

const ATTACHMENT_DESCRIPTIONS = {
  secure: 'Estilo de apego seguro: Confortável com intimidade e independência',
  anxious: 'Estilo de apego ansioso: Preocupação com abandono e necessidade de proximidade',
  avoidant: 'Estilo de apego evitativo: Dificuldade com intimidade e preferência por independência',
  disorganized: 'Estilo de apego desorganizado: Padrões inconsistentes de relacionamento'
};

const ATTACHMENT_COLORS = {
  secure: 'success',
  anxious: 'warning',
  avoidant: 'error',
  disorganized: 'error'
} as const;

export const AttachmentMetricsTab: React.FC<Props> = ({ analysis }) => {
  const getCompatibilityColor = (score: number) => {
    if (score >= 0.7) return 'success';
    if (score >= 0.4) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Métricas de Apego
      </Typography>

      {/* User Attachment Style */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PsychologyIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Seu Estilo de Apego
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<FavoriteIcon />}
            label={analysis.userAttachment}
            color={ATTACHMENT_COLORS[analysis.userAttachment as keyof typeof ATTACHMENT_COLORS]}
            sx={{ mb: 1 }}
          />
          <Tooltip title={ATTACHMENT_DESCRIPTIONS[analysis.userAttachment as keyof typeof ATTACHMENT_DESCRIPTIONS]}>
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {analysis.validatedMetrics?.ecr && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Nível de Ansiedade
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analysis.validatedMetrics.ecr.anxiety * 10}
                color="warning"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Nível de Evitação
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analysis.validatedMetrics.ecr.avoidance * 10}
                color="error"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Partner Attachment Style */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PsychologyIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Estilo de Apego do Parceiro
          </Typography>
        </Box>
        <Box>
          <Chip
            icon={<FavoriteIcon />}
            label={analysis.partnerAttachment}
            color={ATTACHMENT_COLORS[analysis.partnerAttachment as keyof typeof ATTACHMENT_COLORS]}
            sx={{ mb: 1 }}
          />
          <Tooltip title={ATTACHMENT_DESCRIPTIONS[analysis.partnerAttachment as keyof typeof ATTACHMENT_DESCRIPTIONS]}>
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Compatibility Analysis */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CompareArrowsIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Análise de Compatibilidade
          </Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Score de Compatibilidade
          </Typography>
          <LinearProgress
            variant="determinate"
            value={analysis.compatibilityScore * 100}
            color={getCompatibilityColor(analysis.compatibilityScore)}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {analysis.compatibilityScore * 100}% de compatibilidade
          </Typography>
        </Box>
        {analysis.validatedMetrics?.compatibility && (
          <Box>
            <Typography variant="body2" gutterBottom>
              {analysis.validatedMetrics.compatibility.analysis}
            </Typography>
            {analysis.validatedMetrics.compatibility.recommendations.map((recommendation, index) => (
              <Alert severity="info" sx={{ mt: 1 }} key={index}>
                {recommendation}
              </Alert>
            ))}
          </Box>
        )}
      </Paper>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Insights
          </Typography>
          {analysis.insights.map((insight, index) => (
            <Alert severity="info" sx={{ mb: 1 }} key={index}>
              {insight}
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  );
}; 