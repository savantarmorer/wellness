import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimelineIcon from '@mui/icons-material/Timeline';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import type { GPTAnalysis } from '../types';

interface Props {
  analyses: GPTAnalysis[];
}

export const AnalysisHistoryList: React.FC<Props> = ({ analyses }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>(false);

  // Sort and limit analyses to 10 most recent
  const sortedAnalyses = useMemo(() => {
    return [...analyses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [analyses]);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getHealthScore = (analysisContent: any): { score: number; label: string } => {
    try {
      if (typeof analysisContent === 'object' && analysisContent !== null) {
        if (analysisContent.overallHealth && typeof analysisContent.overallHealth.score === 'number') {
          return {
            score: analysisContent.overallHealth.score,
            label: `Saúde: ${analysisContent.overallHealth.score}%`
          };
        }
        // Try to find health score in nested analysis object
        if (analysisContent.analysis && analysisContent.analysis.overallHealth && typeof analysisContent.analysis.overallHealth.score === 'number') {
          return {
            score: analysisContent.analysis.overallHealth.score,
            label: `Saúde: ${analysisContent.analysis.overallHealth.score}%`
          };
        }
      }
      return { score: 0, label: 'Saúde: N/A' };
    } catch (error) {
      console.error('Error getting health score:', error);
      return { score: 0, label: 'Saúde: N/A' };
    }
  };

  const formatDebugContent = (content: any): string => {
    try {
      if (typeof content === 'string') {
        return content;
      }
      if (typeof content === 'object' && content !== null) {
        return JSON.stringify(content, null, 2);
      }
      return String(content);
    } catch (error) {
      return 'Error formatting content';
    }
  };

  const renderAnalysisContent = (analysisContent: any) => {
    // Ensure we have valid content
    if (!analysisContent) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Análise não disponível
          </Typography>
        </Box>
      );
    }

    // Handle text report format
    if (typeof analysisContent === 'string') {
      const sections = analysisContent.split('\n\n').filter(Boolean);
      return (
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 },
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            borderRadius: { xs: 1.5, sm: 2 },
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.3s ease'
          }}
        >
          {sections.map((section: string, index: number) => (
            <Box key={index} sx={{ mb: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  color: theme.palette.text.primary,
                  fontWeight: section.startsWith('1.') ? 600 : 400,
                  fontSize: section.startsWith('1.') ? { xs: '1rem', sm: '1.1rem' } : { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {section}
              </Typography>
              {index < sections.length - 1 && (
                <Divider 
                  sx={{ 
                    my: { xs: 2, sm: 3 },
                    opacity: 0.2,
                    borderColor: theme.palette.primary.main
                  }} 
                />
              )}
            </Box>
          ))}
        </Paper>
      );
    }

    // Handle object format
    if (typeof analysisContent === 'object' && analysisContent !== null) {
      // Try to get text report first
      if (analysisContent.textReport && typeof analysisContent.textReport === 'string') {
        return renderAnalysisContent(analysisContent.textReport);
      }

      // Extract structured data
      let strengths: string[] = [];
      let challenges: string[] = [];
      let recommendations: string[] = [];

      // Extract data from different possible structures
      if (analysisContent.strengthsAndChallenges) {
        strengths = Array.isArray(analysisContent.strengthsAndChallenges.strengths) 
          ? analysisContent.strengthsAndChallenges.strengths 
          : [];
        challenges = Array.isArray(analysisContent.strengthsAndChallenges.challenges) 
          ? analysisContent.strengthsAndChallenges.challenges 
          : [];
      } else if (analysisContent.strengths) {
        strengths = Array.isArray(analysisContent.strengths) ? analysisContent.strengths : [];
        challenges = Array.isArray(analysisContent.challenges) ? analysisContent.challenges : [];
      }

      if (Array.isArray(analysisContent.communicationSuggestions)) {
        recommendations = analysisContent.communicationSuggestions;
      } else if (Array.isArray(analysisContent.recommendations)) {
        recommendations = analysisContent.recommendations;
      } else if (Array.isArray(analysisContent.actionItems)) {
        recommendations = analysisContent.actionItems;
      }

      // If no data found, try nested analysis object
      if (strengths.length === 0 && challenges.length === 0 && recommendations.length === 0) {
        if (analysisContent.analysis && typeof analysisContent.analysis === 'object') {
          const nestedAnalysis = analysisContent.analysis;
          
          if (nestedAnalysis.strengthsAndChallenges) {
            strengths = Array.isArray(nestedAnalysis.strengthsAndChallenges.strengths) 
              ? nestedAnalysis.strengthsAndChallenges.strengths 
              : [];
            challenges = Array.isArray(nestedAnalysis.strengthsAndChallenges.challenges) 
              ? nestedAnalysis.strengthsAndChallenges.challenges 
              : [];
          }

          if (Array.isArray(nestedAnalysis.communicationSuggestions)) {
            recommendations = nestedAnalysis.communicationSuggestions;
          } else if (Array.isArray(nestedAnalysis.recommendations)) {
            recommendations = nestedAnalysis.recommendations;
          } else if (Array.isArray(nestedAnalysis.actionItems)) {
            recommendations = nestedAnalysis.actionItems;
          }
        }
      }

      // If we still have no data, show debug info
      if (strengths.length === 0 && challenges.length === 0 && recommendations.length === 0) {
        return (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Análise em formato não suportado
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {formatDebugContent(analysisContent)}
            </Typography>
          </Box>
        );
      }

      // Render structured data
      return (
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, sm: 3 }
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 3 },
              background: alpha(theme.palette.success.main, 0.05),
              borderRadius: { xs: 1.5, sm: 2 },
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              transition: 'all 0.3s ease',
              flex: 1,
              minWidth: { md: '30%' },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: theme.palette.success.main,
                fontWeight: 600,
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Pontos Fortes
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1
            }}>
              {strengths.length > 0 ? (
                strengths.map((strength: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={String(strength)}
                    color="success"
                    size="small"
                    sx={{ 
                      borderRadius: '8px',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: 'auto',
                      py: 1,
                      '& .MuiChip-label': {
                        display: 'block',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        px: { xs: 1, sm: 2 }
                      }
                    }}
                  />
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Nenhum ponto forte identificado
                </Typography>
              )}
            </Box>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 3 },
              background: alpha(theme.palette.error.main, 0.05),
              borderRadius: { xs: 1.5, sm: 2 },
              border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
              transition: 'all 0.3s ease',
              flex: 1,
              minWidth: { md: '30%' },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: theme.palette.error.main,
                fontWeight: 600,
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Desafios
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1
            }}>
              {challenges.length > 0 ? (
                challenges.map((challenge: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={String(challenge)}
                    color="error"
                    size="small"
                    sx={{ 
                      borderRadius: '8px',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: 'auto',
                      py: 1,
                      '& .MuiChip-label': {
                        display: 'block',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        px: { xs: 1, sm: 2 }
                      }
                    }}
                  />
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Nenhum desafio identificado
                </Typography>
              )}
            </Box>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 3 },
              background: alpha(theme.palette.info.main, 0.05),
              borderRadius: { xs: 1.5, sm: 2 },
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              transition: 'all 0.3s ease',
              flex: 1,
              minWidth: { md: '30%' },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: theme.palette.info.main,
                fontWeight: 600,
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Recomendações
            </Typography>
            <Box 
              component="ul" 
              sx={{ 
                m: 0, 
                pl: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              {recommendations.length > 0 ? (
                recommendations.map((rec: any, idx: number) => (
                  <Box 
                    component="li" 
                    key={idx} 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&::marker': {
                        color: theme.palette.info.main
                      }
                    }}
                  >
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: 'inherit' }}
                    >
                      {String(rec)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Nenhuma recomendação disponível
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      );
    }

    // If we get here, we have an unsupported format
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Formato de análise não suportado
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {formatDebugContent(analysisContent)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Histórico de Análises
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            maxWidth: 600
          }}
        >
          Acompanhe a evolução do seu relacionamento através das análises realizadas
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1,
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          Mostrando as {Math.min(sortedAnalyses.length, 10)} análises mais recentes
        </Typography>
      </Box>

      <List sx={{ width: '100%', p: 0 }}>
        {sortedAnalyses.map((analysis) => {
          const healthScore = getHealthScore(analysis.analysis);
          
          return (
            <Accordion
              key={analysis.id}
              expanded={expanded === analysis.id}
              onChange={handleChange(analysis.id)}
              sx={{ 
                mb: { xs: 1.5, sm: 2 },
                width: '100%',
                background: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
                borderRadius: { xs: '12px !important', sm: '16px !important' },
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0'
                },
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`
                }
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon sx={{ 
                    color: theme.palette.primary.main,
                    transition: 'transform 0.3s ease',
                    transform: expanded === analysis.id ? 'rotate(180deg)' : 'none'
                  }} />
                }
                sx={{ 
                  minHeight: { xs: 56, sm: 64 },
                  '& .MuiAccordionSummary-content': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: { xs: 1, sm: 2 },
                    my: { xs: 0.5, sm: 1 }
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1, sm: 2 },
                  minWidth: { xs: '100%', sm: 'auto' }
                }}>
                  <TimelineIcon sx={{ 
                    color: theme.palette.primary.main,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }} />
                  <Typography 
                    variant="subtitle1"
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {formatDate(analysis.date)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <Chip
                    icon={analysis.type === 'individual' ? <PersonIcon /> : <GroupIcon />}
                    label={analysis.type === 'individual' ? 'Individual' : 'Casal'}
                    color="primary"
                    size="small"
                    sx={{ 
                      borderRadius: '8px',
                      background: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: { xs: 24, sm: 32 },
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }
                    }}
                  />
                  <Chip
                    label={healthScore.label}
                    color={healthScore.score >= 70 ? 'success' : healthScore.score > 0 ? 'warning' : 'default'}
                    size="small"
                    sx={{ 
                      borderRadius: '8px',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: { xs: 24, sm: 32 },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 2 }
                      }
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                {renderAnalysisContent(analysis.analysis)}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </List>
    </Box>
  );
};
