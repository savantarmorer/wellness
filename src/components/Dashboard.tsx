import { useNavigate } from 'react-router-dom';
// ... other imports ...

export const Dashboard = () => {
  const navigate = useNavigate();
  // ... other code ...

  const handleDateSuggestionsClick = () => {
    navigate('/date-suggestions');
  };

  return (
    <Grid container spacing={3}>
      {/* ... other grid items ... */}
      
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: theme => alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
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
            Descubra lugares interessantes para um encontro especial com seu parceiro.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDateSuggestionsClick}
            sx={{ mt: 'auto' }}
          >
            Ver Sugestões
          </Button>
        </Paper>
      </Grid>

      {/* ... other grid items ... */}
    </Grid>
  );
}; 