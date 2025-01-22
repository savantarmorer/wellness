import React from 'react';
import { Box } from '@mui/material';
import type { MoodAnalysis as MoodAnalysisType, MoodSynchronyAnalysis } from '../types';
import { EmotionalMetrics } from './mood/EmotionalMetrics';
import { MoodPatterns } from './mood/MoodPatterns';
import { MoodInsights } from './mood/MoodInsights';

interface MoodAnalysisProps {
  analysis: MoodAnalysisType | MoodSynchronyAnalysis;
}

export const MoodAnalysis: React.FC<MoodAnalysisProps> = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <Box>
      <EmotionalMetrics analysis={analysis} />
      <MoodPatterns analysis={analysis} />
      <MoodInsights analysis={analysis} />
    </Box>
  );
}; 