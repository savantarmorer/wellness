import React, { useState } from 'react';
import { RelationshipOrchestrator } from '../services/relationshipOrchestratorNew';
import { MoodType, MoodEntry, MoodTrackingForm } from '../types';
import {
  Box,
  Typography,
  Grid,
  Button,
  Slider,
  TextField,
  IconButton,
  IconButtonProps,
  styled
} from '@mui/material';

interface MoodTrackerProps {
  currentUser: { uid: string } | null;
  onClose?: () => void;
  onMoodUpdate?: (entry: MoodEntry) => void;
}

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

export const MOOD_EMOJIS: Record<MoodType, string> = {
  'feliz': '😊',
  'animado': '🤗',
  'grato': '🙏',
  'calmo': '😌',
  'satisfeito': '😊',
  'amado': '🥰',
  'ansioso': '😰',
  'estressado': '😫',
  'triste': '😢',
  'irritado': '😠',
  'frustrado': '😤',
  'exausto': '😩',
  'confuso': '🤔',
  'solitário': '😔',
  'neutral': '😐',
  'content': '😌'
};

export const MoodTracker: React.FC<MoodTrackerProps> = ({ currentUser, onClose, onMoodUpdate }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const [moodIntensity, setMoodIntensity] = useState(3);
  const [moodNotes, setMoodNotes] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const orchestrator = new RelationshipOrchestrator();

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };

  const handleIntensityChange = (_: Event, value: number | number[]) => {
    setMoodIntensity(Array.isArray(value) ? value[0] : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const formData: MoodTrackingForm = {
        userId: currentUser.uid,
        mood: {
          primary: selectedMood,
          intensity: moodIntensity,
          notes: moodNotes
        },
        timestamp: new Date().toISOString()
      };

      const result = await orchestrator.processFormSubmission(
        currentUser.uid,
        formData,
        'mood_tracking'
      );

      if (result.success) {
        setMoodEntries(prevEntries => [
          {
            id: `${currentUser.uid}_${new Date().toISOString()}`,
            userId: currentUser.uid,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            mood: {
              primary: selectedMood,
              intensity: moodIntensity,
              notes: moodNotes
            }
          },
          ...prevEntries
        ]);
        
        // Reset form
        setSelectedMood('neutral');
        setMoodIntensity(3);
        setMoodNotes('');
        onClose?.();
      } else {
        console.error('Error submitting mood:', result.error);
      }
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Como você está se sentindo?
      </Typography>
      <Typography variant="body1" gutterBottom>
        Selecione seu humor atual:
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={1} justifyContent="center">
          {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
            <Grid item key={mood}>
              <StyledEmojiButton
                onClick={() => handleMoodSelect(mood as MoodType)}
                isSelected={selectedMood === mood}
              >
                {emoji}
              </StyledEmojiButton>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography id="intensity-slider" gutterBottom>
          Intensidade:
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={moodIntensity}
            onChange={handleIntensityChange}
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            aria-labelledby="intensity-slider"
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Notas (opcional)"
          value={moodNotes}
          onChange={(e) => setMoodNotes(e.target.value)}
          sx={{ mb: 3 }}
        />
      </Box>

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar Humor'}
      </Button>
    </Box>
  );
}; 