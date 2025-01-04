import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  alpha,
  styled,
  Avatar,
  Tooltip,
  Button,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  BarChart as ChartIcon,
  Psychology as InsightIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(8px)',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    paddingTop: '64px',
    height: '100%',
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: 'none',
  color: theme.palette.text.primary,
  height: '64px',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.up('sm')]: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.primary.main, 0.05),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

interface Props {
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { text: 'Início', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Avaliação Diária', icon: <AssessmentIcon />, path: '/assessment' },
    { text: 'Estatísticas', icon: <ChartIcon />, path: '/statistics' },
    { text: 'Análises', icon: <InsightIcon />, path: '/analysis' },
    { text: 'Perfil', icon: <PersonIcon />, path: '/profile' },
    { text: 'Relacionamento', icon: <FavoriteIcon />, path: '/relationship' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          Wellness Monitor
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            opacity: 0.8 
          }}
        >
          Fortalecendo relacionamentos
        </Typography>
      </Box>

      {currentUser && (
        <Box sx={{ px: 3, mb: 3 }}>
          <StyledPaper>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              {currentUser.email?.[0].toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {currentUser.email}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: { xs: '0.675rem', sm: '0.75rem' },
                }}
              >
                Conectado
              </Typography>
            </Box>
          </StyledPaper>
        </Box>
      )}

      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                minHeight: { xs: 44, sm: 48 },
                px: { xs: 2, sm: 3 },
                transition: 'all 0.2s ease-in-out',
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: { xs: 40, sm: 48 },
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  sx: {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path 
                      ? theme.palette.primary.main 
                      : theme.palette.text.primary,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            py: { xs: 1, sm: 1.5 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            borderColor: alpha(theme.palette.error.main, 0.5),
            '&:hover': {
              borderColor: theme.palette.error.main,
              backgroundColor: alpha(theme.palette.error.main, 0.05),
            }
          }}
        >
          Sair
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <StyledAppBar position="fixed">
        <Toolbar sx={{ minHeight: '64px !important', height: '64px' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              display: { sm: 'none' },
              fontWeight: 600
            }}
          >
            Wellness Monitor
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationBell />
            {currentUser && (
              <Tooltip title={currentUser.email || ''}>
                <Avatar 
                  sx={{ 
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  {currentUser.email?.[0].toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </StyledAppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 },
        }}
      >
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              paddingTop: '64px',
            },
          }}
        >
          {drawer}
        </StyledDrawer>
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
          }}
          open
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', sm: '64px' },
          background: alpha(theme.palette.background.default, 0.6),
          minHeight: 'calc(100vh - 64px)',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
          '& .MuiContainer-root': {
            px: { xs: 1, sm: 2, md: 3 }
          },
          '& .MuiTypography-h4': {
            fontSize: { xs: '1.5rem', sm: '2rem' }
          },
          '& .MuiTypography-h5': {
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          },
          '& .MuiTypography-h6': {
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          },
          '& .MuiButton-root': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          },
          '& .MuiCard-root': {
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 20px -5px ${alpha(theme.palette.common.black, 0.2)}`,
            }
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
}; 