import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { DailyAssessmentWithRatings } from '../types';

export const getAssessmentHistory = async (userId: string): Promise<DailyAssessmentWithRatings[]> => {
  try {
    const assessmentsRef = collection(db, 'assessments');
    const q = query(assessmentsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Validate that the assessment has the required ratings field
        if (!data.ratings || typeof data.ratings !== 'object') {
          console.warn('Invalid assessment found:', { id: doc.id, data });
          return null;
        }
        return {
          id: doc.id,
          ...data
        } as DailyAssessmentWithRatings;
      })
      .filter((assessment): assessment is DailyAssessmentWithRatings => assessment !== null);
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    throw error;
  }
}; 