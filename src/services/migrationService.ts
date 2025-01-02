import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { GPTAnalysis } from '../types';

export const recreateAnalysisHistory = async (userId: string) => {
  try {
    console.log('Starting migration for user:', userId);
    
    // Get all analyses from gptAnalysis collection
    const gptAnalysisRef = collection(db, 'gptAnalysis');
    const q = query(gptAnalysisRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    console.log('Found analyses:', querySnapshot.size);

    // Migrate each analysis
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const data = docSnapshot.data();
        console.log('Processing analysis:', docSnapshot.id);
        
        // Convert the analysis data
        let analysisData: GPTAnalysis = {
          id: docSnapshot.id,
          userId: data.userId,
          partnerId: data.partnerId || '',
          date: data.date,
          type: data.type,
          analysis: typeof data.analysis === 'string' 
            ? JSON.parse(data.analysis)
            : data.analysis,
          createdAt: data.createdAt
        };

        // Ensure the analysis has the correct structure
        if (!analysisData.analysis.emotionalDynamics) {
          analysisData.analysis.emotionalDynamics = {
            emotionalSecurity: 0,
            intimacyBalance: {
              score: 0,
              areas: {
                emotional: 0,
                physical: 0,
                intellectual: 0,
                shared: 0
              }
            },
            conflictResolution: {
              style: 'collaborative',
              effectiveness: 0,
              patterns: []
            }
          };
        }

        // Create new document in analysisHistory
        const analysisHistoryRef = collection(db, 'analysisHistory');
        const newDocRef = doc(analysisHistoryRef, docSnapshot.id);
        await setDoc(newDocRef, analysisData);
        console.log('Migrated analysis:', docSnapshot.id);
      } catch (error) {
        console.error('Error migrating analysis:', docSnapshot.id, error);
      }
    }

    console.log('Analysis history migration completed successfully');
  } catch (error) {
    console.error('Error migrating analysis history:', error);
    throw error;
  }
}; 