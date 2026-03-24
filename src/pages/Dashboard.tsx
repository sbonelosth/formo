import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Form } from '@/types/form';
import { Plus, Share2, BarChart3, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Header from '@/components/Header';
import UserMenu from '@/components/UserMenu';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const confirmDeleteForm = forms.find(f => f.id === confirmDeleteId);

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

  const deleteForm = async () => {
    if (!confirmDeleteId) return;
    const { error } = await supabase.from('forms').delete().eq('id', confirmDeleteId);
    if (error) toast.error(error.message);
    else {
      setForms(forms.filter(f => f.id !== confirmDeleteId));
      toast.success('Form deleted');
    }
    setConfirmDeleteId(null);
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
          <>
            <img src="/favicon.ico" alt="Simple Forms" className="logo-icon" />
            <span className="text-muted-foreground text-sm hidden sm:block">Simple Forms</span>
          </>
        }
        right={
          <UserMenu />
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
                    {(form.fields || []).length} Field{(form.fields || []).length !== 1 && 's'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="mono-label tabular-nums">
                        {responseCounts[form.id] || 0} Response{(responseCounts[form.id] || 0) !== 1 && 's'}
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
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(form.id); }}
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

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-background border border-foreground p-8 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <h2 className="text-lg font-bold">Delete Form</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to delete
              </p>
              <p className="text-sm font-medium mb-8">
                "{confirmDeleteForm?.title || 'Untitled'}"?
              </p>
              <p className="text-xs text-muted-foreground mb-8 -mt-6">
                This will permanently delete the form and all its responses. This cannot be undone.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={deleteForm}
                  className="mono-btn-primary w-full text-sm py-3 bg-destructive border-destructive hover:bg-destructive/80 hover:border-destructive/80 hover:text-destructive-foreground"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="mono-btn-secondary w-full text-sm py-3"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}