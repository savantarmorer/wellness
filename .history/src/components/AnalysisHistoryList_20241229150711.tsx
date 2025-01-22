import React from 'react';
import {
  List,
  ListItem,
  Paper,
  Box,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RelationshipAnalysis } from './RelationshipAnalysis';
import type { AnalysisRecord } from '../services/analysisHistoryService';
import type { GPTAnalysis } from '../types';

interface Props {
  analyses: AnalysisRecord[];
}

export const AnalysisHistoryList: React.FC<Props> = ({ analyses }) => {
  const convertToGPTAnalysis = (record: AnalysisRecord): GPTAnalysis => ({
    id: record.id || generateAnalysisId(),
    userId: record.userId,
    partnerId: record.partnerId,
    date: record.date,
    type: record.type,
    analysis: typeof record.analysis === 'string' ? JSON.parse(record.analysis) : record.analysis,
    createdAt: record.createdAt,
  });

  const generateAnalysisId = () => `gpt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return (
    <List>
      {analyses.map((analysis) => (
        <ListItem key={analysis.id}>
          <Paper elevation={2} sx={{ width: '100%', p: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" color="primary">
                  {format(new Date(analysis.date), 'PPP', { locale: ptBR })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {analysis.type === 'individual' ? 'Análise Individual' : 'Análise do Casal'}
                </Typography>
              </Box>
              <Divider />
              <RelationshipAnalysis analysis={convertToGPTAnalysis(analysis)} />
            </Stack>
          </Paper>
        </ListItem>
      ))}
    </List>
  );
};
