import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { config } from '../config';

// Initialize Firebase
const app = initializeApp(config.firebase);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 