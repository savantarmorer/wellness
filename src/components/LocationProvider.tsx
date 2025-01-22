import React, { useState, useEffect } from 'react';
import { CircularProgress, Alert, Box } from '@mui/material';
import { getCurrentLocation, type Location } from '../services/locationService';

interface LocationProviderProps {
  children: (location: Location) => React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const userLocation = await getCurrentLocation();
        setLocation(userLocation);
        setError(null);
      } catch (error) {
        console.error('Error getting location:', error);
        setError('Não foi possível obter sua localização. Verifique se você permitiu o acesso à localização.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!location) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          Localização não disponível. Por favor, permita o acesso à sua localização e recarregue a página.
        </Alert>
      </Box>
    );
  }

  return <>{children(location)}</>;
}; 