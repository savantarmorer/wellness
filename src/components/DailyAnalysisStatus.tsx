import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

interface DailyAnalysisStatusProps {
  userHasSubmitted: boolean;
  partnerHasSubmitted: boolean;
  hasCollectiveAnalysis: boolean;
  partnerName?: string;
}

export const DailyAnalysisStatus: React.FC<DailyAnalysisStatusProps> = ({
  userHasSubmitted,
  partnerHasSubmitted,
  hasCollectiveAnalysis,
  partnerName = 'Parceiro'
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        background: (theme) => alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <Typography variant="h6" gutterBottom>
        Status das Análises de Hoje
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {userHasSubmitted ? (
              <CheckCircleIcon color="success" />
            ) : (
              <PendingIcon color="warning" />
            )}
            <Typography>
              {userHasSubmitted
                ? 'Você já fez sua análise hoje'
                : 'Você ainda não fez sua análise hoje'}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {partnerHasSubmitted ? (
              <CheckCircleIcon color="success" />
            ) : (
              <PendingIcon color="warning" />
            )}
            <Typography>
              {partnerHasSubmitted
                ? `${partnerName} já fez a análise hoje`
                : `${partnerName} ainda não fez a análise hoje`}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Análises Disponíveis:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!userHasSubmitted && (
            <Chip
              icon={<PersonIcon />}
              label="Análise Individual"
              color="primary"
              onClick={() => navigate('/daily-assessment')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          
          {userHasSubmitted && partnerHasSubmitted && !hasCollectiveAnalysis && (
            <Chip
              icon={<GroupIcon />}
              label="Análise do Casal"
              color="secondary"
              onClick={() => navigate('/statistics')}
              sx={{ cursor: 'pointer' }}
            />
          )}

          {(userHasSubmitted || partnerHasSubmitted) && (
            <Chip
              icon={<PersonIcon />}
              label="Ver Histórico"
              variant="outlined"
              onClick={() => navigate('/analysis-history')}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
      </Box>

      {!userHasSubmitted && (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => navigate('/daily-assessment')}
          sx={{ mt: 2 }}
        >
          Fazer Análise Diária
        </Button>
      )}
    </Paper>
  );
}; 