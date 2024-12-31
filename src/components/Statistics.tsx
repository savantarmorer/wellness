import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getAssessmentHistory } from '../services/assessmentHistoryService';
import { DailyAssessmentWithRatings } from '../types';
import { AssessmentChart } from './AssessmentChart';
import { RelationshipInsights } from './RelationshipInsights';
import { CommunicationExercises } from './CommunicationExercises';
import { DiscussionAgenda } from './DiscussionAgenda';
import {
  analyzeDiscrepancies,
  DiscrepancyAnalysis,
  CommunicationExercise,
  DiscussionTopic,
  createCommunicationExercise,
  getExerciseHistory,
  completeExercise,
  addDiscussionTopic,
  getDiscussionTopics,
  updateTopicStatus,
  deleteTopic,
} from '../services/insightService';

export const Statistics = () => {
  const { currentUser } = useAuth();
  const [assessments, setAssessments] = useState<DailyAssessmentWithRatings[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyAnalysis[]>([]);
  const [exercises, setExercises] = useState<CommunicationExercise[]>([]);
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        // Carregar histórico de avaliações
        const history = await getAssessmentHistory(currentUser.uid);
        setAssessments(history);

        // Carregar exercícios de comunicação
        const exerciseHistory = await getExerciseHistory(currentUser.uid);
        setExercises(exerciseHistory);

        // Carregar tópicos de discussão
        const discussionTopics = await getDiscussionTopics(currentUser.uid);
        setTopics(discussionTopics);

        // Analisar discrepâncias se houver avaliações do usuário e do parceiro
        if (history.length >= 2) {
          const userAssessment = history[0];
          const partnerAssessment = history[1];
          const discrepancyAnalysis = analyzeDiscrepancies(
            userAssessment.ratings,
            partnerAssessment.ratings
          );
          setDiscrepancies(discrepancyAnalysis);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  const handleAddExercise = async (
    exercise: Omit<CommunicationExercise, 'id' | 'completed'>
  ) => {
    if (!currentUser) return;
    const userId = currentUser.uid;
    await createCommunicationExercise(userId, exercise);
    const updatedExercises = await getExerciseHistory(userId);
    setExercises(updatedExercises);
  };

  const handleCompleteExercise = async (exerciseId: string) => {
    if (!currentUser) return;
    const userId = currentUser.uid;
    await completeExercise(userId, exerciseId);
    const updatedExercises = await getExerciseHistory(userId);
    setExercises(updatedExercises);
  };

  const handleAddTopic = async (
    topic: Omit<DiscussionTopic, 'id' | 'status'>
  ) => {
    if (!currentUser) return;
    const userId = currentUser.uid;
    await addDiscussionTopic(userId, topic);
    const updatedTopics = await getDiscussionTopics(userId);
    setTopics(updatedTopics);
  };

  const handleUpdateTopicStatus = async (
    topicId: string,
    status: 'pending' | 'discussed' | 'resolved'
  ) => {
    if (!currentUser) return;
    const userId = currentUser.uid;
    await updateTopicStatus(userId, topicId, status);
    const updatedTopics = await getDiscussionTopics(userId);
    setTopics(updatedTopics);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!currentUser) return;
    const userId = currentUser.uid;
    await deleteTopic(userId, topicId);
    const updatedTopics = await getDiscussionTopics(userId);
    setTopics(updatedTopics);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Estatísticas e Insights
        </Typography>

        <Grid container spacing={4}>
          {/* Gráficos de Avaliação */}
          <Grid item xs={12}>
            <AssessmentChart assessments={assessments} />
          </Grid>

          {/* Análise de Discrepâncias */}
          <Grid item xs={12}>
            <RelationshipInsights discrepancies={discrepancies} />
          </Grid>

          {/* Exercícios de Comunicação */}
          <Grid item xs={12} md={6}>
            <CommunicationExercises
              exercises={exercises}
              onAddExercise={handleAddExercise}
              onCompleteExercise={handleCompleteExercise}
            />
          </Grid>

          {/* Agenda de Discussão */}
          <Grid item xs={12} md={6}>
            <DiscussionAgenda
              topics={topics}
              onAddTopic={handleAddTopic}
              onUpdateTopicStatus={handleUpdateTopicStatus}
              onDeleteTopic={handleDeleteTopic}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 