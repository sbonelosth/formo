import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle the Google ID token → Firebase → Supabase exchange
  const handleGoogleToken = async (idToken: string) => {
    // 1. Sign into Firebase with the Google credential
    const firebaseCredential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, firebaseCredential);

    // 2. Exchange for a Supabase session
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
  };

  useEffect(() => {
    // Supabase session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait for the Google script to load
    const initOneTap = () => {
      if (!window.google || user) return; // don't show if already signed in

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            await handleGoogleToken(response.credential);
          } catch (err) {
            console.error('One Tap sign-in failed:', err);
          }
        },
        auto_select: true,        // auto signs in returning users silently
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        }
        if (notification.isSkippedMoment()) {
          console.log('One Tap skipped:', notification.getSkippedReason());
        }
      });
    };

    // Script may already be loaded or needs to wait
    if (window.google) {
      initOneTap();
    } else {
      window.addEventListener('load', initOneTap);
      return () => window.removeEventListener('load', initOneTap);
    }
  }, [user]); // re-runs when user changes (hides prompt once signed in)

  // Manual trigger — call this from your "Sign in with Google" button
  const signInWithGoogle = () => {
    window.google?.accounts.id.prompt();
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    window.google?.accounts.id.disableAutoSelect(); // prevent auto re-signin
    await Promise.all([
      supabase.auth.signOut(),
      firebaseSignOut(auth),
    ]);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}