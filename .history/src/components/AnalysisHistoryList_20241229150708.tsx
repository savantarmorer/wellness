import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RelationshipAnalysis } from './RelationshipAnalysis';
import type { AnalysisRecord } from '../services/analysisHistoryService';

interface Props {
  analyses: AnalysisRecord[];
}

export const AnalysisHistoryList: React.FC<Props> = ({ analyses }) => {
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
              <RelationshipAnalysis analysis={analysis} />
            </Stack>
          </Paper>
        </ListItem>
      ))}
    </List>
  );
};
