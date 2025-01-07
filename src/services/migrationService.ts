import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { GPTAnalysis, RelationshipAnalysis as RelationshipAnalysisType, MoodType } from '../types';

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
            ? JSON.parse(data.analysis) as RelationshipAnalysisType
            : data.analysis,
          createdAt: data.createdAt,
          timestamp: new Date().toISOString(),
          version: '1.0',
          metadata: {
            assessmentCount: 1,
            timeSpan: '1 day',
            confidence: 0.8
          }
        };

        // Ensure the analysis has the correct structure
        if (typeof analysisData.analysis === 'object' && !analysisData.analysis.emotionalDynamics) {
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
              patterns: [],
              confidence: 0.8
            },
            synchronicity: 0.8,
            stability: 0.7,
            patterns: {
              user: {
                dominant: 'feliz' as MoodType,
                frequency: {
                  feliz: 0,
                  animado: 0,
                  grato: 0,
                  calmo: 0,
                  satisfeito: 0,
                  amado: 0,
                  ansioso: 0,
                  estressado: 0,
                  triste: 0,
                  irritado: 0,
                  frustrado: 0,
                  exausto: 0,
                  confuso: 0,
                  solitário: 0,
                  neutral: 0,
                  content: 0
                },
                transitions: {}
              },
              partner: {
                dominant: 'feliz' as MoodType,
                frequency: {
                  feliz: 0,
                  animado: 0,
                  grato: 0,
                  calmo: 0,
                  satisfeito: 0,
                  amado: 0,
                  ansioso: 0,
                  estressado: 0,
                  triste: 0,
                  irritado: 0,
                  frustrado: 0,
                  exausto: 0,
                  confuso: 0,
                  solitário: 0,
                  neutral: 0,
                  content: 0
                },
                transitions: {}
              }
            },
            insights: {
              strengths: [],
              challenges: [],
              recommendations: []
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