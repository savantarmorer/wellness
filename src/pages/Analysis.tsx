import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Paper, CircularProgress, alpha, IconButton, Stack } from '@mui/material';
import { Layout } from '../components/Layout';
import { AnalysisTabs } from '../components/AnalysisTabs';
import { useAuth } from '../contexts/AuthContext';
import type { 
  GPTAnalysis, 
  RelationshipAnalysis, 
  MoodAnalysis, 
  UnifiedAnalysis, 
  DailyAssessment, 
  ConsensusFormData, 
  MoodEntry, 
  ValidatedScalesAnalysis, 
  ClinicalSignificance, 
  AttachmentAnalysis,
  MoodType,
  ComprehensiveAnalysis,
  ValidatedScales,
  EmotionalDynamics,
  TemporalAnalysis,
  CommunicationPatterns,
  CategoryRatings
} from '../types';
import { ArrowBack, ArrowForwardIos } from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RelationshipOrchestrator } from '../services/relationshipOrchestratorNew';
import { getRelationshipContext } from '../services/relationshipContextService';
import { analyzeMoodPatterns } from '../services/moodService';
import { analyzeTemporalPatterns } from '../services/analysisUtils';
import { analyzeAttachmentDynamics } from '../services/psychologicalAnalysisService';

const Analysis = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unifiedAnalysis, setUnifiedAnalysis] = useState<UnifiedAnalysis | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    console.log('[Analysis] Component mounted with:', {
      currentUser: currentUser?.uid,
      hasUserData: !!userData,
      selectedDate: selectedDate.toISOString()
    });
  }, []);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    console.log('[Analysis] Changed to previous day:', newDate.toISOString());
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
      console.log('[Analysis] Changed to next day:', newDate.toISOString());
    }
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!currentUser?.uid || !userData) {
        console.log('[Analysis] Missing user data:', { currentUser: !!currentUser, userData: !!userData });
        return;
      }

      console.log('[Analysis] User data:', {
        hasRelationshipContext: !!userData.relationshipContext,
        relationshipContextData: userData.relationshipContext
      });

      setLoading(true);
      try {
        console.log('[Analysis] Fetching data for date:', selectedDate.toISOString());
        
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch relationship context first
        const relationshipContext = await getRelationshipContext(currentUser.uid);
        console.log('[Analysis] Fetched relationship context:', {
          hasContext: !!relationshipContext,
          contextData: relationshipContext
        });

        if (!relationshipContext) {
          console.log('[Analysis] No relationship context found');
          setUnifiedAnalysis(null);
          setLoading(false);
          return;
        }

        // Store the context in userData if it's not already there
        if (!userData.relationshipContext) {
          userData.relationshipContext = relationshipContext;
        }

        // Fetch daily assessments from both collections
        const [
          userHistoricalAssessments,
          moodEntries,
          consensusForms,
          partnerAssessment,
          partnerHistoricalAssessments,
          partnerMoodEntries
        ] = await Promise.all([
          // Historical assessments
          getDocs(query(
            collection(db, 'assessments'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as DailyAssessment)),

          // Mood entries
          getDocs(query(
            collection(db, 'moodEntries'),
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as MoodEntry)),

          // Consensus forms
          getDocs(query(
            collection(db, 'consensusForms'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as ConsensusFormData)),

          // Partner's assessment
          getDocs(query(
            collection(db, 'assessments'),
            where('userId', '==', userData.partnerId),
            where('date', '>=', startOfDay.toISOString()),
            where('date', '<=', endOfDay.toISOString()),
            orderBy('date', 'desc'),
            limit(1)
          )).then(snapshot => snapshot.empty ? null : snapshot.docs[0].data() as DailyAssessment),

          // Partner's historical assessments
          getDocs(query(
            collection(db, 'assessments'),
            where('userId', '==', userData.partnerId),
            orderBy('date', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as DailyAssessment)),

          // Partner's mood entries
          getDocs(query(
            collection(db, 'moodEntries'),
            where('userId', '==', userData.partnerId),
            orderBy('timestamp', 'desc'),
            limit(30)
          )).then(snapshot => snapshot.docs.map(doc => doc.data() as MoodEntry))
        ]);

        if (!partnerAssessment) {
          console.log('[Analysis] No partner assessment found for the selected date');
          setUnifiedAnalysis(null);
          setLoading(false);
          return;
        }

        // Generate all analyses in parallel
        const orchestrator = new RelationshipOrchestrator();
        const context = await getRelationshipContext(currentUser.uid);
        
        if (!context) {
          console.log('[Analysis] No relationship context found');
          setUnifiedAnalysis(null);
          setLoading(false);
          return;
        }

        const [
          relationshipAnalysis,
          moodAnalysis,
          temporalAnalysis,
          attachmentAnalysis
        ] = await Promise.all([
          // Comprehensive relationship analysis
          orchestrator.generateComprehensiveAnalysis(
            currentUser.uid,
            context,
            {
              assessments: [userHistoricalAssessments[0], partnerAssessment],
              consensusForms: [],
              moodEntries: moodEntries
            }
          ),
          // Mood analysis with actual data
          analyzeMoodPatterns(moodEntries, 'daily'),
          // Temporal analysis with actual data
          analyzeTemporalPatterns(userHistoricalAssessments, partnerHistoricalAssessments),
          // Attachment analysis with context
          (() => {
            const dynamics = analyzeAttachmentDynamics(userHistoricalAssessments[0], partnerAssessment);
            const attachmentAnalysis: AttachmentAnalysis = {
              userAttachment: dynamics.user.primary,
              partnerAttachment: dynamics.partner.primary,
              compatibilityScore: dynamics.compatibility.score,
              insights: dynamics.compatibility.insights,
              validatedMetrics: {
                ecr: {
                  anxiety: 0,
                  avoidance: 0
                },
                compatibility: {
                  score: dynamics.compatibility.score,
                  analysis: '',
                  recommendations: []
                }
              }
            };
            return attachmentAnalysis;
          })()
        ]);

        // Initialize default values
        const defaultMoodFrequency: Record<MoodType, number> = {
          feliz: 0,
          animado: 0,
          grato: 0,
          calmo: 0,
          satisfeito: 0,
          amado: 0,
          ansioso: 0,
          estressado: 0,
          triste: 0,
          irritado: 0,
          frustrado: 0,
          exausto: 0,
          confuso: 0,
          solitário: 0,
          neutral: 0,
          content: 0
        };

        const defaultMoodTransitions: Record<string, number> = {};

        // Construct unified analysis
        const unifiedAnalysis = {
          gptAnalysis: {
            id: '',
            userId: currentUser?.uid || '',
            partnerId: userData?.partnerId || '',
            date: new Date().toISOString(),
            type: 'individual',
            analysis: {
              moodPatterns: {
                user: {
                  dominant: 'neutral',
                  frequency: defaultMoodFrequency,
                  transitions: defaultMoodTransitions
                },
                partner: {
                  dominant: 'neutral',
                  frequency: defaultMoodFrequency,
                  transitions: defaultMoodTransitions
                },
                overall: {
                  synchronicity: 0,
                  stability: 0,
                  variability: 0
                }
              },
              communicationMetrics: {
                quality: 0,
                frequency: 0,
                depth: 0,
                patterns: []
              },
              relationshipDynamics: {
                strengths: [],
                challenges: [],
                recommendations: []
              },
              attachmentInsights: {
                style: '',
                behaviors: [],
                triggers: [],
                suggestions: []
              }
            },
            timestamp: new Date().toISOString(),
            version: '1.0',
            metadata: {
              assessmentCount: 0,
              timeSpan: '',
              confidence: 0
            }
          },
          relationshipContext: context,
          relationshipAnalysis: relationshipAnalysis?.relationshipAnalysis,
          moodAnalysis: moodAnalysis || undefined,
          temporalAnalysis: {
            correlation: 0,
            trends: {},
            patterns: {
              cyclical: [],
              persistent: [],
              emerging: []
            },
            timeframes: {
              daily: {
                averageScores: {} as CategoryRatings,
                discrepancies: [],
                insights: [],
                confidence: 0,
                trends: {}
              },
              weekly: {
                averageScores: {} as CategoryRatings,
                discrepancies: [],
                insights: [],
                confidence: 0,
                trends: {}
              },
              monthly: {
                averageScores: {} as CategoryRatings,
                discrepancies: [],
                insights: [],
                confidence: 0,
                trends: {}
              }
            },
            seasonality: 0,
            volatility: 0,
            confidence: 0,
            analysisDate: new Date().toISOString()
          },
          attachmentAnalysis: attachmentAnalysis,
          clinicalSignificance: {
            gaps: [],
            riskFactors: [],
            protectiveFactors: [],
            recommendations: [],
            severity: 'low',
            confidence: 0
          },
          emotionalDynamics: relationshipAnalysis?.emotionalDynamics || {
            synchronicity: 0,
            stability: 0,
            emotionalSecurity: 0,
            intimacyBalance: {
              score: 0,
              areas: {
                emotional: 0,
                physical: 0,
                intellectual: 0,
                shared: 0
              }
            },
            conflictResolution: {
              style: 'collaborative',
              effectiveness: 0,
              patterns: [],
              confidence: 0
            },
            patterns: {
              user: {
                dominant: 'neutral',
                frequency: defaultMoodFrequency,
                transitions: defaultMoodTransitions
              },
              partner: {
                dominant: 'neutral',
                frequency: defaultMoodFrequency,
                transitions: defaultMoodTransitions
              }
            },
            insights: {
              strengths: [],
              challenges: [],
              recommendations: []
            }
          },
          communicationPatterns: {
            style: '',
            effectiveness: 0,
            patterns: [],
            confidence: 0
          },
          dailyInsight: '',
          stage: {
            current: '',
            nextSteps: [],
            timelineEstimate: ''
          },
          compositeIndex: {
            score: 0,
            weights: {},
            breakdown: {}
          }
        } as UnifiedAnalysis;
        
        if (unifiedAnalysis) {
          console.log('[Analysis] Generated unified analysis:', unifiedAnalysis);
          setUnifiedAnalysis(unifiedAnalysis);
        } else {
          console.log('[Analysis] No analysis generated for the selected date');
          setUnifiedAnalysis(null);
        }

        // After fetching all data
        console.log('[Analysis] Fetched data:', {
          userHistoricalAssessments: userHistoricalAssessments.length,
          moodEntries: moodEntries.length,
          consensusForms: consensusForms.length,
          hasPartnerAssessment: !!partnerAssessment,
          partnerHistoricalAssessments: partnerHistoricalAssessments.length,
          partnerMoodEntries: partnerMoodEntries.length
        });

        // After analysis generation
        console.log('[Analysis] Generated analysis:', {
          relationshipAnalysis: !!relationshipAnalysis,
          moodAnalysis: !!moodAnalysis,
          temporalAnalysis: !!temporalAnalysis,
          attachmentAnalysis: !!attachmentAnalysis
        });
      } catch (error) {
        console.error('[Analysis] Error fetching analysis:', error);
        setUnifiedAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [currentUser, userData, selectedDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <IconButton
              onClick={handlePreviousDay}
              size="small"
              sx={{ 
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: (theme) =>
                  `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
              }}
            >
              {formatDate(selectedDate)}
            </Typography>

            <IconButton
              onClick={handleNextDay}
              disabled={selectedDate >= new Date()}
              size="small"
              sx={{ 
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
                '&.Mui-disabled': {
                  backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.1),
                }
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            {unifiedAnalysis ? (
              <AnalysisTabs
                analysis={unifiedAnalysis.gptAnalysis || null}
                relationshipContext={unifiedAnalysis.relationshipContext || null}
                dailyInsight={unifiedAnalysis.dailyInsight}
                moodAnalysis={unifiedAnalysis.moodAnalysis}
                relationshipAnalysis={unifiedAnalysis.relationshipAnalysis}
                temporalAnalysis={unifiedAnalysis.temporalAnalysis}
                validatedScales={unifiedAnalysis.relationshipAnalysis?.validatedScales ? {
                  insights: [],
                  analysisDate: new Date().toISOString(),
                  confidence: unifiedAnalysis.relationshipAnalysis.validatedScales.reliability || 0.8,
                  trends: {},
                  recommendations: unifiedAnalysis.relationshipAnalysis.validatedScales.recommendations || [],
                  errors: unifiedAnalysis.relationshipAnalysis.validatedScales.errors || [],
                  das: unifiedAnalysis.relationshipAnalysis.validatedScales.das || {
                    consenso: 0,
                    satisfacao: 0,
                    coesao: 0,
                    expressaoAfetiva: 0,
                    total: 0
                  },
                  csi: unifiedAnalysis.relationshipAnalysis.validatedScales.csi || {
                    satisfacaoGlobal: 0,
                    estabilidade: 0,
                    comprometimento: 0,
                    comunicacao: 0,
                    gestaoConflitos: 0,
                    atividadesCompartilhadas: 0,
                    total: 0
                  },
                  gottman: unifiedAnalysis.relationshipAnalysis.validatedScales.gottman || {
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
                  attachment: unifiedAnalysis.relationshipAnalysis.validatedScales.attachment || {
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
                  },
                  consistency: unifiedAnalysis.relationshipAnalysis.validatedScales.consistency || {
                    default: {
                      score: 0.8,
                      confidence: 0.9,
                      flags: []
                    }
                  },
                  reliability: unifiedAnalysis.relationshipAnalysis.validatedScales.reliability || 0.8,
                  completeness: unifiedAnalysis.relationshipAnalysis.validatedScales.completeness || 0.8,
                  isValid: unifiedAnalysis.relationshipAnalysis.validatedScales.isValid ?? true
                } : undefined}
                attachmentAnalysis={unifiedAnalysis.attachmentAnalysis}
              />
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                Nenhuma análise disponível para {formatDate(selectedDate)}. Complete a avaliação diária para ver as análises.
              </Typography>
            )}
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
};

export default Analysis; 