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
  apiKey: "AIzaSyDvbDhXs1SmP104-QuNs2MYmwjdDAZUp2Y",
  authDomain: "formo-6699.firebaseapp.com",
  projectId: "formo-6699",
  storageBucket: "formo-6699.firebasestorage.app",
  messagingSenderId: "100723074498",
  appId: "1:100723074498:web:7ffe78786fac8c8eb0e25b",
  measurementId: "G-7PYVSE7T3T"
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

declare global {
  interface Window {
    google: typeof google;
  }
}