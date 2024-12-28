import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { GPTAnalysis } from '../types';

export const getLatestAnalysis = async (userId: string, partnerId: string): Promise<GPTAnalysis | null> => {
  try {
    const analysisRef = collection(db, 'gptAnalysis');
    const q = query(
      analysisRef,
      where('userId', '==', userId),
      where('partnerId', '==', partnerId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as GPTAnalysis;
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    throw error;
  }
};

export const saveAnalysis = async (analysis: Omit<GPTAnalysis, 'id'>): Promise<GPTAnalysis> => {
  try {
    const analysisRef = collection(db, 'gptAnalysis');
    const docRef = await addDoc(analysisRef, {
      ...analysis,
      createdAt: new Date().toISOString(),
    });

    return {
      id: docRef.id,
      ...analysis,
    };
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
};

export const parseGPTResponse = (response: string): GPTAnalysis['analysis'] => {
  try {
    const parsedResponse = JSON.parse(response);
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing GPT response:', error);
    throw error;
  }
}; 