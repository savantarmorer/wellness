import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDoc,
} from 'firebase/firestore';
import { AssessmentData, AssessmentWithMetadata, ValidatedScalesAssessment } from '../types';

const ASSESSMENTS_COLLECTION = 'assessments';

export const saveAssessment = async (
  userId: string,
  partnerId: string,
  data: AssessmentData | ValidatedScalesAssessment
): Promise<string> => {
  try {
    const assessmentData = {
      ...data,
      userId,
      partnerId,
      timestamp: new Date().toISOString(),
    };

    const docRef = await addDoc(
      collection(db, ASSESSMENTS_COLLECTION),
      assessmentData
    );

    return docRef.id;
  } catch (error) {
    console.error('Error saving assessment:', error);
    throw new Error('Failed to save assessment');
  }
};

export const getRecentAssessments = async (
  userId: string,
  partnerId: string,
  limitCount = 30
): Promise<AssessmentWithMetadata[]> => {
  try {
    const assessmentsRef = collection(db, ASSESSMENTS_COLLECTION);
    const q = query(
      assessmentsRef,
      where('userId', '==', userId),
      where('partnerId', '==', partnerId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AssessmentWithMetadata[];
  } catch (error) {
    console.error('Error fetching recent assessments:', error);
    throw new Error('Failed to fetch recent assessments');
  }
};

export const getLatestAssessment = async (
  userId: string,
  partnerId: string
): Promise<AssessmentWithMetadata | null> => {
  try {
    const assessmentsRef = collection(db, ASSESSMENTS_COLLECTION);
    const q = query(
      assessmentsRef,
      where('userId', '==', userId),
      where('partnerId', '==', partnerId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as AssessmentWithMetadata;
  } catch (error) {
    console.error('Error fetching latest assessment:', error);
    throw new Error('Failed to fetch latest assessment');
  }
};

export const getAssessmentById = async (
  assessmentId: string
): Promise<AssessmentWithMetadata | null> => {
  try {
    const docRef = doc(db, ASSESSMENTS_COLLECTION, assessmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as AssessmentWithMetadata;
  } catch (error) {
    console.error('Error fetching assessment by ID:', error);
    throw new Error('Failed to fetch assessment');
  }
};

export const getAssessmentsByDateRange = async (
  userId: string,
  partnerId: string,
  startDate: Date,
  endDate: Date
): Promise<AssessmentWithMetadata[]> => {
  try {
    const assessmentsRef = collection(db, ASSESSMENTS_COLLECTION);
    const q = query(
      assessmentsRef,
      where('userId', '==', userId),
      where('partnerId', '==', partnerId),
      where('timestamp', '>=', startDate.toISOString()),
      where('timestamp', '<=', endDate.toISOString()),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AssessmentWithMetadata[];
  } catch (error) {
    console.error('Error fetching assessments by date range:', error);
    throw new Error('Failed to fetch assessments');
  }
}; 