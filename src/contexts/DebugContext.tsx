import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DebugLog {
  timestamp: string;
  action: string;
  data?: any;
}

interface DebugContextType {
  logs: DebugLog[];
  addLog: (action: string, data?: any) => void;
  clearLogs: () => void;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(process.env.NODE_ENV === 'development');

  const addLog = (action: string, data?: any) => {
    if (isDebugMode) {
      const newLog: DebugLog = {
        timestamp: new Date().toISOString(),
        action,
        data
      };
      setLogs(prevLogs => [...prevLogs, newLog]);
      console.log(`[Debug] ${action}`, data || '');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev);
  };

  return (
    <DebugContext.Provider 
      value={{ 
        logs, 
        addLog, 
        clearLogs, 
        isDebugMode, 
        toggleDebugMode 
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}; 