import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { AnalysisHistoryList } from '../components/AnalysisHistoryList';

export const AnalysisHistory = () => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState([]);
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
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Histórico de Análises
      </Typography>
      <AnalysisHistoryList analyses={analyses} />
    </Container>
  );
};