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
  Radar
  
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { DailyAssessmentWithRatings } from '../types';
import { getAssessmentHistory } from '../services/assessmentHistoryService';
import { generateDailyInsight, generateRelationshipAnalysis } from '../services/gptService';
import { Layout } from '../components/Layout';
import { Psychology as PsychologyIcon, Group as GroupIcon } from '@mui/icons-material';
import { saveAnalysis, getAnalysisForDate } from '../services/analysisHistoryService';
import { RelationshipAnalysis } from '../components/RelationshipAnalysis';
import type { RelationshipAnalysis as RelationshipAnalysisType } from '../services/gptService';
import { ConsensusFormData } from '../services/gptService';

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

interface AnalysisDialog {
  open: boolean;
  title: string;
  content: string | RelationshipAnalysisType | ConsensusFormData;
}

export default function Statistics() {
  const theme = useTheme();
  const { currentUser, userData } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [intimacyBalanceData, setIntimacyBalanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [analysisDialog, setAnalysisDialog] = useState<AnalysisDialog>({
    open: false,
    title: '',
    content: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !userData?.partnerId) return;

      try {
        setLoading(true);
        setError(null);

        // Carregar histórico de avaliações
        const userAssessments = await getAssessmentHistory(currentUser.uid);
        const partnerAssessments = await getAssessmentHistory(userData.partnerId);

        // Combine and process data for charts
        const { timeSeriesData, radarChartData, intimacyBalanceData } = processAssessmentData(userAssessments, partnerAssessments);
        setChartData(timeSeriesData);
        setRadarData(radarChartData);
        setIntimacyBalanceData(intimacyBalanceData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(new Error('Failed to load data'));
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
        userEmotionalSecurity: assessment.ratings.segurancaRelacionamento / 2,
        userIntimacyBalance: assessment.ratings.intimidadeFisica,
        userEmotionalConnection: assessment.ratings.conexaoEmocional / 2,
        userPhysicalIntimacy: assessment.ratings.intimidadeFisica / 2,
        userIntellectualConnection: assessment.ratings.comunicacao / 2,
        userSharedTime: assessment.ratings.qualidadeTempo / 2,
        userConflictResolution: assessment.ratings.resolucaoConflitos / 2,
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
        partnerEmotionalSecurity: assessment.ratings.segurancaRelacionamento / 2,
        partnerIntimacyBalance: assessment.ratings.intimidadeFisica,
        partnerEmotionalConnection: assessment.ratings.conexaoEmocional / 2,
        partnerPhysicalIntimacy: assessment.ratings.intimidadeFisica / 2,
        partnerIntellectualConnection: assessment.ratings.comunicacao / 2,
        partnerSharedTime: assessment.ratings.qualidadeTempo / 2,
        partnerConflictResolution: assessment.ratings.resolucaoConflitos / 2,
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

    // Calculate intimacy balance radar data
    const intimacyBalanceData = [
      {
        subject: 'Emotional',
        user: latestData.userEmotionalConnection || 0,
        partner: latestData.partnerEmotionalConnection || 0,
      },
      {
        subject: 'Physical',
        user: latestData.userPhysicalIntimacy || 0,
        partner: latestData.partnerPhysicalIntimacy || 0,
      },
      {
        subject: 'Intellectual',
        user: latestData.userIntellectualConnection || 0,
        partner: latestData.partnerIntellectualConnection || 0,
      },
      {
        subject: 'Shared Time',
        user: latestData.userSharedTime || 0,
        partner: latestData.partnerSharedTime || 0,
      },
    ];

    return { timeSeriesData, radarChartData, intimacyBalanceData };
  };

  const handleGenerateIndividualAnalysis = async () => {
    if (!currentUser || !chartData.length) return;

    try {
      const latestAssessment = chartData[chartData.length - 1];
      const today = new Date().toISOString().split('T')[0];

      // Check if analysis already exists for today
      const existingAnalysis = await getAnalysisForDate(currentUser.uid, today, 'individual');
      if (existingAnalysis) {
        setAnalysisDialog(prev => ({
          ...prev,
          open: true,
          title: 'Análise Individual',
          content: existingAnalysis.analysis as RelationshipAnalysisType
        }));
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
      
      setAnalysisDialog(prev => ({
        ...prev,
        open: true,
        title: 'Análise Individual',
        content: insight
      }));
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
          content: existingAnalysis.analysis,
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
      
      // Ensure the analysis has all required fields before setting it in the dialog
      const formattedAnalysis: RelationshipAnalysisType = {
        overallHealth: analysis.overallHealth || { score: 0, trend: 'stable' },
        categories: analysis.categories || {},
        strengthsAndChallenges: analysis.strengthsAndChallenges || { strengths: [], challenges: [] },
        communicationSuggestions: analysis.communicationSuggestions || [],
        actionItems: analysis.actionItems || [],
        relationshipDynamics: analysis.relationshipDynamics || {
          positivePatterns: [],
          concerningPatterns: [],
          growthAreas: []
        },
        emotionalDynamics: analysis.emotionalDynamics || {
          emotionalSecurity: 0,
          intimacyBalance: {
            score: 0,
            areas: {
              emotional: 0,
              physical: 0,
              intellectual: 0,
              shared: 0
            }
          },
          conflictResolution: {
            style: 'collaborative',
            effectiveness: 0,
            patterns: []
          }
        }
      };

      setAnalysisDialog({
        open: true,
        title: 'Análise do Casal',
        content: formattedAnalysis,
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
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              Please log in to view statistics.
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
              You need to connect with your partner to view relationship statistics.
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

  if (error) {
    return (
      <Layout>
        <Container>
          <Alert severity="error" sx={{ mt: 2 }}>
            {String(error)}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Box sx={{ mt: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: 2,
            mb: 3 
          }}>
            <Typography variant="h4" sx={{ 
              fontSize: { xs: '1.75rem', sm: '2rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              Estatísticas do Relacionamento
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<PsychologyIcon />}
                onClick={handleGenerateIndividualAnalysis}
                disabled={generatingAnalysis || !chartData.length}
                fullWidth
              >
                Análise Individual
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<GroupIcon />}
                onClick={handleGenerateCollectiveAnalysis}
                disabled={generatingAnalysis || !chartData.length}
                fullWidth
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
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Visão Geral do Relacionamento
                </Typography>
                <Box sx={{ height: 400 }}>
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
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Intimacy Balance Radar Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Intimacy Balance
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={intimacyBalanceData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 5]} />
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
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Emotional Security Line Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Emotional Security Over Time
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="userEmotionalSecurity"
                        name="Your Emotional Security"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerEmotionalSecurity"
                        name="Partner's Emotional Security"
                        stroke={theme.palette.secondary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Conflict Resolution Line Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Conflict Resolution Effectiveness
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="userConflictResolution"
                        name="Your Conflict Resolution"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerConflictResolution"
                        name="Partner's Conflict Resolution"
                        stroke={theme.palette.secondary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Overall Satisfaction Line Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Satisfaction
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
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerSatisfacaoGeral"
                        name="Partner's Overall Satisfaction"
                        stroke={theme.palette.secondary.main}
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
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>{analysisDialog.title}</DialogTitle>
            <DialogContent dividers>
              {typeof analysisDialog.content === 'object' && 'type' in analysisDialog.content && analysisDialog.content.type === 'consensus_form' ? (
                <Typography>{JSON.stringify(analysisDialog.content.analysis || 'No analysis available')}</Typography>
              ) : (
                <RelationshipAnalysis analysis={
                  typeof analysisDialog.content === 'string' || 'overallHealth' in analysisDialog.content 
                    ? analysisDialog.content 
                    : 'Invalid analysis format'
                } />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAnalysisDialog({ open: false, title: '', content: '' })}>
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