import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { GPTAnalysis } from '../types';

interface Props {
  analyses: GPTAnalysis[];
}

const MotionAccordion = motion(Accordion);

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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Histórico de Análises
      </Typography>
      {analyses.map((analysis, index) => (
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
              label={`Saúde: ${analysis.analysis.overallHealth}%`}
              color={analysis.analysis.overallHealth >= 70 ? 'success' : 'warning'}
              size="small"
            />
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Pontos Fortes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {analysis.analysis.strengths.map((strength, idx) => (
                  <Chip
                    key={idx}
                    label={strength}
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Desafios
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {analysis.analysis.challenges.map((challenge, idx) => (
                  <Chip
                    key={idx}
                    label={challenge}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Recomendações
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {analysis.analysis.recommendations.map((rec, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 1 }}>
                    {rec}
                  </Box>
                ))}
              </Box>
            </Box>
          </AccordionDetails>
        </MotionAccordion>
      ))}
    </Box>
  );
};

export default AnalysisHistory; 