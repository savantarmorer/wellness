import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { recreateAnalysisHistory } from '../services/migrationService';

export const MigrationTool: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMigration = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await recreateAnalysisHistory(currentUser.uid);
      
      setSuccess(true);
    } catch (error) {
      console.error('Migration error:', error);
      setError('Erro ao migrar o histórico de análises. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleMigration}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Migrando...' : 'Recriar Histórico de Análises'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Histórico de análises recriado com sucesso!
        </Alert>
      )}
    </Box>
  );
}; 