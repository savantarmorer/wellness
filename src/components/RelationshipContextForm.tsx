import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import type { RelationshipContextFormData } from '../types';
import { RelationshipContextProgress } from './RelationshipContextProgress';

interface Props {
  initialValues?: Partial<RelationshipContextFormData>;
  onSubmit: (data: RelationshipContextFormData) => void;
}

export const RelationshipContextForm: React.FC<Props> = ({ initialValues, onSubmit }) => {
  const initialData: Partial<RelationshipContextFormData> = initialValues || {};
  const [formData, setFormData] = useState<RelationshipContextFormData>({
    duration: initialData.duration || '',
    status: initialData.status || '',
    type: initialData.type || '',
    goals: initialData.goals || [],
    challenges: initialData.challenges || [],
    values: initialData.values || [],
    relationshipDuration: initialData.relationshipDuration || '',
    relationshipStyle: initialData.relationshipStyle || 'monogamico',
    relationshipStyleOther: initialData.relationshipStyleOther || '',
    currentDynamics: initialData.currentDynamics || '',
    strengths: initialData.strengths || '',
    areasNeedingAttention: initialData.areasNeedingAttention || {
      comunicacao: false,
      confianca: false,
      intimidade: false,
      resolucaoConflitos: false,
      apoioEmocional: false,
      outros: false,
    },
    areasNeedingAttentionOther: initialData.areasNeedingAttentionOther || '',
    recurringProblems: initialData.recurringProblems || '',
    appGoals: initialData.appGoals || '',
    hadSignificantCrises: initialData.hadSignificantCrises || false,
    crisisDescription: initialData.crisisDescription || '',
    attemptedSolutions: initialData.attemptedSolutions || false,
    solutionsDescription: initialData.solutionsDescription || '',
    userEmotionalState: initialData.userEmotionalState || '',
    partnerEmotionalState: initialData.partnerEmotionalState || '',
    timeSpentTogether: initialData.timeSpentTogether || 'menos1h',
    qualityTime: initialData.qualityTime || false,
    qualityTimeDescription: initialData.qualityTimeDescription || '',
    routineImpact: initialData.routineImpact || '',
    physicalIntimacy: initialData.physicalIntimacy || '',
    intimacyImprovements: initialData.intimacyImprovements || '',
    additionalInfo: initialData.additionalInfo || '',
  });

  const [currentStep, setCurrentStep] = useState(0);

  const handleChange = (field: keyof RelationshipContextFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAreasChange = (area: keyof typeof formData.areasNeedingAttention) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      areasNeedingAttention: {
        ...prev.areasNeedingAttention,
        [area]: event.target.checked,
      },
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Informações Básicas
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Duração do Relacionamento"
                value={formData.relationshipDuration}
                onChange={handleChange('relationshipDuration')}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel>Estilo de Relacionamento</FormLabel>
                <RadioGroup
                  value={formData.relationshipStyle}
                  onChange={handleChange('relationshipStyle')}
                >
                  <FormControlLabel
                    value="monogamico"
                    control={<Radio />}
                    label="Monogâmico"
                  />
                  <FormControlLabel
                    value="aberto"
                    control={<Radio />}
                    label="Relacionamento Aberto"
                  />
                  <FormControlLabel
                    value="poliamoroso"
                    control={<Radio />}
                    label="Poliamoroso"
                  />
                  <FormControlLabel value="outro" control={<Radio />} label="Outro" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {formData.relationshipStyle === 'outro' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Especifique o estilo de relacionamento"
                  value={formData.relationshipStyleOther}
                  onChange={handleChange('relationshipStyleOther')}
                />
              </Grid>
            )}
          </>
        );

      case 1: // Dinâmica do Relacionamento
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Dinâmica Atual"
                value={formData.currentDynamics}
                onChange={handleChange('currentDynamics')}
                helperText="Descreva como é a dinâmica atual do seu relacionamento"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Pontos Fortes"
                value={formData.strengths}
                onChange={handleChange('strengths')}
                helperText="Quais são os pontos fortes do seu relacionamento?"
              />
            </Grid>
          </>
        );

      case 2: // Áreas de Atenção
        return (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Áreas que Precisam de Atenção
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.areasNeedingAttention.comunicacao}
                      onChange={handleAreasChange('comunicacao')}
                    />
                  }
                  label="Comunicação"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.areasNeedingAttention.confianca}
                      onChange={handleAreasChange('confianca')}
                    />
                  }
                  label="Confiança"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.areasNeedingAttention.intimidade}
                      onChange={handleAreasChange('intimidade')}
                    />
                  }
                  label="Intimidade"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.areasNeedingAttention.resolucaoConflitos}
                      onChange={handleAreasChange('resolucaoConflitos')}
                    />
                  }
                  label="Resolução de Conflitos"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.areasNeedingAttention.apoioEmocional}
                      onChange={handleAreasChange('apoioEmocional')}
                    />
                  }
                  label="Apoio Emocional"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.areasNeedingAttention.outros}
                      onChange={handleAreasChange('outros')}
                    />
                  }
                  label="Outros"
                />
              </FormGroup>
            </Grid>

            {formData.areasNeedingAttention.outros && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Outras áreas que precisam de atenção"
                  value={formData.areasNeedingAttentionOther}
                  onChange={handleChange('areasNeedingAttentionOther')}
                />
              </Grid>
            )}
          </>
        );

      case 3: // Estado Emocional
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Seu Estado Emocional"
                value={formData.userEmotionalState}
                onChange={handleChange('userEmotionalState')}
                helperText="Como você se sente emocionalmente no relacionamento?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Estado Emocional do Parceiro"
                value={formData.partnerEmotionalState}
                onChange={handleChange('partnerEmotionalState')}
                helperText="Como você percebe o estado emocional do seu parceiro?"
              />
            </Grid>
          </>
        );

      case 4: // Tempo e Qualidade
        return (
          <>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel>Tempo Médio Juntos por Dia</FormLabel>
                <RadioGroup
                  value={formData.timeSpentTogether}
                  onChange={handleChange('timeSpentTogether')}
                >
                  <FormControlLabel
                    value="menos1h"
                    control={<Radio />}
                    label="Menos de 1 hora"
                  />
                  <FormControlLabel value="1-3h" control={<Radio />} label="1-3 horas" />
                  <FormControlLabel
                    value="mais3h"
                    control={<Radio />}
                    label="Mais de 3 horas"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.qualityTime}
                    onChange={handleChange('qualityTime')}
                  />
                }
                label="O tempo juntos é de qualidade?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descrição da Qualidade do Tempo"
                value={formData.qualityTimeDescription}
                onChange={handleChange('qualityTimeDescription')}
                helperText="Como vocês costumam passar o tempo juntos?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Impacto da Rotina"
                value={formData.routineImpact}
                onChange={handleChange('routineImpact')}
                helperText="Como a rotina afeta o relacionamento?"
              />
            </Grid>
          </>
        );

      case 5: // Objetivos e Melhorias
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Objetivos com o App"
                value={formData.appGoals}
                onChange={handleChange('appGoals')}
                helperText="O que você espera alcançar usando este app?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Melhorias Desejadas"
                value={formData.intimacyImprovements}
                onChange={handleChange('intimacyImprovements')}
                helperText="Que aspectos do relacionamento você gostaria de melhorar?"
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Salvar Contexto
              </Button>
            </Grid>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <RelationshipContextProgress
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              data={formData}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {renderStep()}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}; 