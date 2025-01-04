import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { DailyAssessmentWithRatings } from '../types';

export const getAssessmentHistory = async (userId: string): Promise<DailyAssessmentWithRatings[]> => {
  try {
    const assessmentsRef = collection(db, 'assessments');
    const q = query(assessmentsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyAssessmentWithRatings[];
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    throw error;
  }
}; 