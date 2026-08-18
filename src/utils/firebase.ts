/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, setDoc, Firestore, onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { isCloudinaryConfigured, uploadFileToCloudinary } from './cloudinary';

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth
};

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const CONFIG_KEY = 'kit_game_firebase_config';
const DISABLED_KEY = 'kit_game_firebase_disabled';

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCHiAJ5Ay46CsmNFeamUD5ZE5nwkfusKNQ",
  authDomain: "kit-project-16036.firebaseapp.com",
  projectId: "kit-project-16036",
  storageBucket: "kit-project-16036.firebasestorage.app",
  messagingSenderId: "371201670102",
  appId: "1:371201670102:web:cbc7a33401721ee11b8277",
};

// Safe checking of environment variables
const getEnvConfig = (): FirebaseConfig | null => {
  const metaEnv = (import.meta as any).env || {};
  const apiKey = metaEnv.VITE_FIREBASE_API_KEY;
  const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = metaEnv.VITE_FIREBASE_APP_ID;

  if (apiKey && projectId && appId) {
    return {
      apiKey,
      authDomain: authDomain || '',
      projectId,
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId,
    };
  }
  return null;
};

export const getSavedFirebaseConfig = (): FirebaseConfig | null => {
  const envConfig = getEnvConfig();
  if (envConfig) return envConfig;

  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }

  // Fallback to built-in credentials unless explicitly disabled
  const disabled = localStorage.getItem(DISABLED_KEY) === 'true';
  if (!disabled) {
    return DEFAULT_FIREBASE_CONFIG;
  }

  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig | null) => {
  if (config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.removeItem(DISABLED_KEY);
  } else {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.setItem(DISABLED_KEY, 'true');
  }
};


let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const initFirebase = (): Firestore | null => {
  if (dbInstance) return dbInstance;

  const config = getSavedFirebaseConfig();
  if (!config) return null;

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    return dbInstance;
  } catch (error) {
    console.warn("Firebase initialization skipped or failed:", error);
    return null;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  if (authInstance) return authInstance;
  initFirebase();
  return authInstance;
};

// Firestore helper keys
const DOC_PATH = 'game_data/stage_config';

export const isFirebaseConnected = (): boolean => {
  return initFirebase() !== null;
};

/**
 * Saves all state data to Firestore if connected, otherwise falls back to local storage.
 */
export const saveGameDataToCloud = async (
  questions1: any[],
  questions2: any[],
  actors: any[],
  spinningTime: number,
  speakingTime: number
): Promise<boolean> => {
  const db = initFirebase();
  if (!db) {
    // If not connected, save local storage anyway
    localStorage.setItem('kit_game_ctrl_guess_q', JSON.stringify(questions1));
    localStorage.setItem('kit_game_guess_pannu_q', JSON.stringify(questions2));
    localStorage.setItem('kit_game_actors', JSON.stringify(actors));
    localStorage.setItem('kit_game_spin_time', spinningTime.toString());
    localStorage.setItem('kit_game_speak_time', speakingTime.toString());
    return false;
  }

  try {
    const configDocRef = doc(db, DOC_PATH);
    await setDoc(configDocRef, {
      questions1,
      questions2,
      actors,
      spinningTime,
      speakingTime,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn("Failed to save data to Firestore (saved locally instead):", error);
    return false;
  }
};

/**
 * Loads all state data from Firestore if connected, otherwise falls back to local storage.
 */
export const loadGameDataFromCloud = async (): Promise<{
  questions1: any[] | null;
  questions2: any[] | null;
  actors: any[] | null;
  spinningTime: number | null;
  speakingTime: number | null;
} | null> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn("Firestore load skipped: Browser is offline.");
    return null;
  }

  const db = initFirebase();
  if (!db) return null;

  try {
    const configDocRef = doc(db, DOC_PATH);
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        questions1: data.questions1 || null,
        questions2: data.questions2 || null,
        actors: data.actors || null,
        spinningTime: data.spinningTime || null,
        speakingTime: data.speakingTime || null,
      };
    }
  } catch (error: any) {
    const isOfflineErr = error?.message?.includes("offline") || error?.code === "unavailable";
    if (isOfflineErr) {
      console.warn("Failed to load data from Firestore (client is offline, falling back to local storage):", error);
    } else {
      console.warn("Failed to load data from Firestore (falling back to local storage):", error);
    }
  }
  return null;
};

/**
 * Subscribes to all state data from Firestore in real-time.
 * Returns an unsubscribe function or null if Firestore is not connected.
 */
export const subscribeToGameDataFromCloud = (
  onUpdate: (data: {
    questions1: any[] | null;
    questions2: any[] | null;
    actors: any[] | null;
    spinningTime: number | null;
    speakingTime: number | null;
  }) => void
): (() => void) | null => {
  const db = initFirebase();
  if (!db) return null;

  try {
    const configDocRef = doc(db, DOC_PATH);
    const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          questions1: data.questions1 || null,
          questions2: data.questions2 || null,
          actors: data.actors || null,
          spinningTime: data.spinningTime !== undefined ? data.spinningTime : null,
          speakingTime: data.speakingTime !== undefined ? data.speakingTime : null,
        });
      }
    }, (error) => {
      console.warn("Firestore subscription error:", error);
    });
    return unsubscribe;
  } catch (error) {
    console.warn("Failed to subscribe to Firestore:", error);
    return null;
  }
};

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 */
export const uploadFileToStorage = async (
  file: File | Blob,
  path: string
): Promise<string | null> => {
  // If Cloudinary is configured, use it first as preferred storage
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryUrl = await uploadFileToCloudinary(file);
      if (cloudinaryUrl) {
        return cloudinaryUrl;
      }
    } catch (error) {
      console.warn("Cloudinary upload failed, trying Firebase Storage:", error);
    }
  }

  const config = getSavedFirebaseConfig();
  if (!config || !config.storageBucket) {
    console.warn("Firebase Storage is not configured (missing storageBucket)");
    return null;
  }
  
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    if (getApps().length === 0) {
      initializeApp(config);
    }
    const storage = getStorage();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.warn("Firebase Storage upload failed (falling back to local):", error);
    return null;
  }
};

/**
 * Uploads an image for an Actor, updates local storage, and updates Firestore.
 */
export const uploadAndAssociateActorImage = async (
  actorId: string,
  file: File | Blob
): Promise<string | null> => {
  const path = `actors/${actorId}_${Date.now()}`;
  return uploadFileToStorage(file, path);
};

/**
 * Uploads an image for a specific clue in a Question, updates local storage, and updates Firestore.
 */
export const uploadAndAssociateQuestionImage = async (
  gameType: 'q1' | 'q2',
  questionId: string,
  imageIndex: number,
  file: File | Blob
): Promise<string | null> => {
  const path = `questions/${gameType}/${questionId}_img${imageIndex}_${Date.now()}`;
  return uploadFileToStorage(file, path);
};
