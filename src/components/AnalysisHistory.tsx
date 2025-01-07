import React from 'react';
import {
  Box,
  Typography,
  Chip,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MotionAccordion } from './MotionComponents';
import type { GPTAnalysis } from '../types';

interface Props {
  analyses: GPTAnalysis[];
}

const AnalysisHistory: React.FC<Props> = ({ analyses }) => {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getHealthScore = (analysis: any): { score: number; label: string } => {
    try {
      if (typeof analysis === 'object' && analysis !== null) {
        if (analysis.relationshipAnalysis && analysis.relationshipAnalysis.overallHealth && typeof analysis.relationshipAnalysis.overallHealth.score === 'number') {
          return {
            score: analysis.relationshipAnalysis.overallHealth.score,
            label: `Saúde: ${analysis.relationshipAnalysis.overallHealth.score}%`
          };
        }
        // Try to find health score in nested analysis object
        if (analysis.analysis && analysis.analysis.overallHealth && typeof analysis.analysis.overallHealth.score === 'number') {
          return {
            score: analysis.analysis.overallHealth.score,
            label: `Saúde: ${analysis.analysis.overallHealth.score}%`
          };
        }
      }
      return { score: 0, label: 'Saúde: N/A' };
    } catch (error) {
      console.error('Error getting health score:', error);
      return { score: 0, label: 'Saúde: N/A' };
    }
  };

  const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.map(item => String(item));
    }
    if (value && typeof value === 'string') {
      return [value];
    }
    return [];
  };

  const getAnalysisDetails = (analysis: any): { 
    strengths: string[],
    challenges: string[],
    recommendations: string[]
  } => {
    try {
      const details = {
        strengths: [] as string[],
        challenges: [] as string[],
        recommendations: [] as string[]
      };

      if (typeof analysis === 'object' && analysis !== null) {
        // Try to get data from direct properties
        if (analysis.strengthsAndChallenges) {
          details.strengths = ensureArray(analysis.strengthsAndChallenges.strengths);
          details.challenges = ensureArray(analysis.strengthsAndChallenges.challenges);
        } else if (analysis.relationshipDynamics) {
          details.strengths = ensureArray(analysis.relationshipDynamics.strengths);
          details.challenges = ensureArray(analysis.relationshipDynamics.challenges);
        } else {
          details.strengths = ensureArray(analysis.strengths);
          details.challenges = ensureArray(analysis.challenges);
        }

        // Try different properties for recommendations
        if (Array.isArray(analysis.communicationSuggestions)) {
          details.recommendations = ensureArray(analysis.communicationSuggestions);
        } else if (Array.isArray(analysis.recommendations)) {
          details.recommendations = ensureArray(analysis.recommendations);
        } else if (Array.isArray(analysis.actionItems)) {
          details.recommendations = ensureArray(analysis.actionItems);
        }

        // If no data found, try nested analysis object
        if (details.strengths.length === 0 && details.challenges.length === 0 && details.recommendations.length === 0) {
          if (analysis.analysis && typeof analysis.analysis === 'object') {
            const nestedAnalysis = analysis.analysis;
            
            if (nestedAnalysis.strengthsAndChallenges) {
              details.strengths = ensureArray(nestedAnalysis.strengthsAndChallenges.strengths);
              details.challenges = ensureArray(nestedAnalysis.strengthsAndChallenges.challenges);
            } else if (nestedAnalysis.relationshipDynamics) {
              details.strengths = ensureArray(nestedAnalysis.relationshipDynamics.strengths);
              details.challenges = ensureArray(nestedAnalysis.relationshipDynamics.challenges);
            }

            if (Array.isArray(nestedAnalysis.communicationSuggestions)) {
              details.recommendations = ensureArray(nestedAnalysis.communicationSuggestions);
            } else if (Array.isArray(nestedAnalysis.recommendations)) {
              details.recommendations = ensureArray(nestedAnalysis.recommendations);
            } else if (Array.isArray(nestedAnalysis.actionItems)) {
              details.recommendations = ensureArray(nestedAnalysis.actionItems);
            }
          }
        }
      }

      return details;
    } catch (error) {
      console.error('Error getting analysis details:', error);
      return {
        strengths: [],
        challenges: [],
        recommendations: []
      };
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Histórico de Análises
      </Typography>
      {analyses.map((analysis, index) => {
        const healthScore = getHealthScore(analysis.analysis);
        const details = getAnalysisDetails(analysis.analysis);
        
        return (
          <MotionAccordion
            key={analysis.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            sx={{
              mb: 2,
              background: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: '16px',
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              }}
            >
              <Typography>
                {formatDate(analysis.date)}
              </Typography>
              <Chip
                label={healthScore.label}
                color={healthScore.score >= 70 ? 'success' : healthScore.score > 0 ? 'warning' : 'default'}
                size="small"
              />
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Pontos Fortes
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {details.strengths.length > 0 ? (
                    details.strengths.map((strength, idx) => (
                      <Chip
                        key={idx}
                        label={String(strength)}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum ponto forte identificado
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                  Desafios
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {details.challenges.length > 0 ? (
                    details.challenges.map((challenge, idx) => (
                      <Chip
                        key={idx}
                        label={String(challenge)}
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum desafio identificado
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                  Recomendações
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {details.recommendations.length > 0 ? (
                    details.recommendations.map((rec, idx) => (
                      <Box component="li" key={idx} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {String(rec)}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma recomendação disponível
                    </Typography>
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </MotionAccordion>
        );
      })}
    </Box>
  );
};

export default AnalysisHistory; 