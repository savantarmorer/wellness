import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { RelationshipInsights } from '../components/RelationshipInsights';
import { getAssessmentHistory } from '../services/assessmentHistoryService';
import { analyzeDiscrepancies, DiscrepancyAnalysis } from '../services/insightService';

export default function Discrepancies() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyAnalysis[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !userData?.partnerId) return;

      try {
        setLoading(true);
        setError(null);

        // Carregar histórico de avaliações
        const userAssessments = await getAssessmentHistory(currentUser.uid);
        const partnerAssessments = await getAssessmentHistory(userData.partnerId);

        // Analisar discrepâncias
        if (userAssessments.length > 0 && partnerAssessments.length > 0) {
          const discrepancyAnalysis = await analyzeDiscrepancies(
            userAssessments[0].ratings,
            partnerAssessments[0].ratings
          );
          setDiscrepancies(discrepancyAnalysis);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userData]);

  if (!currentUser) {
    return (
      <Layout>
        <Container>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              Por favor, faça login para ver as análises de discrepâncias.
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!userData?.partnerId) {
    return (
      <Layout>
        <Container>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              Você precisa se conectar com seu parceiro para ver as análises de discrepâncias.
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Análise de Discrepâncias
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Diferenças Significativas nas Avaliações
                </Typography>
                {error ? (
                  <Typography color="error">
                    Erro ao carregar os dados: {error.message}
                  </Typography>
                ) : discrepancies.length === 0 ? (
                  <Typography>
                    Não foram encontradas discrepâncias significativas nas avaliações recentes.
                  </Typography>
                ) : (
                  <RelationshipInsights discrepancies={discrepancies} />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
} 