import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, NavigateOptions } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FormField, FieldType } from '@/types/form';
import FormFieldEditor from '@/components/FormFieldEditor';
import Header from '@/components/Header';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, Share2, Save, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('Untitled Form');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState(id || '');
  const [isDirty, setIsDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Intercepts navigation: shows modal if dirty, otherwise navigates immediately
  const safeNavigate = useCallback((path: string, options?: NavigateOptions) => {
    if (isDirty) {
      setPendingPath(path);
    } else {
      navigate(path, options);
    }
  }, [isDirty, navigate]);

  // Track saved state to compare against
  const savedStateRef = useRef({ title: 'Untitled Form', fields: '[]' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id) loadForm(id);
  }, [id]);

  // Mark dirty when title or fields change after initial load
  const isLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const currentState = JSON.stringify(fields);
    const dirty =
      title !== savedStateRef.current.title ||
      currentState !== savedStateRef.current.fields;
    setIsDirty(dirty);
  }, [title, fields]);

  // Warn on browser tab close / refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);


  const loadForm = async (fid: string) => {
    const { data } = await supabase.from('forms').select('*').eq('id', fid).single();
    if (data) {
      setTitle(data.title);
      const loadedFields = (data.fields as unknown as FormField[]) || [];
      setFields(loadedFields);
      setFormId(data.id);
      savedStateRef.current = {
        title: data.title,
        fields: JSON.stringify(loadedFields),
      };
    }
    isLoadedRef.current = true;
  };

  // For new forms, mark as loaded immediately
  useEffect(() => {
    if (!id) {
      isLoadedRef.current = true;
    }
  }, [id]);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: '',
      order: fields.length,
      options: ['dropdown', 'radio', 'checkbox'].includes(type)
        ? ['Option 1', 'Option 2']
        : undefined,
      min: type === 'range' ? 0 : undefined,
      max: type === 'range' ? 100 : undefined,
    };
    setFields(prev => [...prev, newField]);
  };

  const updateField = (index: number, updated: FormField) => {
    setFields(prev => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields(prev => {
        const oldIndex = prev.findIndex(f => f.id === active.id);
        const newIndex = prev.findIndex(f => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
      });
    }
  };

  const saveForm = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const orderedFields = fields.map((f, i) => ({ ...f, order: i }));

    if (formId) {
      const { error } = await supabase
        .from('forms')
        .update({ title, fields: orderedFields })
        .eq('id', formId);
      if (error) {
        toast.error(error.message);
      } else {
        savedStateRef.current = { title, fields: JSON.stringify(orderedFields) };
        setIsDirty(false);
        toast.success('Form saved');
      }
    } else {
      const { data, error } = await supabase
        .from('forms')
        .insert({ title, fields: orderedFields, user_id: user.id, published: false })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setFormId(data.id);
        savedStateRef.current = { title, fields: JSON.stringify(orderedFields) };
        setIsDirty(false);
        toast.success('Form created');
        navigate(`/builder/${data.id}`, { replace: true });
      }
    }
    setSaving(false);
  }, [user, formId, title, fields, navigate]);

  const publishForm = async () => {
    if (!formId) await saveForm();
    if (formId) {
      await supabase.from('forms').update({ published: true }).eq('id', formId);
      navigate(`/share/${formId}`);
    }
  };

  const handleModalSave = async () => {
    await saveForm();
    if (pendingPath) navigate(pendingPath);
    setPendingPath(null);
  };

  const handleModalDiscard = () => {
    setIsDirty(false);
    if (pendingPath) navigate(pendingPath);
    setPendingPath(null);
  };

  const handleModalStay = () => {
    setPendingPath(null);
  };

  const FIELD_TYPES: FieldType[] = [
    'text', 'textarea', 'dropdown', 'checkbox', 'radio', 'color', 'range', 'date', 'time', 'rating',
  ];

  const FIELD_LABELS: Record<FieldType, string> = {
    text: 'Single Line',
    textarea: 'Multi Line',
    dropdown: 'Dropdown',
    checkbox: 'Checkbox',
    radio: 'Radio',
    color: 'Color',
    range: 'Range',
    date: 'Date',
    time: 'Time',
    rating: '★ Rating',
  };

  return (
    <div className="min-h-screen">
      <Header
        left={
          <>
            <button onClick={() => safeNavigate('/dashboard')}>
              <img src="/favicon.ico" className="h-6 w-6 cursor-pointer" alt="Formo" />
            </button>
            <span className="text-muted-foreground text-sm hidden sm:block">
              {title || 'Untitled Form'}
            </span>
            {isDirty && (
              <span className="mono-label text-xs text-muted-foreground border border-muted-foreground px-2 py-0.5">
                Unsaved
              </span>
            )}
          </>
        }
        right={
          <>
            <button
              onClick={saveForm}
              disabled={saving}
              className="p-2 hover:bg-foreground hover:text-background transition-colors"
              title="Save"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            </button>
            <button
              onClick={publishForm}
              className="p-2 hover:bg-foreground hover:text-background transition-colors"
              title="Publish & Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </>
        }
      />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <label className="mono-label text-muted-foreground mb-2 block">Form Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl bg-transparent border-none outline-none w-full mb-12 placeholder:text-muted-foreground text-foreground"
            placeholder="Form title"
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field, index) => (
                <FormFieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(f) => updateField(index, f)}
                  onRemove={() => removeField(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {fields.length === 0 && (
            <div className="mono-card border-dashed flex items-center justify-center py-16">
              <p className="mono-label text-muted-foreground">Add your first field below</p>
            </div>
          )}

          <div className="mt-8">
            <p className="mono-label text-muted-foreground mb-4">Add Field</p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="mono-btn-secondary text-xs py-2 px-4 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {FIELD_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Unsaved Changes Modal */}
      <AnimatePresence>
        {pendingPath !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-background border border-foreground p-8 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <h2 className="text-lg font-bold">Unsaved Changes</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                You have unsaved changes. Do you want to save before leaving, or discard them?
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={handleModalSave} className="mono-btn-primary w-full text-sm py-3">
                  Save &amp; Leave
                </button>
                <button
                  onClick={handleModalDiscard}
                  className="mono-btn-secondary w-full text-sm py-3 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  Discard &amp; Leave
                </button>
                <button
                  onClick={handleModalStay}
                  className="w-full text-sm py-2 mono-label text-muted-foreground hover:text-foreground transition-colors"
                >
                  Stay on Page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}