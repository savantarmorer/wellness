import { collection, query, where, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { DailyAssessment, RelationshipContext } from '../types';
import { checkAndUpdatePartnerAnalysis } from './analysisHistoryService';

export interface PartnerUpdate {
  type: 'assessment' | 'context' | 'analysis';
  data: any;
  timestamp: Timestamp;
}

export const subscribeToPartnerAssessments = (
  partnerId: string,
  onUpdate: (assessment: DailyAssessment) => void
) => {
  const today = new Date().toISOString().split('T')[0];
  const assessmentsRef = collection(db, 'assessments');
  const q = query(
    assessmentsRef,
    where('userId', '==', partnerId),
    where('date', '==', today)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const assessment = {
          id: change.doc.id,
          ...change.doc.data()
        } as DailyAssessment;
        onUpdate(assessment);
      }
    });
  }, (error) => {
    if (error.code === 'permission-denied') {
      console.log('Permission denied for partner assessments - user likely logged out');
      return;
    }
    console.error('Error in partner assessments subscription:', error);
  });
};

export const subscribeToPartnerContext = (
  partnerId: string,
  onUpdate: (context: RelationshipContext) => void
) => {
  const contextRef = doc(db, 'relationshipContexts', partnerId);
  
  return onSnapshot(contextRef, (snapshot) => {
    if (snapshot.exists()) {
      const context = {
        id: snapshot.id,
        ...snapshot.data()
      } as RelationshipContext;
      onUpdate(context);
    }
  }, (error) => {
    if (error.code === 'permission-denied') {
      console.log('Permission denied for partner context - user likely logged out');
      return;
    }
    console.error('Error in partner context subscription:', error);
  });
};

export const subscribeToPartnerAnalysis = (
  userId: string,
  partnerId: string,
  onUpdate: (analysis: any) => void
) => {
  const analysisRef = collection(db, 'gptAnalysis');
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    analysisRef,
    where('userId', '==', partnerId),
    where('date', '==', today)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const analysis = {
          id: change.doc.id,
          ...change.doc.data()
        };
        onUpdate(analysis);
        
        // Trigger analysis update if needed
        checkAndUpdatePartnerAnalysis(userId, partnerId, today).catch(error => {
          console.error('Error updating partner analysis:', error);
        });
      }
    });
  }, (error) => {
    if (error.code === 'permission-denied') {
      console.log('Permission denied for partner analysis - user likely logged out');
      return;
    }
    console.error('Error in partner analysis subscription:', error);
  }); 
}; 