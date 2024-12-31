import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';
import { CommunicationExercise } from '../services/insightService';

interface Props {
  exercises: CommunicationExercise[];
  onAddExercise: (exercise: Omit<CommunicationExercise, 'id' | 'completed'>) => Promise<void>;
  onCompleteExercise: (exerciseId: string) => Promise<void>;
}

export const CommunicationExercises: React.FC<Props> = ({
  exercises,
  onAddExercise,
  onCompleteExercise,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    duration: '',
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewExercise({ title: '', description: '', duration: '' });
  };

  const handleSubmit = async () => {
    if (newExercise.title && newExercise.description) {
      await onAddExercise({
        title: newExercise.title,
        description: newExercise.description,
        duration: newExercise.duration,
        date: new Date().toISOString(),
      });
      handleClose();
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ForumIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">
              Exercícios de Comunicação
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            size="small"
          >
            Novo Exercício
          </Button>
        </Box>

        {exercises.length === 0 ? (
          <Typography color="text.secondary">
            Nenhum exercício de comunicação disponível.
          </Typography>
        ) : (
          <List>
            {exercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                <ListItem
                  sx={{
                    backgroundColor: exercise.completed
                      ? theme.palette.action.selected
                      : 'transparent',
                  }}
                >
                  <ListItemIcon>
                    <AssignmentIcon color={exercise.completed ? 'success' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={exercise.title}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {exercise.description}
                        </Typography>
                        {exercise.duration && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Duração sugerida: {exercise.duration}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  {!exercise.completed && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => onCompleteExercise(exercise.id)}
                    >
                      Concluir
                    </Button>
                  )}
                </ListItem>
                {index < exercises.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Exercício de Comunicação</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            value={newExercise.title}
            onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Descrição"
            fullWidth
            multiline
            rows={4}
            value={newExercise.description}
            onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Duração Sugerida (opcional)"
            fullWidth
            value={newExercise.duration}
            onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
            placeholder="Ex: 30 minutos"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 