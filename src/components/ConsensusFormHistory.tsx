import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  DialogActions,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  ThumbUp,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { useAuth } from '../contexts/AuthContext';
import type { AnalysisRecord } from '../services/analysisHistoryService';
import type { ConsensusFormData, ConsensusFormAnalysis } from '../services/gptService';

interface ProcessedAnalysis {
  id?: string;
  date: string;
  analysis: ConsensusFormData & {
    analysis?: ConsensusFormAnalysis;
  };
}

const ConsensusFormHistory: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ProcessedAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ProcessedAnalysis | null>(null);
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
        .filter((record): record is AnalysisRecord => {
          return record && 
            record.type === 'individual' &&
            record.analysisType === 'object' &&
            typeof record.analysis === 'object' &&
            'type' in record.analysis &&
            record.analysis.type === 'consensus_form';
        })
        .map(record => ({
          id: record.id,
          date: record.date,
          analysis: record.analysis as ConsensusFormData
        }))
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

  const getAssessmentSummary = (item: ProcessedAnalysis) => {
    if (!item.analysis || !item.analysis.scores || !item.analysis.analysis?.overallAnalysis) {
      return 'Análise não disponível';
    }

    const { overall: score } = item.analysis.scores;
    const { trend } = item.analysis.analysis.overallAnalysis;
    const riskLevel = item.analysis.analysis.overallAnalysis.riskLevel || 'low';
    
    const trendText = trend === 'improving' ? 'melhorando' : 
                     trend === 'stable' ? 'estável' : 'preocupante';
    const riskText = riskLevel === 'high' ? 'alto' : 
                    riskLevel === 'moderate' ? 'moderado' : 'baixo';

    return `Score: ${score}% | Tendência: ${trendText} | Nível de Risco: ${riskText}`;
  };

  const renderAnalysisDialog = () => {
    if (!selectedAnalysis?.analysis?.analysis) return null;

    const analysisData = selectedAnalysis.analysis;
    const analysis = analysisData.analysis as ConsensusFormAnalysis;

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
                value={analysisData.scores?.overall || 0}
                size={60}
                thickness={4}
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Score Geral: {analysisData.scores?.overall || 0}%
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
              {analysis.therapeuticInsights?.immediateActions.map((action: string, index: number) => (
                <ListItem key={`action-${index}`}>
                  <ListItemIcon>
                    <PsychologyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" color="primary" gutterBottom>
              Estratégias de Longo Prazo
            </Typography>
            <List>
              {analysis.therapeuticInsights?.longTermStrategies.map((strategy: string, index: number) => (
                <ListItem key={`strategy-${index}`}>
                  <ListItemIcon>
                    <TimelineIcon color="info" />
                  </ListItemIcon>
                  <ListItemText primary={strategy} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" color="primary" gutterBottom>
              Questões Subjacentes
            </Typography>
            <List>
              {analysis.therapeuticInsights?.underlyingIssues.map((issue: string, index: number) => (
                <ListItem key={`issue-${index}`}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          </Box>

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
                  {analysis.recommendations?.exercises.map((exercise: string, index: number) => (
                    <ListItem key={`exercise-${index}`}>
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
                  {analysis.recommendations?.communication.map((suggestion: string, index: number) => (
                    <ListItem key={`suggestion-${index}`}>
                      <ListItemIcon>
                        <ThumbUp color="success" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>

            {analysis.recommendations?.professionalSupport.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    Suporte Profissional Recomendado
                  </Typography>
                  <List>
                    {analysis.recommendations.professionalSupport.map((support: string, index: number) => (
                      <ListItem key={`support-${index}`}>
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
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pontuações por Categoria
            </Typography>
            {Object.entries(analysisData.scores || {}).map(([category, score]) => (
              category !== 'overall' && (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={score as number}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {score as number}%
                  </Typography>
                </Box>
              )
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAnalysis(null)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      ) : history.length === 0 ? (
        <Typography sx={{ p: 2 }}>
          Nenhuma avaliação encontrada.
        </Typography>
      ) : (
        <List sx={{ width: '100%', p: 0 }}>
          {history.map((item, index) => {
            console.log('Rendering item:', item);
            return (
              <React.Fragment key={item.id || index}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 },
                    py: { xs: 2, sm: 1.5 },
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                    <AssignmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle1"
                        sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          fontWeight: 500
                        }}
                      >
                        Avaliação de {formatDate(item.date)}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {getAssessmentSummary(item)}
                        </Typography>
                        {item.analysis?.analysis?.overallAnalysis?.summary && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mt: 1,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              color: 'text.secondary'
                            }}
                          >
                            {item.analysis.analysis?.overallAnalysis?.summary}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction sx={{ 
                    position: { xs: 'relative', sm: 'absolute' },
                    transform: { xs: 'none', sm: 'translateY(-50%)' },
                    top: { xs: 'auto', sm: '50%' },
                    right: { xs: 0, sm: 16 },
                    mt: { xs: 1, sm: 0 }
                  }}>
                    <IconButton 
                      edge="end" 
                      onClick={() => setSelectedAnalysis(item)}
                      size={window.innerWidth < 600 ? 'small' : 'medium'}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < history.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      )}

      {renderAnalysisDialog()}
    </Box>
  );
};

export default ConsensusFormHistory; 