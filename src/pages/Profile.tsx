/**
 * Profile Component
 * 
 * This component handles the user profile management in the wellness monitor application.
 * It allows users to update their personal information, partner email, and interests.
 * 
 * Dependencies:
 * - AuthContext: For user authentication and data
 * - Firebase: For database operations
 * - MUI: For UI components
 * - DateSuggestionsService: For interest categories
 * 
 * Related Components:
 * - Layout: Main layout wrapper
 * - RelationshipConsensusForm: Form for relationship assessment
 * - ConsensusFormHistory: History of relationship assessments
 */

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { categories } from '../services/dateSuggestionsService';

const Profile = () => {
  // State management using AuthContext
  const { currentUser, userData } = useAuth();
  const [name, setName] = useState(userData?.name || '');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userData?.interests || []);

  // Update interests when userData changes
  useEffect(() => {
    if (userData?.interests) {
      setSelectedInterests(userData.interests);
    }
  }, [userData]);

  /**
   * Handles the profile update operation
   * Updates user data in Firestore with new name, partner email, and interests
   * Shows success/error messages accordingly
   */
  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        partnerEmail,
        interests: selectedInterests,
        updatedAt: new Date().toISOString(),
      });

      setSuccess('Perfil atualizado com sucesso!');
      setError('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erro ao atualizar perfil');
      setSuccess('');
    }
  };

  return (
    <Layout>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Perfil
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email do Parceiro"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle1" gutterBottom>
              Interesses
            </Typography>
            <Autocomplete
              multiple
              options={categories}
              value={selectedInterests}
              onChange={(_, newValue) => setSelectedInterests(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Selecione seus interesses"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Selecione seus interesses para receber sugestões de encontros personalizadas
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveProfile}
            sx={{ mt: 2 }}
          >
            Salvar Alterações
          </Button>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Profile; 