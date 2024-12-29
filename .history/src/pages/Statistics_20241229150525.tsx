import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Paper,
  Alert,
  useTheme,
  Button,
  Stack,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DailyAssessmentWithRatings } from '../types';
import { getAssessmentHistory } from '../services/assessmentHistoryService';
import { generateDailyInsight, generateRelationshipAnalysis } from '../services/gptService';
import { Layout } from '../components/Layout';
import { Psychology as PsychologyIcon, Group as GroupIcon } from '@mui/icons-material';
import { saveAnalysis, getAnalysisForDate } from '../services/analysisHistoryService';

const METRICS = {
  comunicacao: 'Comunicação',
  conexaoEmocional: 'Conexão Emocional',
  apoioMutuo: 'Apoio Mútuo',
  transparenciaConfianca: 'Transparência e Confiança',
  intimidadeFisica: 'Intimidade Física',
  saudeMental: 'Saúde Mental',
  resolucaoConflitos: 'Resolução de Conflitos',
  segurancaRelacionamento: 'Segurança no Relacionamento',
  satisfacaoGeral: 'Satisfação Geral',
};

export default function Statistics() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [analysisDialog, setAnalysisDialog] = useState<{
    open: boolean;
    title: string;
    content: string;
  }>({ open: false, title: '', content: '' });
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !userData?.partnerId) return;

      try {
        setLoading(true);
        setError(null);

        const userAssessments = await getAssessmentHistory(currentUser.uid);
        const partnerAssessments = await getAssessmentHistory(userData.partnerId);

        // Combine and process data for charts
        const { timeSeriesData, radarChartData } = processAssessmentData(userAssessments, partnerAssessments);
        setChartData(timeSeriesData);
        setRadarData(radarChartData);
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

    const timeSeriesData = Array.from(combinedData.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate averages for radar chart
    const latestData = timeSeriesData[timeSeriesData.length - 1] || {};
    const radarChartData = Object.entries(METRICS).map(([key, label]) => ({
      subject: label,
      user: latestData[`user${key.charAt(0).toUpperCase() + key.slice(1)}`] || 0,
      partner: latestData[`partner${key.charAt(0).toUpperCase() + key.slice(1)}`] || 0,
    }));

    return { timeSeriesData, radarChartData };
  };

  const handleGenerateIndividualAnalysis = async () => {
    if (!currentUser || !chartData.length) return;

    try {
      const latestAssessment = chartData[chartData.length - 1];
      const today = new Date().toISOString().split('T')[0];

      // Check if analysis already exists for today
      const existingAnalysis = await getAnalysisForDate(currentUser.uid, today, 'individual');
      if (existingAnalysis) {
        setAnalysisDialog({
          open: true,
          title: 'Análise Individual',
          content: existingAnalysis.analysis as string,
        });
        return;
      }

      setGeneratingAnalysis(true);
      
      // Convert the latest data to DailyAssessment format
      const userAssessment = {
        userId: currentUser.uid,
        date: latestAssessment.date,
        createdAt: new Date().toISOString(),
        ratings: {
          comunicacao: latestAssessment.userComunicacao,
          conexaoEmocional: latestAssessment.userConexaoEmocional,
          apoioMutuo: latestAssessment.userApoioMutuo,
          transparenciaConfianca: latestAssessment.userTransparenciaConfianca,
          intimidadeFisica: latestAssessment.userIntimidadeFisica,
          saudeMental: latestAssessment.userSaudeMental,
          resolucaoConflitos: latestAssessment.userResolucaoConflitos,
          segurancaRelacionamento: latestAssessment.userSegurancaRelacionamento,
          satisfacaoGeral: latestAssessment.userSatisfacaoGeral,
          autocuidado: latestAssessment.userAutocuidado || 5,
          gratidao: latestAssessment.userGratidao || 5,
          qualidadeTempo: latestAssessment.userQualidadeTempo || 5,
          alinhamentoObjetivos: latestAssessment.userAlinhamentoObjetivos || 5,
        },
      };

      const insight = await generateDailyInsight(userAssessment);
      await saveAnalysis(currentUser.uid, 'individual', insight);
      
      setAnalysisDialog({
        open: true,
        title: 'Análise Individual',
        content: insight,
      });
    } catch (error) {
      console.error('Error generating individual analysis:', error);
      setSnackbarMessage('Erro ao gerar análise individual');
      setSnackbarOpen(true);
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleGenerateCollectiveAnalysis = async () => {
    if (!currentUser || !userData?.partnerId || !chartData.length) return;

    try {
      const latestAssessment = chartData[chartData.length - 1];
      const today = new Date().toISOString().split('T')[0];

      // Check if analysis already exists for today
      const existingAnalysis = await getAnalysisForDate(currentUser.uid, today, 'collective');
      if (existingAnalysis) {
        setAnalysisDialog({
          open: true,
          title: 'Análise do Casal',
          content: JSON.stringify(existingAnalysis.analysis, null, 2),
        });
        return;
      }

      setGeneratingAnalysis(true);
      const now = new Date().toISOString();
      
      // Convert the latest data to DailyAssessment format for both users
      const userAssessment = {
        userId: currentUser.uid,
        date: latestAssessment.date,
        createdAt: now,
        ratings: {
          comunicacao: latestAssessment.userComunicacao,
          conexaoEmocional: latestAssessment.userConexaoEmocional,
          apoioMutuo: latestAssessment.userApoioMutuo,
          transparenciaConfianca: latestAssessment.userTransparenciaConfianca,
          intimidadeFisica: latestAssessment.userIntimidadeFisica,
          saudeMental: latestAssessment.userSaudeMental,
          resolucaoConflitos: latestAssessment.userResolucaoConflitos,
          segurancaRelacionamento: latestAssessment.userSegurancaRelacionamento,
          satisfacaoGeral: latestAssessment.userSatisfacaoGeral,
          autocuidado: latestAssessment.userAutocuidado || 5,
          gratidao: latestAssessment.userGratidao || 5,
          qualidadeTempo: latestAssessment.userQualidadeTempo || 5,
          alinhamentoObjetivos: latestAssessment.userAlinhamentoObjetivos || 5,
        },
      };

      const partnerAssessment = {
        userId: userData.partnerId,
        date: latestAssessment.date,
        createdAt: now,
        ratings: {
          comunicacao: latestAssessment.partnerComunicacao,
          conexaoEmocional: latestAssessment.partnerConexaoEmocional,
          apoioMutuo: latestAssessment.partnerApoioMutuo,
          transparenciaConfianca: latestAssessment.partnerTransparenciaConfianca,
          intimidadeFisica: latestAssessment.partnerIntimidadeFisica,
          saudeMental: latestAssessment.partnerSaudeMental,
          resolucaoConflitos: latestAssessment.partnerResolucaoConflitos,
          segurancaRelacionamento: latestAssessment.partnerSegurancaRelacionamento,
          satisfacaoGeral: latestAssessment.partnerSatisfacaoGeral,
          autocuidado: latestAssessment.partnerAutocuidado || 5,
          gratidao: latestAssessment.partnerGratidao || 5,
          qualidadeTempo: latestAssessment.partnerQualidadeTempo || 5,
          alinhamentoObjetivos: latestAssessment.partnerAlinhamentoObjetivos || 5,
        },
      };

      const analysis = await generateRelationshipAnalysis(userAssessment, partnerAssessment);
      await saveAnalysis(currentUser.uid, 'collective', analysis, userData.partnerId);
      
      setAnalysisDialog({
        open: true,
        title: 'Análise do Casal',
        content: JSON.stringify(analysis, null, 2),
      });
    } catch (error) {
      console.error('Error generating collective analysis:', error);
      setSnackbarMessage('Erro ao gerar análise coletiva');
      setSnackbarOpen(true);
    } finally {
      setGeneratingAnalysis(false);
    }
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  display: 'inline-block',
                }}
              />
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Relationship Statistics
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PsychologyIcon />}
                onClick={handleGenerateIndividualAnalysis}
                disabled={generatingAnalysis || !chartData.length}
              >
                Análise Individual
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<GroupIcon />}
                onClick={handleGenerateCollectiveAnalysis}
                disabled={generatingAnalysis || !chartData.length}
              >
                Análise do Casal
              </Button>
            </Stack>
          </Box>

          {generatingAnalysis && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Gerando análise...
              </Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Radar Chart - Overview */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Current Relationship Overview
                </Typography>
                <Box sx={{ height: 500 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 10]} />
                      <Radar
                        name="You"
                        dataKey="user"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Partner"
                        dataKey="partner"
                        stroke={theme.palette.secondary.main}
                        fill={theme.palette.secondary.main}
                        fillOpacity={0.3}
                      />
                      <Legend />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Area Chart - Overall Satisfaction */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Satisfaction Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="userSatisfacaoGeral"
                        name="Your Satisfaction"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="partnerSatisfacaoGeral"
                        name="Partner's Satisfaction"
                        stroke={theme.palette.secondary.main}
                        fill={theme.palette.secondary.main}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Bar Chart - Communication and Emotional Connection */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Latest Communication Comparison
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[chartData[chartData.length - 1]].filter(Boolean)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis dataKey="date" type="category" hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="userComunicacao"
                        name="Your Communication"
                        fill={theme.palette.primary.main}
                      />
                      <Bar
                        dataKey="partnerComunicacao"
                        name="Partner's Communication"
                        fill={theme.palette.secondary.main}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Latest Emotional Connection Comparison
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[chartData[chartData.length - 1]].filter(Boolean)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis dataKey="date" type="category" hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="userConexaoEmocional"
                        name="Your Emotional Connection"
                        fill={theme.palette.primary.main}
                      />
                      <Bar
                        dataKey="partnerConexaoEmocional"
                        name="Partner's Emotional Connection"
                        fill={theme.palette.secondary.main}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Line Chart - Trends */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Relationship Health Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="userSaudeMental"
                        name="Your Mental Health"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerSaudeMental"
                        name="Partner's Mental Health"
                        stroke={theme.palette.secondary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="userSegurancaRelacionamento"
                        name="Your Relationship Security"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerSegurancaRelacionamento"
                        name="Partner's Relationship Security"
                        stroke={theme.palette.warning.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Dialog
            open={analysisDialog.open}
            onClose={() => setAnalysisDialog({ open: false, title: '', content: '' })}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>{analysisDialog.title}</DialogTitle>
            <DialogContent dividers>
              <Typography
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                }}
              >
                {analysisDialog.content}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setAnalysisDialog({ open: false, title: '', content: '' })}
              >
                Fechar
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
          />
        </Box>
      </Container>
    </Layout>
  );
} 