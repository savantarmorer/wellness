import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DailyAssessmentWithRatings } from '../types';
import { getAssessmentHistory } from '../services/assessmentHistoryService';
import { Layout } from '../components/Layout';

export default function Statistics() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !userData?.partnerId) return;

      try {
        setLoading(true);
        setError(null);

        const userAssessments = await getAssessmentHistory(currentUser.uid);
        const partnerAssessments = await getAssessmentHistory(userData.partnerId);

        // Combine and process data for chart
        const processedData = processAssessmentData(userAssessments, partnerAssessments);
        setChartData(processedData);
      } catch (error) {
        console.error('Error fetching assessment history:', error);
        setError('Failed to load assessment history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userData]);

  const processAssessmentData = (
    userAssessments: DailyAssessmentWithRatings[],
    partnerAssessments: DailyAssessmentWithRatings[]
  ) => {
    const combinedData = new Map();

    // Process user assessments
    userAssessments.forEach((assessment) => {
      const date = new Date(assessment.date).toLocaleDateString();
      combinedData.set(date, {
        date,
        userComunicacao: assessment.ratings.comunicacao,
        userConexaoEmocional: assessment.ratings.conexaoEmocional,
        userApoioMutuo: assessment.ratings.apoioMutuo,
        userTransparenciaConfianca: assessment.ratings.transparenciaConfianca,
        userIntimidadeFisica: assessment.ratings.intimidadeFisica,
        userSaudeMental: assessment.ratings.saudeMental,
        userResolucaoConflitos: assessment.ratings.resolucaoConflitos,
        userSegurancaRelacionamento: assessment.ratings.segurancaRelacionamento,
        userSatisfacaoGeral: assessment.ratings.satisfacaoGeral,
      });
    });

    // Process partner assessments
    partnerAssessments.forEach((assessment) => {
      const date = new Date(assessment.date).toLocaleDateString();
      const existing = combinedData.get(date) || { date };
      combinedData.set(date, {
        ...existing,
        partnerComunicacao: assessment.ratings.comunicacao,
        partnerConexaoEmocional: assessment.ratings.conexaoEmocional,
        partnerApoioMutuo: assessment.ratings.apoioMutuo,
        partnerTransparenciaConfianca: assessment.ratings.transparenciaConfianca,
        partnerIntimidadeFisica: assessment.ratings.intimidadeFisica,
        partnerSaudeMental: assessment.ratings.saudeMental,
        partnerResolucaoConflitos: assessment.ratings.resolucaoConflitos,
        partnerSegurancaRelacionamento: assessment.ratings.segurancaRelacionamento,
        partnerSatisfacaoGeral: assessment.ratings.satisfacaoGeral,
      });
    });

    return Array.from(combinedData.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  if (!currentUser) {
    return (
      <Layout>
        <Container>
          <Typography>Please log in to view statistics.</Typography>
        </Container>
      </Layout>
    );
  }

  if (!userData?.partnerId) {
    return (
      <Layout>
        <Container>
          <Typography>
            You need to connect with your partner to view relationship statistics.
          </Typography>
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

  if (error) {
    return (
      <Layout>
        <Container>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Relationship Statistics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Communication Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="userComunicacao"
                        name="Your Communication"
                        stroke="#8884d8"
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerComunicacao"
                        name="Partner's Communication"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Emotional Connection Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="userConexaoEmocional"
                        name="Your Emotional Connection"
                        stroke="#8884d8"
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerConexaoEmocional"
                        name="Partner's Emotional Connection"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Satisfaction Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="userSatisfacaoGeral"
                        name="Your Overall Satisfaction"
                        stroke="#8884d8"
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerSatisfacaoGeral"
                        name="Partner's Overall Satisfaction"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
} 