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
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  DyadicAdjustmentScale,
  GottmanMetrics,
  ValidatedScales,
  AttachmentStyle,
  ValidatedScaleAssessmentData,
  AssessmentType,
  AssessmentMetadata
} from '../types';
import { saveAssessment } from '../services/assessmentService';
import { useNavigate } from 'react-router-dom';

const SCALE_TOOLTIPS = {
  das: {
    consenso: 'Como vocês tomam decisões juntos sobre assuntos importantes do dia a dia? (ex: finanças, tempo livre, amizades)',
    satisfacao: 'Qual seu nível de satisfação com as interações diárias e momentos que passam juntos?',
    coesao: 'Com que frequência vocês compartilham atividades e conversas significativas?',
    expressaoAfetiva: 'Como está a demonstração de carinho, afeto e intimidade entre vocês?'
  },
  gottman: {
    fourHorsemen: {
      critica: 'Com que frequência seu parceiro(a) critica seu jeito de ser, em vez de falar sobre uma situação específica?\n\nExemplo: Quando seu parceiro(a) diz "Você sempre é assim" em vez de "Essa situação me incomodou"',
      defensividade: 'Quando você traz uma preocupação, com que frequência seu parceiro(a) se defende ou contra-ataca em vez de ouvir e tentar entender?\n\nExemplo: Seu parceiro(a) responde "Mas você também faz isso!" em vez de tentar entender seu ponto de vista',
      desprezo: 'Com que frequência seu parceiro(a) demonstra desprezo através de sarcasmo, ironia ou gestos de desrespeito?\n\nExemplos: Revirar os olhos quando você fala, fazer comentários zombeteiros, usar tom de voz condescendente',
      stonewalling: 'Quando há um conflito, com que frequência seu parceiro(a) se fecha completamente, para de responder ou sai da situação sem acordo?\n\nExemplo: Dar "gelo", se recusar a conversar, sair no meio de uma discussão importante'
    },
    bidsForConnection: {
      tentativas: 'Com que frequência seu parceiro(a) tenta criar momentos de conexão com você?\n\nExemplos:\n- Compartilha coisas do dia dele(a)\n- Pede sua opinião\n- Mostra algo interessante\n- Busca proximidade física',
      respostasPositivas: 'Quando você tenta se conectar, com que frequência seu parceiro(a) responde com interesse e entusiasmo genuínos?\n\nExemplo: Para o que está fazendo, demonstra interesse real, faz perguntas sobre o que você compartilhou',
      respostasNegativas: 'Quando você tenta criar conexão, com que frequência seu parceiro(a) ignora ou responde com irritação?\n\nExemplos:\n- Te ignora completamente\n- Responde com hostilidade\n- Faz pouco caso do que você diz',
      respostasNeutras: 'Quando você busca conexão, com que frequência seu parceiro(a) responde de forma automática, sem real engajamento?\n\nExemplos:\n- Responde com "uhum" sem olhar\n- Dá respostas curtas e desinteressadas\n- Continua no celular enquanto você fala'
    },
    reparacao: 'Após um conflito, qual a capacidade do seu parceiro(a) de fazer reparações e retomar o diálogo de forma construtiva?\n\nExemplos:\n- Pede desculpas sinceras\n- Reconhece os próprios erros\n- Propõe soluções\n- Demonstra vontade de melhorar',
    influenciaPositiva: 'Para um relacionamento saudável, é importante ter mais interações positivas do que negativas. O ideal é ter 5 interações positivas para cada negativa.\n\nExemplos positivos:\n- Demonstrações de afeto\n- Palavras de apreciação\n- Gestos de cuidado\n- Momentos de diversão juntos'
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

  useEffect(() => {
    console.log('RelationshipPatterns mounted', { currentUser, userData });
  }, [currentUser, userData]);

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

  const updateGottmanMetrics = (
    category: 'fourHorsemen' | 'bidsForConnection' | 'reparacao',
    field: string,
    value: number
  ) => {
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

      let updatedGottman: GottmanMetrics;

      if (category === 'fourHorsemen') {
        updatedGottman = {
          ...currentGottman,
          fourHorsemen: {
            ...currentGottman.fourHorsemen,
            [field]: value
          }
        };
      } else if (category === 'bidsForConnection') {
        updatedGottman = {
          ...currentGottman,
          bidsForConnection: {
            ...currentGottman.bidsForConnection,
            [field]: value
          }
        };
      } else {
        updatedGottman = {
          ...currentGottman,
          [field]: value
        };
      }

      return {
        ...prev,
        gottman: updatedGottman
      };
    });
  };

  const handleSave = async () => {
    if (!currentUser || !userData?.partnerId) {
      setError('Dados do usuário não encontrados. Por favor, faça login novamente.');
      return;
    }

    // Validate Gottman metrics
    const fourHorsemenValues = Object.values(validatedScales.gottman.fourHorsemen);
    const bidsValues = Object.values(validatedScales.gottman.bidsForConnection);
    
    if (fourHorsemenValues.some(value => value === 0)) {
      setError('Por favor, preencha todas as questões da seção "Os Quatro Cavaleiros"');
      return;
    }

    if (bidsValues.some(value => value === 0)) {
      setError('Por favor, preencha todas as questões da seção "Tentativas de Conexão"');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const metadata: AssessmentMetadata = {
        assessmentType: 'gottman_metrics',
        assessmentName: 'Métricas de Gottman',
        assessmentCount: 1,
        timeSpan: '1 week',
        confidence: 0.9,
        lastUpdate: new Date().toISOString(),
        description: 'Avaliação dos padrões de comunicação e conexão emocional baseada nas métricas de Gottman',
        category: 'relationship_patterns',
        version: '1.0'
      };

      const assessmentData: ValidatedScaleAssessmentData = {
        id: `gottman_metrics_${new Date().getTime()}`,
        userId: currentUser.uid,
        partnerId: userData.partnerId,
        date: new Date().toISOString(),
        type: 'gottman_metrics' as AssessmentType,
        emotionalSecurity: validatedScales.gottman?.resolucaoConflitos || 0,
        intimacy: validatedScales.gottman?.bidsForConnection?.respostasPositivas || 0,
        communication: validatedScales.gottman?.resolucaoConflitos || 0,
        trust: validatedScales.gottman?.significadoCompartilhado || 0,
        mood: {
          primary: 'neutral',
          intensity: 3
        },
        validatedScales: {
          ...validatedScales,
          das: {
            consenso: validatedScales.gottman?.significadoCompartilhado || 0,
            satisfacao: validatedScales.gottman?.bidsForConnection?.respostasPositivas || 0,
            coesao: validatedScales.gottman?.resolucaoConflitos || 0,
            expressaoAfetiva: validatedScales.gottman?.bidsForConnection?.tentativas || 0,
            total: 0
          }
        },
        ratings: {
          satisfacaoGeral: validatedScales.gottman?.bidsForConnection?.respostasPositivas || 0,
          alinhamentoObjetivos: validatedScales.gottman?.significadoCompartilhado || 0,
          conexaoEmocional: validatedScales.gottman?.bidsForConnection?.tentativas || 0,
          apoioMutuo: validatedScales.gottman?.bidsForConnection?.respostasPositivas || 0,
          segurancaRelacionamento: validatedScales.gottman?.resolucaoConflitos || 0,
          comunicacao: validatedScales.gottman?.resolucaoConflitos || 0,
          intimidade: validatedScales.gottman?.bidsForConnection?.tentativas || 0,
          resolucaoConflitos: validatedScales.gottman?.resolucaoConflitos || 0,
          transparenciaConfianca: validatedScales.gottman?.significadoCompartilhado || 0,
          intimidadeFisica: validatedScales.gottman?.bidsForConnection?.tentativas || 0,
          saudeMental: validatedScales.gottman?.reparacao || 0,
          autocuidado: validatedScales.gottman?.influenciaPositiva || 0,
          gratidao: validatedScales.gottman?.bidsForConnection?.respostasPositivas || 0,
          qualidadeTempo: validatedScales.gottman?.bidsForConnection?.tentativas || 0
        },
        createdAt: new Date().toISOString(),
        metadata,
        timestamp: new Date().toISOString()
      };

      // Calculate DAS total
      assessmentData.validatedScales.das.total = 
        assessmentData.validatedScales.das.consenso +
        assessmentData.validatedScales.das.satisfacao +
        assessmentData.validatedScales.das.coesao +
        assessmentData.validatedScales.das.expressaoAfetiva;

      await saveAssessment(currentUser.uid, userData.partnerId, assessmentData);
      setSuccess('Métricas de Gottman salvas com sucesso!');
      setTimeout(() => {
        setSuccess('');
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error saving Gottman metrics:', err);
      setError('Erro ao salvar as métricas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Avaliação dos Padrões do Relacionamento
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBackIcon />}
            >
              Voltar ao Dashboard
            </Button>
          </Box>

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

          {/* Introduction Section */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="body1" gutterBottom>
              Esta avaliação ajuda a identificar padrões importantes no seu relacionamento, baseados nas pesquisas do Dr. John Gottman. São dois aspectos principais:
            </Typography>
            <Box sx={{ pl: 2, mt: 2 }}>
              <Typography variant="body1" component="div" gutterBottom>
                1. <strong>Os Quatro Cavaleiros</strong> - Padrões negativos de comunicação que podem prejudicar o relacionamento
              </Typography>
              <Typography variant="body1" component="div" gutterBottom>
                2. <strong>Tentativas de Conexão</strong> - Como vocês mantêm a conexão emocional no dia a dia
              </Typography>
            </Box>
          </Paper>

          {/* Four Horsemen Section */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Os Quatro Cavaleiros
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
              Avalie a frequência destes comportamentos do seu parceiro(a) na última semana:
            </Typography>

            {(Object.keys(SCALE_TOOLTIPS.gottman.fourHorsemen) as FourHorsemenField[]).map((field) => (
              <Box key={field} sx={{ mb: 4, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Typography>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Como identificar:</Typography>
                        <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
                          {field === 'critica' && "Seu parceiro(a) ataca seu caráter ou personalidade em vez de falar sobre um comportamento específico. Usa palavras como 'sempre' ou 'nunca'."}
                          {field === 'defensividade' && "Seu parceiro(a) contra-ataca em vez de ouvir, se faz de vítima, nega responsabilidade ou usa 'mas' para justificar."}
                          {field === 'desprezo' && "Seu parceiro(a) demonstra superioridade moral, usa sarcasmo ou ironia, faz gestos de desprezo como revirar os olhos."}
                          {field === 'stonewalling' && "Seu parceiro(a) se isola emocionalmente, dá respostas curtas e frias, sai no meio de conversas importantes."}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>Como isso afeta você:</Typography>
                        <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
                          {field === 'critica' && "Pode diminuir sua autoestima e gerar ressentimento, fazendo você se sentir inadequado(a) ou não aceito(a)."}
                          {field === 'defensividade' && "Pode fazer você se sentir não ouvido(a) e invalidado(a), gerando frustração e distanciamento."}
                          {field === 'desprezo' && "Pode ferir profundamente sua autoestima e senso de valor, corroendo o respeito mútuo."}
                          {field === 'stonewalling' && "Pode gerar sensação de rejeição, solidão e abandono emocional."}
                        </Typography>
                      </Box>
                    }
                    placement="right"
                  >
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 0.5 }}>
                  {SCALE_TOOLTIPS.gottman.fourHorsemen[field].split('\n\n')[0]}
                </Typography>
                <Slider
                  value={Number(validatedScales.gottman?.fourHorsemen?.[field]) || 0}
                  onChange={(_, value) => updateGottmanMetrics('fourHorsemen', field, value as number)}
                  min={0}
                  max={10}
                  marks={[
                    { value: 0, label: 'Nunca' },
                    { value: 5, label: 'Às vezes' },
                    { value: 10, label: 'Frequentemente' }
                  ]}
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>
            ))}
          </Paper>

          {/* Bids for Connection Section */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Tentativas de Conexão
              </Typography>
              {validatedScales.gottman?.bidsForConnection && (
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
              Avalie como seu parceiro(a) responde às tentativas de conexão:
            </Typography>

            {Object.entries(SCALE_TOOLTIPS.gottman.bidsForConnection).map(([field, tooltip]) => (
              <Box key={field} sx={{ mb: 4, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Typography>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Como isso afeta o relacionamento:</Typography>
                        <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
                          {field === 'tentativas' && "Quando seu parceiro(a) faz poucas tentativas de conexão, você pode se sentir sozinho(a) e desconectado(a) emocionalmente."}
                          {field === 'respostasPositivas' && "Respostas positivas do seu parceiro(a) fortalecem sua confiança e disposição para compartilhar."}
                          {field === 'respostasNegativas' && "Respostas negativas frequentes podem fazer você se retrair e parar de tentar se conectar."}
                          {field === 'respostasNeutras' && "Respostas desinteressadas podem ser tão prejudiciais quanto as negativas, gerando sensação de insignificância."}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>O que você pode fazer:</Typography>
                        <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
                          {field === 'tentativas' && "- Comunique sua necessidade de mais conexão\n- Sugira atividades conjuntas\n- Elogie quando seu parceiro(a) toma iniciativa\n- Estabeleça momentos dedicados à conexão"}
                          {field === 'respostasPositivas' && "- Reconheça e agradeça as respostas positivas\n- Compartilhe como isso te faz bem\n- Reforce esse comportamento\n- Mantenha-se vulnerável"}
                          {field === 'respostasNegativas' && "- Converse sobre como isso te afeta\n- Escolha bons momentos para conexão\n- Busque entender os motivos\n- Considere terapia de casal"}
                          {field === 'respostasNeutras' && "- Expresse sua necessidade de atenção plena\n- Sugira momentos sem distrações\n- Seja específico sobre o que precisa\n- Valorize os momentos de conexão real"}
                        </Typography>
                      </Box>
                    }
                    placement="right"
                  >
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 0.5 }}>
                  {tooltip.split('\n\n')[0]}
                </Typography>
                <Slider
                  value={Number(validatedScales.gottman?.bidsForConnection?.[field as keyof typeof validatedScales.gottman.bidsForConnection]) || 0}
                  onChange={(_, value) => updateGottmanMetrics('bidsForConnection', field, value as number)}
                  min={0}
                  max={10}
                  marks={[
                    { value: 0, label: 'Nunca' },
                    { value: 5, label: 'Às vezes' },
                    { value: 10, label: 'Frequentemente' }
                  ]}
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>
            ))}
          </Paper>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ minWidth: 200 }}
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