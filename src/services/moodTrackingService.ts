import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { MoodEntry } from '../types';

export const getUserMoodEntries = async (userId: string): Promise<MoodEntry[]> => {
  try {
    const moodEntriesRef = collection(db, 'moodEntries');
    const q = query(
      moodEntriesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MoodEntry[];
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return [];
  }
}; 