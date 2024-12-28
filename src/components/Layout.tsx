import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  BarChart as StatisticsIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
    borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.37)}`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
}));

const MenuItemContainer = styled(motion.div)({
  width: '100%',
});

const StyledListItem = styled(ListItem)(({ theme }) => ({
  margin: '8px 16px',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  background: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.25)} 100%)`,
    transform: 'translateX(5px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },
  '&.active': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: '16px',
  padding: '12px',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.25)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const MotionBox = motion(Box);

const GlassBox = styled(Box)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: '24px',
}));

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Avaliação Diária', icon: <AssessmentIcon />, path: '/assessment' },
    { text: 'Estatísticas', icon: <StatisticsIcon />, path: '/statistics' },
    { text: 'Contexto do Relacionamento', icon: <PsychologyIcon />, path: '/relationship-context' },
    { text: 'Perfil', icon: <ProfileIcon />, path: '/profile' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <GlassBox sx={{ m: 2, p: 2 }}>
        <Typography 
          variant="h5" 
          component="div"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Dr. Bread
        </Typography>
      </GlassBox>
      <Divider sx={{ opacity: 0.1, mx: 2 }} />
      <List>
        <AnimatePresence>
          {menuItems.map((item, index) => (
            <MenuItemContainer
              key={item.text}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StyledListItem
                onClick={() => navigate(item.path)}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }
                  }}
                />
              </StyledListItem>
            </MenuItemContainer>
          ))}
          <MenuItemContainer
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ delay: menuItems.length * 0.1 }}
          >
            <StyledListItem
              onClick={handleLogout}
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.error.main, 0.25)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Sair" />
            </StyledListItem>
          </MenuItemContainer>
        </AnimatePresence>
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%), 
                  radial-gradient(circle at 100% 0%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%),
                  linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
    }}>
      <Box
        component="nav"
        sx={{ width: { sm: 250 }, flexShrink: { sm: 0 } }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: theme.zIndex.drawer + 2,
        }}>
          <StyledIconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              display: { sm: 'none' },
            }}
          >
            <MenuIcon />
          </StyledIconButton>
          <NotificationBell />
        </Box>
        <StyledDrawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: 250 },
          }}
        >
          {drawer}
        </StyledDrawer>
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: 250, boxSizing: 'border-box' },
          }}
          open
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <MotionBox
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 250px)` },
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </MotionBox>
    </Box>
  );
}; 