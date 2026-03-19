import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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

  // Tracks whether the user explicitly signed out.
  // Prevents the user=null→useEffect re-run from re-initializing One Tap.
  const intentionalSignOutRef = useRef(false);

  const handleGoogleToken = async (idToken: string) => {
    const firebaseCredential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, firebaseCredential);

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
  };

  useEffect(() => {
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
    // If the user just signed out intentionally, do NOT re-init One Tap.
    // This is what was causing the silent re-auth loop.
    if (intentionalSignOutRef.current) return;
    if (user) return; // already signed in, no prompt needed

    const initOneTap = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            await handleGoogleToken(response.credential);
          } catch (err) {
            console.error('One Tap sign-in failed:', err);
          }
        },
        // auto_select: false — never silently re-auth without user interaction.
        // This was the root cause of the re-auth loop after sign out.
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; getNotDisplayedReason: () => string; isSkippedMoment: () => boolean; getSkippedReason: () => string }) => {
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        }
        if (notification.isSkippedMoment()) {
          console.log('One Tap skipped:', notification.getSkippedReason());
        }
      });
    };

    if (window.google) {
      initOneTap();
    } else {
      window.addEventListener('load', initOneTap);
      return () => window.removeEventListener('load', initOneTap);
    }
  }, [user]);

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
    // Grab the email before the session is cleared
    const email = (await supabase.auth.getUser()).data.user?.email;

    // Mark as intentional BEFORE clearing the session so the useEffect
    // that fires on user→null doesn't re-initialize One Tap
    intentionalSignOutRef.current = true;

    // 1. Stop One Tap from auto-selecting a cached credential
    window.google?.accounts.id.disableAutoSelect();

    // 2. Fully revoke the OAuth grant so One Tap won't prompt again
    //    until the user explicitly clicks "Sign in with Google"
    if (email && window.google?.accounts?.id) {
      window.google.accounts.id.revoke(email, () => {
        // fire-and-forget, non-critical
      });
    }

    // 3. Clear Supabase + Firebase sessions
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