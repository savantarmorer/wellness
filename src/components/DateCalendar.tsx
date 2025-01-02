import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

export interface DateEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  category: string;
  userId: string;
}

interface DateCalendarProps {
  events: DateEvent[];
  onAddEvent: (event: Omit<DateEvent, 'id'>) => void;
  userId: string;
}

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const DateCalendar: React.FC<DateCalendarProps> = ({ events, onAddEvent, userId }) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<DateEvent | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowAddDialog(true);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !eventTitle || !eventTime) return;

    const [hours, minutes] = eventTime.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes);

    const end = new Date(start);
    end.setHours(hours + 1, minutes); // Default duration: 1 hour

    const newEvent: Omit<DateEvent, 'id'> = {
      title: eventTitle,
      description: eventDescription,
      start,
      end,
      category: eventCategory,
      userId,
    };

    onAddEvent(newEvent);
    setShowAddDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventTime('');
    setEventCategory('');
    setSelectedDate(null);
  };

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <BigCalendar
          localizer={localizer}
          events={events.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectSlot={({ start }: { start: Date }) => handleDateClick(start)}
          selectable
          eventPropGetter={() => ({
            style: {
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              borderRadius: '4px',
              border: 'none',
              padding: '2px 5px',
            },
          })}
          onSelectEvent={(event: DateEvent) => setSelectedEvent(event)}
          messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Não há eventos neste período',
          }}
        />
      </Paper>

      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogTitle>Adicionar Evento</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Título"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descrição"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Horário"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Categoria"
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddEvent} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
        <DialogTitle>{selectedEvent?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" paragraph>
              {selectedEvent?.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedEvent?.start && formatEventTime(new Date(selectedEvent.start))}
            </Typography>
            {selectedEvent?.location && (
              <Typography variant="body2" color="text.secondary">
                {selectedEvent.location.address}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 