import {
  Favorite,
  Chat,
  Psychology,
  Group,
  Handshake,
  SentimentSatisfied,
  Diversity3,
  Support,
} from '@mui/icons-material';

export const categoryIcons = {
  communication: Chat,
  emotional_connection: Favorite,
  conflict_resolution: Handshake,
  trust: Psychology,
  shared_values: Group,
  intimacy: SentimentSatisfied,
  support: Support,
  growth: Diversity3,
};

export type CategoryIcon = keyof typeof categoryIcons; 