import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, collection, collectionGroup, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, Timestamp, addDoc, updateDoc, deleteDoc, getDocFromServer, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Configure Firestore with long-polling and multi-tab persistent cache for reliable iframe/proxy connectivity
if (typeof window !== 'undefined') {
  try {
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    // If already initialized in this runtime, safely ignore
  }
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

export { 
  collection, collectionGroup, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, 
  Timestamp, addDoc, updateDoc, deleteDoc, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, serverTimestamp, orderBy, limit 
};
export type { User };

// Connection test helper can be executed on demand
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code;

  // If Firestore is temporarily operating in offline mode or waiting for backend, warn softly without crashing async listeners
  if (
    errorMessage.includes('Could not reach Cloud Firestore backend') ||
    errorMessage.includes('the client is offline') ||
    errorMessage.includes('Failed to get document because the client is offline') ||
    errorMessage.includes('[code=unavailable]') ||
    errorMessage.includes('code=unavailable') ||
    errorCode === 'unavailable'
  ) {
    console.warn(`[Firestore Offline Mode] Operation ${operationType} on path '${path}' running in local/offline cache.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
