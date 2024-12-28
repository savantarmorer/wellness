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
} from '@mui/material';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { DailyAssessment } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const [recentAssessments, setRecentAssessments] = useState<DailyAssessment[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userData]);

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
        <Box sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Welcome Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    Welcome Back, {userData?.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Track your relationship wellness daily
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/assessment')}
                >
                  Start Today's Assessment
                </Button>
              </Paper>
            </Grid>

            {/* Partner Status */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Partner Status
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    {partnerStatus.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last assessment: {partnerStatus.lastAssessment || 'No assessment yet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessment streak: {partnerStatus.assessmentStreak} days
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Recent Assessments */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Recent Assessments
                </Typography>
                <List>
                  {recentAssessments.map((assessment, index) => (
                    <React.Fragment key={assessment.id}>
                      <ListItem>
                        <ListItemText
                          primary={formatDate(assessment.date)}
                          secondary={`Average Rating: ${assessment.ratings.satisfacaoGeral}`}
                        />
                      </ListItem>
                      {index < recentAssessments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {recentAssessments.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No assessments yet" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.weeklyAverage}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Rating This Week
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.completionRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Assessment Completion Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.streak}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Days Streak
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default Dashboard; 