import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { RelationshipAnalysis } from './gptService';

export interface AnalysisRecord {
  id?: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: string | RelationshipAnalysis;
  createdAt: string;
}

export const saveAnalysis = async (
  userId: string,
  type: 'individual' | 'collective',
  analysis: string | RelationshipAnalysis,
  partnerId?: string
): Promise<void> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    
    // If analysis is a string (individual analysis), store it directly
    // If it's a RelationshipAnalysis object (collective analysis), ensure it has all required fields
    const formattedAnalysis = typeof analysis === 'string' ? analysis : {
      overallHealth: analysis.overallHealth || { score: 0, trend: 'stable' },
      categories: analysis.categories || {},
      strengthsAndChallenges: analysis.strengthsAndChallenges || { strengths: [], challenges: [] },
      communicationSuggestions: analysis.communicationSuggestions || [],
      actionItems: analysis.actionItems || [],
      relationshipDynamics: analysis.relationshipDynamics || {
        positivePatterns: [],
        concerningPatterns: [],
        growthAreas: []
      }
    };

    const analysisData = {
      userId,
      type,
      analysis: formattedAnalysis,
      date: new Date().toISOString().split('T')[0],
      createdAt: Timestamp.now(),
    };

    // Only add partnerId if it's defined
    if (partnerId) {
      Object.assign(analysisData, { partnerId });
    }

    await addDoc(analysisCollection, analysisData);
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
};

export const getAnalysisForDate = async (
  userId: string,
  date: string,
  type: 'individual' | 'collective'
): Promise<AnalysisRecord | null> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    const q = query(
      analysisCollection,
      where('userId', '==', userId),
      where('date', '==', date),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as AnalysisRecord;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};

export const getAnalysisHistory = async (userId: string): Promise<AnalysisRecord[]> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    const q = query(
      analysisCollection,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AnalysisRecord[];
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
}; 