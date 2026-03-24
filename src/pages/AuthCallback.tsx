import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
      else navigate('/auth', { replace: true });
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mono-progress w-32 animate-pulse" />
    </div>
  );
}