import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const DailyAssessment = React.lazy(() => import('./pages/DailyAssessment'));
const Statistics = React.lazy(() => import('./pages/Statistics'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const HelloWorld = React.lazy(() => import('./components/HelloWorld'));
const RelationshipContext = React.lazy(() => import('./pages/RelationshipContext'));

const LoadingScreen = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    background: (theme) => `radial-gradient(circle at 50% 50%, ${theme.palette.primary.main}20 0%, transparent 50%),
                           radial-gradient(circle at 100% 0%, ${theme.palette.secondary.main}20 0%, transparent 50%)`,
  }}>
    <CircularProgress />
  </Box>
);

function App() {
  const { currentUser } = useAuth();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<HelloWorld />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/assessment" element={currentUser ? <DailyAssessment /> : <Navigate to="/login" />} />
        <Route path="/statistics" element={currentUser ? <Statistics /> : <Navigate to="/login" />} />
        <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/relationship-context" element={currentUser ? <RelationshipContext /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App; 