import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Info as InfoIcon,
  Psychology as PsychologyIcon,
  Favorite as FavoriteIcon,
  Balance as BalanceIcon,
} from '@mui/icons-material';
import { ValidatedScalesAnalysis } from '../types';

interface Props {
  analysis: ValidatedScalesAnalysis;
}

const DAS_DESCRIPTIONS = {
  consenso: 'Nível de acordo em questões importantes do relacionamento',
  satisfacao: 'Grau de satisfação com o relacionamento atual',
  coesao: 'Conexão e atividades compartilhadas',
  expressaoAfetiva: 'Demonstrações de afeto e intimidade',
  total: 'Pontuação total da escala DAS'
};

const CSI_DESCRIPTIONS = {
  satisfacaoGlobal: 'Satisfação geral com o relacionamento',
  estabilidade: 'Percepção de estabilidade do relacionamento',
  comprometimento: 'Nível de comprometimento com o relacionamento',
  comunicacao: 'Qualidade da comunicação',
  gestaoConflitos: 'Capacidade de resolver conflitos',
  atividadesCompartilhadas: 'Frequência e qualidade de atividades juntos',
  total: 'Pontuação total da escala CSI'
};

const GOTTMAN_DESCRIPTIONS = {
  fourHorsemen: {
    critica: 'Frequência de críticas destrutivas',
    defensividade: 'Nível de comportamento defensivo',
    desprezo: 'Presença de desprezo na comunicação',
    stonewalling: 'Frequência de afastamento emocional'
  },
  bidsForConnection: {
    tentativas: 'Tentativas de conexão emocional',
    respostasPositivas: 'Respostas positivas às tentativas',
    respostasNegativas: 'Respostas negativas às tentativas',
    respostasNeutras: 'Respostas neutras às tentativas'
  },
  resolucaoConflitos: 'Eficácia na resolução de conflitos',
  significadoCompartilhado: 'Compartilhamento de valores e objetivos',
  reparacao: 'Capacidade de reparar danos emocionais',
  influenciaPositiva: 'Influência positiva mútua'
};

const getProgressValue = (value: number, key: string): number => {
  // DAS scale maximums
  const DAS_MAX = {
    consenso: 65,
    satisfacao: 50,
    coesao: 24,
    expressaoAfetiva: 12,
    total: 151
  };
  
  // Return percentage (0-100)
  return (value / DAS_MAX[key as keyof typeof DAS_MAX]) * 100;
};

const getGottmanProgressValue = (value: number, category: 'fourHorsemen' | 'bidsForConnection' | 'other'): number => {
  switch (category) {
    case 'fourHorsemen':
      // Four horsemen are on a 0-10 scale where lower is better
      return value * 10;
    case 'bidsForConnection':
      // Bids are on a 0-20 scale
      return (value / 20) * 100;
    default:
      // Other metrics are on a 0-10 scale
      return value * 10;
  }
};

export const ValidatedScalesTab: React.FC<Props> = ({ analysis }) => {
  const getScoreColor = (score: number, isNegative: boolean = false) => {
    if (isNegative) {
      return score > 7 ? 'error' : score > 4 ? 'warning' : 'success';
    }
    return score > 7 ? 'success' : score > 4 ? 'warning' : 'error';
  };

  const getGottmanDescription = (key: string, section?: 'fourHorsemen' | 'bidsForConnection'): string => {
    if (section === 'fourHorsemen') {
      return GOTTMAN_DESCRIPTIONS.fourHorsemen[key as keyof typeof GOTTMAN_DESCRIPTIONS.fourHorsemen] || '';
    }
    if (section === 'bidsForConnection') {
      return GOTTMAN_DESCRIPTIONS.bidsForConnection[key as keyof typeof GOTTMAN_DESCRIPTIONS.bidsForConnection] || '';
    }
    return (GOTTMAN_DESCRIPTIONS[key as keyof typeof GOTTMAN_DESCRIPTIONS] as string) || '';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Escalas Validadas
      </Typography>

      {/* DAS Scale */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BalanceIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Escala de Ajustamento Diádico (DAS)
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {analysis?.das && Object.entries(analysis.das).map(([key, value]) => (
            <Grid item xs={12} key={key}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Tooltip title={DAS_DESCRIPTIONS[key as keyof typeof DAS_DESCRIPTIONS]}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressValue(value, key)}
                  color={getScoreColor(value)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* CSI Scale */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FavoriteIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Índice de Satisfação do Casal (CSI)
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {analysis?.csi && Object.entries(analysis.csi).map(([key, value]) => (
            <Grid item xs={12} key={key}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Tooltip title={CSI_DESCRIPTIONS[key as keyof typeof CSI_DESCRIPTIONS]}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={value * 10}
                  color={getScoreColor(value)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Gottman Metrics */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PsychologyIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Métricas de Gottman
          </Typography>
        </Box>

        {/* Four Horsemen */}
        <Typography variant="subtitle2" gutterBottom>
          Os Quatro Cavaleiros
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {analysis?.gottman?.fourHorsemen && Object.entries(analysis.gottman.fourHorsemen).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Tooltip title={getGottmanDescription(key, 'fourHorsemen')}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getGottmanProgressValue(value, 'fourHorsemen')}
                  color={getScoreColor(value, true)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Bids for Connection */}
        <Typography variant="subtitle2" gutterBottom>
          Tentativas de Conexão
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {analysis?.gottman?.bidsForConnection && Object.entries(analysis.gottman.bidsForConnection).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Tooltip title={getGottmanDescription(key, 'bidsForConnection')}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getGottmanProgressValue(value, 'bidsForConnection')}
                  color={key === 'respostasPositivas' ? getScoreColor(value) : getScoreColor(value, true)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Other Metrics */}
        <Typography variant="subtitle2" gutterBottom>
          Outras Métricas
        </Typography>
        <Grid container spacing={2}>
          {Object.entries({
            resolucaoConflitos: analysis.gottman?.resolucaoConflitos || 0,
            significadoCompartilhado: analysis.gottman?.significadoCompartilhado || 0,
            reparacao: analysis.gottman?.reparacao || 0,
            influenciaPositiva: analysis.gottman?.influenciaPositiva || 0
          }).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Tooltip title={getGottmanDescription(key)}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getGottmanProgressValue(value, 'other')}
                  color={getScoreColor(value)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Insights and Recommendations */}
      {(analysis.insights.length > 0 || analysis.recommendations.length > 0) && (
        <Paper elevation={3} sx={{ p: 2 }}>
          {analysis.insights.length > 0 && (
            <Box sx={{ mb: analysis.recommendations.length > 0 ? 2 : 0 }}>
              <Typography variant="subtitle1" gutterBottom>
                Insights
              </Typography>
              {analysis.insights.map((insight, index) => (
                <Alert severity="info" sx={{ mb: 1 }} key={index}>
                  {typeof insight === 'string' ? insight : insight.description}
                </Alert>
              ))}
            </Box>
          )}

          {analysis.recommendations.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Recomendações
              </Typography>
              {analysis.recommendations.map((recommendation, index) => (
                <Alert severity="success" sx={{ mb: 1 }} key={index}>
                  {recommendation}
                </Alert>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}; 