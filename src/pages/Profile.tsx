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
  Divider,
} from '@mui/material';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { categories } from '../services/dateSuggestionsService';
import RelationshipConsensusForm from '../components/RelationshipConsensusForm';
import ConsensusFormHistory from '../components/ConsensusFormHistory';

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
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Profile Info Section */}
        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          mt: { xs: 2, sm: 3, md: 4 }, 
          mb: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, sm: 3 }
        }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
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
              size="small"
            />

            <TextField
              fullWidth
              label="Email do Parceiro"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />

            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 500,
                mt: 2 
              }}
            >
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
                  size="small"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...otherProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      {...otherProps}
                    />
                  );
                })
              }
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Selecione seus interesses para receber sugestões de encontros personalizadas
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveProfile}
            fullWidth
            sx={{ 
              mt: 2,
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Salvar Alterações
          </Button>
        </Paper>

        {/* Relationship Assessment Section */}
        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          mb: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, sm: 3 }
        }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
            Avaliação do Relacionamento
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            paragraph
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Este formulário ajuda a avaliar diferentes aspectos do seu relacionamento, como comunicação, afeto e satisfação.
            As respostas são confidenciais e serão usadas para gerar insights personalizados.
          </Typography>
          <Divider sx={{ my: { xs: 2, sm: 3 } }} />
          <RelationshipConsensusForm />
        </Paper>

        {/* Assessment History Section */}
        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          mb: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, sm: 3 }
        }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
            Histórico de Avaliações
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            paragraph
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Aqui você pode ver todas as suas avaliações anteriores e acompanhar o progresso do seu relacionamento ao longo do tempo.
          </Typography>
          <Divider sx={{ my: { xs: 2, sm: 3 } }} />
          <ConsensusFormHistory />
        </Paper>
      </Container>
    </Layout>
  );
};

export default Profile; 