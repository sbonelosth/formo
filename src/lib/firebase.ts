import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_GOOGLE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_GOOGLE_FIREBASE_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable session persistence (critical for production)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Firebase persistence setup failed:', error);
});

// OAuth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account picker
});

export const githubProvider = new GithubAuthProvider();
githubProvider.setCustomParameters({
  allow_signup: 'true'
});