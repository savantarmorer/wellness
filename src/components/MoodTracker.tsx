import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  TextField,
  Chip,
  IconButton,
  IconButtonProps,
  Autocomplete,
  Button,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { MoodEntry, MoodType } from '../types/index';
import { saveMoodEntry } from '../services/moodService';
import { useAuth } from '../contexts/AuthContext';

export const MOOD_EMOJIS: Record<MoodType, string> = {
  'feliz': '😊',
  'animado': '🤗',
  'grato': '🙏',
  'calmo': '😌',
  'satisfeito': '😃',
  'ansioso': '😰',
  'estressado': '😫',
  'triste': '😢',
  'irritado': '😠',
  'frustrado': '😤',
  'exausto': '😩',
  'esperançoso': '🤔',
  'confuso': '😕',
  'solitário': '😔',
  'amado': '🥰'
};

const COMMON_ACTIVITIES = [
  'Exercício',
  'Meditação',
  'Trabalho',
  'Estudo',
  'Socialização',
  'Hobby',
  'Descanso',
  'Família',
  'Lazer',
  'Terapia'
];

interface StyledEmojiButtonProps extends IconButtonProps {
  isSelected?: boolean;
}

const StyledEmojiButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<StyledEmojiButtonProps>(({ theme, isSelected }) => ({
  fontSize: '2rem',
  padding: theme.spacing(1),
  margin: theme.spacing(0.5),
  backgroundColor: isSelected ? theme.palette.primary.light : 'transparent',
  '&:hover': {
    backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.action.hover,
    transform: 'scale(1.1)',
  },
  transition: 'transform 0.2s',
}));

interface MoodTrackerProps {
  onMoodUpdate?: (mood: MoodEntry) => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({ onMoodUpdate }) => {
  const { currentUser } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodIntensity, setMoodIntensity] = useState<number>(5);
  const [activities, setActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedMood) return;

    try {
      setLoading(true);
      await saveMoodEntry(
        currentUser.uid,
        selectedMood,
        moodIntensity,
        activities,
        notes
      );
      if (onMoodUpdate) {
        onMoodUpdate({
          id: Date.now().toString(),
          userId: currentUser.uid,
          timestamp: new Date().toISOString(),
          mood: {
            primary: selectedMood,
            intensity: moodIntensity
          },
          context: activities?.length ? { activities } : undefined,
          notes,
          createdAt: new Date().toISOString()
        });
      }
      setSuccess('Humor registrado com sucesso!');
      // Reset form
      setSelectedMood(null);
      setMoodIntensity(5);
      setActivities([]);
      setNotes('');
    } catch (error) {
      console.error('Error saving mood:', error);
      setError('Erro ao salvar o humor. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Como você está se sentindo?
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
            <Grid item key={mood}>
              <Button
                variant={selectedMood === mood ? 'contained' : 'outlined'}
                onClick={() => handleMoodSelect(mood as MoodType)}
                sx={{ minWidth: 'auto', p: 1 }}
              >
                {emoji}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {selectedMood && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Intensidade do humor
          </Typography>
          <Box sx={{ px: 2, mb: 3 }}>
            <Slider
              value={moodIntensity}
              min={1}
              max={5}
              step={1}
              marks
              onChange={(_, value) => setMoodIntensity(value as number)}
              valueLabelDisplay="auto"
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar registro de humor'}
          </Button>
        </>
      )}
    </Box>
  );
}; 