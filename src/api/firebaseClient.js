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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

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

export async function getCurrentUser() {
  const authUser = auth.currentUser;
  if (!authUser) return null;
  const userDoc = await getUserDoc(authUser.uid);
  return mapFirebaseUserToAppUser(authUser, userDoc);
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

export async function createTransaction(data) {
  const payload = {
    created_at: new Date().toISOString(),
    created_date: new Date().toISOString(),
    status: data.status || 'pending',
    ...data,
  };
  const docRef = doc(collection(db, 'transactions'));
  await setDoc(docRef, payload);
  return { id: docRef.id, ...payload };
}
