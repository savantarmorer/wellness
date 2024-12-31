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
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { DailyAssessment } from '../types';
import { DateCalendar, DateEvent } from '../components/DateCalendar';
import * as calendarService from '../services/calendarService';
import { DateSuggestions, DateSuggestion } from '../components/DateSuggestions';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const [recentAssessments, setRecentAssessments] = useState<DailyAssessment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<DateEvent[]>([]);
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
  const matches = useMediaQuery(theme.breakpoints.down('sm'));
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch calendar events
        const events = await calendarService.getEvents(currentUser.uid, userData?.partnerId);
        setCalendarEvents(events);

        // Fetch recent assessments
        const assessmentsRef = collection(db, 'assessments');
        const assessmentsQuery = query(
          assessmentsRef,
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc'),
          limit(5)
        );
        const assessmentsSnapshot = await getDocs(assessmentsQuery);
        const assessments = assessmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DailyAssessment[];
        setRecentAssessments(assessments);

        // Calculate statistics
        if (assessments.length > 0) {
          // Weekly average
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weeklyAssessments = assessments.filter(
            a => new Date(a.date) >= weekAgo
          );
          const weeklyAverage = weeklyAssessments.reduce(
            (acc, curr) => acc + curr.ratings.satisfacaoGeral,
            0
          ) / weeklyAssessments.length || 0;

          // Completion rate (last 7 days)
          const completionRate = (weeklyAssessments.length / 7) * 100;

          // Calculate streak
          let streak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (let i = 0; i < assessments.length; i++) {
            const assessmentDate = new Date(assessments[i].date);
            assessmentDate.setHours(0, 0, 0, 0);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            
            if (assessmentDate.getTime() === expectedDate.getTime()) {
              streak++;
            } else {
              break;
            }
          }

          setStats({
            weeklyAverage: Number(weeklyAverage.toFixed(1)),
            completionRate: Math.round(completionRate),
            streak,
          });
        }

        // Fetch partner status if partnerId exists
        if (userData?.partnerId) {
          const partnerAssessmentsQuery = query(
            assessmentsRef,
            where('userId', '==', userData.partnerId),
            orderBy('date', 'desc'),
            limit(1)
          );
          const partnerSnapshot = await getDocs(partnerAssessmentsQuery);
          if (!partnerSnapshot.empty) {
            const lastAssessment = partnerSnapshot.docs[0].data();
            const lastAssessmentTime = new Date(lastAssessment.date);
            const now = new Date();
            const diffHours = Math.floor((now.getTime() - lastAssessmentTime.getTime()) / (1000 * 60 * 60));
            
            // Calculate partner's streak
            const partnerAssessmentsStreakQuery = query(
              assessmentsRef,
              where('userId', '==', userData.partnerId),
              orderBy('date', 'desc')
            );
            const partnerStreakSnapshot = await getDocs(partnerAssessmentsStreakQuery);
            const partnerAssessments = partnerStreakSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as DailyAssessment[];

            let partnerStreak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < partnerAssessments.length; i++) {
              const assessmentDate = new Date(partnerAssessments[i].date);
              assessmentDate.setHours(0, 0, 0, 0);
              const expectedDate = new Date(today);
              expectedDate.setDate(today.getDate() - i);
              
              if (assessmentDate.getTime() === expectedDate.getTime()) {
                partnerStreak++;
              } else {
                break;
              }
            }
            
            setPartnerStatus({
              name: userData.name || 'Parceiro',
              lastAssessment: diffHours < 24 ? `${diffHours} hours ago` : 'over a day ago',
              assessmentStreak: partnerStreak,
            });
          }
        }

        // Fetch user interests if they exist
        if (userData?.interests) {
          setUserInterests(userData.interests);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userData]);

  const handleAddEvent = async (event: Omit<DateEvent, 'id'>) => {
    try {
      await calendarService.addEvent(event);
      const updatedEvents = await calendarService.getEvents(currentUser!.uid, userData?.partnerId);
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleAddToCalendar = async (suggestion: DateSuggestion) => {
    try {
      const eventDetails: Omit<DateEvent, 'id'> = {
        title: suggestion.title,
        date: new Date(),
        time: '',
        location: suggestion.location,
        isRecurring: false,
        createdBy: currentUser!.uid,
      };
      await calendarService.addEvent(eventDetails);
      const updatedEvents = await calendarService.getEvents(currentUser!.uid, userData?.partnerId);
      setCalendarEvents(updatedEvents);
    } catch (error) {
      console.error('Error adding event from suggestion:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        {!userData?.partnerId && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/profile')}
                sx={{ 
                  fontWeight: 'bold',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s'
                  }
                }}
              >
                Conectar Parceiro
              </Button>
            }
          >
            Conecte-se com seu parceiro para compartilhar avaliações e acompanhar o bem-estar do relacionamento juntos.
          </Alert>
        )}
        <Grid container spacing={3}>
          {/* Calendar Section */}
          <Grid item xs={12}>
            <DateCalendar
              events={calendarEvents}
              onAddEvent={handleAddEvent}
              userId={currentUser?.uid || ''}
            />
          </Grid>

          {/* Welcome Section */}
          <Grid item xs={12}>
            <Paper sx={{ 
              p: { xs: 2, sm: 3 }, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' } 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box
                  component="img"
                  src="/icons/icon-192x192.png"
                  alt="Dr. Bread Logo"
                  sx={{
                    width: { xs: 80, sm: 60 },
                    height: { xs: 80, sm: 60 },
                    borderRadius: '20%'
                  }}
                />
                <Box>
                  <Typography variant="h4" sx={{ 
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    mb: 1 
                  }}>
                    Bem Vindo de volta, {userData?.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {userData?.partnerId ? (
                      <>Conectado com <strong>{partnerStatus.name}</strong> • Acompanhe seu relacionamento diário</>
                    ) : (
                      'Acompanhe seu relacionamento diário'
                    )}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/assessment')}
                fullWidth={matches}
                sx={{ 
                  mt: { xs: 2, sm: 0 },
                  minWidth: { xs: '100%', sm: 'auto' }
                }}
              >
                Iniciar Avaliação de hoje
              </Button>
            </Paper>
          </Grid>

          {/* Partner Status */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Status do parceiro
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  {partnerStatus.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avaliação mais recente: {partnerStatus.lastAssessment || 'Nenhuma avaliação ainda'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sequência de avaliações: {partnerStatus.assessmentStreak} dias
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Recent Assessments */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Avaliações recentes
              </Typography>
              <List>
                {recentAssessments.map((assessment, index) => (
                  <React.Fragment key={assessment.id}>
                    <ListItem>
                      <ListItemText
                        primary={formatDate(assessment.date)}
                        secondary={`Avaliação geral: ${assessment.ratings.satisfacaoGeral}`}
                      />
                    </ListItem>
                    {index < recentAssessments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {recentAssessments.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Nenhuma avaliação ainda" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Estatísticas rápidas
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {stats.weeklyAverage}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avaliação geral esta semana
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {stats.completionRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taxa de conclusão de avaliações
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {stats.streak}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sequência de avaliações
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Date Suggestions Section */}
          <Grid item xs={12}>
            <DateSuggestions
              userInterests={userInterests}
              onAddToCalendar={handleAddToCalendar}
            />
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Dashboard; 