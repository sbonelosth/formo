import { useState } from 'react';
import { FormField, FieldType, FIELD_TYPE_LABELS } from '@/types/form';
import { GripVertical, Trash2, Plus, X, ChevronDownCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onRemove: () => void;
}

export default function FormFieldEditor({ field, onUpdate, onRemove }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const needsOptions = field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox';

  const addOption = () => {
    onUpdate({ ...field, options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] });
  };

  const updateOption = (index: number, value: string) => {
    const opts = [...(field.options || [])];
    opts[index] = value;
    onUpdate({ ...field, options: opts });
  };

  const removeOption = (index: number) => {
    const opts = [...(field.options || [])];
    opts.splice(index, 1);
    onUpdate({ ...field, options: opts });
  };

  return (
    <div ref={setNodeRef} style={style} className="mono-card mb-4">
      <div className="relative flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="w-full flex flex-col md:flex-row gap-2 items-start md:items-center">
          <div className="w-full">
            <textarea
              value={field.label}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
              className="mono-input w-full text-sm py-2 px-3"
              placeholder="Question"
            />
          </div>
          <div className="relative flex-shrink-0">
            <select
              value={field.type}
              onChange={(e) => onUpdate({ ...field, type: e.target.value as FieldType, options: ['dropdown', 'radio', 'checkbox'].includes(e.target.value) ? field.options || ['Option 1'] : undefined })}
              className="w-full md:w-auto border border-foreground text-sm py-2 px-3 pr-8 appearance-none"
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <ChevronDownCircle className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {needsOptions && expanded && (
        <div className="w-[90%] mt-4 ml-8 space-y-2">
          {(field.options || []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="mono-label w-6 text-muted-foreground">
                {field.type === 'checkbox' ? `☐` : field.type === 'radio' ? `◯` : `▢`}
              </span>
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="mono-input flex-1 text-sm py-2 px-3"
              />
              <button onClick={() => removeOption(i)} className="p-1 hover:bg-foreground hover:text-background transition-colors rounded-full">
                <X className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            </div>
          ))}
          <button onClick={addOption} className="flex items-center gap-1 mono-label text-muted-foreground hover:text-foreground transition-colors mt-2">
            <Plus className="w-3 h-3" /> Add Option
          </button>
        </div>
      )}

      {field.type === 'range' && expanded && (
        <div className="mt-4 ml-8 flex gap-4">
          <div>
            <label className="mono-label text-muted-foreground block mb-1">Min</label>
            <input
              type="number"
              value={field.min ?? 0}
              onChange={(e) => onUpdate({ ...field, min: Number(e.target.value) })}
              className="mono-input text-sm py-2 px-3 w-24"
            />
          </div>
          <div>
            <label className="mono-label text-muted-foreground block mb-1">Max</label>
            <input
              type="number"
              value={field.max ?? 100}
              onChange={(e) => onUpdate({ ...field, max: Number(e.target.value) })}
              className="mono-input text-sm py-2 px-3 w-24"
            />
          </div>
        </div>
      )}
      <div className="w-full flex items-center justify-end gap-4 mt-4">
        <label className="flex items-center gap-1 mono-label text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={field.required || false}
            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
            className="accent-foreground"
          />
          Required
        </label>
        <button onClick={onRemove} className="p-2 hover:bg-destructive hover:text-destructive-foreground transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
