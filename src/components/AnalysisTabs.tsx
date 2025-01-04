import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  alpha,
} from '@mui/material';
import MoodIcon from '@mui/icons-material/Mood';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { MoodAnalysis } from './MoodAnalysis';
import { RelationshipAnalysisTab } from './RelationshipAnalysisTab';
import { GPTAnalysisTab } from './GPTAnalysisTab';
import type {
  RelationshipContext,
  GPTAnalysis,
  MoodAnalysis as MoodAnalysisType,
  RelationshipAnalysis
} from '../types/index';

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
      aria-controls={`analysis-tabpanel-${index}`}
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

interface AnalysisTabsProps {
  analysis: GPTAnalysis | null;
  relationshipContext: RelationshipContext | null;
  dailyInsight: string;
  moodAnalysis?: MoodAnalysisType;
  relationshipAnalysis?: RelationshipAnalysis;
}

const convertGPTAnalysisToRelationshipAnalysis = (gptAnalysis: GPTAnalysis): RelationshipAnalysis => {
  if (typeof gptAnalysis.analysis === 'string') {
    return {
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
            shared: 0
          }
        },
        conflictResolution: {
          style: 'undefined',
          effectiveness: 0,
          patterns: []
        }
      }
    };
  }

  const analysis = gptAnalysis.analysis;
  return {
    overallHealth: analysis.overallHealth ?? { score: 0, trend: 'stable' },
    categories: analysis.categories ?? {},
    strengthsAndChallenges: analysis.strengthsAndChallenges ?? { strengths: [], challenges: [] },
    communicationSuggestions: analysis.communicationSuggestions ?? [],
    actionItems: analysis.actionItems ?? [],
    relationshipDynamics: analysis.relationshipDynamics ?? {
      positivePatterns: [],
      concerningPatterns: [],
      growthAreas: []
    },
    emotionalDynamics: analysis.emotionalDynamics ?? {
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
        style: 'undefined',
        effectiveness: 0,
        patterns: []
      }
    }
  };
};

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  analysis: gptAnalysis,
  relationshipContext,
  dailyInsight,
  moodAnalysis,
  relationshipAnalysis
}) => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const renderTabIcon = (index: number) => {
    switch (index) {
      case 0:
        return <MoodIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />;
      case 1:
        return <AssessmentIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />;
      case 2:
        return <PsychologyIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          background: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
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
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {renderTabIcon(0)}
                  <Typography>Análise de Humor</Typography>
                </Box>
              }
              {...a11yProps(0)}
            />
            {gptAnalysis && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderTabIcon(1)}
                    <Typography>Análise Individual</Typography>
                  </Box>
                }
                {...a11yProps(1)}
              />
            )}
            {relationshipAnalysis && relationshipContext && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderTabIcon(2)}
                    <Typography>Análise do Relacionamento</Typography>
                  </Box>
                }
                {...a11yProps(2)}
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          {moodAnalysis && <MoodAnalysis analysis={moodAnalysis} />}
        </TabPanel>

        {gptAnalysis && (
          <TabPanel value={value} index={1}>
            <GPTAnalysisTab analysis={convertGPTAnalysisToRelationshipAnalysis(gptAnalysis)} />
          </TabPanel>
        )}

        {relationshipAnalysis && relationshipContext && (
          <TabPanel value={value} index={2}>
            <RelationshipAnalysisTab
              analysis={relationshipAnalysis}
              relationshipContext={relationshipContext}
            />
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
}; 