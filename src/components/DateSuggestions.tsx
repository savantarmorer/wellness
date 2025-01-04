import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  alpha,
  useTheme,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { useAuth } from '../contexts/AuthContext';
import { getNearbyPlaces, initializeGoogleMaps, type Location, type NearbyPlace } from '../services/locationService';
import { useNotification } from '../contexts/NotificationContext';
import { addEvent } from '../services/calendarService';
import { sendDateInvite } from '../services/notificationService';

export interface DateSuggestion {
  id: string;
  title: string;
  description: string;
  location?: string;
  date?: string;
}

interface DateSuggestionsProps {
  userLocation: Location;
}

const categories = [
  { value: 'romantic', label: 'Romântico', icon: '💑' },
  { value: 'outdoor', label: 'Ao Ar Livre', icon: '🌳' },
  { value: 'cultural', label: 'Cultural', icon: '🎭' },
  { value: 'active', label: 'Ativo', icon: '🏃' },
  { value: 'relaxing', label: 'Relaxante', icon: '🧘' },
  { value: 'food', label: 'Gastronômico', icon: '🍽️' },
  { value: 'nightlife', label: 'Vida Noturna', icon: '🌙' },
  { value: 'shopping', label: 'Compras', icon: '🛍️' },
];

export const DateSuggestions: React.FC<DateSuggestionsProps> = ({ userLocation }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NearbyPlace[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [notes, setNotes] = useState('');
  const { showNotification } = useNotification();
  const { currentUser, userData } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const initMaps = async () => {
      try {
        await initializeGoogleMaps();
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showNotification('Erro ao carregar o Google Maps. Por favor, verifique sua conexão e recarregue a página.', 'error');
      }
    };

    initMaps();
  }, [showNotification]);

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  const handleFetchSuggestions = async () => {
    if (!selectedCategory) {
      showNotification('Por favor, selecione uma categoria primeiro.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const places = await getNearbyPlaces(userLocation, selectedCategory);
      setSuggestions(places);
      if (places.length === 0) {
        showNotification('Nenhuma sugestão encontrada para esta categoria na sua região.', 'info');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showNotification('Erro ao buscar sugestões. Por favor, tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayedSuggestions = showMore ? suggestions : suggestions.slice(0, 20);

  const handleScheduleDate = (place: NearbyPlace) => {
    setSelectedPlace(place);
    setSelectedDate(null);
    setNotes('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPlace(null);
    setSelectedDate(null);
    setNotes('');
  };

  const handleConfirmDate = async () => {
    if (!selectedPlace || !selectedDate || !currentUser || !userData?.partnerId) {
      showNotification('Erro ao marcar encontro. Verifique os dados e tente novamente.', 'error');
      return;
    }

    try {
      const dateValue = selectedDate.toDate();
      const endDateValue = new Date(dateValue.getTime() + 2 * 60 * 60 * 1000); // 2 horas de duração

      // Prepare place data without undefined fields
      const placeData: NearbyPlace = {
        id: selectedPlace.id,
        name: selectedPlace.name,
        address: selectedPlace.address,
        location: selectedPlace.location,
        category: selectedPlace.category,
        photoUrl: selectedPlace.photoUrl || '',
        description: selectedPlace.description || '',
        rating: selectedPlace.rating || 0,
        priceLevel: selectedPlace.priceLevel || 0,
        website: selectedPlace.website || '',
        openNow: selectedPlace.openNow || false,
        distance: selectedPlace.distance || 0
      };

      // Cria o evento no calendário do usuário
      const event = {
        title: `Encontro em ${selectedPlace.name}`,
        description: `${notes || 'Encontro marcado!'}\n\nLocal: ${selectedPlace.name}\nEndereço: ${selectedPlace.address}\n${selectedPlace.description ? `\nSobre o local: ${selectedPlace.description}` : ''}\n${selectedPlace.website ? `\nSite: ${selectedPlace.website}` : ''}`,
        start: dateValue,
        end: endDateValue,
        location: {
          lat: selectedPlace.location.lat,
          lng: selectedPlace.location.lng,
          address: selectedPlace.address
        },
        category: 'date',
        userId: currentUser.uid,
      };

      const createdEvent = await addEvent(event);

      // Envia convite para o parceiro
      await sendDateInvite({
        fromUserId: currentUser.uid,
        toUserId: userData.partnerId,
        place: placeData,
        date: dateValue,
        notes: notes,
      });

      showNotification('Convite de encontro enviado! Aguarde a confirmação do seu parceiro.', 'success');
      handleCloseDialog();
    } catch (error) {
      console.error('Error scheduling date:', error);
      showNotification('Erro ao marcar encontro. Por favor, tente novamente.', 'error');
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Sugestões de Encontro
      </Typography>

      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="Categoria"
          >
            {categories.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>{category.icon}</span>
                  {category.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchSuggestions}
          disabled={loading || !selectedCategory}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Buscar Sugestões'}
        </Button>
      </Box>

      {suggestions.length > 0 && (
        <Grid container spacing={3}>
          {displayedSuggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}
              >
                {suggestion.photoUrl && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={suggestion.photoUrl}
                    alt={suggestion.name}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {suggestion.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {suggestion.address}
                  </Typography>
                  {suggestion.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {suggestion.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {suggestion.rating && (
                      <Chip
                        label={`${suggestion.rating} ⭐`}
                        size="small"
                      />
                    )}
                    {suggestion.distance && (
                      <Chip
                        label={`${(suggestion.distance / 1000).toFixed(1)}km`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {suggestion.openNow !== undefined && (
                      <Chip
                        label={suggestion.openNow ? 'Aberto agora' : 'Fechado'}
                        size="small"
                        color={suggestion.openNow ? 'success' : 'default'}
                        variant="outlined"
                      />
                    )}
                    {suggestion.priceLevel !== undefined && (
                      <Chip
                        label={'$'.repeat(suggestion.priceLevel + 1)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {suggestion.website && (
                      <Button
                        href={suggestion.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Visitar site
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ flex: 1 }}
                      onClick={() => handleScheduleDate(suggestion)}
                    >
                      Marcar Encontro
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Marcar Encontro</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Local: {selectedPlace?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Endereço: {selectedPlace?.address}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DateTimePicker
                label="Data e Hora"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                sx={{ mt: 2, width: '100%' }}
                minDateTime={dayjs()}
              />
            </LocalizationProvider>
            <TextField
              label="Observações"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              placeholder="Adicione uma mensagem para seu parceiro..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleConfirmDate}
            variant="contained"
            disabled={!selectedDate}
          >
            Enviar Convite
          </Button>
        </DialogActions>
      </Dialog>

      {suggestions.length > 20 && !showMore && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowMore(true)}
          >
            Ver Mais Sugestões
          </Button>
        </Box>
      )}
    </Box>
  );
}; 