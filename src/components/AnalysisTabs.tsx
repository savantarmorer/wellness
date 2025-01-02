import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

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
        <Box sx={{ p: 3 }}>
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

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="analysis tabs"
            variant="fullWidth"
          >
            <Tab 
              label="Diário" 
              {...a11yProps(0)}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1.5, sm: 2 }
              }}
            />
            <Tab 
              label="Semanal" 
              {...a11yProps(1)}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1.5, sm: 2 }
              }}
            />
            <Tab 
              label="Mensal" 
              {...a11yProps(2)}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1.5, sm: 2 }
              }}
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          {dailyAnalysis ? (
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: { xs: 2, sm: 3 }
                }}
              >
                Análise Diária
              </Typography>
              <RelationshipAnalysisComponent analysis={dailyAnalysis} />
              <Box sx={{ mt: 4 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  Análise de Discrepâncias
                </Typography>
                <DiscrepancyAnalysis analysis={dailyAnalysis} period="daily" />
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              Nenhuma análise diária disponível.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={value} index={1}>
          {weeklyAnalysis ? (
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: { xs: 2, sm: 3 }
                }}
              >
                Análise Semanal
              </Typography>
              <RelationshipAnalysisComponent analysis={weeklyAnalysis} />
              <Box sx={{ mt: 4 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  Análise de Discrepâncias
                </Typography>
                <DiscrepancyAnalysis analysis={weeklyAnalysis} period="weekly" />
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              Nenhuma análise semanal disponível.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={value} index={2}>
          {monthlyAnalysis ? (
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: { xs: 2, sm: 3 }
                }}
              >
                Análise Mensal
              </Typography>
              <RelationshipAnalysisComponent analysis={monthlyAnalysis} />
              <Box sx={{ mt: 4 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  Análise de Discrepâncias
                </Typography>
                <DiscrepancyAnalysis analysis={monthlyAnalysis} period="monthly" />
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              Nenhuma análise mensal disponível.
            </Typography>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}; 