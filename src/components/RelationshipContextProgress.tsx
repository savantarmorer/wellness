import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Button,
} from '@mui/material';
import type { RelationshipContextFormData } from '../types';

interface Props {
  currentStep: number;
  onStepChange: (step: number) => void;
  data: Partial<RelationshipContextFormData>;
}

export const RelationshipContextProgress: React.FC<Props> = ({
  currentStep,
  onStepChange,
  data,
}) => {
  const steps = [
    {
      label: 'Informações Básicas',
      description: 'Duração e estilo do relacionamento',
      isComplete: () => Boolean(data.relationshipDuration && data.relationshipStyle),
    },
    {
      label: 'Dinâmica do Relacionamento',
      description: 'Como funciona o relacionamento atualmente',
      isComplete: () => Boolean(data.currentDynamics && data.strengths),
    },
    {
      label: 'Áreas de Atenção',
      description: 'Aspectos que precisam ser trabalhados',
      isComplete: () => {
        const hasAreas = Object.values(data.areasNeedingAttention || {}).some(value => value);
        return hasAreas;
      },
    },
    {
      label: 'Estado Emocional',
      description: 'Como você e seu parceiro se sentem',
      isComplete: () => Boolean(data.userEmotionalState && data.partnerEmotionalState),
    },
    {
      label: 'Tempo e Qualidade',
      description: 'Como vocês aproveitam o tempo juntos',
      isComplete: () => Boolean(data.timeSpentTogether && data.routineImpact),
    },
    {
      label: 'Objetivos e Melhorias',
      description: 'O que vocês querem alcançar',
      isComplete: () => Boolean(data.appGoals),
    },
  ];

  const handleNext = () => {
    onStepChange(currentStep + 1);
  };

  const handleBack = () => {
    onStepChange(currentStep - 1);
  };

  return (
    <Box sx={{ maxWidth: 400, mb: 4 }}>
      <Stepper activeStep={currentStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} completed={step.isComplete()}>
            <StepLabel>
              <Typography variant="subtitle1">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={!step.isComplete()}
                  >
                    {index === steps.length - 1 ? 'Finalizar' : 'Continuar'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Voltar
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}; 