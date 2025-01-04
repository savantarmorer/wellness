import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  partnerEmail?: string;
  partnerName?: string;
  relationshipStartDate?: string;
  preferences?: {
    notifications: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
}

interface UserDataContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!currentUser) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserData({
          id: userDoc.id,
          ...userDoc.data(),
        } as UserData);
      } else {
        setError('User data not found');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const refreshUserData = async () => {
    setLoading(true);
    await fetchUserData();
  };

  const value = {
    userData,
    loading,
    error,
    refreshUserData,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}; 