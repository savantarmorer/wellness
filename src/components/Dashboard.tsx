import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  alpha,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { DateSuggestion } from './DateSuggestions';

interface DashboardProps {
  dateSuggestions: DateSuggestion[];
}

export const Dashboard: React.FC<DashboardProps> = ({ dateSuggestions }) => {
  const navigate = useNavigate();

  const handleDateSuggestionsClick = () => {
    navigate('/date-suggestions');
  };

  return (
    <Grid container spacing={3}>
      {/* Date Suggestions */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 3,
            height: '100%',
            background: theme => alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme => `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FavoriteIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Sugestões de Encontro</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Descubra ideias personalizadas para fortalecer seu relacionamento
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDateSuggestionsClick}
            fullWidth
            sx={{ mt: 2 }}
          >
            Ver sugestões
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}; 