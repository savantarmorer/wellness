import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Slider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Info as InfoIcon,
  Check as CheckIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  DyadicAdjustmentScale,
  GottmanMetrics,
  ValidatedScales,
  AttachmentStyle
} from '../types';
import { saveAssessment } from '../services/assessmentService';

const SCALE_TOOLTIPS = {
  das: {
    consenso: 'Como vocês lidam com decisões importantes juntos? (ex: dinheiro, tempo livre, amizades)',
    satisfacao: 'O quanto você está feliz com as interações diárias e momentos juntos?',
    coesao: 'Vocês compartilham atividades e conversas interessantes?',
    expressaoAfetiva: 'Como está a demonstração de carinho e intimidade entre vocês?'
  },
  gottman: {
    fourHorsemen: {
      critica: 'Você criticou a personalidade do seu parceiro ao invés de falar sobre uma situação específica?',
      defensividade: 'Você se defendeu ou contra-atacou ao invés de ouvir e dialogar?',
      desprezo: 'Houve momentos de sarcasmo, ironia ou desrespeito na comunicação?',
      stonewalling: 'Você ou seu parceiro se fecharam ou se isolaram durante conflitos?'
    },
    bidsForConnection: {
      tentativas: 'Quantas vezes você tentou criar momentos de conexão hoje? (ex: compartilhar algo interessante, buscar atenção)',
      respostasPositivas: 'Quando seu parceiro tentou se conectar, você respondeu com entusiasmo?',
      respostasNegativas: 'Você ignorou ou respondeu negativamente às tentativas de conexão?',
      respostasNeutras: 'Você respondeu sem muito interesse às tentativas de conexão?'
    }
  }
};

const SCALE_RANGES = {
  das: {
    consenso: {
      concerning: { min: 0, max: 30 },
      moderate: { min: 31, max: 45 },
      healthy: { min: 46, max: 65 }
    },
    satisfacao: {
      concerning: { min: 0, max: 20 },
      moderate: { min: 21, max: 35 },
      healthy: { min: 36, max: 50 }
    },
    coesao: {
      concerning: { min: 0, max: 10 },
      moderate: { min: 11, max: 17 },
      healthy: { min: 18, max: 24 }
    },
    expressaoAfetiva: {
      concerning: { min: 0, max: 5 },
      moderate: { min: 6, max: 8 },
      healthy: { min: 9, max: 12 }
    }
  }
};

type FourHorsemenField = keyof GottmanMetrics['fourHorsemen'];

const RelationshipPatterns: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [validatedScales, setValidatedScales] = useState<ValidatedScales>({
    consistency: {
      default: {
        score: 0.8,
        confidence: 0.9,
        flags: []
      }
    },
    reliability: 0.85,
    completeness: 0.9,
    recommendations: [],
    isValid: true,
    errors: [],
    das: {
      consenso: 0,
      satisfacao: 0,
      coesao: 0,
      expressaoAfetiva: 0,
      total: 0
    },
    csi: {
      satisfacaoGlobal: 0,
      estabilidade: 0,
      comprometimento: 0,
      comunicacao: 0,
      gestaoConflitos: 0,
      atividadesCompartilhadas: 0,
      total: 0
    },
    gottman: {
      fourHorsemen: {
        critica: 0,
        defensividade: 0,
        desprezo: 0,
        stonewalling: 0
      },
      bidsForConnection: {
        tentativas: 0,
        respostasPositivas: 0,
        respostasNegativas: 0,
        respostasNeutras: 0
      },
      resolucaoConflitos: 0,
      significadoCompartilhado: 0,
      reparacao: 0,
      influenciaPositiva: 0
    },
    attachment: {
      ecr: {
        ansiedade: 0,
        evitacao: 0,
        anxiety: 0,
        avoidance: 0
      },
      securityLevel: 0,
      attachmentStyle: {
        primary: 'secure',
        description: 'Secure attachment style',
        recommendations: ['Continue fostering trust and open communication']
      },
      padraoApego: {
        primary: 'secure',
        description: 'Padrão de apego seguro',
        recommendations: ['Manter comunicação aberta e confiança']
      },
      compatibilidadeApego: 0
    }
  });

  const updateDAS = (field: keyof DyadicAdjustmentScale, value: number) => {
    setValidatedScales(prev => {
      const newDAS: DyadicAdjustmentScale = {
        consenso: prev.das?.consenso ?? 0,
        satisfacao: prev.das?.satisfacao ?? 0,
        coesao: prev.das?.coesao ?? 0,
        expressaoAfetiva: prev.das?.expressaoAfetiva ?? 0,
        total: prev.das?.total ?? 0,
        [field]: value
      };

      // Update total
      newDAS.total = newDAS.consenso + newDAS.satisfacao + newDAS.coesao + newDAS.expressaoAfetiva;

      return {
        ...prev,
        das: newDAS
      };
    });
  };

  const updateGottmanMetrics = (field: FourHorsemenField, value: number) => {
    setValidatedScales(prev => {
      const currentGottman = prev.gottman || {
        fourHorsemen: {
          critica: 0,
          defensividade: 0,
          desprezo: 0,
          stonewalling: 0
        },
        bidsForConnection: {
          tentativas: 0,
          respostasPositivas: 0,
          respostasNegativas: 0,
          respostasNeutras: 0
        },
        reparacao: 0,
        influenciaPositiva: 0,
        resolucaoConflitos: 0,
        significadoCompartilhado: 0
      };

      return {
        ...prev,
        gottman: {
          ...currentGottman,
          fourHorsemen: {
            ...currentGottman.fourHorsemen,
            [field]: value
          }
        }
      };
    });
  };

  const handleSave = async () => {
    if (!currentUser || !userData?.partnerId) return;

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      await saveAssessment(currentUser.uid, userData.partnerId, {
        validatedScales,
        timestamp: new Date().toISOString()
      });
      setSuccess('Avaliação salva com sucesso!');
    } catch (err) {
      console.error('Error saving assessment:', err);
      setError('Erro ao salvar a avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Padrões do Relacionamento
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Communication Patterns Section */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Padrões de Comunicação
              </Typography>
              {validatedScales.gottman?.fourHorsemen && (
                <Chip
                  icon={<CheckIcon />}
                  label="Respondido"
                  color="success"
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Avalie os padrões de comunicação no seu relacionamento:
            </Typography>

            {(Object.keys(SCALE_TOOLTIPS.gottman.fourHorsemen) as FourHorsemenField[]).map((field) => (
              <Box key={field} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">
                    {SCALE_TOOLTIPS.gottman.fourHorsemen[field]}
                  </Typography>
                  <Tooltip title="Avalie de 0 (nunca) a 10 (frequentemente)">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Slider
                  value={Number(validatedScales.gottman?.fourHorsemen?.[field]) || 0}
                  onChange={(_, value) => updateGottmanMetrics(field, value as number)}
                  min={0}
                  max={10}
                  marks={[
                    { value: 0, label: 'Nunca' },
                    { value: 5, label: 'Às vezes' },
                    { value: 10, label: 'Frequente' }
                  ]}
                />
              </Box>
            ))}
          </Paper>

          {/* Relationship Satisfaction Section */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Satisfação no Relacionamento
              </Typography>
              {validatedScales.das && Object.values(validatedScales.das).some(value => value > 0) && (
                <Chip
                  icon={<CheckIcon />}
                  label="Respondido"
                  color="success"
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Como você avalia os seguintes aspectos:
            </Typography>

            <Grid container spacing={3}>
              {Object.entries(SCALE_TOOLTIPS.das).map(([field, tooltip]) => (
                <Grid item xs={12} sm={6} key={field}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">{tooltip}</Typography>
                    </Box>
                    <Slider
                      value={Number(validatedScales.das?.[field as keyof DyadicAdjustmentScale]) || 0}
                      onChange={(_, value) => updateDAS(field as keyof DyadicAdjustmentScale, value as number)}
                      min={0}
                      max={SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].healthy.max}
                      marks={[
                        { value: 0, label: 'Precisa melhorar' },
                        { value: SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].moderate.max, label: 'Moderado' },
                        { value: SCALE_RANGES.das[field as keyof typeof SCALE_RANGES.das].healthy.max, label: 'Ótimo' }
                      ]}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default RelationshipPatterns; 