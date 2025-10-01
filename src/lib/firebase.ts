
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "studio-9206476147-10f1d",
  "appId": "1:187269746863:web:db4d787dd48478f6dfc45a",
  "apiKey": "AIzaSyBv1yrT3Ct3I7Kgqu8uaL0Iu8ANlWN4B6o",
  "authDomain": "studio-9206476147-10f1d.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "187269746863"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
