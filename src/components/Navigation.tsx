import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DateRangeIcon from '@mui/icons-material/DateRange';

export const routes = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    path: '/assessment',
    label: 'Avaliações',
    icon: <AssessmentIcon />,
  },
  {
    path: '/statistics',
    label: 'Estatísticas',
    icon: <TimelineIcon />,
  },
  {
    path: '/orbital-analysis',
    label: 'Análise',
    icon: <AssessmentIcon />,
  },
  {
    path: '/analysis-history',
    label: 'Histórico',
    icon: <HistoryIcon />,
  },
  {
    path: '/profile',
    label: 'Perfil',
    icon: <PersonIcon />,
  },
  {
    path: '/relationship',
    label: 'Relacionamento',
    icon: <FavoriteIcon />,
  },
  {
    path: '/date-suggestions',
    label: 'Sugestões',
    icon: <DateRangeIcon />,
  },
]; 