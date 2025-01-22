import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export const createUserDocument = async (
  userId: string,
  data: {
    name: string;
    email: string;
  }
): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', userId);
    const userData: User = {
      id: userId,
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDoc, userData);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}; 