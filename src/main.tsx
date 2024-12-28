import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <UserDataProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </UserDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Register service worker for PWA support
serviceWorkerRegistration.register(); 