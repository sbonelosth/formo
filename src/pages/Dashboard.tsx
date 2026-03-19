import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Form } from '@/types/form';
import { Plus, Share2, BarChart3, LogOut, Trash2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Header from '@/components/Header';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadForms();
  }, [user]);

  const loadForms = async () => {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setForms(data as unknown as Form[]);
      const counts: Record<string, number> = {};
      for (const form of data) {
        const { count } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', form.id);
        counts[form.id] = count || 0;
      }
      setResponseCounts(counts);
    }
    setLoading(false);
  };

  const deleteForm = async (id: string) => {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      setForms(forms.filter(f => f.id !== id));
      toast.success('Form deleted');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mono-progress w-32 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header
        left={
          <button className='cursor-default'>
            <img src="/favicon.ico" alt="Formo" className="h-6 w-6" />
          </button>
        }
        right={
          <div className="relative">
            <button onClick={() => setShowUserMenu(v => !v)} className="p-2 hover:bg-foreground hover:text-background transition-colors">
              <UserCircle className="w-5 h-5" />
            </button>
            {showUserMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-background border border-foreground shadow-md py-2 w-64 z-20"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <p className="mono-label text-xs text-muted-foreground px-4 py-2">
                  Signed in as<br />
                  <span className="font-medium text-foreground">{user?.email}</span>
                </p>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-sm px-4 py-2 hover:text-destructive transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        }
      />

      <main className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-xl font-normal">Managed Forms</h2>
              <p className="mono-label text-muted-foreground mt-2">{forms.length} Total</p>
            </div>
            <button
              onClick={() => navigate('/builder')}
              className="w-12 aspect-square mono-btn-secondary text-sm flex items-center gap-2"
              title='Create a new form'
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {forms.length === 0 ? (
            <div className="mono-card border-dashed flex flex-col items-center justify-center py-16">
              <p className="mono-label text-muted-foreground mb-4">No forms yet</p>
              <button onClick={() => navigate('/builder')} className="mono-btn-primary text-sm py-3 px-6">
                Create a new form
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form, i) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="mono-card-hover cursor-pointer group"
                  onClick={() => navigate(`/builder/${form.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-normal text-lg">{form.title || 'Untitled'}</h3>
                    {form.published && (
                      <span className="mono-label text-xs bg-foreground text-background px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mono-label text-muted-foreground mb-6">
                    {(form.fields || []).length} Fields
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="mono-label tabular-nums">
                        {responseCounts[form.id] || 0} Responses
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {form.published && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/share/${form.id}`); }}
                          className="p-2 hover:bg-foreground hover:text-background transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      {form.published && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/responses/${form.id}`); }}
                          className="p-2 hover:bg-foreground hover:text-background transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteForm(form.id); }}
                        className="p-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}