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

export const addEvent = async (event: Omit<DateEvent, 'id'>) => {
  try {
    const eventData = {
      title: event.title,
      date: Timestamp.fromDate(event.date),
      time: event.time || '',
      location: event.location || '',
      isRecurring: event.isRecurring || false,
      recurringDay: event.recurringDay || '',
      createdBy: event.createdBy,
      createdAt: Timestamp.now(),
      accepted: event.accepted ?? null,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), eventData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const getEvents = async (userId: string, partnerId?: string) => {
  try {
    const eventsRef = collection(db, COLLECTION_NAME);
    const q = query(
      eventsRef,
      where('createdBy', 'in', partnerId ? [userId, partnerId] : [userId])
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    })) as DateEvent[];
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