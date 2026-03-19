import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Form, FormField } from '@/types/form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

export default function PublicForm() {
  const { id } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadForm(id);
  }, [id]);

  const loadForm = async (formId: string) => {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('published', true)
      .single();
    setForm(data as unknown as Form | null);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const { error } = await supabase.from('responses').insert([{
      form_id: form.id,
      data: responses as any,
    }]);

    if (error) toast.error('Failed to submit');
    else setSubmitted(true);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="mono-progress w-32 animate-pulse" /></div>;
  if (!form) return <div className="flex min-h-screen items-center justify-center"><p className="mono-label">Form not found</p></div>;

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 border-2 border-foreground flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Response Recorded</h1>
          <p className="mono-label text-muted-foreground">Thank you for your submission.</p>
        </motion.div>
      </div>
    );
  }

  const sortedFields = [...(form.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex items-start justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <header className="w-full border-b border-foreground sticky top-0 bg-background z-10 mb-8 py-4 px-2">
          <h1 className="text-xl font-normal">{form.title}</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 px-4 pb-12">
          {sortedFields.map((field: FormField) => (
            <div key={field.id}>
              <label className="mono-label block mb-3">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {renderField(field, responses, setResponses)}
            </div>
          ))}

          <button type="submit" className="mono-btn-primary w-full mt-8">
            Submit
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function renderField(
  field: FormField,
  responses: Record<string, unknown>,
  setResponses: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
) {
  const val = responses[field.id];

  switch (field.type) {
    case 'text':
      return <input className="mono-input w-full" value={(val as string) || ''} onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))} required={field.required} />;
    case 'textarea':
      return <textarea className="mono-input w-full min-h-[120px] resize-y" value={(val as string) || ''} onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))} required={field.required} />;
    case 'dropdown':
      return (
        <select className="mono-input w-full appearance-none pr-10" value={(val as string) || ''} onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))} required={field.required}>
          <option value="">Select...</option>
          {(field.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}
        </select>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(field.options || []).map((option, idx) => {
            const currentValue = (val as string[]) || [];
            const isChecked = currentValue.includes(option);

            return (
              <label key={idx} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={isChecked}
                  onChange={(e) => {
                    let newValue: string[];
                    if (e.target.checked) {
                      // Add the option
                      newValue = [...currentValue, option];
                    } else {
                      // Remove the option
                      newValue = currentValue.filter(v => v !== option);
                    }
                    setResponses(r => ({
                      ...r,
                      [field.id]: newValue.length > 0 ? newValue : undefined
                    }));
                  }}
                  className="w-5 h-5 accent-foreground"
                />
                <span className="text-sm">{option}</span>
              </label>
            );
          })}
        </div>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map((o, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name={field.id} value={o} checked={val === o} onChange={() => setResponses(r => ({ ...r, [field.id]: o }))} className="w-5 h-5 accent-foreground" required={field.required} />
              <span className="text-sm">{o}</span>
            </label>
          ))}
        </div>
      );
    case 'color':
      return (
        <div className="flex items-center gap-4">
          <input type="color" value={(val as string) || '#000000'} onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))} className="w-12 h-12 border border-foreground cursor-pointer" />
          <span className="mono-label text-muted-foreground">{(val as string) || '#000000'}</span>
        </div>
      );
    case 'range':
      return (
        <div className="flex items-center gap-4">
          <span className="mono-label text-muted-foreground">{field.min ?? 0}</span>
          <input type="range" min={field.min ?? 0} max={field.max ?? 100} value={(val as number) ?? Math.round(((field.min ?? 0) + (field.max ?? 100)) / 2)} onChange={e => setResponses(r => ({ ...r, [field.id]: Number(e.target.value) }))} className="flex-1 accent-foreground" />
          <span className="mono-label text-muted-foreground">{field.max ?? 100}</span>
          <span className="mono-label font-bold min-w-[3ch] text-right">{(val as number) ?? '—'}</span>
        </div>
      );
    default:
      return null;
  }
}
