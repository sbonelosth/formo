import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Form, FormField } from '@/types/form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, Star } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export default function PublicForm() {
  const { id } = useParams();
  const { theme, toggleTheme } = useTheme();
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
      data: responses as Record<string, unknown>,
    }]);
    if (error) toast.error('Failed to submit');
    else setSubmitted(true);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mono-progress w-32 animate-pulse" />
    </div>
  );

  if (!form) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="mono-label">Form not found</p>
    </div>
  );

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
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
        <header className="w-full border-b border-foreground sticky top-0 bg-background z-10 mb-8 py-4 px-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-normal">{form.title}</h1>
              {form.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{form.description}</p>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-foreground hover:text-background transition-colors flex-shrink-0"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
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

function StarRating({
  value,
  onChange,
  required,
}: {
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? 'fill-foreground text-foreground'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="mono-label text-muted-foreground ml-2">{value} / 5</span>
      )}
      {/* Hidden input to satisfy required validation */}
      {required && (
        <input
          type="number"
          value={value || ''}
          required
          readOnly
          className="sr-only"
          tabIndex={-1}
        />
      )}
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
      return (
        <input
          className="mono-input w-full"
          value={(val as string) || ''}
          onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
          required={field.required}
        />
      );

    case 'textarea':
      return (
        <textarea
          className="mono-input w-full min-h-[120px] resize-y"
          value={(val as string) || ''}
          onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
          required={field.required}
        />
      );

    case 'dropdown':
      return (
        <select
          className="mono-input w-full appearance-none bg-background text-foreground"
          value={(val as string) || ''}
          onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
          required={field.required}
        >
          <option value="">Select...</option>
          {(field.options || []).map((o, i) => (
            <option key={i} value={o}>{o}</option>
          ))}
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
                    const newValue = e.target.checked
                      ? [...currentValue, option]
                      : currentValue.filter(v => v !== option);
                    setResponses(r => ({
                      ...r,
                      [field.id]: newValue.length > 0 ? newValue : undefined,
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
              <input
                type="radio"
                name={field.id}
                value={o}
                checked={val === o}
                onChange={() => setResponses(r => ({ ...r, [field.id]: o }))}
                className="w-5 h-5 accent-foreground"
                required={field.required}
              />
              <span className="text-sm">{o}</span>
            </label>
          ))}
        </div>
      );

    case 'color':
      return (
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={(val as string) || '#000000'}
            onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
            className="w-12 h-12 border border-foreground cursor-pointer"
          />
          <span className="mono-label text-muted-foreground">{(val as string) || '#000000'}</span>
        </div>
      );

    case 'range':
      return (
        <div className="flex items-center gap-4">
          <span className="mono-label text-muted-foreground">{field.min ?? 0}</span>
          <input
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 100}
            value={(val as number) ?? Math.round(((field.min ?? 0) + (field.max ?? 100)) / 2)}
            onChange={e => setResponses(r => ({ ...r, [field.id]: Number(e.target.value) }))}
            className="flex-1 accent-foreground"
          />
          <span className="mono-label text-muted-foreground">{field.max ?? 100}</span>
          <span className="mono-label font-bold min-w-[3ch] text-right">
            {(val as number) ?? '—'}
          </span>
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          className="mono-input w-full bg-background text-foreground"
          value={(val as string) || ''}
          onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
          required={field.required}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          className="mono-input w-full bg-background text-foreground"
          value={(val as string) || ''}
          onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
          required={field.required}
        />
      );

    case 'rating':
      return (
        <StarRating
          value={(val as number) || 0}
          onChange={v => setResponses(r => ({ ...r, [field.id]: v }))}
          required={field.required}
        />
      );

    default:
      return null;
  }
}