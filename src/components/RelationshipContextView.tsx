import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  AccessTime as TimeIcon,
  EmojiPeople as PeopleIcon,
  Psychology as PsychologyIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { RelationshipContextFormData } from '../types';

interface Props {
  data: RelationshipContextFormData;
  onEdit: () => void;
}

export const RelationshipContextView: React.FC<Props> = ({ data, onEdit }) => {
  const getTimeLabel = (time: string) => {
    switch (time) {
      case 'menos1h':
        return 'Menos de 1 hora';
      case '1-3h':
        return '1-3 horas';
      case 'mais3h':
        return 'Mais de 3 horas';
      default:
        return time;
    }
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'monogamico':
        return 'Monogâmico';
      case 'aberto':
        return 'Relacionamento Aberto';
      case 'poliamoroso':
        return 'Poliamoroso';
      case 'outro':
        return data.relationshipStyleOther || 'Outro';
      default:
        return style;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5">Contexto do Relacionamento</Typography>
        <Tooltip title="Editar Contexto">
          <IconButton onClick={onEdit} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={4}>
        {/* Informações Básicas */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FavoriteIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Informações Básicas</Typography>
          </Box>
          <Box sx={{ pl: 4 }}>
            <Typography><strong>Duração:</strong> {data.relationshipDuration}</Typography>
            <Typography><strong>Estilo:</strong> {getStyleLabel(data.relationshipStyle)}</Typography>
          </Box>
        </Grid>

        {/* Dinâmica */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Dinâmica do Relacionamento</Typography>
          </Box>
          <Box sx={{ pl: 4 }}>
            <Typography paragraph><strong>Dinâmica Atual:</strong> {data.currentDynamics}</Typography>
            <Typography paragraph><strong>Pontos Fortes:</strong> {data.strengths}</Typography>
          </Box>
        </Grid>

        {/* Áreas de Atenção */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Áreas que Precisam de Atenção</Typography>
          </Box>
          <Box sx={{ pl: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {Object.entries(data.areasNeedingAttention).map(([key, value]) => {
                if (!value) return null;
                const label = {
                  comunicacao: 'Comunicação',
                  confianca: 'Confiança',
                  intimidade: 'Intimidade',
                  resolucaoConflitos: 'Resolução de Conflitos',
                  apoioEmocional: 'Apoio Emocional',
                  outros: 'Outros',
                }[key];
                return <Chip key={key} label={label} color="primary" variant="outlined" />;
              })}
            </Box>
            {data.areasNeedingAttention.outros && (
              <Typography paragraph><strong>Outras áreas:</strong> {data.areasNeedingAttentionOther}</Typography>
            )}
          </Box>
        </Grid>

        {/* Estado Emocional */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PsychologyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Estado Emocional</Typography>
          </Box>
          <Box sx={{ pl: 4 }}>
            <Typography paragraph><strong>Seu Estado:</strong> {data.userEmotionalState}</Typography>
            <Typography paragraph><strong>Estado do Parceiro:</strong> {data.partnerEmotionalState}</Typography>
          </Box>
        </Grid>

        {/* Tempo e Qualidade */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TimeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Tempo e Qualidade</Typography>
          </Box>
          <Box sx={{ pl: 4 }}>
            <Typography><strong>Tempo Médio Juntos:</strong> {getTimeLabel(data.timeSpentTogether)}</Typography>
            <Typography><strong>Tempo de Qualidade:</strong> {data.qualityTime ? 'Sim' : 'Não'}</Typography>
            {data.qualityTimeDescription && (
              <Typography paragraph><strong>Detalhes:</strong> {data.qualityTimeDescription}</Typography>
            )}
            <Typography paragraph><strong>Impacto da Rotina:</strong> {data.routineImpact}</Typography>
          </Box>
        </Grid>

        {/* Objetivos */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StarIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Objetivos e Melhorias</Typography>
          </Box>
          <Box sx={{ pl: 4 }}>
            <Typography paragraph><strong>Objetivos com o App:</strong> {data.appGoals}</Typography>
            <Typography paragraph><strong>Melhorias Desejadas:</strong> {data.intimacyImprovements}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}; 