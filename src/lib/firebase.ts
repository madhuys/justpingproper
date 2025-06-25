import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCDI-j0gA1DujugRQKxr_fIAaOtsxQKF4E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "justpingdev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "justpingdev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "justpingdev.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "240883067385",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:240883067385:web:ce2ba7ecdebe50857e7528",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y1D0XZ3MQP"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Firebase: Attempting sign in with email:', email);
    console.log('Firebase auth instance:', auth);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase: Sign in successful, user:', userCredential.user.email);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Firebase: Sign in error:', error.code, error.message);
    return { user: null, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('Firebase: Attempting Google sign in...');
    console.log('Firebase auth instance:', auth);
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Firebase: Google sign in successful, user:', result.user.email);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Firebase: Google sign in error:', error.code, error.message);
    return { user: null, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db };