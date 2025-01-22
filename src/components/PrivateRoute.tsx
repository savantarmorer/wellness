import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<Props> = ({ children }) => {
  console.log('PrivateRoute rendering');
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute state:', {
    hasCurrentUser: !!currentUser,
    loading,
    pathname: location.pathname
  });

  if (loading) {
    console.log('PrivateRoute: Loading state');
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    console.log('PrivateRoute: No current user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('PrivateRoute: Rendering children');
  return <>{children}</>;
}; 