import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FormField, FieldType } from '@/types/form';
import FormFieldEditor from '@/components/FormFieldEditor';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, ArrowLeft, Share2, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('Untitled Form');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState(id || '');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id) loadForm(id);
  }, [id]);

  const loadForm = async (formId: string) => {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    if (data) {
      setTitle(data.title);
      setFields((data.fields as unknown as FormField[]) || []);
      setFormId(data.id);
    }
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: '',
      order: fields.length,
      options: ['dropdown', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      min: type === 'range' ? 0 : undefined,
      max: type === 'range' ? 100 : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updated: FormField) => {
    const copy = [...fields];
    copy[index] = updated;
    setFields(copy);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      setFields(arrayMove(fields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i })));
    }
  };

  const saveForm = async () => {
    if (!user) return;
    setSaving(true);

    const orderedFields = fields.map((f, i) => ({ ...f, order: i }));

    if (formId) {
      const { error } = await supabase
        .from('forms')
        .update({ title, fields: orderedFields })
        .eq('id', formId);
      if (error) toast.error(error.message);
      else toast.success('Form saved');
    } else {
      const { data, error } = await supabase
        .from('forms')
        .insert({ title, fields: orderedFields, user_id: user.id, published: false })
        .select()
        .single();
      if (error) toast.error(error.message);
      else if (data) {
        setFormId(data.id);
        toast.success('Form created');
        navigate(`/builder/${data.id}`, { replace: true });
      }
    }
    setSaving(false);
  };

  const publishForm = async () => {
    if (!formId) {
      await saveForm();
    }
    if (formId) {
      await supabase.from('forms').update({ published: true }).eq('id', formId);
      navigate(`/share/${formId}`);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="w-full border-b border-foreground sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}>
              <img src='/favicon.ico' className="text-xl font-bold cursor-pointer" />
            </button>
            <span className="text-muted-foreground">{title || 'Untitled Form'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={saveForm} disabled={saving} className="text-sm py-1 px-3" title='Save'>
              {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
            </button>
            <button onClick={publishForm} className="text-sm py-1 px-2" title='Share'>
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <label className="mono-label text-muted-foreground mb-2">Form Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl bg-transparent border-none outline-none w-full mb-12 placeholder:text-muted-foreground"
            placeholder="Form title"
          />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
              {(['text', 'textarea', 'dropdown', 'checkbox', 'radio', 'color', 'range'] as FieldType[]).map(type => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="mono-btn-secondary text-xs py-2 px-4 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {type === 'text' ? 'Single Line' : type === 'textarea' ? 'Multi Line' : type === 'dropdown' ? 'Dropdown' : type === 'checkbox' ? 'Checkbox' : type === 'radio' ? 'Radio' : type === 'color' ? 'Color' : 'Range'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
