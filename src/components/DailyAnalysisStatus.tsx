import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Card,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip,
} from '@mui/material';
import { Check, Close, ArrowForward } from '@mui/icons-material';

interface Props {
  userSubmitted: boolean;
  partnerSubmitted: boolean;
  onNavigateToAnalysis: () => void;
}

export const DailyAnalysisStatus: React.FC<Props> = ({
  userSubmitted,
  partnerSubmitted,
  onNavigateToAnalysis,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        background: (theme) => alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack spacing={2}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Status da Análise Diária
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 3 }}
          alignItems="center"
          justifyContent="center"
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: { sm: 200 } }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Sua Submissão
            </Typography>
            <Chip
              icon={userSubmitted ? <Check /> : <Close />}
              label={userSubmitted ? 'Enviado' : 'Pendente'}
              color={userSubmitted ? 'success' : 'error'}
              sx={{
                width: '100%',
                height: { xs: 32, sm: 36 },
                '& .MuiChip-icon': {
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                },
              }}
            />
          </Box>

          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: { sm: 200 } }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Submissão do Parceiro
            </Typography>
            <Chip
              icon={partnerSubmitted ? <Check /> : <Close />}
              label={partnerSubmitted ? 'Enviado' : 'Pendente'}
              color={partnerSubmitted ? 'success' : 'error'}
              sx={{
                width: '100%',
                height: { xs: 32, sm: 36 },
                '& .MuiChip-icon': {
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                },
              }}
            />
          </Box>
        </Stack>

        <Box sx={{ textAlign: 'center', mt: { xs: 1, sm: 2 } }}>
          <Tooltip
            title={
              !userSubmitted || !partnerSubmitted
                ? 'Aguardando submissão de ambos os parceiros'
                : ''
            }
          >
            <span>
              <Button
                variant="contained"
                color="primary"
                endIcon={<ArrowForward />}
                onClick={onNavigateToAnalysis}
                disabled={!userSubmitted || !partnerSubmitted}
                sx={{
                  mt: { xs: 1, sm: 2 },
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '& .MuiButton-endIcon': {
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  },
                }}
              >
                Ver Análise
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Stack>
    </Card>
  );
}; 