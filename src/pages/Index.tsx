import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import UserMenu from '@/components/UserMenu';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mono-progress w-32 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        left={
          <div className='flex items-center gap-2'>
            <img src="/favicon.ico" alt="Simple Forms" className="logo-icon" />
            <h1 className="text-lg">Simple Forms</h1>
          </div>
        }
        right={
          user ? (
            <div className="hidden sm:block">
              <UserMenu />
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="text-md py-2 pr-4 font-medium">
              Sign In
            </button>
          )
        }
      />

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="text-center max-w-2xl"
        >
          <h2 className="text-2xl md:text-7xl font-bold mb-6 leading-tight">
            Create forms.<br />Collect data.<br />No distractions.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(user ? '/builder' : '/auth')}
              className="mono-btn-primary text-sm"
            >
              Create a Form
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="mono-btn-secondary text-sm"
            >
              View Dashboard
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-foreground py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="mono-label text-muted-foreground">
            © {new Date().getFullYear()} abumanga project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}