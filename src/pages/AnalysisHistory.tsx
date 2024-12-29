import { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { AnalysisHistoryList } from '../components/AnalysisHistoryList';
import type { AnalysisRecord } from '../services/analysisHistoryService';
import { Layout } from '../components/Layout';

export const AnalysisHistory = () => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        if (!currentUser) return;
        const analysisHistory = await getAnalysisHistory(currentUser.uid);
        setAnalyses(analysisHistory);
      } catch (err) {
        console.error('Error fetching analyses:', err);
        setError('Erro ao carregar histórico de análises');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [currentUser]);

  if (loading) {
    return (
      <Layout>
        <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <Typography color="error">{error}</Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Typography variant="h4" gutterBottom>
          Histórico de Análises
        </Typography>
        <AnalysisHistoryList analyses={analyses} />
      </Container>
    </Layout>
  );
};