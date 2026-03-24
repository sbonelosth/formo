import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeClosed, MailCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mono-progress w-32 animate-pulse" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // OAuth redirect — page navigates away so no need to reset loading
    signInWithGoogle();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setEmailLoading(true);

    if (isSignUp) {
      const { error, alreadyExists, isGoogleAccount } = await signUpWithEmail(email, password);
      if (isGoogleAccount) {
        setError('This email is linked to a Google account. Please use "Continue with Google" to sign in.');
      } else if (alreadyExists) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a verification link.');
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message);
        toast.error(error.message);
      }
    }

    setEmailLoading(false);
  };

  const isBusy = googleLoading || emailLoading;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
        className="w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-2">Simple Forms</h1>
        <p className="mono-label text-muted-foreground mb-4">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="mono-btn-secondary w-full mb-8 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <AnimatePresence mode="wait" initial={false}>
            {googleLoading ? (
              <motion.span
                key="spinner"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Google…
              </motion.span>
            ) : (
              <motion.span
                key="label"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 border-t border-foreground" />
          <span className="mono-label text-muted-foreground">Or</span>
          <div className="flex-1 border-t border-foreground" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {message && (
              <motion.p
                key="message"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center text-sm border border-dotted border-green-500 rounded-md p-2"
              >
                <span className="text-green-500">
                  <MailCheck className="inline-block mr-2" />{message}
                </span>
              </motion.p>
            )}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-destructive text-sm border border-dotted border-destructive rounded-md p-2"
              >
                {error}
                {(error.includes('Google account') || error.includes('already exists')) && (
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    className="block mt-1 underline text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Switch to sign in →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mono-label block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mono-input w-full"
              required
              disabled={isBusy}
            />
          </div>
          <div className="relative">
            <label className="mono-label block">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mono-input w-full pr-12"
              required
              minLength={6}
              disabled={isBusy}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isBusy}
              className="absolute right-4 top-7 text-sm disabled:opacity-40"
            >
              {showPassword ? <EyeClosed /> : <Eye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="mono-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {emailLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSignUp ? 'Creating Account…' : 'Signing In…'}
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isBusy}
            className="mono-btn-secondary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
          disabled={isBusy}
          className="w-full text-center mt-6 mono-label text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </motion.div>
    </div>
  );
}