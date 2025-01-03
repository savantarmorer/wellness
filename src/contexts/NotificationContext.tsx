import React, { createContext, useContext, useState, useEffect } from 'react';
import { requestNotificationPermission } from '../services/notificationService';
import { Alert, Snackbar } from '@mui/material';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  notificationsEnabled: boolean;
  requestPermission: () => Promise<void>;
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    };

    checkPermission();
  }, []);

  const requestPermission = async () => {
    const token = await requestNotificationPermission();
    setNotificationsEnabled(!!token);
  };

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const value = {
    notificationsEnabled,
    requestPermission,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar 
        open={open} 
        autoHideDuration={6000} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={notification?.type || 'info'} 
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}; 