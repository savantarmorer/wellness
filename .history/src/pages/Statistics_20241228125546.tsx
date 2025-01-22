import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Paper,
  Alert,
  Card,
  CardContent,
  Chip,
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { useAuth } from '../context/AuthContext';
import { DailyAssessmentWithRatings } from '../types';
import { getAssessmentHistory } from '../services/assessmentHistoryService';
import { Layout } from '../components/Layout';

const ASPECT_COLORS = {
  comunicacao: '#8884d8',
  conexaoEmocional: '#82ca9d',
  apoioMutuo: '#ffc658',
  transparenciaConfianca: '#ff7300',
  intimidadeFisica: '#0088fe',
  saudeMental: '#00c49f',
  resolucaoConflitos: '#ffbb28',
  segurancaRelacionamento: '#ff8042',
  satisfacaoGeral: '#413ea0',
};

interface WeeklyAverages {
  [key: string]: {
    user: number;
    partner: number;
    combined: number;
  };
}

interface Insights {
  trends: Array<{
    aspect: string;
    difference: number;
    trend: 'up' | 'down' | 'stable';
    percentage: string;
  }>;
  comparisons: {
    current: WeeklyAverages;
    previous: WeeklyAverages;
  };
  alerts: Array<{
    aspect: string;
    score: number;
    difference: number;
  }>;
  achievements: Array<{
    aspect: string;
    score: number;
  }>;
}

export default function Statistics() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insights>({
    trends: [],
    comparisons: {
      current: {} as WeeklyAverages,
      previous: {} as WeeklyAverages,
    },
    alerts: [],
    achievements: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !userData?.partnerId) return;

      try {
        setLoading(true);
        setError(null);

        const userAssessments = await getAssessmentHistory(currentUser.uid);
        const partnerAssessments = await getAssessmentHistory(userData.partnerId);

        const processedData = processAssessmentData(userAssessments, partnerAssessments);
        setChartData(processedData);
        
        // Gerar insights
        const generatedInsights = generateInsights(processedData);
        setInsights(generatedInsights);
      } catch (error) {
        console.error('Error fetching assessment history:', error);
        setError('Failed to load assessment history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userData]);

  const generateInsights = (data: any[]): Insights => {
    if (!data.length) return {
      trends: [],
      comparisons: {
        current: {} as WeeklyAverages,
        previous: {} as WeeklyAverages,
      },
      alerts: [],
      achievements: [],
    };

    const lastWeekData = data.slice(-7);
    const previousWeekData = data.slice(-14, -7);

    // Calcular médias semanais
    const calculateAverages = (weekData: any[]): WeeklyAverages => {
      const aspects = [
        'comunicacao',
        'conexaoEmocional',
        'apoioMutuo',
        'transparenciaConfianca',
        'intimidadeFisica',
        'saudeMental',
        'resolucaoConflitos',
        'segurancaRelacionamento',
        'satisfacaoGeral',
      ];

      return aspects.reduce((acc: WeeklyAverages, aspect: string) => {
        const userAspect = `user${aspect.charAt(0).toUpperCase()}${aspect.slice(1)}`;
        const partnerAspect = `partner${aspect.charAt(0).toUpperCase()}${aspect.slice(1)}`;

        const userAvg = weekData.reduce((sum, day) => sum + (day[userAspect] || 0), 0) / weekData.length;
        const partnerAvg = weekData.reduce((sum, day) => sum + (day[partnerAspect] || 0), 0) / weekData.length;

        acc[aspect] = {
          user: userAvg,
          partner: partnerAvg,
          combined: (userAvg + partnerAvg) / 2,
        };

        return acc;
      }, {} as WeeklyAverages);
    };

    const currentAverages = calculateAverages(lastWeekData);
    const previousAverages = calculateAverages(previousWeekData);

    // Identificar tendências
    const trends = Object.entries(currentAverages).map(([aspect, values]: [string, any]) => {
      const previous = previousAverages[aspect].combined;
      const current = values.combined;
      const difference = current - previous;
      const trend = difference > 0 ? 'up' as const : difference < 0 ? 'down' as const : 'stable' as const;

      return {
        aspect,
        difference,
        trend,
        percentage: Math.abs((difference / previous) * 100).toFixed(1),
      };
    });

    // Identificar alertas
    const alerts = Object.entries(currentAverages)
      .filter(([_, values]: [string, any]) => values.combined < 6)
      .map(([aspect, values]: [string, any]) => ({
        aspect,
        score: values.combined,
        difference: Math.abs(values.user - values.partner),
      }));

    // Identificar conquistas
    const achievements = Object.entries(currentAverages)
      .filter(([_, values]: [string, any]) => values.combined >= 8)
      .map(([aspect, values]: [string, any]) => ({
        aspect,
        score: values.combined,
      }));

    return {
      trends: trends.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)),
      comparisons: {
        current: currentAverages,
        previous: previousAverages,
      },
      alerts: alerts.sort((a, b) => a.score - b.score),
      achievements: achievements.sort((a, b) => b.score - a.score),
    };
  };

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

  const formatAspectName = (aspect: string) => {
    const names: { [key: string]: string } = {
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
    return names[aspect] || aspect;
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

  const lastEntry = chartData[chartData.length - 1];
  const radarData = lastEntry ? [
    {
      subject: 'Comunicação',
      user: lastEntry.userComunicacao,
      partner: lastEntry.partnerComunicacao,
    },
    {
      subject: 'Conexão Emocional',
      user: lastEntry.userConexaoEmocional,
      partner: lastEntry.partnerConexaoEmocional,
    },
    {
      subject: 'Apoio Mútuo',
      user: lastEntry.userApoioMutuo,
      partner: lastEntry.partnerApoioMutuo,
    },
    {
      subject: 'Transparência',
      user: lastEntry.userTransparenciaConfianca,
      partner: lastEntry.partnerTransparenciaConfianca,
    },
    {
      subject: 'Intimidade',
      user: lastEntry.userIntimidadeFisica,
      partner: lastEntry.partnerIntimidadeFisica,
    },
  ] : [];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Estatísticas do Relacionamento
          </Typography>

          {/* Insights Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Tendências Significativas */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon /> Tendências Significativas
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {insights.trends.slice(0, 3).map((trend: any) => (
                      <Box key={trend.aspect} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {trend.trend === 'up' ? (
                          <TrendingUpIcon color="success" />
                        ) : (
                          <TrendingDownIcon color="error" />
                        )}
                        <Typography>
                          {formatAspectName(trend.aspect)}:{' '}
                          <strong>{trend.trend === 'up' ? '+' : '-'}{trend.percentage}%</strong>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Alertas */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" /> Áreas que Precisam de Atenção
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {insights.alerts.slice(0, 3).map((alert: any) => (
                      <Box key={alert.aspect} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={alert.score.toFixed(1)}
                          color="warning"
                          size="small"
                        />
                        <Typography>
                          {formatAspectName(alert.aspect)}
                          {alert.difference > 2 && (
                            <Chip
                              label="Divergência"
                              size="small"
                              color="error"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Conquistas */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CelebrationIcon color="success" /> Pontos Fortes do Relacionamento
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {insights.achievements.map((achievement: any) => (
                      <Chip
                        key={achievement.aspect}
                        label={`${formatAspectName(achievement.aspect)} (${achievement.score.toFixed(1)})`}
                        color="success"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Radar Chart - Current State */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Estado Atual do Relacionamento
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 10]} />
                      <Radar
                        name="Você"
                        dataKey="user"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Parceiro"
                        dataKey="partner"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Area Chart - Satisfaction Over Time */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Evolução da Satisfação
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="userSatisfacaoGeral"
                        name="Sua Satisfação"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="partnerSatisfacaoGeral"
                        name="Satisfação do Parceiro"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Bar Chart - Weekly Averages */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Médias Semanais por Aspecto
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(insights.comparisons.current).map(([aspect, values]: [string, any]) => ({
                      name: formatAspectName(aspect),
                      user: values.user,
                      partner: values.partner,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="user" name="Você" fill="#8884d8" />
                      <Bar dataKey="partner" name="Parceiro" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Line Chart - Communication and Emotional Connection */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Comunicação e Conexão Emocional
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
                        name="Sua Comunicação"
                        stroke={ASPECT_COLORS.comunicacao}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerComunicacao"
                        name="Comunicação do Parceiro"
                        stroke={ASPECT_COLORS.comunicacao}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="userConexaoEmocional"
                        name="Sua Conexão Emocional"
                        stroke={ASPECT_COLORS.conexaoEmocional}
                      />
                      <Line
                        type="monotone"
                        dataKey="partnerConexaoEmocional"
                        name="Conexão Emocional do Parceiro"
                        stroke={ASPECT_COLORS.conexaoEmocional}
                        strokeDasharray="5 5"
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