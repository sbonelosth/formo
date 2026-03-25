import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Form, FormField, FormResponse } from '@/types/form';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Header from '@/components/Header';

export default function Responses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (formId: string) => {
    const [formRes, responsesRes] = await Promise.all([
      supabase.from('forms').select('*').eq('id', formId).single(),
      supabase
        .from('responses')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false }),
    ]);
    setForm(formRes.data as unknown as Form | null);
    setResponses((responsesRes.data || []) as unknown as FormResponse[]);
    setLoading(false);
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

  const fields = [...(form.fields || [])].sort((a, b) => a.order - b.order);

  const getFieldStats = (field: FormField) => {
    const values = responses.map(r => (r.data as Record<string, unknown>)[field.id]).filter(v => v !== undefined && v !== null && v !== '');

    if (['dropdown', 'radio'].includes(field.type)) {
      const counts: Record<string, number> = {};
      values.forEach(v => { counts[v as string] = (counts[v as string] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    if (field.type === 'checkbox') {
      const trueCount = values.filter(v => v === true).length;
      return [{ name: 'Yes', value: trueCount }, { name: 'No', value: values.length - trueCount }];
    }

    if (field.type === 'range') {
      const nums = values.map(Number);
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return { avg: Math.round(avg * 10) / 10, min: Math.min(...nums), max: Math.max(...nums), count: nums.length };
    }

    if (field.type === 'rating') {
      const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      values.forEach(v => { const k = String(v); if (counts[k] !== undefined) counts[k]++; });
      return Object.entries(counts).map(([name, value]) => ({ name: `${'★'.repeat(Number(name))}`, value }));
    }

    return null;
  };

  const COLORS = ['#000000', '#4d4d4d', '#808080', '#b3b3b3', '#d9d9d9'];

  const formatCellValue = (field: FormField, value: unknown): string => {
    if (value === undefined || value === null || value === '') return '—';
    if (field.type === 'checkbox' && Array.isArray(value)) {
      return value.join(', ');
    }
    if (field.type === 'rating') {
      const n = Number(value);
      return '★'.repeat(n) + '☆'.repeat(5 - n);
    }
    return String(value);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header
        left={
          <>
            <button onClick={() => navigate('/dashboard')}>
              <img src="/favicon.ico" alt="Simple Forms" className="logo-icon" />
            </button>
            <span className="mono-label text-muted-foreground">Responses</span>
          </>
        }
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-12">
            <h1 className="text-2xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{form.description}</p>
            )}
            <div className="flex gap-6 mt-4">
              <div className="mono-card flex-1 text-center py-8">
                <p className="text-2xl font-bold tabular-nums">{responses.length}</p>
                <p className="mono-label text-muted-foreground mt-2">
                  Response{responses.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="mono-card flex-1 text-center py-8">
                <p className="text-2xl font-bold tabular-nums">{fields.length}</p>
                <p className="mono-label text-muted-foreground mt-2">Fields</p>
              </div>
            </div>
          </div>

          {/* Charts per field */}
          {/* <div className="space-y-8">
            {fields.map(field => {
              const stats = getFieldStats(field);
              if (!stats) {
                // Text / date / time fields — show recent values
                const values = responses.map(r => (r.data as Record<string, unknown>)[field.id]).filter(Boolean);
                return (
                  <div key={field.id} className="mono-card">
                    <p className="mono-label mb-4">{field.label}</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {values.slice(0, 10).map((v, i) => (
                        <p key={i} className="text-sm border-b border-muted py-2">{String(v)}</p>
                      ))}
                      {values.length === 0 && <p className="text-sm text-muted-foreground">No responses yet</p>}
                    </div>
                  </div>
                );
              }

              if (Array.isArray(stats)) {
                return (
                  <div key={field.id} className="mono-card">
                    <p className="mono-label mb-6">{field.label}</p>
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d9d9d9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Bar dataKey="value" fill="#000000" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                              {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              }

              // Range stats
              return (
                <div key={field.id} className="mono-card">
                  <p className="mono-label mb-4">{field.label}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.avg}</p>
                      <p className="mono-label text-muted-foreground">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.min}</p>
                      <p className="mono-label text-muted-foreground">Min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.max}</p>
                      <p className="mono-label text-muted-foreground">Max</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div> */}

          {responses.length > 0 && (
            <div className="mt-12">
              <p className="mono-label mb-4">Raw Responses</p>
              {/* Scoped horizontal scroll — only the table scrolls, not the whole viewport */}
              <div className="overflow-x-auto w-full border border-foreground">
                <table className="w-full border-collapse min-w-max">
                  <thead className="bg-gray-800/20 text-foreground">
                    <tr>
                      <th className="border-r border-background/20 p-3 mono-label text-left whitespace-nowrap">#</th>
                      {fields.map(f => (
                        <th
                          key={f.id}
                          className="border-r border-background/20 p-3 mono-label text-left whitespace-nowrap"
                        >
                          {f.label || '(unlabelled)'}
                        </th>
                      ))}
                      <th className="p-3 mono-label text-left whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((resp, i) => (
                      <tr key={resp.id} className="hover:bg-muted transition-colors">
                        <td className="border border-foreground/20 p-3 text-sm tabular-nums">{i + 1}</td>
                        {fields.map(f => (
                          <td key={f.id} className="border border-foreground/20 p-3 text-sm whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                            {formatCellValue(f, (resp.data as Record<string, unknown>)[f.id])}
                          </td>
                        ))}
                        <td className="border border-foreground/20 p-3 text-sm tabular-nums whitespace-nowrap">
                          {new Date(resp.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {responses.length === 0 && (
            <div className="mono-card border-dashed flex items-center justify-center py-16">
              <p className="mono-label text-muted-foreground">No responses yet</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}