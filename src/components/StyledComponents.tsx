import { styled, alpha } from '@mui/material/styles';
import {
  Button,
  Paper,
  Card,
  TextField,
  Chip,
  AppBar,
  Dialog,
} from '@mui/material';

export const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(1.5, 3),
  },
  fontSize: '0.875rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1rem',
  },
  fontWeight: 600,
  textTransform: 'none',
  '&.MuiButton-contained': {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '&:hover': {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundImage: 'none',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
}));

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  backgroundImage: 'none',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3),
    },
  },
  '& .MuiCardActions-root': {
    padding: theme.spacing(1, 2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(2, 3),
    },
  },
  '&:hover': {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    fontSize: '0.875rem',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1rem',
    },
    '& .MuiOutlinedInput-input': {
      padding: theme.spacing(1.5, 2),
      [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(2, 2.5),
      },
    },
    '&:hover': {
      borderColor: alpha(theme.palette.primary.main, 0.5),
    },
    '&.Mui-focused': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
}));

export const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: 8,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
  },
}));

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundImage: 'none',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    backgroundImage: 'none',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
})); 