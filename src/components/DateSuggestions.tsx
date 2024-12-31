import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Favorite,
  LocationOn,
  AccessTime,
  AttachMoney,
  Add,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { getCurrentLocation, getNearbyPlaces, categoryToPlaceType, type Location, type NearbyPlace } from '../services/locationService';

export interface DateSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  duration?: string;
  cost: number;
  rating?: number;
  likes?: number;
  dislikes?: number;
  userRating?: 'like' | 'dislike';
  imageUrl?: string;
  address?: string;
  distance?: number;
}

interface DateSuggestionsProps {
  userInterests?: string[];
  onAddToCalendar: (suggestion: DateSuggestion) => void;
}

export const DateSuggestions: React.FC<DateSuggestionsProps> = ({
  userInterests = [],
  onAddToCalendar,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<DateSuggestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        await fetchSuggestions(location);
      } catch (error) {
        console.error('Error getting location:', error);
        setError('Não foi possível obter sua localização. Verifique se você permitiu o acesso à localização.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const fetchSuggestions = async (location: Location) => {
    try {
      const allSuggestions: DateSuggestion[] = [];

      // Para cada interesse do usuário, busca lugares próximos
      for (const interest of userInterests) {
        const placeType = categoryToPlaceType[interest];
        if (placeType) {
          const places = await getNearbyPlaces(location, placeType);
          
          // Converte os lugares em sugestões
          const newSuggestions = places.map((place): DateSuggestion => ({
            id: place.id,
            title: place.name,
            description: `${place.name} - A ${(place.distance / 1000).toFixed(1)}km de distância`,
            category: interest,
            location: place.address,
            cost: Math.floor(Math.random() * 3) + 1, // Simula um custo aleatório por enquanto
            rating: place.rating,
            likes: 0,
            dislikes: 0,
            address: place.address,
            distance: place.distance,
          }));

          allSuggestions.push(...newSuggestions);
        }
      }

      // Ordena por distância e limita a 9 sugestões
      const sortedSuggestions = allSuggestions
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 9);

      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Erro ao buscar sugestões de lugares próximos.');
    }
  };

  const handleAddToCalendar = (suggestion: DateSuggestion) => {
    setSelectedSuggestion(suggestion);
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventTime('');
    setIsDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    if (selectedSuggestion && eventDate && eventTime) {
      const [year, month, day] = eventDate.split('-').map(Number);
      const [hours, minutes] = eventTime.split(':').map(Number);
      const eventDateTime = new Date(year, month - 1, day, hours, minutes);

      onAddToCalendar({
        ...selectedSuggestion,
        date: eventDateTime,
        time: eventTime,
      });
      setIsDialogOpen(false);
      setSelectedSuggestion(null);
      setEventDate('');
      setEventTime('');
    }
  };

  const getCostSymbol = (cost: number) => {
    return '💰'.repeat(cost);
  };

  if (loading) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography>Carregando sugestões...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sugestões de Encontros Próximos
      </Typography>
      {userLocation && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mostrando lugares próximos à sua localização
        </Typography>
      )}
      <Grid container spacing={3}>
        {suggestions.map((suggestion) => (
          <Grid item xs={12} md={4} key={suggestion.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {suggestion.title}
                </Typography>
                <Chip
                  icon={<Favorite />}
                  label={suggestion.category}
                  size="small"
                  color="primary"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" paragraph>
                  {suggestion.description}
                </Typography>
                {suggestion.distance && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 'small', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {(suggestion.distance / 1000).toFixed(1)}km de distância
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ fontSize: 'small', mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {getCostSymbol(suggestion.cost)}
                  </Typography>
                </Box>
                {suggestion.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={suggestion.rating} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({suggestion.rating})
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleAddToCalendar(suggestion)}
                  fullWidth
                >
                  Adicionar ao Calendário
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Agendar Encontro</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedSuggestion?.title}
          </Typography>
          {selectedSuggestion?.address && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Local: {selectedSuggestion.address}
            </Typography>
          )}
          <TextField
            margin="dense"
            label="Data"
            type="date"
            fullWidth
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Horário"
            type="time"
            fullWidth
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmAdd}
            variant="contained"
            color="primary"
            disabled={!eventDate || !eventTime}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 