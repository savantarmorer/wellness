import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { RelationshipContext } from '../types';
import { getAuth } from 'firebase/auth';

const ensureAuthenticated = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }
  return auth.currentUser;
};

export const getRelationshipContext = async (userId: string): Promise<RelationshipContext | null> => {
  try {
    const currentUser = ensureAuthenticated();
    
    // Verifica se o usuário tem permissão para acessar este contexto
    if (currentUser.uid !== userId) {
      throw new Error('Insufficient permissions');
    }

    const docRef = doc(db, 'relationshipContexts', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as RelationshipContext;
  } catch (error) {
    console.error('Error fetching relationship context:', error);
    throw error;
  }
};

export const saveRelationshipContext = async (
  userId: string,
  partnerId: string,
  data: Omit<RelationshipContext, 'id' | 'userId' | 'partnerId' | 'createdAt' | 'updatedAt'>
): Promise<RelationshipContext> => {
  try {
    const currentUser = ensureAuthenticated();
    
    // Verifica se o usuário tem permissão para salvar este contexto
    if (currentUser.uid !== userId) {
      throw new Error('Insufficient permissions');
    }

    const docRef = doc(db, 'relationshipContexts', userId);
    const now = new Date().toISOString();
    
    const contextData = {
      userId,
      partnerId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, contextData);

    return {
      id: docRef.id,
      ...contextData,
    };
  } catch (error) {
    console.error('Error saving relationship context:', error);
    throw error;
  }
};

export const updateRelationshipContext = async (
  userId: string,
  partnerId: string,
  data: Omit<RelationshipContext, 'id' | 'userId' | 'partnerId' | 'createdAt' | 'updatedAt'>
): Promise<RelationshipContext> => {
  try {
    const currentUser = ensureAuthenticated();
    
    // Verifica se o usuário tem permissão para atualizar este contexto
    if (currentUser.uid !== userId) {
      throw new Error('Insufficient permissions');
    }

    const docRef = doc(db, 'relationshipContexts', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Context not found');
    }

    const existingData = docSnap.data() as RelationshipContext;
    const contextData = {
      userId,
      partnerId,
      ...data,
      createdAt: existingData.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, contextData);

    return {
      id: docRef.id,
      ...contextData,
    };
  } catch (error) {
    console.error('Error updating relationship context:', error);
    throw error;
  }
}; 