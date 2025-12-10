import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCFqutPXnUbA_eNKdbGiK2V41Pk5Ce3tBo",
  authDomain: "new-day-69f04.firebaseapp.com",
  projectId: "new-day-69f04",
  storageBucket: "new-day-69f04.firebasestorage.app",
  messagingSenderId: "275584764792",
  appId: "1:275584764792:web:003081c98da2b8a50f168d",
  measurementId: "G-LCEKP07C7Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistent cache (new API)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export default app;
