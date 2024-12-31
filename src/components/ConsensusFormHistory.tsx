import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Grid,
  Chip,
  CircularProgress,
  useTheme,
  ListItemIcon,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  ThumbUp,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { useAuth } from '../contexts/AuthContext';
import type { ConsensusFormData } from '../services/analysisHistoryService';

const ConsensusFormHistory: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ConsensusFormData[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ConsensusFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const analysisHistory = await getAnalysisHistory(currentUser.uid);
      const consensusForms = analysisHistory
        .filter(record => 
          typeof record.analysis === 'object' && 
          'type' in record.analysis && 
          record.analysis.type === 'consensus_form'
        )
        .map(record => record.analysis as ConsensusFormData)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setHistory(consensusForms);
    } catch (err) {
      console.error('Error loading consensus form history:', err);
      setError('Erro ao carregar histórico de análises.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAnalysisDialog = () => {
    if (!selectedAnalysis?.analysis) return null;

    const analysis = selectedAnalysis.analysis;

    return (
      <Dialog 
        open={!!selectedAnalysis} 
        onClose={() => setSelectedAnalysis(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Análise do Formulário - {formatDate(selectedAnalysis.date)}
          {analysis.overallAnalysis.riskLevel !== 'low' && (
            <Chip
              label={`Risco ${analysis.overallAnalysis.riskLevel === 'high' ? 'Alto' : 'Moderado'}`}
              color={analysis.overallAnalysis.riskLevel === 'high' ? 'error' : 'warning'}
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumo Geral
            </Typography>
            <Typography>
              {analysis.overallAnalysis.summary}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress
                variant="determinate"
                value={analysis.overallAnalysis.score}
                size={60}
                thickness={4}
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Score Geral: {analysis.overallAnalysis.score}%
                <br />
                Tendência: {analysis.overallAnalysis.trend === 'improving' ? 'Melhorando' : 
                           analysis.overallAnalysis.trend === 'stable' ? 'Estável' : 'Preocupante'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Insights Terapêuticos
            </Typography>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Ações Imediatas
            </Typography>
            <List>
              {analysis.therapeuticInsights.immediateActions.map((action: string, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <PsychologyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Questões Subjacentes
            </Typography>
            <List>
              {analysis.therapeuticInsights.underlyingIssues.map((issue: string, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recomendações
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Exercícios Práticos
                </Typography>
                <List>
                  {analysis.recommendations.exercises.map((exercise: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <StarIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={exercise} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Sugestões de Comunicação
                </Typography>
                <List>
                  {analysis.recommendations.communication.map((suggestion: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ThumbUp color="success" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Box>

          {analysis.recommendations.professionalSupport.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="h6" gutterBottom color="warning.main">
                  Suporte Profissional Recomendado
                </Typography>
                <List>
                  {analysis.recommendations.professionalSupport.map((support: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AssignmentIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={support} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Nenhuma análise encontrada.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Histórico de Análises
      </Typography>
      <Paper elevation={2}>
        <List>
          {history.map((form, index) => (
            <React.Fragment key={form.date}>
              <ListItem>
                <ListItemText
                  primary={formatDate(form.date)}
                  secondary={form.analysis?.overallAnalysis.summary}
                  secondaryTypographyProps={{
                    sx: { 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => setSelectedAnalysis(form)}
                    color="primary"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < history.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      {renderAnalysisDialog()}
    </Box>
  );
};

export default ConsensusFormHistory; 