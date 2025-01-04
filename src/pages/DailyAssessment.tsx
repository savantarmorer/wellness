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
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import {
  MoodEntry,
  MoodType,
  DailyAssessment as DailyAssessmentType,
  RelationshipContext,
  CategoryRatings,
  RelationshipAnalysis,
  GPTAnalysis,
  GPTRelationshipAnalysis,
  UnifiedAnalysis,
  MoodAnalysis
} from '../types/index';
import { generateDailyInsight } from '../services/gptService';
import { alpha } from '@mui/material/styles';
import { getRelationshipContext } from '../services/relationshipContextService';
import { AnalysisTabs } from '../components/AnalysisTabs';
import { MoodTracker } from '../components/MoodTracker';
import { getUserMoodEntries, analyzeMoodPatterns } from '../services/moodService';
import { analyzeRelationshipEmotions } from '../services/relationshipAnalysisService';

interface Category {
  id: keyof CategoryRatings;
  label: string;
  description: string;
  tip: string;
}

const categories: Category[] = [
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

const generateAnalysisId = () => `gpt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const convertToGPTAnalysis = (
  analysis: GPTRelationshipAnalysis,
  userId: string,
  partnerId: string,
  analysisType: 'individual' | 'collective'
): GPTAnalysis => ({
  id: generateAnalysisId(),
  userId,
  partnerId,
  date: new Date().toISOString(),
  type: analysisType,
  analysis,
  createdAt: new Date().toISOString()
});

export const DailyAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [relationshipContext, setRelationshipContext] = useState<RelationshipContext | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [partnerMoodEntries, setPartnerMoodEntries] = useState<MoodEntry[]>([]);
  const [unifiedAnalysis, setUnifiedAnalysis] = useState<UnifiedAnalysis>({
    gptAnalysis: null,
    relationshipAnalysis: null,
    moodAnalysis: null
  });
  const [ratings, setRatings] = useState<CategoryRatings>({
    comunicacao: 0,
    conexaoEmocional: 0,
    apoioMutuo: 0,
    transparenciaConfianca: 0,
    intimidadeFisica: 0,
    saudeMental: 0,
    resolucaoConflitos: 0,
    segurancaRelacionamento: 0,
    alinhamentoObjetivos: 0,
    satisfacaoGeral: 0,
    autocuidado: 0,
    gratidao: 0,
    qualidadeTempo: 0
  });
  const [comments, setComments] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [dailyInsight, setDailyInsight] = useState('');

  useEffect(() => {
    const fetchMoodEntries = async () => {
      if (!currentUser) return;
      try {
        const entries = await getUserMoodEntries(currentUser.uid);
        setMoodEntries(entries);
        const moodAnalysisResult = await analyzeMoodPatterns(entries, 'daily');
        const context = await getRelationshipContext(currentUser.uid);
        if (context) {
          setRelationshipContext(context as RelationshipContext);
        }
        
        if (context?.partnerId) {
          const partnerEntries = await getUserMoodEntries(context.partnerId);
          setPartnerMoodEntries(partnerEntries);
          const relationshipEmotions = await analyzeRelationshipEmotions(entries, partnerEntries);
          setUnifiedAnalysis(prev => ({
            ...prev,
            relationshipAnalysis: relationshipEmotions
          } as UnifiedAnalysis));
        }

        if (moodAnalysisResult) {
          setUnifiedAnalysis(prev => ({
            ...prev,
            moodAnalysis: moodAnalysisResult
          } as UnifiedAnalysis));
        }
      } catch (err) {
        console.error('Error fetching mood entries:', err);
        setError('Failed to fetch mood entries');
      }
    };
    fetchMoodEntries();
  }, [currentUser]);

  const handleMoodUpdate = (newEntry: MoodEntry) => {
    setMoodEntries(prev => [...prev, newEntry]);
  };

  const handleRatingChange = (category: keyof CategoryRatings) => (_event: Event, value: number | number[]) => {
    if (typeof value === 'number') {
      setRatings(prev => ({
        ...prev,
        [category]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const assessment: DailyAssessmentType = {
        userId: currentUser.uid,
        partnerId: userData?.partnerId || '',
        date: new Date().toISOString(),
        ratings,
        comments,
        gratitude,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'dailyAssessments'), assessment);
      setSuccess('Avaliação enviada com sucesso!');
      setHasSubmittedToday(true);
      
      // Reset form
      setRatings({
        comunicacao: 0,
        conexaoEmocional: 0,
        apoioMutuo: 0,
        transparenciaConfianca: 0,
        intimidadeFisica: 0,
        saudeMental: 0,
        resolucaoConflitos: 0,
        segurancaRelacionamento: 0,
        alinhamentoObjetivos: 0,
        satisfacaoGeral: 0,
        autocuidado: 0,
        gratidao: 0,
        qualidadeTempo: 0
      });
      setComments('');
      setGratitude('');
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
          <Box sx={{ mt: { xs: 2, sm: 4 } }}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
                mb: { xs: 2, sm: 3 }
              }}
            >
              Avaliação Diária
            </Typography>

            <MoodTracker onMoodUpdate={handleMoodUpdate} />

            <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
              Você já completou sua avaliação hoje. Volte amanhã para uma nova avaliação!
            </Alert>

            <Box sx={{ mt: 4 }}>
              <AnalysisTabs 
                analysis={unifiedAnalysis.gptAnalysis}
                relationshipContext={relationshipContext}
                dailyInsight={dailyInsight}
                moodAnalysis={unifiedAnalysis.moodAnalysis || undefined}
                relationshipAnalysis={unifiedAnalysis.relationshipAnalysis || undefined}
              />
            </Box>
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

          <MoodTracker onMoodUpdate={handleMoodUpdate} />

          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, sm: 4 },
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              align="center"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                mb: { xs: 2, sm: 3 }
              }}
            >
              Avaliação Diária
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              paragraph 
              align="center"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                mb: { xs: 2, sm: 3 }
              }}
            >
              Como foi seu dia no relacionamento? Avalie os aspectos abaixo.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {categories.map((category) => (
                <Box key={category.id} sx={{ mb: { xs: 3, sm: 4 }, width: '100%' }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      fontSize: { xs: '1.125rem', sm: '1.25rem' }
                    }}
                  >
                    {category.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {category.description}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      fontStyle: 'italic',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {category.tip}
                  </Typography>
                  <Box sx={{ px: { xs: 1, sm: 2 }, width: '100%' }}>
                    <Slider
                      value={ratings[category.id] || 1}
                      onChange={handleRatingChange(category.id)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      sx={{
                        width: '100%',
                        '& .MuiSlider-markLabel': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        },
                        '& .MuiSlider-valueLabel': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        },
                        mt: { xs: 1, sm: 2 },
                        mb: { xs: 1, sm: 2 }
                      }}
                    />
                  </Box>
                  <Divider sx={{ mt: { xs: 1, sm: 2 } }} />
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
                  mb: { xs: 2, sm: 3 },
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1, sm: 2 },
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
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
                  mb: { xs: 2, sm: 3 },
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1, sm: 2 },
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ 
                  mt: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Enviar Avaliação'}
              </Button>
            </Box>
          </Paper>

          <Box sx={{ mt: 4 }}>
            <AnalysisTabs 
              analysis={unifiedAnalysis.gptAnalysis}
              relationshipContext={relationshipContext}
              dailyInsight={dailyInsight}
              moodAnalysis={unifiedAnalysis.moodAnalysis || undefined}
              relationshipAnalysis={unifiedAnalysis.relationshipAnalysis || undefined}
            />
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default DailyAssessment; 