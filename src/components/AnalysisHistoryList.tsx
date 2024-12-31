import React, { useState } from 'react';
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

  const renderAnalysisContent = (analysisContent: GPTAnalysis['analysis']) => {
    if ('textReport' in analysisContent && typeof analysisContent.textReport === 'string') {
      const sections = analysisContent.textReport.split('\n\n').filter(Boolean);
      return (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.3s ease'
          }}
        >
          {sections.map((section: string, index: number) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  color: theme.palette.text.primary,
                  fontWeight: section.startsWith('1.') ? 600 : 400,
                  fontSize: section.startsWith('1.') ? '1.1rem' : '1rem'
                }}
              >
                {section}
              </Typography>
              {index < sections.length - 1 && (
                <Divider 
                  sx={{ 
                    my: 3,
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

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              background: alpha(theme.palette.success.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              transition: 'all 0.3s ease',
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
                mb: 2
              }}
            >
              Pontos Fortes
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analysisContent.strengths?.map((strength: string, idx: number) => (
                <Chip
                  key={idx}
                  label={strength}
                  color="success"
                  size="small"
                  sx={{ 
                    borderRadius: '8px',
                    '& .MuiChip-label': {
                      px: 2
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              background: alpha(theme.palette.error.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
              transition: 'all 0.3s ease',
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
                mb: 2
              }}
            >
              Desafios
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analysisContent.challenges?.map((challenge: string, idx: number) => (
                <Chip
                  key={idx}
                  label={challenge}
                  color="error"
                  size="small"
                  sx={{ 
                    borderRadius: '8px',
                    '& .MuiChip-label': {
                      px: 2
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              background: alpha(theme.palette.info.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              transition: 'all 0.3s ease',
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
                mb: 2
              }}
            >
              Recomendações
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {analysisContent.recommendations?.map((rec: string, idx: number) => (
                <Box 
                  component="li" 
                  key={idx} 
                  sx={{ 
                    mb: 1,
                    color: theme.palette.text.secondary,
                    '&::marker': {
                      color: theme.palette.info.main
                    }
                  }}
                >
                  {rec}
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Histórico de Análises
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acompanhe a evolução do seu relacionamento através das análises realizadas
        </Typography>
      </Box>

      <List sx={{ width: '100%' }}>
        {analyses.map((analysis) => {
          const analysisContent = analysis.analysis;

          return (
            <Accordion
              key={analysis.id}
              expanded={expanded === analysis.id}
              onChange={handleChange(analysis.id)}
              sx={{ 
                mb: 2,
                width: '100%',
                background: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
                borderRadius: '16px !important',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0'
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
                  '& .MuiAccordionSummary-content': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TimelineIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography 
                    variant="subtitle1"
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary
                    }}
                  >
                    {formatDate(analysis.date)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    icon={analysis.type === 'individual' ? <PersonIcon /> : <GroupIcon />}
                    label={analysis.type === 'individual' ? 'Individual' : 'Casal'}
                    color="primary"
                    size="small"
                    sx={{ 
                      borderRadius: '8px',
                      background: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main
                      }
                    }}
                  />
                  {'textReport' in analysisContent && 
                   typeof analysisContent.textReport === 'string' && 
                   !analysisContent.textReport && 
                   analysisContent.overallHealth && (
                    <Chip
                      label={`Saúde: ${analysisContent.overallHealth.score}%`}
                      color={analysisContent.overallHealth.score >= 70 ? 'success' : 'warning'}
                      size="small"
                      sx={{ 
                        borderRadius: '8px',
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
                {renderAnalysisContent(analysisContent)}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </List>
    </Box>
  );
};
