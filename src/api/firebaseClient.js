import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// Helper to read config from environment or local storage fallback
const getFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem('custom_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.apiKey.startsWith('AIzaSy')) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load custom Firebase config from localStorage:', e);
  }

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envKey && envKey.startsWith('AIzaSy')) {
    return {
      apiKey: envKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  // Fallback to user-provided default config
  return {
    apiKey: "AIzaSyBdY4RKoJDNVL5yuw302jrmxrqF_6NdHb0",
    authDomain: "money-tracker-ef2f2.firebaseapp.com",
    projectId: "money-tracker-ef2f2",
    storageBucket: "money-tracker-ef2f2.firebasestorage.app",
    messagingSenderId: "185931539517",
    appId: "1:185931539517:web:2345fa75914198628cf654",
    measurementId: "G-7K19RNXQPX"
  };
};

const activeConfig = getFirebaseConfig();

// Dummy config to prevent initialization crashes when keys are missing
const dummyConfig = {
  apiKey: "AIzaSy_dummy_api_key_for_setup_interface_only",
  authDomain: "dummy-project.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:1234567890",
};

export const isFirebaseConfigured = () => !!activeConfig;

export const saveFirebaseConfig = (config) => {
  try {
    localStorage.setItem('custom_firebase_config', JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
    return false;
  }
};

export const clearFirebaseConfig = () => {
  try {
    localStorage.removeItem('custom_firebase_config');
    return true;
  } catch (e) {
    console.error('Failed to clear Firebase config:', e);
    return false;
  }
};

export const firebaseConfig = activeConfig || dummyConfig;
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export function onAuthStateReady() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export function subscribeAuthStateChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserDoc(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? { uid, ...snapshot.data() } : null;
}

export async function getUserDocByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

export async function createUserDoc(uid, data) {
  const payload = {
    uid,
    email: data.email,
    display_name: data.display_name || '',
    role: data.role ?? 'user',
    pin: data.pin ?? null,
    created_at: data.created_at ?? new Date().toISOString(),
    ...data,
  };
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
  return getUserDoc(uid);
}

export async function updateUserDoc(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
  return getUserDoc(uid);
}

export async function verifyUserPin(email, pin) {
  const user = await getUserDocByEmail(email);
  return !!user && user.pin === pin;
}

export function mapFirebaseUserToAppUser(authUser, userDoc = null) {
  if (!authUser) return null;
  const docData = userDoc || {};
  const display_name = authUser.displayName || docData.display_name || authUser.email?.split('@')[0] || '';
  return {
    uid: authUser.uid,
    email: authUser.email,
    display_name,
    photoURL: authUser.photoURL,
    role: docData.role || 'user',
    pin: docData.pin || null,
    ...docData,
  };
}

export async function ensureUserDoc(authUser) {
  if (!authUser) return null;
  const userDoc = await getUserDoc(authUser.uid);
  if (userDoc) return userDoc;
  return createUserDoc(authUser.uid, {
    email: authUser.email,
    display_name: authUser.displayName || authUser.email?.split('@')[0] || '',
    role: 'user',
    pin: null,
  });
}

export async function loginUserWithEmailPassword(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const authUser = credential.user;
  const userDoc = await ensureUserDoc(authUser);
  return mapFirebaseUserToAppUser(authUser, userDoc);
}

export async function registerUserWithEmailPassword(email, password, display_name) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const authUser = credential.user;
  const userDoc = await createUserDoc(authUser.uid, {
    email: authUser.email,
    display_name: display_name || authUser.displayName || authUser.email?.split('@')[0] || '',
    role: 'user',
    pin: null,
  });
  return mapFirebaseUserToAppUser(authUser, userDoc);
}

export async function updateFirebaseUserProfile(updates) {
  if (!auth.currentUser) {
    throw new Error('User is not signed in');
  }
  return updateProfile(auth.currentUser, updates);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export async function getCurrentUser() {
  const authUser = auth.currentUser;
  if (!authUser) return null;
  const userDoc = await getUserDoc(authUser.uid);
  return mapFirebaseUserToAppUser(authUser, userDoc);
}

export async function createTransaction(data) {
  const newDocRef = doc(collection(db, 'transactions'));
  const payload = {
    id: newDocRef.id,
    created_at: new Date().toISOString(),
    ...data,
  };
  await setDoc(newDocRef, payload);
  return payload;
}

export async function getUserTransactions(uid, limitVal = 50) {
  if (!uid) return [];
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', uid),
    limit(limitVal)
  );
  const snapshot = await getDocs(q);
  const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort in memory to avoid Firestore index requirement issues
  return txs.sort((a, b) => {
    const dateA = a.created_at || '';
    const dateB = b.created_at || '';
    return dateB.localeCompare(dateA);
  });
}
