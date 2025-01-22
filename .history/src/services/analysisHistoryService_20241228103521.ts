import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { AnalysisHistoryItem } from '../types';

export const saveAnalysis = async (data: Omit<AnalysisHistoryItem, 'id'>): Promise<AnalysisHistoryItem> => {
  try {
    const analysisRef = collection(db, 'analysisHistory');
    const docRef = await addDoc(analysisRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });

    return {
      id: docRef.id,
      ...data,
    };
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
};

export const getAnalysisHistory = async (userId: string): Promise<AnalysisHistoryItem[]> => {
  try {
    const analysisRef = collection(db, 'analysisHistory');
    const q = query(analysisRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AnalysisHistoryItem[];
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
}; 