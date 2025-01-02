import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  alpha,
} from '@mui/material';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, ToolbarProps } from 'react-big-calendar';
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

const calendarMessages = {
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
  showMore: (total: number) => `+${total} mais`,
};

export const DateCalendar: React.FC<DateCalendarProps> = ({ events, onAddEvent, userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<DateEvent | null>(null);
  const [view, setView] = useState<View>('month');

  useEffect(() => {
    if (isMobile) {
      setView('agenda');
    }
  }, [isMobile]);

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
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: 2,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
          '& .rbc-calendar': {
            minHeight: { xs: 400, sm: 500 },
          },
          '& .rbc-toolbar': {
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1,
            mb: { xs: 1, sm: 2 },
          },
          '& .rbc-toolbar-label': {
            margin: { xs: '4px 0', sm: '0 10px' },
            width: { xs: '100%', sm: 'auto' },
            textAlign: 'center',
            order: { xs: -1, sm: 0 },
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 600,
            color: theme.palette.text.primary,
          },
          '& .rbc-btn-group': {
            margin: '4px',
            '& button': {
              padding: { xs: '4px 8px', sm: '6px 12px' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              background: 'transparent',
              color: theme.palette.text.primary,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.1),
                borderColor: theme.palette.primary.main,
              },
              '&.rbc-active': {
                background: alpha(theme.palette.primary.main, 0.2),
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              },
            },
          },
          '& .rbc-header': {
            padding: { xs: '4px', sm: '8px' },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 600,
          },
          '& .rbc-date-cell': {
            padding: { xs: '2px', sm: '4px' },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          },
          '& .rbc-event': {
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            backgroundColor: alpha(theme.palette.primary.main, 0.9),
            border: 'none',
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
            },
          },
          '& .rbc-today': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
          '& .rbc-off-range-bg': {
            backgroundColor: alpha(theme.palette.action.disabled, 0.05),
          },
          '& .rbc-agenda-view': {
            '& table.rbc-agenda-table': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '& thead > tr > th': {
                padding: { xs: '4px', sm: '8px' },
                fontWeight: 600,
              },
              '& tbody > tr > td': {
                padding: { xs: '4px', sm: '8px' },
              },
            },
          },
        }}
      >
        <BigCalendar
          localizer={localizer}
          events={events.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }))}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(newView: View) => setView(newView)}
          defaultView={isMobile ? 'agenda' : 'month'}
          views={['month', 'week', 'day', 'agenda']}
          onSelectSlot={({ start }: { start: Date }) => handleDateClick(start)}
          selectable
          eventPropGetter={() => ({
            style: {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: '4px',
              border: 'none',
              padding: '2px 5px',
            },
          })}
          onSelectEvent={(event: DateEvent) => setSelectedEvent(event)}
          messages={calendarMessages}
          popup
          components={{
            toolbar: (toolbarProps: ToolbarProps) => (
              <div className="rbc-toolbar">
                <span className="rbc-btn-group">
                  <button type="button" onClick={() => toolbarProps.onNavigate('PREV')}>
                    Anterior
                  </button>
                  <button type="button" onClick={() => toolbarProps.onNavigate('TODAY')}>
                    Hoje
                  </button>
                  <button type="button" onClick={() => toolbarProps.onNavigate('NEXT')}>
                    Próximo
                  </button>
                </span>
                <span className="rbc-toolbar-label">{toolbarProps.label}</span>
                {!isMobile && (
                  <span className="rbc-btn-group">
                    {toolbarProps.views.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toolbarProps.onView(name)}
                        className={toolbarProps.view === name ? 'rbc-active' : ''}
                      >
                        {calendarMessages[name as keyof typeof calendarMessages]}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            ),
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