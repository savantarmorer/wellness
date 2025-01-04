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
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Topic as TopicIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { DiscussionTopic } from '../services/insightService';

interface Props {
  topics: DiscussionTopic[];
  onAddTopic: (topic: Omit<DiscussionTopic, 'id' | 'status'>) => Promise<void>;
  onUpdateTopicStatus: (topicId: string, status: 'pending' | 'discussed' | 'resolved') => Promise<void>;
  onDeleteTopic: (topicId: string) => Promise<void>;
}

export const DiscussionAgenda: React.FC<Props> = ({
  topics,
  onAddTopic,
  onUpdateTopicStatus,
  onDeleteTopic,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewTopic({ title: '', description: '', priority: 'medium' });
  };

  const handleSubmit = async () => {
    if (newTopic.title) {
      await onAddTopic({
        title: newTopic.title,
        description: newTopic.description,
        priority: newTopic.priority,
        date: new Date().toISOString(),
      });
      handleClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'discussed':
        return theme.palette.info.main;
      case 'resolved':
        return theme.palette.success.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'discussed':
        return 'Discutido';
      case 'resolved':
        return 'Resolvido';
      default:
        return 'Pendente';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TopicIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">
              Agenda de Discussão
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            size="small"
          >
            Novo Tópico
          </Button>
        </Box>

        {topics.length === 0 ? (
          <Typography color="text.secondary">
            Nenhum tópico de discussão agendado.
          </Typography>
        ) : (
          <List>
            {topics.map((topic, index) => (
              <React.Fragment key={topic.id}>
                <ListItem
                  sx={{
                    backgroundColor: topic.status === 'resolved'
                      ? theme.palette.action.selected
                      : 'transparent',
                  }}
                >
                  <ListItemIcon>
                    <FlagIcon sx={{ color: getPriorityColor(topic.priority) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {topic.title}
                        <Chip
                          label={getStatusLabel(topic.status)}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(topic.status),
                            color: 'white',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {topic.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Adicionado em: {new Date(topic.date).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {topic.status === 'pending' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onUpdateTopicStatus(topic.id, 'discussed')}
                      >
                        Discutido
                      </Button>
                    )}
                    {topic.status === 'discussed' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => onUpdateTopicStatus(topic.id, 'resolved')}
                      >
                        Resolvido
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => onDeleteTopic(topic.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < topics.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Tópico de Discussão</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            value={newTopic.title}
            onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Descrição (opcional)"
            fullWidth
            multiline
            rows={4}
            value={newTopic.description}
            onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Prioridade
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['low', 'medium', 'high'].map((priority) => (
                <Chip
                  key={priority}
                  label={
                    priority === 'low' ? 'Baixa' :
                    priority === 'medium' ? 'Média' : 'Alta'
                  }
                  onClick={() => setNewTopic({ ...newTopic, priority: priority as any })}
                  color={newTopic.priority === priority ? 'primary' : 'default'}
                  variant={newTopic.priority === priority ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
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