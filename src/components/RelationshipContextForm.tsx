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
  Chip,
} from '@mui/material';
import type { RelationshipContextFormData } from '../types';
import { RelationshipContextProgress } from './RelationshipContextProgress';

interface Props {
  initialData?: Partial<RelationshipContextFormData>;
  onSubmit: (formData: RelationshipContextFormData) => Promise<void>;
  userId: string;
  partnerId: string;
}

export const RelationshipContextForm: React.FC<Props> = ({ initialData = {}, onSubmit, userId, partnerId }) => {
  const [formData, setFormData] = useState<RelationshipContextFormData>({
    status: initialData.status || 'dating',
    duration: initialData.duration || '',
    cohabitation: initialData.cohabitation || false,
    children: initialData.children || false,
    previousMarriage: initialData.previousMarriage || false,
    previousCounseling: initialData.previousCounseling || false,
    relationshipStyle: initialData.relationshipStyle || '',
    relationshipStyleOther: initialData.relationshipStyleOther || '',
    strengths: Array.isArray(initialData.strengths) ? initialData.strengths : [],
    areasNeedingAttention: initialData.areasNeedingAttention || {
      comunicacao: false,
      confianca: false,
      intimidade: false,
      resolucaoConflitos: false,
      apoioEmocional: false,
      outros: false
    },
    recurringProblems: initialData.recurringProblems || [],
    appGoals: initialData.appGoals || [],
    mentalHealth: initialData.mentalHealth || {
      ansiedade: false,
      depressao: false,
      outros: false
    },
    qualityTime: initialData.qualityTime || false,
    physicalIntimacy: initialData.physicalIntimacy || false,
    intimacyImprovements: initialData.intimacyImprovements || [],
    values: initialData.values || [],
    goals: initialData.goals || [],
    challenges: initialData.challenges || [],
    type: initialData.type || '',
    currentDynamics: initialData.currentDynamics || '',
    userEmotionalState: initialData.userEmotionalState || '',
    partnerEmotionalState: initialData.partnerEmotionalState || '',
    hadSignificantCrises: initialData.hadSignificantCrises || false,
    crisisDescription: initialData.crisisDescription || '',
    attemptedSolutions: initialData.attemptedSolutions || false,
    solutionsDescription: initialData.solutionsDescription || '',
    routineImpact: initialData.routineImpact || '',
    relationshipStatus: initialData.relationshipStatus || '',
    livingArrangement: initialData.livingArrangement || '',
    communicationStyle: initialData.communicationStyle || '',
    sharedActivities: initialData.sharedActivities || [],
    supportSystem: initialData.supportSystem || [],
    futureExpectations: initialData.futureExpectations || '',
    challengeAreas: initialData.challengeAreas || [],
    strengthAreas: initialData.strengthAreas || [],
    timeSpentTogether: initialData.timeSpentTogether || '',
    qualityTimeDescription: initialData.qualityTimeDescription || '',
    additionalInfo: initialData.additionalInfo || '',
    userId,
    partnerId,
    majorLifeEvents: initialData.majorLifeEvents || [],
    attachmentStyle: initialData.attachmentStyle
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [newEvent, setNewEvent] = useState('');
  const [newStrength, setNewStrength] = useState('');

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
      case 0:
        return (
          <>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Status do Relacionamento</FormLabel>
                <RadioGroup
                  value={formData.status}
                  onChange={handleChange('status')}
                  row
                >
                  <FormControlLabel value="dating" control={<Radio />} label="Namorando" />
                  <FormControlLabel value="engaged" control={<Radio />} label="Noivos" />
                  <FormControlLabel value="married" control={<Radio />} label="Casados" />
                  <FormControlLabel value="other" control={<Radio />} label="Outro" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Moram Juntos?</FormLabel>
                <RadioGroup
                  value={formData.cohabitation.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cohabitation: e.target.value === 'true'
                  }))}
                  row
                >
                  <FormControlLabel value="true" control={<Radio />} label="Sim" />
                  <FormControlLabel value="false" control={<Radio />} label="Não" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Têm Filhos?</FormLabel>
                <RadioGroup
                  value={formData.children.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    children: e.target.value === 'true'
                  }))}
                  row
                >
                  <FormControlLabel value="true" control={<Radio />} label="Sim" />
                  <FormControlLabel value="false" control={<Radio />} label="Não" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Já fizeram terapia de casal?</FormLabel>
                <RadioGroup
                  value={formData.previousCounseling.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    previousCounseling: e.target.value === 'true'
                  }))}
                  row
                >
                  <FormControlLabel value="true" control={<Radio />} label="Sim" />
                  <FormControlLabel value="false" control={<Radio />} label="Não" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Duração do Relacionamento"
                value={formData.duration}
                onChange={handleChange('duration')}
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
                  label="Tipo de Relacionamento"
                  value={formData.type}
                  onChange={handleChange('type')}
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
              <FormControl fullWidth>
                <FormLabel>Pontos Fortes</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {Array.isArray(formData.strengths) ? formData.strengths.map((strength, index) => (
                    <Chip
                      key={index}
                      label={strength}
                      onDelete={() => {
                        setFormData(prev => ({
                          ...prev,
                          strengths: Array.isArray(prev.strengths) ? prev.strengths.filter((_, i) => i !== index) : []
                        }));
                      }}
                    />
                  )) : null}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Adicionar ponto forte"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (newStrength.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          strengths: Array.isArray(prev.strengths) ? [...prev.strengths, newStrength.trim()] : [newStrength.trim()]
                        }));
                        setNewStrength('');
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </Box>
              </FormControl>
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
                  value={formData.additionalInfo}
                  onChange={handleChange('additionalInfo')}
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

      case 6: // Eventos Importantes da Vida
        return (
          <>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Eventos Importantes da Vida</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {formData.majorLifeEvents?.map((event, index) => (
                    <Chip
                      key={index}
                      label={event}
                      onDelete={() => {
                        setFormData(prev => ({
                          ...prev,
                          majorLifeEvents: prev.majorLifeEvents?.filter((_, i) => i !== index) || []
                        }));
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Adicionar evento importante"
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (newEvent.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          majorLifeEvents: [...(prev.majorLifeEvents || []), newEvent.trim()]
                        }));
                        setNewEvent('');
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </Box>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Estilo de Comunicação</FormLabel>
                <RadioGroup
                  value={formData.communicationStyle}
                  onChange={handleChange('communicationStyle')}
                >
                  <FormControlLabel value="assertivo" control={<Radio />} label="Assertivo" />
                  <FormControlLabel value="passivo" control={<Radio />} label="Passivo" />
                  <FormControlLabel value="agressivo" control={<Radio />} label="Agressivo" />
                  <FormControlLabel value="passivo-agressivo" control={<Radio />} label="Passivo-Agressivo" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Estilo de Apego</FormLabel>
                <RadioGroup
                  value={formData.attachmentStyle || ''}
                  onChange={handleChange('attachmentStyle')}
                >
                  <FormControlLabel value="seguro" control={<Radio />} label="Seguro" />
                  <FormControlLabel value="ansioso" control={<Radio />} label="Ansioso" />
                  <FormControlLabel value="evitativo" control={<Radio />} label="Evitativo" />
                  <FormControlLabel value="desorganizado" control={<Radio />} label="Desorganizado" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Atividades Compartilhadas</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {formData.sharedActivities.map((activity: string, index: number) => (
                    <Chip
                      key={index}
                      label={activity}
                      onDelete={() => {
                        setFormData(prev => ({
                          ...prev,
                          sharedActivities: prev.sharedActivities.filter((_: string, i: number) => i !== index)
                        }));
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Nova Atividade"
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newEvent.trim()) {
                          setFormData(prev => ({
                            ...prev,
                            sharedActivities: [...prev.sharedActivities, newEvent.trim()]
                          }));
                          setNewEvent('');
                        }
                      }
                    }}
                  />
                </Box>
              </FormControl>
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