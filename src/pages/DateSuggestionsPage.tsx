import React from 'react';
import { Container } from '@mui/material';
import { LocationProvider } from '../components/LocationProvider';
import { DateSuggestions } from '../components/DateSuggestions';
import { Layout } from '../components/Layout';

export const DateSuggestionsPage: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LocationProvider>
          {(location) => (
            <DateSuggestions userLocation={location} />
          )}
        </LocationProvider>
      </Container>
    </Layout>
  );
}; 