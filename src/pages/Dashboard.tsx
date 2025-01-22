import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Fade,
} from '@mui/material';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { DailyAssessment } from '../types';
import { DateCalendar, DateEvent } from '../components/DateCalendar';
import * as calendarService from '../services/calendarService';
import { clearAnalysisHistory } from '../services/analysisHistoryService';
import { DailyAnalysisStatus } from '../components/DailyAnalysisStatus';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RateReviewIcon from '@mui/icons-material/RateReview';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userData, partnerData } = useAuth();
  const [recentAssessments, setRecentAssessments] = useState<DailyAssessment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<DateEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    weeklyAverage: 0,
    completionRate: 0,
    streak: 0,
  });
  const [partnerStatus, setPartnerStatus] = useState({
    name: '',
    lastAssessment: '',
    assessmentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [dailyStatus, setDailyStatus] = useState({
    userHasSubmitted: false,
    partnerHasSubmitted: false,
    hasCollectiveAnalysis: false
  });

  // Função auxiliar para buscar todos os dados
  const fetchAllData = async () => {
    // Check if user is authenticated and has necessary data
    if (!currentUser?.uid) {
      console.log('🔍 Debug - Error: No authenticated user');
      setLoading(false);
      return;
    }

    if (!userData) {
      console.log('🔍 Debug - Error: No user data available');
      setLoading(false);
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      // 1. Buscar avaliações recentes do usuário
      const assessmentsRef = collection(db, 'assessments');
      
      // Separate queries for user and partner assessments
      const userQuery = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(5)
      );

      const partnerQuery = userData?.partnerId ? query(
        assessmentsRef,
        where('userId', '==', userData.partnerId),
        orderBy('date', 'desc'),
        limit(5)
      ) : null;

      const [userSnapshot, partnerSnapshot] = await Promise.all([
        getDocs(userQuery),
        partnerQuery ? getDocs(partnerQuery) : Promise.resolve(null)
      ]);

      const userDocs = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ratings: doc.data().ratings || { satisfacaoGeral: 0 }
      })) as DailyAssessment[];

      const partnerDocs = partnerSnapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ratings: doc.data().ratings || { satisfacaoGeral: 0 }
      })) as DailyAssessment[] || [];

      // Combine and sort by date
      const recentDocs = [...userDocs, ...partnerDocs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      console.log('📊 Debug - Recent Assessments:', {
        count: recentDocs.length,
        assessments: recentDocs.map(doc => ({
          date: doc.date,
          ratings: doc.ratings,
          comments: doc.mood?.notes
        }))
      });

      setRecentAssessments(recentDocs);

      // 2. Calcular estatísticas do usuário
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weeklyQuery = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', weekStart.toISOString()),
        orderBy('date', 'desc')
      );
      const weeklySnapshot = await getDocs(weeklyQuery);
      const weeklyAssessments = weeklySnapshot.docs.map(doc => doc.data() as DailyAssessment);
      const weeklyAverage = weeklyAssessments.length > 0
        ? weeklyAssessments.reduce((acc, curr) => acc + (curr.ratings?.satisfacaoGeral || 0), 0) / weeklyAssessments.length
        : 0;

      // Completion rate
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      const monthlyQuery = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', monthStart.toISOString()),
        orderBy('date', 'desc')
      );
      const monthlySnapshot = await getDocs(monthlyQuery);
      const completionRate = Math.round((monthlySnapshot.size / 30) * 100);

      // User streak
      const allUserAssessmentsQuery = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      const allUserAssessmentsSnapshot = await getDocs(allUserAssessmentsQuery);
      const userAssessments = allUserAssessmentsSnapshot.docs.map(doc => ({
        date: new Date(doc.data().date),
      }));

      let userStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < userAssessments.length; i++) {
        const assessmentDate = userAssessments[i].date;
        assessmentDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (assessmentDate.getTime() === expectedDate.getTime()) {
          userStreak++;
        } else {
          break;
        }
      }

      console.log('📈 Debug - User Stats:', {
        weeklyData: {
          period: {
            start: weekStart.toISOString(),
            end: new Date().toISOString()
          },
          assessmentsCount: weeklyAssessments.length,
          average: weeklyAverage
        },
        monthlyData: {
          assessmentsCount: monthlySnapshot.size,
          completionRate
        },
        streak: userStreak
      });

      const updatedStats = {
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        completionRate,
        streak: userStreak,
      };

      setStats(updatedStats);

      // 3. Buscar status do parceiro
      const latestPartnerQuery = query(
        assessmentsRef,
        where('userId', '==', userData.partnerId),
        orderBy('date', 'desc'),
        limit(1)
      );
      const latestPartnerSnapshot = await getDocs(latestPartnerQuery);
      
      // Partner streak
      const allPartnerAssessmentsQuery = query(
        assessmentsRef,
        where('userId', '==', userData.partnerId),
        orderBy('date', 'desc')
      );
      const allPartnerAssessmentsSnapshot = await getDocs(allPartnerAssessmentsQuery);
      const partnerAssessments = allPartnerAssessmentsSnapshot.docs.map(doc => ({
        date: new Date(doc.data().date),
      }));

      let partnerStreak = 0;
      for (let i = 0; i < partnerAssessments.length; i++) {
        const assessmentDate = partnerAssessments[i].date;
        assessmentDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (assessmentDate.getTime() === expectedDate.getTime()) {
          partnerStreak++;
        } else {
          break;
        }
      }

      const updatedPartnerStatus = {
        name: userData?.partnerName || 'Parceiro',
        lastAssessment: latestPartnerSnapshot.empty ? '' : formatDate(latestPartnerSnapshot.docs[0].data().date),
        assessmentStreak: partnerStreak,
      };

      console.log('👥 Debug - Partner Status:', {
        name: updatedPartnerStatus.name,
        hasRecentAssessment: !latestPartnerSnapshot.empty,
        lastAssessmentDate: updatedPartnerStatus.lastAssessment,
        streak: updatedPartnerStatus.assessmentStreak,
        assessments: partnerAssessments.length
      });

      setPartnerStatus(updatedPartnerStatus);

      // 4. Buscar eventos do calendário
      const eventsRef = collection(db, 'calendar_events');
      const eventsQuery = query(
        eventsRef,
        where('userId', '==', currentUser.uid)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          start: data.start.toDate(),
          end: data.end.toDate(),
        };
      }) as DateEvent[];

      console.log('📅 Debug - Calendar:', {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => new Date(e.start) > new Date()).length
      });

      setCalendarEvents(events);

      // 5. Verificar status diário
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const userTodayQuery = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', todayStart.toISOString()),
        orderBy('date', 'desc'),
        limit(1)
      );
      const userTodaySnapshot = await getDocs(userTodayQuery);
      const userHasSubmitted = !userTodaySnapshot.empty;

      const partnerTodayQuery = query(
        assessmentsRef,
        where('userId', '==', userData.partnerId),
        where('date', '>=', todayStart.toISOString()),
        orderBy('date', 'desc'),
        limit(1)
      );
      const partnerTodaySnapshot = await getDocs(partnerTodayQuery);
      const partnerHasSubmitted = !partnerTodaySnapshot.empty;

      const analysisRef = collection(db, 'analysisHistory');
      const analysisQuery = query(
        analysisRef,
        where('userId', '==', currentUser.uid),
        where('type', '==', 'collective'),
        where('date', '>=', todayStart.toISOString()),
        orderBy('date', 'desc'),
        limit(1)
      );
      const analysisSnapshot = await getDocs(analysisQuery);
      const hasCollectiveAnalysis = !analysisSnapshot.empty;

      const updatedDailyStatus = {
        userHasSubmitted,
        partnerHasSubmitted,
        hasCollectiveAnalysis
      };

      console.log('📋 Debug - Daily Status:', {
        date: todayStart.toISOString(),
        status: updatedDailyStatus,
        userAssessment: userTodaySnapshot.empty ? null : userTodaySnapshot.docs[0].data(),
        partnerAssessment: partnerTodaySnapshot.empty ? null : partnerTodaySnapshot.docs[0].data()
      });

      setDailyStatus(updatedDailyStatus);

    } catch (error) {
      console.error('❌ Debug - Error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      const endTime = Date.now();
      console.log('✅ Debug - Fetch Summary:', {
        duration: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }
  };

  // Efeito para buscar todos os dados quando necessário
  useEffect(() => {
    fetchAllData();
  }, [currentUser?.uid, userData?.partnerId]);

  // Atualizar dados quando houver mudanças no partnerData
  useEffect(() => {
    if (partnerData?.assessment) {
      fetchAllData();
    }
  }, [partnerData?.assessment]);

  // Adicionar listener para atualizações em tempo real
  useEffect(() => {
    if (!currentUser?.uid || !userData?.partnerId) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const assessmentsRef = collection(db, 'assessments');
    
    // Query para avaliações do usuário hoje
    const userTodayQuery = query(
      assessmentsRef,
      where('userId', '==', currentUser.uid),
      where('date', '>=', todayStart.toISOString()),
      orderBy('date', 'desc'),
      limit(1)
    );

    // Query para avaliações do parceiro hoje
    const partnerTodayQuery = query(
      assessmentsRef,
      where('userId', '==', userData.partnerId),
      where('date', '>=', todayStart.toISOString()),
      orderBy('date', 'desc'),
      limit(1)
    );

    // Query para análises coletivas hoje
    const analysisRef = collection(db, 'analysisHistory');
    const analysisQuery = query(
      analysisRef,
      where('userId', '==', currentUser.uid),
      where('type', '==', 'collective'),
      where('date', '>=', todayStart.toISOString()),
      orderBy('date', 'desc'),
      limit(1)
    );

    // Listener para avaliações do usuário
    const userUnsubscribe = onSnapshot(userTodayQuery, (snapshot) => {
      const userHasSubmitted = !snapshot.empty;
      setDailyStatus(prev => ({ ...prev, userHasSubmitted }));
    });

    // Listener para avaliações do parceiro
    const partnerUnsubscribe = onSnapshot(partnerTodayQuery, (snapshot) => {
      const partnerHasSubmitted = !snapshot.empty;
      setDailyStatus(prev => ({ ...prev, partnerHasSubmitted }));
    });

    // Listener para análises coletivas
    const analysisUnsubscribe = onSnapshot(analysisQuery, (snapshot) => {
      const hasCollectiveAnalysis = !snapshot.empty;
      setDailyStatus(prev => ({ ...prev, hasCollectiveAnalysis }));
    });

    // Cleanup function
    return () => {
      userUnsubscribe();
      partnerUnsubscribe();
      analysisUnsubscribe();
    };
  }, [currentUser?.uid, userData?.partnerId]);

  const handleAddEvent = async (event: Omit<DateEvent, 'id'>) => {
    try {
      await calendarService.addEvent(event);
      const updatedEvents = await calendarService.getEvents(currentUser!.uid);
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleDateSuggestionsClick = () => {
    navigate('/date-suggestions');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleClearHistory = async () => {
    if (!currentUser?.uid) {
      console.error('No user logged in');
      return;
    }

    try {
      await clearAnalysisHistory(currentUser.uid);
      setRecentAssessments([]);
      setCalendarEvents([]);
      setStats({
        weeklyAverage: 0,
        completionRate: 0,
        streak: 0,
      });
      setOpenDialog(false);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    fetchDailyStatus(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
      fetchDailyStatus(newDate);
    }
  };

  const fetchDailyStatus = async (date: Date) => {
    if (!currentUser?.uid || !userData) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const assessmentsRef = collection(db, 'assessments');
    
    const [userSnapshot, partnerSnapshot] = await Promise.all([
      getDocs(
        query(
          assessmentsRef,
          where('userId', '==', currentUser.uid),
          where('date', '>=', startOfDay.toISOString()),
          where('date', '<=', endOfDay.toISOString())
        )
      ),
      getDocs(
        query(
          assessmentsRef,
          where('userId', '==', userData.partnerId),
          where('date', '>=', startOfDay.toISOString()),
          where('date', '<=', endOfDay.toISOString())
        )
      )
    ]);

    setDailyStatus({
      userHasSubmitted: !userSnapshot.empty,
      partnerHasSubmitted: !partnerSnapshot.empty,
      hasCollectiveAnalysis: !userSnapshot.empty && !partnerSnapshot.empty
    });
  };

  useEffect(() => {
    fetchDailyStatus(selectedDate);
  }, [selectedDate, currentUser, userData]);

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl">
        <Fade in timeout={500}>
          <Box>
            <Box sx={{ 
              mb: { xs: 2, sm: 4 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -16,
                left: 0,
                right: 0,
                height: 1,
                background: (theme) => alpha(theme.palette.divider, 0.1),
              }
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                    background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Bem-vindo(a) de volta!
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    maxWidth: '600px',
                    lineHeight: 1.6,
                  }}
                >
                  Acompanhe seu progresso e fortaleça seu relacionamento com análises diárias e insights personalizados.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 4 } }}>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<RateReviewIcon />}
                    onClick={() => navigate('/assessment')}
                    sx={{
                      py: 2,
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.9),
                      },
                    }}
                  >
                    Avaliação Diária
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/orbital-analysis')}
                    sx={{
                      py: 2,
                      backgroundColor: theme.palette.secondary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.secondary.main, 0.9),
                      },
                    }}
                  >
                    Análise do Relacionamento
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/statistics')}
                    sx={{
                      py: 2,
                      backgroundColor: theme.palette.info.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.info.main, 0.9),
                      },
                    }}
                  >
                    Estatísticas
                  </Button>
                </Grid>
              </Grid>
              <DailyAnalysisStatus
                userSubmitted={dailyStatus.userHasSubmitted}
                partnerSubmitted={dailyStatus.partnerHasSubmitted}
                onNavigateToAnalysis={() => navigate('/analysis')}
                currentDate={selectedDate.toLocaleDateString('pt-BR')}
                onPreviousDay={handlePreviousDay}
                onNextDay={handleNextDay}
                hasNextDay={selectedDate < new Date()}
              />
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Partner Status */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  height: '100%',
                  background: (theme) => alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600,
                    }}
                  >
                    <FavoriteIcon color="inherit" />
                    Status do parceiro
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {partnerStatus.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Avaliação mais recente:</strong> {partnerStatus.lastAssessment || 'Nenhuma avaliação ainda'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Sequência de avaliações:</strong> {partnerStatus.assessmentStreak} dias
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Recent Assessments */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  height: '100%',
                  background: (theme) => alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="inherit" />
                      Avaliações recentes
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/analysis-history')}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: (theme) => `0 4px 8px -2px ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Ver histórico
                    </Button>
                  </Typography>
                  <List>
                    {recentAssessments.map((assessment, index) => (
                      <React.Fragment key={assessment.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={formatDate(assessment.date)}
                            secondary={`Avaliação geral: ${assessment.ratings?.satisfacaoGeral || 0}`}
                            primaryTypographyProps={{
                              sx: { fontWeight: 500 }
                            }}
                          />
                        </ListItem>
                        {index < recentAssessments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                    {recentAssessments.length === 0 && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="Nenhuma avaliação ainda"
                          sx={{ color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: { xs: 2, sm: 3 },
                  background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <EmojiEventsIcon color="inherit" />
                    Estatísticas rápidas
                  </Typography>
                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12} sm={4}>
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          background: (theme) => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.15)}`,
                          },
                        }}
                      >
                        <Typography 
                          variant="h4" 
                          color="primary"
                          sx={{ 
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            fontWeight: 700,
                            mb: 1,
                            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {stats.weeklyAverage}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Avaliação geral esta semana
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          background: (theme) => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.15)}`,
                          },
                        }}
                      >
                        <Typography 
                          variant="h4" 
                          color="primary"
                          sx={{ 
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            fontWeight: 700,
                            mb: 1,
                            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {stats.completionRate}%
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Taxa de conclusão de avaliações
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          background: (theme) => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.15)}`,
                          },
                        }}
                      >
                        <Typography 
                          variant="h4" 
                          color="primary"
                          sx={{ 
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            fontWeight: 700,
                            mb: 1,
                            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {stats.streak}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Sequência de avaliações
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Date Suggestions Button */}
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: { xs: 2, sm: 3 },
                  background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        fontWeight: 600,
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      Planeje momentos especiais
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        maxWidth: '600px' 
                      }}
                    >
                      Descubra ideias personalizadas para encontros e fortaleça seu relacionamento
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/date-suggestions')}
                    sx={{
                      py: { xs: 1.25, sm: 2 },
                      px: { xs: 2, sm: 4 },
                      borderRadius: 2,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      fontWeight: 600,
                      background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      ml: { xs: 2, sm: 4 },
                      whiteSpace: 'nowrap',
                    }}
                    startIcon={<FavoriteIcon />}
                  >
                    Sugestões de Encontro
                  </Button>
                </Paper>
              </Grid>

              {/* Calendar */}
              <Grid item xs={12}>
                <DateCalendar
                  events={calendarEvents}
                  onAddEvent={handleAddEvent}
                  userId={currentUser?.uid || ''}
                />
              </Grid>

              {/* Assessment Actions */}
              <Grid item xs={12}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                    background: (theme) => alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2 
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Avaliações Disponíveis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/relationship-patterns')}
                        startIcon={<AssessmentIcon />}
                        sx={{ py: 2 }}
                      >
                        Padrões do Relacionamento
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/attachment-assessment')}
                        startIcon={<PsychologyIcon />}
                        sx={{ py: 2 }}
                      >
                        Avaliação de Apego
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Dialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  p: { xs: 2, sm: 3 },
                }
              }}
            >
              <DialogTitle>Limpar Histórico</DialogTitle>
              <DialogContent>
                <Typography>
                  Tem certeza que deseja limpar todo o seu histórico? Esta ação não pode ser desfeita.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                <Button 
                  onClick={handleClearHistory} 
                  color="error" 
                  variant="contained"
                  sx={{
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Limpar
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Fade>
      </Container>
    </Layout>
  );
};

export default Dashboard; 