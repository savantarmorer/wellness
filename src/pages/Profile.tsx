import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Grid,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../types';

export default function Profile() {
  const { currentUser, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<User>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');

  useEffect(() => {
    if (userData) {
      setEditedData({
        name: userData.name,
        email: userData.email,
      });
    }
  }, [userData]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userData) {
      setEditedData({
        name: userData.name,
        email: userData.email,
      });
    }
    setError(null);
  };

  const handleChange = (field: keyof User) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        ...editedData,
      });

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setError(null);

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handlePartnerDialogOpen = () => {
    setIsPartnerDialogOpen(true);
  };

  const handlePartnerDialogClose = () => {
    setIsPartnerDialogOpen(false);
    setPartnerEmail('');
    setError(null);
  };

  const handlePartnerEmailSubmit = async () => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Buscar o usuário pelo email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', partnerEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found with this email');
        return;
      }

      const partnerDoc = querySnapshot.docs[0];
      const partnerId = partnerDoc.id;

      // Atualizar o documento do usuário atual
      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        partnerId,
      });

      // Atualizar o documento do parceiro
      const partnerRef = doc(db, 'users', partnerId);
      await updateDoc(partnerRef, {
        partnerId: currentUser.uid,
      });

      setSuccess('Partner linked successfully');
      handlePartnerDialogClose();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to link partner');
      console.error('Error linking partner:', err);
    }
  };

  if (!userData) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              mr: 3,
            }}
          >
            {userData.name ? userData.name[0].toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {userData.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {userData.email}
            </Typography>
          </Box>
          {!isEditing && (
            <IconButton onClick={handleEdit} sx={{ ml: 'auto' }}>
              <EditIcon />
            </IconButton>
          )}
        </Box>

        <Grid container spacing={3}>
          {isEditing ? (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editedData.name || ''}
                  onChange={handleChange('name')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editedData.email || ''}
                  onChange={handleChange('email')}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Profile Information
                </Typography>
                {Object.entries(userData).map(([key, value]) => {
                  if (key === 'id' || key === 'partnerId') return null;
                  return (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Typography>
                      <Typography>{value}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          )}
        </Grid>

        {!userData.partnerId && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Partner Connection
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Connect with your partner to share daily assessments and track your relationship wellness together.
            </Typography>
            <Button variant="contained" onClick={handlePartnerDialogOpen}>
              Connect with Partner
            </Button>
          </Box>
        )}

        <Dialog open={isPartnerDialogOpen} onClose={handlePartnerDialogClose}>
          <DialogTitle>Connect with Partner</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your partner's email address to connect your accounts.
            </Typography>
            <TextField
              fullWidth
              label="Partner's Email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePartnerDialogClose}>Cancel</Button>
            <Button onClick={handlePartnerEmailSubmit} variant="contained">
              Connect
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
} 