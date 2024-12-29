import React from 'react';
import {
  List,
  ListItem,
  Paper,
  Box,
  Divider,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RelationshipAnalysis } from './RelationshipAnalysis';
import type { AnalysisRecord } from '../services/analysisHistoryService';
import type { GPTAnalysis } from '../types';
import type { RelationshipAnalysis as ServiceAnalysis } from '../services/gptService';

interface Props {
  analyses: AnalysisRecord[];
}

const generateAnalysisId = () => `gpt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const AnalysisHistoryList: React.FC<Props> = ({ analyses }) => {
  const convertToServiceAnalysis = (record: AnalysisRecord): ServiceAnalysis | null => {
    try {
      let analysisData: any = record.analysis;
      if (typeof record.analysis === 'string' && 
          (record.analysis.startsWith('{') || record.analysis.startsWith('['))) {
        try {
          analysisData = JSON.parse(record.analysis);
        } catch (e) {
          console.error('Failed to parse analysis string:', e);
          return null;
        }
      }

      if (!analysisData) {
        console.error('Analysis data is null or undefined');
        return null;
      }

      // Handle both GPTAnalysis and direct RelationshipAnalysis formats
      if (typeof analysisData === 'object' && 'analysis' in analysisData) {
        // If it's a GPTAnalysis format
        const gptAnalysis = analysisData.analysis as GPTAnalysis['analysis'];
        return {
          overallHealth: {
            score: gptAnalysis.overallHealth || 0,
            trend: 'stable'
          },
          categories: gptAnalysis.categoryAnalysis || {},
          strengthsAndChallenges: {
            strengths: gptAnalysis.strengths || [],
            challenges: gptAnalysis.challenges || []
          },
          communicationSuggestions: gptAnalysis.recommendations || [],
          actionItems: gptAnalysis.actionItems || [],
          relationshipDynamics: gptAnalysis.relationshipDynamics || {
            positivePatterns: [],
            concerningPatterns: [],
            growthAreas: []
          }
        };
      }

      // If it's already in RelationshipAnalysis format
      const analysis = analysisData as ServiceAnalysis;
      return {
        overallHealth: {
          score: analysis.overallHealth?.score || 0,
          trend: analysis.overallHealth?.trend || 'stable'
        },
        categories: analysis.categories || {},
        strengthsAndChallenges: {
          strengths: analysis.strengthsAndChallenges?.strengths || [],
          challenges: analysis.strengthsAndChallenges?.challenges || []
        },
        communicationSuggestions: analysis.communicationSuggestions || [],
        actionItems: analysis.actionItems || [],
        relationshipDynamics: analysis.relationshipDynamics || {
          positivePatterns: [],
          concerningPatterns: [],
          growthAreas: []
        }
      };
    } catch (error) {
      console.error('Error converting analysis:', error);
      console.error('Record that caused error:', record);
      return null;
    }
  };

  if (!analyses || analyses.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Nenhuma análise encontrada.
      </Alert>
    );
  }

  return (
    <List>
      {analyses.map((analysis) => {
        const convertedAnalysis = convertToServiceAnalysis(analysis);
        if (!convertedAnalysis) {
          return (
            <ListItem key={analysis.id || 'error'}>
              <Alert severity="error" sx={{ width: '100%' }}>
                Erro ao carregar esta análise.
              </Alert>
            </ListItem>
          );
        }

        return (
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
                <RelationshipAnalysis analysis={convertedAnalysis} />
              </Stack>
            </Paper>
          </ListItem>
        );
      })}
    </List>
  );
};
