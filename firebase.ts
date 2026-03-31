import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling for better stability in proxied environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
// Explicitly set persistence to local to handle iframe storage issues
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Auth persistence failed:", err));

export const storage = getStorage(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to test connectivity
    // Using getDocFromServer forces a network request
    await getDocFromServer(doc(db, '_internal_', 'connectivity_test'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    // If it's just "not found" or "permission-denied", that's a success for connectivity
    if (error.code === 'not-found' || error.code === 'permission-denied') {
      console.log("Firestore connection verified (reached server).");
      return;
    }
    
    if (error.code === 'unavailable' || (error.message && error.message.includes('the client is offline'))) {
      console.warn("Firestore is currently in offline mode. The app will sync when connection is restored.");
    } else {
      console.error("Firestore connection test failed:", error.message || error);
    }
  }
}

testConnection();
