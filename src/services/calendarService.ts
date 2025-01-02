import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DateEvent } from '../components/DateCalendar';

const COLLECTION_NAME = 'calendar_events';

export const addEvent = async (event: Omit<DateEvent, 'id'>): Promise<DateEvent> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...event,
      start: Timestamp.fromDate(event.start),
      end: Timestamp.fromDate(event.end),
    });

    return {
      ...event,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const getEvents = async (userId: string): Promise<DateEvent[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        start: data.start.toDate(),
        end: data.end.toDate(),
      } as DateEvent;
    });
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

export const updateEventStatus = async (eventId: string, accepted: boolean) => {
  try {
    const eventRef = doc(db, COLLECTION_NAME, eventId);
    await updateDoc(eventRef, { accepted });
  } catch (error) {
    console.error('Error updating event status:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}; 