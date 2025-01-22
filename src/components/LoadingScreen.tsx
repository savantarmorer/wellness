import React from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading your experience...'
}) => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Dr. Bread
          </Typography>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoadingScreen; 