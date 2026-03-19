export type FieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'color'
  | 'range'
  | 'date'
  | 'time'
  | 'rating';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  order: number;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  fields: FormField[];
  created_at: string;
  published: boolean;
}

export interface FormResponse {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Single Line',
  textarea: 'Multi Line',
  dropdown: 'Dropdown',
  checkbox: 'Checkbox',
  radio: 'Radio Buttons',
  color: 'Color Picker',
  range: 'Range Slider',
  date: 'Date',
  time: 'Time',
  rating: '★ Rating',
};