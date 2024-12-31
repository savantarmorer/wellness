import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
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
import Discrepancies from './pages/Discrepancies';
import ReloadPrompt from './components/ReloadPrompt';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
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
              path="/discrepancies"
              element={
                <PrivateRoute>
                  <Discrepancies />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ReloadPrompt />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 