import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import type { MoodAnalysis, MoodSynchronyAnalysis } from '../../types';

interface MoodInsightsProps {
  analysis: MoodAnalysis | MoodSynchronyAnalysis;
}

interface MoodInsight {
  id: string;
  type: 'warning' | 'info' | 'pattern' | 'observation';
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: string;
  actionItems?: string[];
}

function isSyncAnalysis(analysis: MoodAnalysis | MoodSynchronyAnalysis): analysis is MoodSynchronyAnalysis {
  return 'emotionalSync' in analysis;
}

export const MoodInsights: React.FC<MoodInsightsProps> = ({ analysis }) => {
  const hasValidInsights = analysis.insights && analysis.insights.length > 0;

  if (!hasValidInsights) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Aguardando mais dados para gerar insights
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <LightbulbIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Insights e Recomendações
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Com base na análise dos seus registros de humor, identificamos padrões e observações importantes 
          que podem ajudar você a entender melhor suas emoções{isSyncAnalysis(analysis) ? ' e seu relacionamento' : ''}.
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {analysis.insights.length === 1 
            ? '1 insight identificado'
            : `${analysis.insights.length} insights identificados`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {analysis.insights.some(i => i.type === 'warning')
            ? 'Existem alguns pontos de atenção que merecem seu cuidado.'
            : 'Os padrões observados indicam uma dinâmica emocional estável.'}
        </Typography>
      </Box>

      <Timeline>
        {analysis.insights.map((insight, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot 
                color={insight.type === 'warning' ? 'error' : 
                       insight.type === 'pattern' ? 'success' : 
                       insight.type === 'observation' ? 'primary' : 'info'}
              >
                {insight.type === 'warning' ? <WarningIcon /> : 
                 insight.type === 'pattern' ? <Timeline /> :
                 insight.type === 'observation' ? <PsychologyIcon /> : 
                 <LightbulbIcon />}
              </TimelineDot>
              {index < analysis.insights.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Alert 
                severity={insight.type === 'warning' ? 'warning' : 
                         insight.type === 'pattern' ? 'success' :
                         insight.type === 'observation' ? 'info' : 'info'} 
                sx={{ mb: 2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {insight.type === 'warning' ? 'Ponto de Atenção' :
                       insight.type === 'pattern' ? 'Padrão Identificado' :
                       insight.type === 'observation' ? 'Observação' : 'Insight'}
                    </Typography>
                    <Typography variant="body2">
                      {insight.description}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    {new Date(insight.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="Categoria do insight identificado">
                    <Chip 
                      label={`Categoria: ${insight.category}`}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                  <Tooltip title="Nível de impacto no seu bem-estar emocional">
                    <Chip 
                      label={`Impacto: ${insight.impact}`} 
                      size="small" 
                      color={insight.impact === 'high' ? 'error' : 
                            insight.impact === 'medium' ? 'warning' : 'default'}
                    />
                  </Tooltip>
                  <Tooltip title="Nível de confiança da análise">
                    <Chip 
                      label={`Confiança: ${(insight.confidence * 100).toFixed(0)}%`} 
                      size="small"
                      color={insight.confidence > 0.7 ? 'success' : 
                            insight.confidence > 0.4 ? 'primary' : 'default'}
                    />
                  </Tooltip>
                </Box>

                {insight.actionItems && insight.actionItems.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      O que você pode fazer:
                    </Typography>
                    <List dense>
                      {insight.actionItems.map((item, idx) => (
                        <ListItem key={idx} sx={{ py: 0 }}>
                          <Typography variant="body2">• {item}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Alert>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Como interpretar estes insights:
        </Typography>
        <List dense>
          <ListItem>
            <Typography variant="body2">
              • <strong>Pontos de Atenção</strong> (vermelho) indicam aspectos que merecem seu cuidado
            </Typography>
          </ListItem>
          <ListItem>
            <Typography variant="body2">
              • <strong>Padrões</strong> (verde) são comportamentos recorrentes identificados
            </Typography>
          </ListItem>
          <ListItem>
            <Typography variant="body2">
              • <strong>Observações</strong> (azul) são análises gerais sobre seu estado emocional
            </Typography>
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
}; 