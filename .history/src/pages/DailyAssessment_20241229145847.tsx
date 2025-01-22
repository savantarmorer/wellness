import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Slider,
  TextField,
  Typography
} from '@mui/material';
import { Layout } from '../components/Layout';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import type { DailyAssessment as DailyAssessmentType, GPTAnalysis } from '../types';
import { generateDailyInsight, generateRelationshipAnalysis, type RelationshipAnalysis } from '../services/gptService';
import { RelationshipAnalysis as RelationshipAnalysisComponent } from '../components/RelationshipAnalysis';
import { alpha } from '@mui/material/styles';
import { getRelationshipContext } from '../services/relationshipContextService';
import type { RelationshipContext } from '../types';
import { saveAnalysis } from '../services/analysisHistoryService';

const categories = [
  {
    id: 'comunicacao',
    label: 'Comunicação',
    description: 'A comunicação com seu parceiro foi aberta e clara hoje?',
    tip: 'Considere se você se sentiu ouvido e compreendido, e como foram resolvidos os conflitos.',
  },
  {
    id: 'conexaoEmocional',
    label: 'Conexão Emocional',
    description: 'Você sentiu uma conexão emocional com seu parceiro hoje?',
    tip: 'Pense na empatia, proximidade emocional e tempo de qualidade juntos.',
  },
  {
    id: 'apoioMutuo',
    label: 'Apoio Mútuo',
    description: 'Você se sentiu apoiado(a) pelo seu parceiro hoje?',
    tip: 'Considere o suporte emocional, prático ou moral recebido.',
  },
  {
    id: 'transparenciaConfianca',
    label: 'Transparência e Confiança',
    description: 'Você sentiu que houve transparência e confiança entre vocês hoje?',
    tip: 'Avalie a honestidade e abertura na comunicação.',
  },
  {
    id: 'intimidadeFisica',
    label: 'Intimidade Física',
    description: 'Você se sentiu satisfeito(a) com a intimidade física no relacionamento hoje?',
    tip: 'Inclui contato físico, beijos, abraços e intimidade sexual.',
  },
  {
    id: 'saudeMental',
    label: 'Saúde Mental e Individual',
    description: 'Como você avaliaria seu estado mental hoje?',
    tip: 'Considere seus níveis de ansiedade, estresse e bem-estar geral.',
  },
  {
    id: 'resolucaoConflitos',
    label: 'Resolução de Conflitos',
    description: 'Vocês resolveram bem os conflitos que surgiram hoje?',
    tip: 'Avalie a forma como lidaram com desacordos e tensões.',
  },
  {
    id: 'segurancaRelacionamento',
    label: 'Segurança no Relacionamento',
    description: 'Você se sentiu emocionalmente seguro(a) no relacionamento hoje?',
    tip: 'Pense se você se sentiu aceito(a) e respeitado(a).',
  },
  {
    id: 'alinhamentoObjetivos',
    label: 'Alinhamento em Objetivos',
    description: 'Vocês se sentiram alinhados em decisões e objetivos hoje?',
    tip: 'Considere o planejamento conjunto e respeito pelos valores mútuos.',
  },
  {
    id: 'satisfacaoGeral',
    label: 'Satisfação Geral',
    description: 'Quão satisfeito(a) você está com o relacionamento hoje?',
    tip: 'Faça uma avaliação geral do seu dia no relacionamento.',
  },
  {
    id: 'autocuidado',
    label: 'Autocuidado',
    description: 'Você cuidou de si mesmo hoje e contribuiu para o bem-estar do relacionamento?',
    tip: 'Avalie seu autocuidado físico e emocional.',
  },
  {
    id: 'gratidao',
    label: 'Gratidão e Reconhecimento',
    description: 'Há algo que você gostaria de agradecer ou reconhecer no seu parceiro hoje?',
    tip: 'Pense nos momentos positivos e atitudes que você aprecia.',
  },
  {
    id: 'qualidadeTempo',
    label: 'Qualidade do Tempo Juntos',
    description: 'O tempo que vocês passaram juntos hoje foi significativo?',
    tip: 'Considere a qualidade dos momentos compartilhados.',
  },
];

const convertToGPTAnalysis = (
  analysis: RelationshipAnalysis,
  userId: string,
  partnerId: string
): Omit<GPTAnalysis, 'id'> => ({
  userId,
  partnerId,
  date: new Date().toISOString(),
  analysis: {
    overallHealth: analysis.overallHealth.score,
    strengths: analysis.strengthsAndChallenges.strengths,
    challenges: analysis.strengthsAndChallenges.challenges,
    recommendations: analysis.communicationSuggestions,
    actionItems: analysis.actionItems,
    categoryAnalysis: Object.entries(analysis.categories).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: {
        score: value.score,
        trend: value.trend,
        insights: value.insights,
      },
    }), {}),
    relationshipDynamics: analysis.relationshipDynamics,
  },
  createdAt: new Date().toISOString(),
});

const DailyAssessment = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GPTAnalysis | null>(null);
  const [dailyInsight, setDailyInsight] = useState<string>('');
  const [relationshipContext, setRelationshipContext] = useState<RelationshipContext | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (!currentUser) return;

      try {
        const context = await getRelationshipContext(currentUser.uid);
        setRelationshipContext(context);
      } catch (error) {
        console.error('Error fetching relationship context:', error);
        setError('Erro ao carregar o contexto do relacionamento. Por favor, tente novamente mais tarde.');
      }
    };

    fetchContext();
  }, [currentUser]);

  useEffect(() => {
    const checkTodaySubmission = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const assessmentsRef = collection(db, 'assessments');
        const todayQuery = query(
          assessmentsRef,
          where('userId', '==', currentUser.uid),
          where('date', '>=', today.toISOString()),
          orderBy('date', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(todayQuery);
        
        if (!snapshot.empty) {
          setHasSubmittedToday(true);
          
          // Check if partner has submitted today
          if (userData?.partnerId) {
            const partnerQuery = query(
              assessmentsRef,
              where('userId', '==', userData.partnerId),
              where('date', '>=', today.toISOString()),
              orderBy('date', 'desc'),
              limit(1)
            );
            
            const partnerSnapshot = await getDocs(partnerQuery);
            
            if (!partnerSnapshot.empty) {
              setAnalysisLoading(true);
              try {
                const userAssessment = {
                  id: snapshot.docs[0].id,
                  ...snapshot.docs[0].data()
                } as DailyAssessmentType;
                
                const partnerAssessment = {
                  id: partnerSnapshot.docs[0].id,
                  ...partnerSnapshot.docs[0].data()
                } as DailyAssessmentType;

                // Check if analysis already exists for today
                const analysisRef = collection(db, 'analysisHistory');
                const analysisQuery = query(
                  analysisRef,
                  where('userId', '==', currentUser.uid),
                  where('userAssessmentId', '==', userAssessment.id),
                  where('partnerAssessmentId', '==', partnerAssessment.id),
                  limit(1)
                );
                
                const existingAnalysis = await getDocs(analysisQuery);
                
                if (!existingAnalysis.empty) {
                  // Use existing analysis
                  const analysisData = existingAnalysis.docs[0].data();
                  setAnalysis(analysisData.analysis);
                } else {
                  // Generate new analysis
                  const analysis = await generateRelationshipAnalysis(
                    userAssessment,
                    partnerAssessment,
                    relationshipContext || undefined
                  );
                  const gptAnalysisData = convertToGPTAnalysis(analysis, currentUser.uid, userData.partnerId);
                  setAnalysis({
                    id: doc(collection(db, 'gptAnalysis')).id,
                    ...gptAnalysisData
                  });

                  // Save analysis to history
                  await saveAnalysis({
                    userId: currentUser.uid,
                    partnerId: userData.partnerId,
                    date: new Date().toISOString(),
                    analysis: analysis,
                    userAssessmentId: userAssessment.id!,
                    partnerAssessmentId: partnerAssessment.id!,
                    createdAt: new Date().toISOString(),
                  });
                }
              } catch (error) {
                console.error('Error handling analysis:', error);
                setError('Erro ao processar análise do relacionamento.');
              } finally {
                setAnalysisLoading(false);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking today submission:', error);
        setError('Erro ao verificar avaliações anteriores. Por favor, tente novamente.');
      }
    };

    checkTodaySubmission();
  }, [currentUser, navigate, userData?.partnerId, relationshipContext]);

  const handleRatingChange = (category: string) => (_event: Event, value: number | number[]) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value as number,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Validate that all categories have been rated
    const missingRatings = categories.filter((category) => ratings[category.id] === undefined);
    if (missingRatings.length > 0) {
      setError(`Por favor, avalie todas as categorias: ${missingRatings.map((c) => c.label).join(', ')}`);
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Create assessment object without optional fields first
      const assessment: Partial<DailyAssessmentType> = {
        userId: currentUser.uid,
        date: new Date().toISOString(),
        ratings: {
          comunicacao: ratings.comunicacao,
          conexaoEmocional: ratings.conexaoEmocional,
          apoioMutuo: ratings.apoioMutuo,
          transparenciaConfianca: ratings.transparenciaConfianca,
          intimidadeFisica: ratings.intimidadeFisica,
          saudeMental: ratings.saudeMental,
          resolucaoConflitos: ratings.resolucaoConflitos,
          segurancaRelacionamento: ratings.segurancaRelacionamento,
          alinhamentoObjetivos: ratings.alinhamentoObjetivos,
          satisfacaoGeral: ratings.satisfacaoGeral,
          autocuidado: ratings.autocuidado,
          gratidao: ratings.gratidao,
          qualidadeTempo: ratings.qualidadeTempo,
        },
        comments,
      };

      // Only add optional fields if they exist
      if (userData?.partnerId) {
        assessment.partnerId = userData.partnerId;
      }
      if (gratitude) {
        assessment.gratitude = gratitude;
      }

      // Save assessment
      const assessmentRef = await addDoc(collection(db, 'assessments'), assessment);
      const savedAssessment = { ...assessment, id: assessmentRef.id } as DailyAssessmentType;

      // Generate individual analysis first
      try {
        const insight = await generateDailyInsight(
          savedAssessment,
          relationshipContext || undefined
        );
        setDailyInsight(insight);

        // Save individual analysis
        const individualAnalysis = {
          userId: currentUser.uid,
          partnerId: userData?.partnerId,
          date: new Date().toISOString(),
          type: 'individual',
          assessmentId: assessmentRef.id,
          insight,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'analysisHistory'), individualAnalysis);

        // Check if partner has submitted today and generate combined analysis if they have
        if (userData?.partnerId) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const partnerQuery = query(
            collection(db, 'assessments'),
            where('userId', '==', userData.partnerId),
            where('date', '>=', today.toISOString()),
            orderBy('date', 'desc'),
            limit(1)
          );
          
          const partnerSnapshot = await getDocs(partnerQuery);
          
          if (!partnerSnapshot.empty) {
            const partnerAssessment = {
              id: partnerSnapshot.docs[0].id,
              ...partnerSnapshot.docs[0].data()
            } as DailyAssessmentType;

            // Generate combined analysis
            const analysis = await generateRelationshipAnalysis(
              savedAssessment,
              partnerAssessment,
              relationshipContext || undefined
            );

            const gptAnalysisData = convertToGPTAnalysis(analysis, currentUser.uid, userData.partnerId);
            
            // Save combined analysis
            await saveAnalysis({
              userId: currentUser.uid,
              partnerId: userData.partnerId,
              date: new Date().toISOString(),
              type: 'combined',
              analysis: analysis,
              userAssessmentId: savedAssessment.id!,
              partnerAssessmentId: partnerAssessment.id!,
              createdAt: new Date().toISOString(),
            });

            setAnalysis(gptAnalysisData);
          }
        }
      } catch (error) {
        console.error('Error generating analysis:', error);
      }

      setSuccess('Avaliação enviada com sucesso!');
      
      // Reset form
      setRatings({});
      setComments('');
      setGratitude('');
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Erro ao enviar avaliação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (hasSubmittedToday) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
              Avaliação Diária
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Você já completou sua avaliação hoje. Volte amanhã para uma nova avaliação!
            </Alert>
            
            {dailyInsight && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  background: (theme) => alpha(theme.palette.background.paper, 0.4),
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: '24px',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Insight do Dia
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {dailyInsight}
                </Typography>
              </Paper>
            )}
            
            {analysisLoading && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Gerando análise do relacionamento...
                </Typography>
                <LinearProgress />
              </Box>
            )}
            
            {analysis && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Análise do Relacionamento
                </Typography>
                <RelationshipAnalysisComponent analysis={analysis} />
              </Box>
            )}
            
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              sx={{ mt: 2 }}
            >
              Voltar ao Dashboard
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ 
          mt: { xs: 2, sm: 4 },
          mb: { xs: 4, sm: 6 }
        }}>
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

          {hasSubmittedToday ? (
            <>
              <Typography variant="h5" gutterBottom align="center">
                Avaliação de Hoje
              </Typography>
              
              {analysisLoading ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  my: 4 
                }}>
                  <CircularProgress />
                  <Typography>Gerando análise do relacionamento...</Typography>
                </Box>
              ) : analysis ? (
                <RelationshipAnalysisComponent analysis={analysis} />
              ) : (
                <Typography align="center" color="text.secondary">
                  Aguardando a avaliação do seu parceiro para gerar a análise.
                </Typography>
              )}
            </>
          ) : (
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 4,
                background: (theme) => alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <Typography variant="h5" gutterBottom align="center">
                Avaliação Diária
              </Typography>

              <Typography variant="body1" color="text.secondary" paragraph align="center">
                Como foi seu dia no relacionamento? Avalie os aspectos abaixo.
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                {categories.map((category) => (
                  <Box key={category.id} sx={{ mb: { xs: 3, sm: 4 } }}>
                    <Typography variant="h6" gutterBottom>
                      {category.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {category.description}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2, 
                        fontStyle: 'italic',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      {category.tip}
                    </Typography>
                    <Slider
                      value={ratings[category.id] || 1}
                      onChange={handleRatingChange(category.id)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      sx={{
                        '& .MuiSlider-markLabel': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Comentários Adicionais"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Gratidão e Reconhecimento"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ 
                    mt: 2,
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '1rem', sm: '1.1rem' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Enviar Avaliação'}
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default DailyAssessment; 