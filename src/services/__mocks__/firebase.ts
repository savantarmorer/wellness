import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';

export const app = {} as FirebaseApp;
export const db = {} as Firestore;

export const firebaseConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-auth-domain',
  projectId: 'mock-project-id',
  storageBucket: 'mock-storage-bucket',
  messagingSenderId: 'mock-sender-id',
  appId: 'mock-app-id'
}; 