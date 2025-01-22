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
  Grid,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AnalysisHistoryItem } from '../types';
import { RelationshipAnalysis } from './RelationshipAnalysis';

interface Props {
  analyses: AnalysisHistoryItem[];
}

const MotionAccordion = motion(Accordion);

const AnalysisHistoryList: React.FC<Props> = ({ analyses }) => {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
                gap: 2,
              },
            }}
          >
            <Typography>{formatDate(analysis.date)}</Typography>
            <Chip
              label={analysis.type === 'individual' ? 'Individual' : 'Combinada'}
              color={analysis.type === 'individual' ? 'primary' : 'success'}
              size="small"
            />
            {analysis.type === 'combined' && analysis.analysis.overallHealth && (
              <Chip
                label={`Saúde: ${analysis.analysis.overallHealth}%`}
                color={analysis.analysis.overallHealth >= 70 ? 'success' : 'warning'}
                size="small"
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            {analysis.type === 'individual' ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Insight Individual
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {analysis.insight}
                </Typography>
              </Box>
            ) : (
              <RelationshipAnalysis analysis={analysis} />
            )}
          </AccordionDetails>
        </MotionAccordion>
      ))}
    </Box>
  );
};

export default AnalysisHistoryList;
