import { useState, useEffect } from 'react';
import { Box, Container, Typography, Alert, Button } from '@mui/material';
import { RelationshipContextForm } from '../components/RelationshipContextForm';
import { RelationshipContextView } from '../components/RelationshipContextView';
import { useAuth } from '../contexts/AuthContext';
import { getRelationshipContext, saveRelationshipContext, updateRelationshipContext } from '../services/relationshipContextService';
import type { RelationshipContext as RelationshipContextType, RelationshipContextFormData } from '../types';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const isValidStatus = (status: string): status is 'dating' | 'engaged' | 'married' | 'other' => {
  return ['dating', 'engaged', 'married', 'other'].includes(status);
};

export default function RelationshipContext() {
  const { currentUser, userData } = useAuth();
  const [existingContext, setExistingContext] = useState<Partial<RelationshipContextFormData> | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContext = async () => {
      if (!currentUser) return;

      try {
        const context = await getRelationshipContext(currentUser.uid);
        if (context) {
          const formData: Partial<RelationshipContextFormData> = {
            duration: context.duration,
            status: isValidStatus(context.status) ? context.status : 'other',
            type: context.type,
            goals: context.goals,
            challenges: context.challenges,
            values: context.values,
            relationshipStyle: context.relationshipStyle,
            relationshipStyleOther: context.relationshipStyleOther,
            currentDynamics: context.currentDynamics,
            strengths: context.strengths,
            areasNeedingAttention: Array.isArray(context.areasNeedingAttention) ? {
              comunicacao: context.areasNeedingAttention.includes('comunicacao'),
              confianca: context.areasNeedingAttention.includes('confianca'),
              intimidade: context.areasNeedingAttention.includes('intimidade'),
              resolucaoConflitos: context.areasNeedingAttention.includes('resolucaoConflitos'),
              apoioEmocional: context.areasNeedingAttention.includes('apoioEmocional'),
              outros: context.areasNeedingAttention.includes('outros')
            } : {
              comunicacao: false,
              confianca: false,
              intimidade: false,
              resolucaoConflitos: false,
              apoioEmocional: false,
              outros: false
            },
            recurringProblems: context.recurringProblems,
            appGoals: context.appGoals,
            hadSignificantCrises: context.hadSignificantCrises,
            crisisDescription: context.crisisDescription,
            attemptedSolutions: context.attemptedSolutions,
            solutionsDescription: context.solutionsDescription,
            userEmotionalState: context.userEmotionalState,
            partnerEmotionalState: context.partnerEmotionalState,
            timeSpentTogether: context.timeSpentTogether,
            qualityTime: context.qualityTime === 'yes',
            qualityTimeDescription: context.qualityTimeDescription,
            routineImpact: context.routineImpact,
            physicalIntimacy: context.physicalIntimacy === 'yes',
            intimacyImprovements: context.intimacyImprovements,
            additionalInfo: context.additionalInfo,
            majorLifeEvents: context.majorLifeEvents,
            attachmentStyle: context.attachmentStyle
          };
          setExistingContext(formData);
          setIsEditing(false);
        } else {
          setExistingContext(undefined);
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error fetching relationship context:', error);
        setError('Failed to load relationship context');
      }
    };

    fetchContext();
  }, [currentUser]);

  const initialContext: RelationshipContextType = {
    type: '',
    duration: '',
    status: 'dating',
    relationshipStyle: '',
    relationshipStyleOther: '',
    currentDynamics: '',
    userEmotionalState: '',
    partnerEmotionalState: '',
    hadSignificantCrises: false,
    crisisDescription: '',
    attemptedSolutions: false,
    solutionsDescription: '',
    routineImpact: '',
    relationshipStatus: '',
    livingArrangement: '',
    communicationStyle: '',
    sharedActivities: [],
    supportSystem: [],
    futureExpectations: '',
    challengeAreas: [],
    strengthAreas: [],
    values: [],
    goals: [],
    challenges: [],
    strengths: [],
    appGoals: [],
    timeSpentTogether: '',
    qualityTime: 'no' as const,
    qualityTimeDescription: '',
    physicalIntimacy: 'no' as const,
    intimacyImprovements: [],
    additionalInfo: '',
    areasNeedingAttention: []
  };

  const handleSubmit = async (formData: RelationshipContextFormData) => {
    try {
      setError(null);
      setSuccess(null);

      const updatedContext: RelationshipContextType = {
        type: formData.type,
        duration: formData.duration,
        status: formData.status,
        relationshipStyle: formData.relationshipStyle,
        relationshipStyleOther: formData.relationshipStyleOther,
        currentDynamics: formData.currentDynamics,
        userEmotionalState: formData.userEmotionalState,
        partnerEmotionalState: formData.partnerEmotionalState,
        hadSignificantCrises: formData.hadSignificantCrises,
        crisisDescription: formData.crisisDescription || '',
        attemptedSolutions: formData.attemptedSolutions,
        solutionsDescription: formData.solutionsDescription || '',
        routineImpact: formData.routineImpact,
        relationshipStatus: formData.relationshipStatus,
        livingArrangement: formData.livingArrangement,
        communicationStyle: formData.communicationStyle,
        sharedActivities: formData.sharedActivities,
        supportSystem: formData.supportSystem,
        futureExpectations: formData.futureExpectations,
        challengeAreas: formData.challengeAreas,
        strengthAreas: formData.strengthAreas,
        values: formData.values,
        goals: formData.goals,
        challenges: formData.challenges,
        strengths: formData.strengths,
        appGoals: formData.appGoals,
        timeSpentTogether: formData.timeSpentTogether,
        qualityTime: formData.qualityTime ? 'yes' as const : 'no' as const,
        qualityTimeDescription: formData.qualityTimeDescription,
        physicalIntimacy: formData.physicalIntimacy ? 'yes' as const : 'no' as const,
        intimacyImprovements: formData.intimacyImprovements,
        additionalInfo: formData.additionalInfo || '',
        areasNeedingAttention: Object.entries(formData.areasNeedingAttention)
          .filter(([_, value]) => value)
          .map(([key]) => key),
        majorLifeEvents: formData.majorLifeEvents,
        attachmentStyle: formData.attachmentStyle
      };

      if (!currentUser) {
        throw new Error('Você precisa estar logado para salvar o contexto.');
      }

      await saveRelationshipContext(updatedContext, currentUser.uid, formData.partnerId || '');
      setSuccess('Contexto do relacionamento salvo com sucesso!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error updating relationship context:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar o contexto do relacionamento');
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
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Contexto do Relacionamento
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

          {isEditing ? (
            <RelationshipContextForm
              initialData={existingContext}
              onSubmit={handleSubmit}
              userId={currentUser?.uid || ''}
              partnerId={userData?.partnerId || ''}
            />
          ) : existingContext ? (
            <Box>
              <RelationshipContextView
                data={existingContext as RelationshipContextFormData}
                onEdit={() => setIsEditing(true)}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>
                Nenhum contexto de relacionamento encontrado. Por favor, adicione um.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsEditing(true)}
                sx={{ mt: 2 }}
              >
                Adicionar Contexto
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Layout>
  );
} 