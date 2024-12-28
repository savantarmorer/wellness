import { useState, useEffect } from 'react';
import { Box, Container, Typography, Alert } from '@mui/material';
import { RelationshipContextForm } from '../components/RelationshipContextForm';
import { useAuth } from '../context/AuthContext';
import { getRelationshipContext, saveRelationshipContext, updateRelationshipContext } from '../services/relationshipContextService';
import type { RelationshipContext, RelationshipContextFormData } from '../types';
import { Layout } from '../components/Layout';

export default function RelationshipContext() {
  const { currentUser, userData } = useAuth();
  const [existingContext, setExistingContext] = useState<Partial<RelationshipContextFormData> | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (!currentUser) return;

      try {
        const context = await getRelationshipContext(currentUser.uid);
        if (context) {
          const formData: Partial<RelationshipContextFormData> = {
            duration: context.duration,
            status: context.status,
            type: context.type,
            goals: context.goals,
            challenges: context.challenges,
            values: context.values,
            relationshipDuration: context.relationshipDuration,
            relationshipStyle: context.relationshipStyle,
            relationshipStyleOther: context.relationshipStyleOther,
            currentDynamics: context.currentDynamics,
            strengths: context.strengths,
            areasNeedingAttention: context.areasNeedingAttention,
            areasNeedingAttentionOther: context.areasNeedingAttentionOther,
            recurringProblems: context.recurringProblems,
            appGoals: context.appGoals,
            hadSignificantCrises: context.hadSignificantCrises,
            crisisDescription: context.crisisDescription,
            attemptedSolutions: context.attemptedSolutions,
            solutionsDescription: context.solutionsDescription,
            userEmotionalState: context.userEmotionalState,
            partnerEmotionalState: context.partnerEmotionalState,
            timeSpentTogether: context.timeSpentTogether,
            qualityTime: context.qualityTime,
            qualityTimeDescription: context.qualityTimeDescription,
            routineImpact: context.routineImpact,
            physicalIntimacy: context.physicalIntimacy,
            intimacyImprovements: context.intimacyImprovements,
            additionalInfo: context.additionalInfo,
          };
          setExistingContext(formData);
        } else {
          setExistingContext(undefined);
        }
      } catch (error) {
        console.error('Error fetching relationship context:', error);
        setError('Failed to load relationship context');
      }
    };

    fetchContext();
  }, [currentUser]);

  const handleSubmit = async (data: RelationshipContextFormData) => {
    if (!currentUser || !userData?.partnerId) {
      setError('You need to be connected with a partner to save relationship context');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      if (existingContext) {
        await updateRelationshipContext(currentUser.uid, userData.partnerId, data);
      } else {
        await saveRelationshipContext(currentUser.uid, userData.partnerId, data);
      }

      setSuccess('Relationship context saved successfully');

      const updatedContext = await getRelationshipContext(currentUser.uid);
      if (updatedContext) {
        const formData: Partial<RelationshipContextFormData> = {
          duration: updatedContext.duration,
          status: updatedContext.status,
          type: updatedContext.type,
          goals: updatedContext.goals,
          challenges: updatedContext.challenges,
          values: updatedContext.values,
          relationshipDuration: updatedContext.relationshipDuration,
          relationshipStyle: updatedContext.relationshipStyle,
          relationshipStyleOther: updatedContext.relationshipStyleOther,
          currentDynamics: updatedContext.currentDynamics,
          strengths: updatedContext.strengths,
          areasNeedingAttention: updatedContext.areasNeedingAttention,
          areasNeedingAttentionOther: updatedContext.areasNeedingAttentionOther,
          recurringProblems: updatedContext.recurringProblems,
          appGoals: updatedContext.appGoals,
          hadSignificantCrises: updatedContext.hadSignificantCrises,
          crisisDescription: updatedContext.crisisDescription,
          attemptedSolutions: updatedContext.attemptedSolutions,
          solutionsDescription: updatedContext.solutionsDescription,
          userEmotionalState: updatedContext.userEmotionalState,
          partnerEmotionalState: updatedContext.partnerEmotionalState,
          timeSpentTogether: updatedContext.timeSpentTogether,
          qualityTime: updatedContext.qualityTime,
          qualityTimeDescription: updatedContext.qualityTimeDescription,
          routineImpact: updatedContext.routineImpact,
          physicalIntimacy: updatedContext.physicalIntimacy,
          intimacyImprovements: updatedContext.intimacyImprovements,
          additionalInfo: updatedContext.additionalInfo,
        };
        setExistingContext(formData);
      } else {
        setExistingContext(undefined);
      }
    } catch (error) {
      console.error('Error saving relationship context:', error);
      setError('Failed to save relationship context');
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <Container>
          <Typography>Please log in to access this page.</Typography>
        </Container>
      </Layout>
    );
  }

  if (!userData?.partnerId) {
    return (
      <Layout>
        <Container>
          <Typography>
            You need to connect with your partner before setting up relationship context.
          </Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Relationship Context
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Help us understand your relationship better by providing some context. This information will be
            used to provide more personalized insights and recommendations.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <RelationshipContextForm
            initialValues={existingContext}
            onSubmit={handleSubmit}
          />
        </Box>
      </Container>
    </Layout>
  );
} 