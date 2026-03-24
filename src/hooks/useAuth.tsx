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
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; alreadyExists: boolean; isGoogleAccount: boolean }>;
  signOut: () => Promise<void>;
}

// Expire after 1 hour of inactivity
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const intentionalSignOutRef = useRef(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedInRef = useRef(false);

  // ── Sign out ────────────────────────────────────────────────────────────────
  const forceSignOut = async () => {
    intentionalSignOutRef.current = true;
    stopInactivityTimer();
    window.google?.accounts.id.disableAutoSelect();
    const email = (await supabase.auth.getUser()).data.user?.email;
    if (email && window.google?.accounts?.id) {
      window.google.accounts.id.revoke(email, () => {});
    }
    await Promise.all([supabase.auth.signOut(), firebaseSignOut(auth)]);
  };

  // ── Inactivity timer ────────────────────────────────────────────────────────
  const stopInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const resetInactivityTimer = () => {
    if (!isLoggedInRef.current) return; // only track when signed in
    stopInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      forceSignOut();
    }, INACTIVITY_TIMEOUT_MS);
  };

  // Attach / detach activity listeners depending on auth state
  useEffect(() => {
    if (!user) {
      stopInactivityTimer();
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      return;
    }

    isLoggedInRef.current = true;
    resetInactivityTimer(); // start the clock on sign-in
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      stopInactivityTimer();
    };
  }, [user]);

  // ── Google One Tap (credential callback path) ───────────────────────────────
  const handleGoogleToken = async (idToken: string) => {
    const firebaseCredential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, firebaseCredential);
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw error;
  };

  useEffect(() => {
    if (intentionalSignOutRef.current) return;
    if (user) return;

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
        auto_select: false,
        cancel_on_tap_outside: true,
        // No use_fedcm_for_prompt — let Chrome use FedCM natively.
        // Also no prompt() notification callback — those methods are deprecated
        // in FedCM and were causing the AbortError we saw in the console.
      });

      window.google.accounts.id.prompt();
    };

    if (window.google) {
      initOneTap();
    } else {
      window.addEventListener('load', initOneTap);
      return () => window.removeEventListener('load', initOneTap);
    }
  }, [user]);

  // ── Supabase auth state ─────────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'SIGNED_OUT') {
        isLoggedInRef.current = false;
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Manual Google sign-in button → OAuth redirect ───────────────────────────
  // One Tap may not always show (user dismissed it, FedCM quirks, etc.)
  // so the button falls back to the reliable OAuth redirect flow.
  const signInWithGoogle = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  // ── Email auth ──────────────────────────────────────────────────────────────
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<{
    error: Error | null;
    alreadyExists: boolean;
    isGoogleAccount: boolean;
  }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) return { error: error as Error, alreadyExists: false, isGoogleAccount: false };

    if (data.user && data.user.identities?.length === 0) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: '##probe##',
      });
      const isGoogleAccount = signInError?.message?.toLowerCase().includes('invalid login credentials') ?? false;
      return { error: null, alreadyExists: true, isGoogleAccount };
    }

    return { error: null, alreadyExists: false, isGoogleAccount: false };
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut: forceSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}