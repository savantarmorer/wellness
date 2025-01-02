import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { subscribeToPartnerAssessments, subscribeToPartnerContext, subscribeToPartnerAnalysis } from '../services/partnerSyncService';
import { DailyAssessment, RelationshipContext } from '../types';

interface UserData {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  partnerEmail?: string;
  partnerName?: string;
  relationshipStartDate?: string;
  interests?: string[];
  preferences?: {
    notifications: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
}

interface PartnerData {
  assessment?: DailyAssessment;
  context?: RelationshipContext;
  analysis?: any;
}

export type AuthContextType = {
  currentUser: User | null;
  userData: UserData | null;
  partnerData: PartnerData;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribePartner: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setCurrentUser(user);

      try {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          
          unsubscribeUser = onSnapshot(userDocRef, async (doc) => {
            console.log('User data updated:', doc.exists());
            
            if (doc.exists()) {
              const data = { id: doc.id, ...doc.data() } as UserData;
              setUserData(data);

              if (data.partnerId && !unsubscribePartner) {
                console.log('Setting up partner subscriptions:', data.partnerId);
                
                const unsubAssessment = subscribeToPartnerAssessments(
                  data.partnerId,
                  (assessment) => setPartnerData(prev => ({ ...prev, assessment }))
                );

                const unsubContext = subscribeToPartnerContext(
                  data.partnerId,
                  (context) => setPartnerData(prev => ({ ...prev, context }))
                );

                const unsubAnalysis = subscribeToPartnerAnalysis(
                  user.uid,
                  data.partnerId,
                  (analysis) => setPartnerData(prev => ({ ...prev, analysis }))
                );

                unsubscribePartner = () => {
                  unsubAssessment();
                  unsubContext();
                  unsubAnalysis();
                };
              }
            } else {
              setUserData(null);
            }
          });
        } else {
          setUserData(null);
          setPartnerData({});
          if (unsubscribePartner) {
            unsubscribePartner();
            unsubscribePartner = undefined;
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Error setting up user data');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePartner) unsubscribePartner();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      setError('Falha no login. Verifique suas credenciais.');
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Signup error:', error);
      setError('Falha no cadastro. Tente novamente.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Falha ao sair. Tente novamente.');
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserData({ id: userDoc.id, ...userDoc.data() } as UserData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setError('Falha ao atualizar dados do usuário.');
    }
  };

  const value = {
    currentUser,
    userData,
    partnerData,
    loading: loading || !initialized,
    error,
    login,
    signup,
    logout,
    refreshUserData,
  };

  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 