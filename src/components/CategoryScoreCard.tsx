import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography, Stack, Chip, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import MergeIcon from '@mui/icons-material/Merge';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { categoryIcons, CategoryIcon } from '../utils/categoryIcons';

interface CategoryScoreCardProps {
  category: string;
  score: number;
  trend?: {
    userTrend: 'improving' | 'stable' | 'declining';
    partnerTrend: 'improving' | 'stable' | 'declining';
    convergence: 'converging' | 'stable' | 'diverging';
    volatility: number;
  };
}

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving':
      return <TrendingUpIcon color="success" />;
    case 'declining':
      return <TrendingDownIcon color="error" />;
    default:
      return <TrendingFlatIcon color="info" />;
  }
};

const getTrendLabel = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving':
      return 'Melhorando';
    case 'declining':
      return 'Declinando';
    default:
      return 'Estável';
  }
};

const getConvergenceIcon = (convergence: 'converging' | 'stable' | 'diverging') => {
  switch (convergence) {
    case 'converging':
      return <MergeIcon color="success" />;
    case 'diverging':
      return <CallSplitIcon color="error" />;
    default:
      return <TrendingFlatIcon color="info" />;
  }
};

const getConvergenceLabel = (convergence: 'converging' | 'stable' | 'diverging') => {
  switch (convergence) {
    case 'converging':
      return 'Convergindo';
    case 'diverging':
      return 'Divergindo';
    default:
      return 'Estável';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 4) return 'success';
  if (score >= 3) return 'info';
  if (score >= 2) return 'warning';
  return 'error';
};

export const CategoryScoreCard: React.FC<CategoryScoreCardProps> = ({ category, score, trend }) => (
  <Card>
    <CardHeader 
      title={category}
      avatar={React.createElement(categoryIcons[category as CategoryIcon])}
    />
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <CircularProgress 
          variant="determinate" 
          value={score * 20} // Converte para escala 0-100
          color={getScoreColor(score)}
        />
        <Typography variant="h4" ml={2}>
          {score.toFixed(1)}
        </Typography>
      </Box>
      
      {trend && (
        <Stack spacing={1}>
          <Chip 
            icon={getTrendIcon(trend.userTrend)}
            label={`Você: ${getTrendLabel(trend.userTrend)}`}
          />
          <Chip 
            icon={getTrendIcon(trend.partnerTrend)}
            label={`Parceiro: ${getTrendLabel(trend.partnerTrend)}`}
          />
          <Chip 
            icon={getConvergenceIcon(trend.convergence)}
            label={getConvergenceLabel(trend.convergence)}
          />
        </Stack>
      )}
    </CardContent>
  </Card>
);

export default CategoryScoreCard; 