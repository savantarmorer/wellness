import React, { createContext, useContext, useState, useEffect } from 'react';
import { requestNotificationPermission } from '../services/notificationService';

interface NotificationContextType {
  notificationsEnabled: boolean;
  requestPermission: () => Promise<void>;
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

  const value = {
    notificationsEnabled,
    requestPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 