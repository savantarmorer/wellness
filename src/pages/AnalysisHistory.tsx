import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { Layout } from '../components/Layout';
import { AnalysisHistoryList } from '../components/AnalysisHistoryList';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { useAuth } from '../contexts/AuthContext';
import type { GPTAnalysis } from '../types';

const AnalysisHistory = () => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<GPTAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!currentUser) return;

      try {
        const analysisRecords = await getAnalysisHistory(currentUser.uid);
        console.log('Raw analysis records:', analysisRecords);

        const convertedAnalyses: GPTAnalysis[] = analysisRecords
          .filter(record => record.id) // Filter out records without id
          .map(record => {
            console.log('Processing record:', {
              id: record.id,
              type: record.type,
              analysisType: typeof record.analysis,
              analysisValue: record.analysis
            });

            let parsedAnalysis;
            try {
              // Handle both string and object analysis data
              if (typeof record.analysis === 'string') {
                // Check if the string is a JSON or a text report
                if (record.analysis.trim().startsWith('{')) {
                  console.log('Attempting to parse JSON string analysis');
                  parsedAnalysis = JSON.parse(record.analysis);
                } else {
                  console.log('Processing text report analysis');
                  // Convert text report to GPTAnalysis format
                  parsedAnalysis = record.analysis;
                }
              } else if (typeof record.analysis === 'object' && record.analysis !== null) {
                console.log('Using object analysis directly:', record.analysis);
                parsedAnalysis = record.analysis;
              } else {
                console.log('Invalid analysis format:', record.analysis);
                throw new Error('Invalid analysis data format');
              }
            } catch (e) {
              console.error('Error parsing analysis:', e);
              console.error('Problematic record:', record);
              parsedAnalysis = record.analysis;
            }

            // If it's a string, return it as a text report
            if (typeof parsedAnalysis === 'string') {
              return {
                id: record.id!,
                userId: record.userId,
                partnerId: record.partnerId || '',
                date: record.date,
                type: record.type,
                analysis: {
                  overallHealth: { score: 75, trend: 'stable' },
                  strengths: [],
                  challenges: [],
                  recommendations: [],
                  categories: {},
                  relationshipDynamics: {
                    positivePatterns: [],
                    concerningPatterns: [],
                    growthAreas: []
                  },
                  actionItems: [],
                  textReport: parsedAnalysis
                },
                createdAt: record.createdAt
              };
            }

            // Ensure all required fields exist with proper structure
            const validatedAnalysis = {
              overallHealth: parsedAnalysis.overallHealth || { score: 75, trend: 'stable' },
              strengths: Array.isArray(parsedAnalysis.strengths) ? parsedAnalysis.strengths : [],
              challenges: Array.isArray(parsedAnalysis.challenges) ? parsedAnalysis.challenges : [],
              recommendations: Array.isArray(parsedAnalysis.recommendations) ? parsedAnalysis.recommendations : [],
              categories: parsedAnalysis.categories || {},
              relationshipDynamics: {
                positivePatterns: Array.isArray(parsedAnalysis.relationshipDynamics?.positivePatterns) 
                  ? parsedAnalysis.relationshipDynamics.positivePatterns 
                  : [],
                concerningPatterns: Array.isArray(parsedAnalysis.relationshipDynamics?.concerningPatterns)
                  ? parsedAnalysis.relationshipDynamics.concerningPatterns
                  : [],
                growthAreas: Array.isArray(parsedAnalysis.relationshipDynamics?.growthAreas)
                  ? parsedAnalysis.relationshipDynamics.growthAreas
                  : []
              },
              actionItems: Array.isArray(parsedAnalysis.actionItems) ? parsedAnalysis.actionItems : []
            };

            return {
              id: record.id!,
              userId: record.userId,
              partnerId: record.partnerId || '',
              date: record.date,
              type: record.type,
              analysis: validatedAnalysis,
              createdAt: record.createdAt
            };
          });
        setAnalyses(convertedAnalyses);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [currentUser]);

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Histórico de Análises
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <AnalysisHistoryList analyses={analyses} />
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default AnalysisHistory;