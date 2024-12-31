import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import { Add } from '@mui/icons-material';

export interface DateEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location?: string;
  isRecurring: boolean;
  recurringDay?: string;
  createdBy: string;
  accepted?: boolean;
}

interface DateCalendarProps {
  events: DateEvent[];
  onAddEvent: (event: Omit<DateEvent, 'id'>) => void;
  userId: string;
}

export const DateCalendar: React.FC<DateCalendarProps> = ({ events, onAddEvent, userId }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    time: '',
    location: '',
    isRecurring: false,
    recurringDay: '',
  });

  const handleAddEventClick = () => {
    setIsAddEventOpen(true);
  };

  const handleCloseAddEvent = () => {
    setIsAddEventOpen(false);
    setNewEvent({
      title: '',
      date: new Date(),
      time: '',
      location: '',
      isRecurring: false,
      recurringDay: '',
    });
  };

  const handleSubmitEvent = () => {
    onAddEvent({
      ...newEvent,
      date: selectedDate,
      createdBy: userId,
    });
    handleCloseAddEvent();
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectedDateEvents = getDayEvents(selectedDate);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Calendário de Encontros</Typography>
        <IconButton onClick={handleAddEventClick} color="primary">
          <Add />
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TextField
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Eventos do dia {selectedDate.toLocaleDateString('pt-BR')}
            </Typography>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <Paper
                  key={event.id}
                  sx={{
                    p: 1,
                    mb: 1,
                    backgroundColor: event.accepted === false ? 'grey.100' : 'primary.light',
                  }}
                >
                  <Typography variant="subtitle2">{event.title}</Typography>
                  <Typography variant="body2">{event.time}</Typography>
                  {event.location && (
                    <Typography variant="body2" color="text.secondary">
                      {event.location}
                    </Typography>
                  )}
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhum evento para este dia
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      <Dialog open={isAddEventOpen} onClose={handleCloseAddEvent}>
        <DialogTitle>Adicionar Novo Evento</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título do Evento"
            fullWidth
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Data"
            type="date"
            fullWidth
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            label="Horário"
            type="time"
            fullWidth
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            label="Local (opcional)"
            fullWidth
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newEvent.isRecurring}
                onChange={(e) => setNewEvent({ ...newEvent, isRecurring: e.target.checked })}
              />
            }
            label="Evento Recorrente"
          />
          {newEvent.isRecurring && (
            <TextField
              select
              margin="dense"
              label="Repetir a cada"
              fullWidth
              value={newEvent.recurringDay}
              onChange={(e) => setNewEvent({ ...newEvent, recurringDay: e.target.value })}
            >
              <MenuItem value="monday">Segunda-feira</MenuItem>
              <MenuItem value="tuesday">Terça-feira</MenuItem>
              <MenuItem value="wednesday">Quarta-feira</MenuItem>
              <MenuItem value="thursday">Quinta-feira</MenuItem>
              <MenuItem value="friday">Sexta-feira</MenuItem>
              <MenuItem value="saturday">Sábado</MenuItem>
              <MenuItem value="sunday">Domingo</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddEvent}>Cancelar</Button>
          <Button onClick={handleSubmitEvent} variant="contained" color="primary">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 