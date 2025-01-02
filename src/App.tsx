import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { NotificationProvider } from './contexts/NotificationContext';
import { PrivateRoute } from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DailyAssessment from './pages/DailyAssessment';
import Statistics from './pages/Statistics';
import AnalysisHistory from './pages/AnalysisHistory';
import Profile from './pages/Profile';
import RelationshipContext from './pages/RelationshipContext';
import ReloadPrompt from './components/ReloadPrompt';
import { useEffect } from 'react';
import { initializeScheduledTasks } from './services/scheduledTasks';
import { useAuth } from './contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import { DateSuggestionsPage } from './pages/DateSuggestionsPage';

function App() {
  const { loading } = useAuth();

  useEffect(() => {
    const cleanupTasks = initializeScheduledTasks();
    return () => {
      cleanupTasks();
    };
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/assessment"
            element={
              <PrivateRoute>
                <DailyAssessment />
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <Statistics />
              </PrivateRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <PrivateRoute>
                <AnalysisHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/relationship"
            element={
              <PrivateRoute>
                <RelationshipContext />
              </PrivateRoute>
            }
          />
          <Route
            path="/date-suggestions"
            element={
              <PrivateRoute>
                <DateSuggestionsPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ReloadPrompt />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App; 