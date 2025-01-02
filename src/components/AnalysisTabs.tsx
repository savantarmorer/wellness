import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  Card,
  Stack,
  Button
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarIcon from '@mui/icons-material/Star';
import CategoryIcon from '@mui/icons-material/Category';
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

import { DiscrepancyAnalysis } from './DiscrepancyAnalysis';
import { RelationshipAnalysis as RelationshipAnalysisComponent } from './RelationshipAnalysis';
import { getAnalysisHistory } from '../services/analysisHistoryService';
import { useAuth } from '../contexts/AuthContext';
import type { RelationshipAnalysis } from '../services/gptService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: { xs: 1.5, sm: 3 },
          '& > *': {
            maxWidth: '100%',
            overflowX: 'hidden',
          }
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analysis-tab-${index}`,
    'aria-controls': `analysis-tabpanel-${index}`,
  };
}

export const AnalysisTabs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyAnalysis, setDailyAnalysis] = useState<RelationshipAnalysis | null>(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<RelationshipAnalysis | null>(null);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<RelationshipAnalysis | null>(null);

  useEffect(() => {
    const loadAnalyses = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const history = await getAnalysisHistory(currentUser.uid);
        
        // Get today's date
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Filter analyses by time period
        const dailyRecords = history.filter(record => 
          new Date(record.date).toDateString() === today.toDateString()
        );
        const weeklyRecords = history.filter(record => 
          new Date(record.date) >= oneWeekAgo
        );
        const monthlyRecords = history.filter(record => 
          new Date(record.date) >= oneMonthAgo
        );

        // Set the most recent analysis for each period
        if (dailyRecords.length > 0) {
          const dailyAnalysisData = typeof dailyRecords[0].analysis === 'string' 
            ? {
                overallHealth: { score: 0, trend: 'stable' },
                categories: {},
                strengthsAndChallenges: { strengths: [], challenges: [] },
                communicationSuggestions: [],
                actionItems: [],
                relationshipDynamics: {
                  positivePatterns: [],
                  concerningPatterns: [],
                  growthAreas: []
                },
                emotionalDynamics: {
                  emotionalSecurity: 0,
                  intimacyBalance: {
                    score: 0,
                    areas: {
                      emotional: 0,
                      physical: 0,
                      intellectual: 0,
                      shared: 0,
                    }
                  },
                  conflictResolution: {
                    style: '',
                    effectiveness: 0,
                    patterns: []
                  }
                }
              } as RelationshipAnalysis
            : dailyRecords[0].analysis as RelationshipAnalysis;
          
          if (dailyAnalysisData && !dailyAnalysisData.emotionalDynamics) {
            dailyAnalysisData.emotionalDynamics = {
              emotionalSecurity: 0,
              intimacyBalance: {
                score: 0,
                areas: {
                  emotional: 0,
                  physical: 0,
                  intellectual: 0,
                  shared: 0,
                }
              },
              conflictResolution: {
                style: '',
                effectiveness: 0,
                patterns: []
              }
            };
          }
          setDailyAnalysis(dailyAnalysisData);
        }
        if (weeklyRecords.length > 0) {
          const weeklyAnalysisData = typeof weeklyRecords[0].analysis === 'string' 
            ? {
                overallHealth: { score: 0, trend: 'stable' },
                categories: {},
                strengthsAndChallenges: { strengths: [], challenges: [] },
                communicationSuggestions: [],
                actionItems: [],
                relationshipDynamics: {
                  positivePatterns: [],
                  concerningPatterns: [],
                  growthAreas: []
                },
                emotionalDynamics: {
                  emotionalSecurity: 0,
                  intimacyBalance: {
                    score: 0,
                    areas: {
                      emotional: 0,
                      physical: 0,
                      intellectual: 0,
                      shared: 0,
                    }
                  },
                  conflictResolution: {
                    style: '',
                    effectiveness: 0,
                    patterns: []
                  }
                }
              } as RelationshipAnalysis
            : weeklyRecords[0].analysis as RelationshipAnalysis;
          
          if (weeklyAnalysisData && !weeklyAnalysisData.emotionalDynamics) {
            weeklyAnalysisData.emotionalDynamics = {
              emotionalSecurity: 0,
              intimacyBalance: {
                score: 0,
                areas: {
                  emotional: 0,
                  physical: 0,
                  intellectual: 0,
                  shared: 0,
                }
              },
              conflictResolution: {
                style: '',
                effectiveness: 0,
                patterns: []
              }
            };
          }
          setWeeklyAnalysis(weeklyAnalysisData);
        }
        if (monthlyRecords.length > 0) {
          const monthlyAnalysisData = typeof monthlyRecords[0].analysis === 'string' 
            ? {
                overallHealth: { score: 0, trend: 'stable' },
                categories: {},
                strengthsAndChallenges: { strengths: [], challenges: [] },
                communicationSuggestions: [],
                actionItems: [],
                relationshipDynamics: {
                  positivePatterns: [],
                  concerningPatterns: [],
                  growthAreas: []
                },
                emotionalDynamics: {
                  emotionalSecurity: 0,
                  intimacyBalance: {
                    score: 0,
                    areas: {
                      emotional: 0,
                      physical: 0,
                      intellectual: 0,
                      shared: 0,
                    }
                  },
                  conflictResolution: {
                    style: '',
                    effectiveness: 0,
                    patterns: []
                  }
                }
              } as RelationshipAnalysis
            : monthlyRecords[0].analysis as RelationshipAnalysis;
          
          if (monthlyAnalysisData && !monthlyAnalysisData.emotionalDynamics) {
            monthlyAnalysisData.emotionalDynamics = {
              emotionalSecurity: 0,
              intimacyBalance: {
                score: 0,
                areas: {
                  emotional: 0,
                  physical: 0,
                  intellectual: 0,
                  shared: 0,
                }
              },
              conflictResolution: {
                style: '',
                effectiveness: 0,
                patterns: []
              }
            };
          }
          setMonthlyAnalysis(monthlyAnalysisData);
        }
      } catch (err) {
        console.error('Error loading analyses:', err);
        setError('Erro ao carregar análises');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyses();
  }, [currentUser]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const renderTabIcon = (index: number) => {
    switch (index) {
      case 0:
        return <AssessmentIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />;
      case 1:
        return <TrendingUpIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />;
      case 2:
        return <CalendarMonthIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />;
      default:
        return null;
    }
  };

  const renderAnalysisContent = (analysis: RelationshipAnalysis | null, title: string) => {
    if (!analysis) {
      return (
        <Card 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 },
            background: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          }}
        >
          <Typography 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              textAlign: 'center',
            }}
          >
            Nenhuma análise {title.toLowerCase()} disponível.
          </Typography>
        </Card>
      );
    }

    const sections = [
      { id: 'saude-geral', label: 'Saúde Geral', icon: <AssessmentIcon fontSize="small" /> },
      { id: 'pontos-fortes', label: 'Pontos Fortes e Desafios', icon: <StarIcon fontSize="small" /> },
      { id: 'categorias', label: 'Análise por Categorias', icon: <CategoryIcon fontSize="small" /> },
      { id: 'comunicacao', label: 'Sugestões de Comunicação', icon: <ChatIcon fontSize="small" /> },
      { id: 'acoes', label: 'Ações Sugeridas', icon: <AssignmentIcon fontSize="small" /> },
      { id: 'dinamicas', label: 'Dinâmicas do Relacionamento', icon: <TimelineIcon fontSize="small" /> },
      { id: 'emocional', label: 'Dinâmicas Emocionais', icon: <PsychologyIcon fontSize="small" /> },
      { id: 'discrepancias', label: 'Análise de Discrepâncias', icon: <CompareArrowsIcon fontSize="small" /> },
    ];

    return (
      <Stack spacing={3}>
        <Card 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 },
            background: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600,
              mb: { xs: 1.5, sm: 2 },
            }}
          >
            Índice Rápido
          </Typography>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 1, sm: 2 },
          }}>
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="outlined"
                size="small"
                startIcon={section.icon}
                onClick={() => {
                  const element = document.getElementById(section.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {section.label}
              </Button>
            ))}
          </Box>
        </Card>

        <Box>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.5rem' },
              mb: { xs: 1.5, sm: 2.5 },
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            Análise {title}
          </Typography>
          <RelationshipAnalysisComponent analysis={analysis} />
        </Box>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        <Box id="discrepancias">
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.5rem' },
              mb: { xs: 1.5, sm: 2.5 },
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            Análise de Discrepâncias
          </Typography>
          <DiscrepancyAnalysis 
            analysis={analysis} 
            period={value === 0 ? 'daily' : value === 1 ? 'weekly' : 'monthly'} 
          />
        </Box>
      </Stack>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      position: 'relative',
      '& *': {
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }
    }}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          background: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          width: '100%',
          maxWidth: '100vw',
        }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          background: (theme) => alpha(theme.palette.background.paper, 0.6),
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="analysis tabs"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 48, sm: 56 },
              width: '100%',
              maxWidth: '100vw',
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTabs-scrollButtons': {
                color: 'primary.main',
              },
              '& .MuiTab-root': {
                minWidth: isMobile ? 'auto' : undefined,
                px: { xs: 1, sm: 2 },
                maxWidth: isMobile ? '33.33%' : undefined,
              },
            }}
          >
            {['Diário', 'Semanal', 'Mensal'].map((label, index) => (
              <Tab 
                key={label}
                label={
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    flexDirection: isMobile ? 'column' : 'row',
                    py: isMobile ? 0.5 : 0,
                    minWidth: isMobile ? 'auto' : undefined,
                    maxWidth: '100%',
                  }}>
                    {renderTabIcon(index)}
                    <Typography 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: value === index ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                }
                {...a11yProps(index)}
                sx={{ 
                  minHeight: { xs: 48, sm: 56 },
                  p: { xs: 1, sm: 2 },
                  minWidth: isMobile ? 'auto' : undefined,
                  flex: isMobile ? 'none' : 1,
                  maxWidth: isMobile ? '33.33%' : undefined,
                }}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ 
          p: { xs: 0, sm: 1 },
          '& .MuiTabPanel-root': {
            p: { xs: 0, sm: 1 },
          },
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}>
          <TabPanel value={value} index={0}>
            {renderAnalysisContent(dailyAnalysis, 'Diária')}
          </TabPanel>

          <TabPanel value={value} index={1}>
            {renderAnalysisContent(weeklyAnalysis, 'Semanal')}
          </TabPanel>

          <TabPanel value={value} index={2}>
            {renderAnalysisContent(monthlyAnalysis, 'Mensal')}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}; 