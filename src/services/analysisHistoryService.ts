import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { RelationshipAnalysis } from './gptService';
import type { ConsensusFormAnalysis } from './gptService';

export interface ConsensusFormData {
  type: 'consensus_form';
  answers: Record<string, string>;
  date: string;
  scores?: {
    consensus: number;
    affection: number;
    cohesion: number;
    satisfaction: number;
    conflict: number;
    general: number;
    overall: number;
  };
  analysis?: ConsensusFormAnalysis;
}

export interface AnalysisRecord {
  id?: string;
  userId: string;
  partnerId?: string;
  date: string;
  type: 'individual' | 'collective';
  analysis: string | RelationshipAnalysis | ConsensusFormData;
  createdAt: string;
}

const calculateConsensusScores = (answers: Record<string, string>): ConsensusFormData['scores'] => {
  const scoreMap: Record<string, number> = {};
  
  // Convert string values to numbers for Likert scale questions (1-5)
  Object.entries(answers).forEach(([key, value]) => {
    if (!isNaN(Number(value))) {
      scoreMap[key] = Number(value);
    } else {
      // Convert frequency options to numbers
      switch (value.toLowerCase()) {
        case 'diariamente':
        case 'todos os dias':
        case 'uma vez por dia':
        case 'frequentemente':
          scoreMap[key] = 5;
          break;
        case 'quase todos os dias':
        case 'algumas vezes por semana':
        case 'às vezes':
          scoreMap[key] = 4;
          break;
        case 'raramente':
          scoreMap[key] = 2;
          break;
        case 'nunca':
          scoreMap[key] = 1;
          break;
        case 'sim':
          scoreMap[key] = 1;
          break;
        case 'não':
          scoreMap[key] = 5;
          break;
        default:
          scoreMap[key] = 3;
      }
    }
  });

  // Calculate category scores
  const consensusScore = [
    'finances', 'recreation', 'religion', 'friendships', 'conventions'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 5;

  const affectionScore = [
    'affection_demonstration', 'kissing', 'sexual_satisfaction'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const cohesionScore = [
    'time_together', 'stimulating_ideas', 'projects_together'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const satisfactionScore = [
    'divorce_thoughts', 'regret', 'arguments'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const conflictScore = [
    'leave_after_fight', 'calm_discussion', 'lose_patience'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 3;

  const generalScore = [
    'too_tired', 'lack_affection'
  ].reduce((sum, key) => sum + (scoreMap[key] || 0), 0) / 2;

  // Calculate overall score (weighted average)
  const weights = {
    consensus: 0.2,
    affection: 0.2,
    cohesion: 0.2,
    satisfaction: 0.2,
    conflict: 0.15,
    general: 0.05
  };

  const overallScore =
    consensusScore * weights.consensus +
    affectionScore * weights.affection +
    cohesionScore * weights.cohesion +
    satisfactionScore * weights.satisfaction +
    conflictScore * weights.conflict +
    generalScore * weights.general;

  return {
    consensus: Math.round(consensusScore * 100) / 100,
    affection: Math.round(affectionScore * 100) / 100,
    cohesion: Math.round(cohesionScore * 100) / 100,
    satisfaction: Math.round(satisfactionScore * 100) / 100,
    conflict: Math.round(conflictScore * 100) / 100,
    general: Math.round(generalScore * 100) / 100,
    overall: Math.round(overallScore * 100) / 100
  };
};

export const saveAnalysis = async (
  userId: string,
  type: 'individual' | 'collective',
  analysis: string | RelationshipAnalysis | ConsensusFormData,
  partnerId?: string
): Promise<void> => {
  try {
    const analysisCollection = collection(db, 'gptAnalysis');
    
    // Calculate scores for consensus form
    if (typeof analysis === 'object' && 'type' in analysis && analysis.type === 'consensus_form') {
      analysis.scores = calculateConsensusScores(analysis.answers);
    }

    // Ensure analysis is properly stringified if it's an object
    const processedAnalysis = typeof analysis === 'string' 
      ? analysis 
      : JSON.stringify(analysis);

    const analysisData = {
      userId,
      type,
      analysis: processedAnalysis,
      date: new Date().toISOString().split('T')[0],
      createdAt: Timestamp.now(),
    };

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
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Raw Firestore document:', {
        id: doc.id,
        data: data
      });
      return {
        id: doc.id,
        ...data
      };
    }) as AnalysisRecord[];

    console.log('Processed analysis records:', records);
    return records;
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
}; 